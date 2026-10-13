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

/** Inspect real HTML attributes, rather than strings serialized inside Next's scripts. */
export function inspectMetadata(html, label = 'page') {
    const issues = [];
    const descriptions = [];
    let keywords = 0;
    const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
    for (const tag of markup.match(/<meta\b[^>]*>/gi) ?? []) {
        const attributes = {};
        for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
            attributes[match[1].toLowerCase()] = decodeAttribute(match[2] ?? match[3]);
        }
        const field = (attributes.name ?? attributes.property ?? '').toLowerCase();
        if (field === 'keywords') {
            keywords++;
            issues.push(`${label}: remove the keywords meta tag`);
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
    return { descriptions, keywords, issues };
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
    const results = files.map(filename => ({ file: path.relative(directory, filename), ...inspectMetadata(fs.readFileSync(filename, 'utf8'), path.relative(directory, filename)) }));
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
