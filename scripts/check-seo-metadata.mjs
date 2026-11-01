import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const descriptionLimit = 160;
const namedEntities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0' };

function decodeAttribute(value) {
    return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity) => {
        if (!entity.startsWith('#')) return namedEntities[entity.toLowerCase()] ?? match;
        const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '\ufffd';
    });
}

function parseAttributes(tag) {
    const attributes = {};
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
        attributes[match[1].toLowerCase()] = decodeAttribute(match[2] ?? match[3]);
    }
    return attributes;
}

function normalizeUrl(value) {
    try {
        const url = new URL(value, 'https://fusebeadpatterns.art');
        return `${url.origin}${url.pathname.replace(/\/+$/, '') || '/'}${url.search}${url.hash}`;
    } catch {
        return value.trim();
    }
}

/** Inspect real HTML attributes, rather than strings serialized inside Next's scripts. */
export function inspectMetadata(html, label = 'page', { requireIndexableCompleteness = false } = {}) {
    const issues = [];
    const descriptions = [];
    let keywords = 0;
    let canonicalUrl = '';
    let ogUrl = '';
    let ogImage = '';
    let isNoindex = false;
    let jsonLdCount = 0;
    const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
    for (const scriptMatch of withoutComments.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
        const attrs = parseAttributes(`<script ${scriptMatch[1]}>`);
        if ((attrs.type ?? '').toLowerCase() === 'application/ld+json') {
            jsonLdCount++;
            try {
                JSON.parse(scriptMatch[2]);
            } catch {
                issues.push(`${label}: invalid JSON-LD script content`);
            }
        }
    }
    const markup = withoutComments.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
    for (const tag of markup.match(/<link\b[^>]*>/gi) ?? []) {
        const attributes = parseAttributes(tag);
        const relTokens = (attributes.rel ?? '').toLowerCase().split(/\s+/).filter(Boolean);
        if (relTokens.includes('canonical') && attributes.href) {
            canonicalUrl = attributes.href;
        }
    }
    for (const tag of markup.match(/<meta\b[^>]*>/gi) ?? []) {
        const attributes = parseAttributes(tag);
        const field = (attributes.name ?? attributes.property ?? '').toLowerCase();
        if (field === 'keywords') {
            keywords++;
            issues.push(`${label}: remove the keywords meta tag`);
        }
        if (field === 'robots' && /\bnoindex\b/i.test(attributes.content ?? '')) {
            isNoindex = true;
        }
        if (field === 'og:url' && attributes.content) {
            ogUrl = attributes.content;
        }
        if (field === 'og:image' && (attributes.content ?? '').trim()) {
            ogImage = attributes.content.trim();
        }
        if (!['description', 'og:description', 'twitter:description'].includes(field)) continue;
        const content = attributes.content ?? '';
        const length = Array.from(content).length;
        descriptions.push({ field, length });
        if (!content.trim()) issues.push(`${label}: ${field} is empty`);
        if (length > descriptionLimit) issues.push(`${label}: ${field} has ${length} characters (limit ${descriptionLimit})`);
    }
    for (const field of ['description', 'og:description', 'twitter:description']) {
        if (descriptions.filter(item => item.field === field).length > 1) issues.push(`${label}: duplicate ${field} meta tags`);
    }
    if (canonicalUrl && ogUrl && normalizeUrl(canonicalUrl) !== normalizeUrl(ogUrl)) {
        issues.push(`${label}: canonical (${canonicalUrl}) does not match og:url (${ogUrl})`);
    }
    if (requireIndexableCompleteness && canonicalUrl && !isNoindex) {
        if (!ogImage) issues.push(`${label}: indexable page is missing og:image`);
        if (jsonLdCount === 0) issues.push(`${label}: indexable page is missing JSON-LD structured data`);
    }
    return { descriptions, keywords, issues, jsonLdCount };
}

function htmlFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const filename = path.join(directory, entry.name);
        return entry.isDirectory() ? htmlFiles(filename) : entry.name.endsWith('.html') ? [filename] : [];
    });
}

export function checkBuiltMetadata(directory = '.next/server/app') {
    const files = htmlFiles(directory);
    if (!files.length) throw new Error(`No built HTML found in ${directory}; run the production build first.`);
    const results = files.map(filename => {
        const rel = path.relative(directory, filename);
        const isErrorDoc = rel.endsWith('_not-found.html') || rel.endsWith('global-not-found.html') || rel.endsWith('_global-error.html');
        return {
            file: rel,
            ...inspectMetadata(fs.readFileSync(filename, 'utf8'), rel, { requireIndexableCompleteness: !isErrorDoc }),
        };
    });
    const issues = results.flatMap(result => result.issues);
    if (issues.length) throw new Error(issues.join('\n'));
    return {
        htmlPages: files.length,
        descriptionTags: results.reduce((total, result) => total + result.descriptions.length, 0),
        maxDescriptionLength: Math.max(...results.flatMap(result => result.descriptions.map(item => item.length))),
        keywordTags: 0,
    };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        console.log(JSON.stringify(checkBuiltMetadata(process.argv[2]), null, 2));
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
