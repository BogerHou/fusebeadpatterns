#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, resolve, basename, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const USER_AGENT = 'WebsiteIndexNow/1.0 (+https://www.indexnow.org/)';

export function normalizeUrls(values, host) {
  if (!Array.isArray(values) || values.length > MAX_URLS) throw new Error('Provide 1–10,000 changed URLs.');
  const result = new Set();
  for (const value of values) {
    if (!value || typeof value !== 'string' || value !== value.trim()) throw new Error('Invalid URL input.');
    if (value.startsWith('//')) throw new Error('Protocol-relative URLs are not allowed.');
    const url = new URL(value, `https://${host}/`);
    if (url.protocol !== 'https:' || url.host !== host || url.username || url.password || url.search || url.hash) {
      throw new Error(`Use a canonical HTTPS URL on ${host}, without credentials, query or fragment.`);
    }
    const path = decodeURIComponent(url.pathname);
    if (/^\/(?:api|admin|_next|_vercel|cdn-cgi)(?:\/|$)/i.test(path)) throw new Error('Internal/API URLs are not allowed.');
    result.add(url.href);
  }
  if (!result.size) throw new Error('Provide at least one changed URL.');
  return [...result];
}

export async function loadConfig(configPath) {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const origin = new URL(`https://${config.host}`);
  if (origin.host !== config.host || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
    throw new Error('Config host must be the exact production hostname.');
  }
  if (typeof config.keyFile !== 'string' || isAbsolute(config.keyFile)) throw new Error('keyFile must be relative to the config.');
  const root = dirname(resolve(configPath));
  const keyPath = resolve(root, config.keyFile);
  if (relative(root, keyPath).startsWith('..')) throw new Error('keyFile must stay inside the project.');
  const key = (await readFile(keyPath, 'utf8')).trim();
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key) || basename(keyPath) !== `${key}.txt`) {
    throw new Error('Expected a UTF-8 <key>.txt file containing only its 8–128 character key.');
  }
  return { host: config.host, key, keyLocation: `https://${config.host}/${basename(keyPath)}` };
}

async function request(fetchFn, url, options = {}) {
  return fetchFn(url, { ...options, redirect: 'manual', signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': USER_AGENT, ...options.headers } });
}

async function readLimited(response, limit) {
  if (Number(response.headers.get('content-length')) > limit) throw new Error('Response exceeds the verification size limit.');
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) throw new Error('Response exceeds the verification size limit.');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  return Buffer.concat(chunks).toString('utf8');
}

export async function verifyKey(config, fetchFn = fetch) {
  const response = await request(fetchFn, config.keyLocation);
  const body = await readLimited(response, 1024);
  if (response.status !== 200 || body.trim() !== config.key || /text\/html/i.test(response.headers.get('content-type') || '')) {
    throw new Error(`Production key verification failed (HTTP ${response.status}); deploy the static key first.`);
  }
  return true;
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map((m) => [m[1].toLowerCase(), m[2] ?? m[3] ?? m[4]]));
}

export async function verifyPage(url, { removed = false, fetchFn = fetch } = {}) {
  const response = await request(fetchFn, url);
  if (removed && ([404, 410].includes(response.status) || [301, 302, 307, 308].includes(response.status))) {
    await response.body?.cancel();
    return;
  }
  if (response.status !== 200) { await response.body?.cancel(); throw new Error(`Page returned HTTP ${response.status}: ${url}`); }
  if (!/text\/html/i.test(response.headers.get('content-type') || '')) {
    await response.body?.cancel(); throw new Error(`Expected a public HTML page: ${url}`);
  }
  const html = await readLimited(response, MAX_HTML_BYTES);
  const robots = [response.headers.get('x-robots-tag') || ''];
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(tag[0]);
    if (/^(robots|bingbot)$/i.test(attrs.name || '')) robots.push(attrs.content || '');
  }
  if (robots.some((value) => /\b(noindex|none)\b/i.test(value))) throw new Error(`Refusing a noindex page: ${url}`);
  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attributes(tag[0]);
    if ((attrs.rel || '').toLowerCase().split(/\s+/).includes('canonical') && attrs.href) {
      const canonical = new URL(attrs.href.replaceAll('&amp;', '&'), url).href;
      if (canonical !== url) throw new Error(`Use the page's canonical URL: ${canonical}`);
    }
  }
}

export async function submitUrls(config, urls, { removed = false, fetchFn = fetch } = {}) {
  const normalized = normalizeUrls(urls, config.host);
  await verifyKey(config, fetchFn);
  // Check the actual deployed pages, never a preview build or a local sitemap.
  for (const url of normalized) await verifyPage(url, { removed, fetchFn });
  const response = await request(fetchFn, ENDPOINT, { method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ ...config, urlList: normalized }) });
  await response.body?.cancel();
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow returned HTTP ${response.status}; no automatic retry was made.`);
  return { host: config.host, submittedCount: normalized.length, urls: normalized,
    httpStatus: response.status, state: response.status === 200 ? 'received' : 'received_key_validation_pending',
    indexed: 'not_verified', submittedAt: new Date().toISOString() };
}

const HELP = `Usage: npm run indexnow -- [--dry-run | --submit] URL [URL ...]
       npm run indexnow -- --check
       npm run indexnow -- --submit --removed /old-page

Default is dry-run (no network). Only list URLs actually added, updated or removed
in this production release. Relative paths use the configured production host.
--check verifies the deployed key. --submit also checks public HTML/noindex/canonical.
--removed additionally allows 404, 410 or redirect responses for removed/moved URLs.
Use --file changed-urls.txt for one URL per line; blank/comment lines are ignored.
200 means received; 202 means key validation pending. Neither proves indexing.
Do not resubmit unchanged sitemaps or retry the same URL within five minutes.`;

export async function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help') || argv.includes('-h')) { console.log(HELP); return; }
  let configPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'indexnow.config.json');
  let submit = false, check = false, removed = false, dryRun = false;
  const values = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--config') { if (!argv[i + 1]) throw new Error('--config requires a path.'); configPath = resolve(argv[++i]); }
    else if (arg === '--submit') submit = true;
    else if (arg === '--dry-run') dryRun = true;
    else if (arg === '--check') check = true;
    else if (arg === '--removed') removed = true;
    else if (arg === '--file') {
      if (!argv[i + 1]) throw new Error('--file requires a path.');
      values.push(...(await readFile(argv[++i], 'utf8')).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')));
    } else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else values.push(arg);
  }
  if ((submit && dryRun) || (check && (values.length || submit || dryRun || removed))) throw new Error('Choose one of --check, --dry-run or --submit.');
  const config = await loadConfig(configPath);
  let result;
  if (check) { await verifyKey(config); result = { host: config.host, keyVerified: true }; }
  else {
    const urls = normalizeUrls(values, config.host);
    result = submit ? await submitUrls(config, urls, { removed }) : { mode: 'dry-run', host: config.host, urls, removed, submittedCount: 0 };
  }
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => { console.error(`IndexNow: ${error.message}`); process.exitCode = 1; });
}
