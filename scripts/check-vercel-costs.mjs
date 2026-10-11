import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// This gate verifies the project's source and fresh Next build contract. It does
// not read billing accounts, estimate allowances, or promise zero CDN charges.
// There are currently no request-specific routes. A future authenticated/private
// feature needs an explicit, reviewed exception here; never public-cache it to
// satisfy this check or force-static a page that needs request-specific behavior.
const internalPages = new Set(['/_not-found', '/_global-error']);
const locales = ['', '/de', '/fr', '/ja'];
export const requiredStaticPages = locales.flatMap(prefix => [
    prefix || '/', `${prefix}/editor`, `${prefix}/patterns/sunset-mountain-lake`,
]);
// Only these shared navigation surfaces are subject to the no-prefetch contract.
// This is not a blanket prohibition on purposeful workspace/private interactions.
export const coreLinkFiles = [
    'src/components/layout/SiteHeader.tsx',
    'src/components/layout/Breadcrumbs.tsx',
    'src/components/layout/SiteFooter.tsx',
    'src/components/patterns/MultiboardInstructions.tsx',
];

function insist(condition, message) {
    assert.ok(condition, `Vercel cost guard: ${message}`);
}

function unwrap(expression) {
    while (expression && (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression)
        || ts.isTypeAssertionExpression(expression) || ts.isNonNullExpression(expression)
        || ts.isSatisfiesExpression(expression))) expression = expression.expression;
    return expression;
}

function isModuleRequire(expression, moduleName) {
    const value = unwrap(expression);
    return value && ts.isCallExpression(value) && ts.isIdentifier(value.expression)
        && value.expression.text === 'require' && value.arguments.length === 1
        && ts.isStringLiteral(value.arguments[0]) && value.arguments[0].text === moduleName;
}

function componentValue(expression, bindings, namespaces, moduleName) {
    const value = unwrap(expression);
    if (!value) return false;
    if (ts.isIdentifier(value)) return bindings.has(value.text);
    if (isModuleRequire(value, moduleName)) return true;
    return ts.isPropertyAccessExpression(value) && value.name.text === 'default'
        && ((ts.isIdentifier(value.expression) && namespaces.has(value.expression.text))
            || isModuleRequire(value.expression, moduleName));
}

/** Use the TypeScript syntax tree rather than strings/comments or tag-name regexes. */
function inspectModuleFlags(source, filename, moduleName, flagName, expectedValue) {
    const kind = /\.[cm]?jsx$/.test(filename) ? ts.ScriptKind.JSX
        : /\.tsx$/.test(filename) ? ts.ScriptKind.TSX
            : /\.[cm]?js$/.test(filename) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
    const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true,
        kind);
    insist(tree.parseDiagnostics.length === 0, `${filename}: TypeScript syntax could not be inspected`);
    const bindings = new Set();
    const namespaces = new Set();
    const declarations = [];
    const openingElements = [];
    function collect(node) {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)
            && node.moduleSpecifier.text === moduleName && node.importClause && !node.importClause.isTypeOnly) {
            if (node.importClause.name) bindings.add(node.importClause.name.text);
            const imported = node.importClause.namedBindings;
            if (imported && ts.isNamespaceImport(imported)) namespaces.add(imported.name.text);
            if (imported && ts.isNamedImports(imported)) for (const item of imported.elements) {
                if (!item.isTypeOnly && (item.propertyName ?? item.name).text === 'default') bindings.add(item.name.text);
            }
        }
        if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)
            && node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)
            && node.moduleReference.expression.text === moduleName) { namespaces.add(node.name.text); bindings.add(node.name.text); }
        if (ts.isVariableDeclaration(node)) declarations.push(node);
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) openingElements.push(node);
        ts.forEachChild(node, collect);
    }
    collect(tree);
    // Resolve simple local aliases, including CommonJS defaults. Unsupported
    // component factories cannot weaken the independent global image-config gate.
    for (let changed = true; changed;) {
        changed = false;
        for (const node of declarations) {
            if (ts.isIdentifier(node.name) && componentValue(node.initializer, bindings, namespaces, moduleName)
                && !bindings.has(node.name.text)) { bindings.add(node.name.text); changed = true; }
            if (ts.isIdentifier(node.name) && isModuleRequire(node.initializer, moduleName)) namespaces.add(node.name.text);
            if (ts.isObjectBindingPattern(node.name) && isModuleRequire(node.initializer, moduleName)) {
                for (const item of node.name.elements) if (item.propertyName?.getText(tree) === 'default'
                    && ts.isIdentifier(item.name) && !bindings.has(item.name.text)) {
                    bindings.add(item.name.text); changed = true;
                }
            }
        }
    }
    let count = 0;
    const failures = [];
    for (const node of openingElements) {
        if (!componentValue(node.tagName, bindings, namespaces, moduleName)) continue;
        count++;
        const attributes = node.attributes.properties;
        const flags = attributes.filter(attribute => ts.isJsxAttribute(attribute)
            && attribute.name.getText(tree) === flagName);
        const flag = flags[0];
        const value = flag?.initializer;
        const enabled = flag && ((!value && expectedValue === true) || (value && ts.isJsxExpression(value)
            && unwrap(value.expression)?.kind === (expectedValue ? ts.SyntaxKind.TrueKeyword : ts.SyntaxKind.FalseKeyword)));
        const safeOrder = flag && !attributes.slice(attributes.indexOf(flag) + 1).some(ts.isJsxSpreadAttribute);
        if (flags.length !== 1 || !enabled || !safeOrder) {
            const { line, character } = tree.getLineAndCharacterOfPosition(node.getStart(tree));
            const requirement = expectedValue ? `${flagName} (or ={true})` : `${flagName}={false}`;
            failures.push(`${filename}:${line + 1}:${character + 1} <${node.tagName.getText(tree)}> needs explicit ${requirement} after any spread props`);
        }
    }
    return { count, failures };
}

export function inspectNextImages(source, filename = 'source.tsx') {
    const { count, failures } = inspectModuleFlags(source, filename, 'next/image', 'unoptimized', true);
    return { imageCount: count, failures };
}

export function inspectCoreLinks(source, filename = 'source.tsx') {
    const { count, failures } = inspectModuleFlags(source, filename, 'next/link', 'prefetch', false);
    return { linkCount: count, failures };
}

export async function inspectSourceCoreLinks(root) {
    let linkCount = 0;
    const failures = [];
    for (const filename of coreLinkFiles) {
        const result = inspectCoreLinks(await readFile(path.join(root, filename), 'utf8'), filename);
        insist(result.linkCount > 0, `${filename}: core next/link inventory is empty; review navigation changes explicitly`);
        linkCount += result.linkCount;
        failures.push(...result.failures);
    }
    insist(!failures.length, `shared navigation prefetch regressions:\n${failures.join('\n')}`);
    return { coreLinkFiles: coreLinkFiles.length, noPrefetchCoreLinks: linkCount };
}

export async function inspectSourceImages(root) {
    const files = [];
    async function walk(directory) {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
            const filename = path.join(directory, entry.name);
            if (entry.isDirectory() && !['__tests__', '__mocks__'].includes(entry.name)) await walk(filename);
            else if (entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name)
                && !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) files.push(filename);
        }
    }
    await walk(path.join(root, 'src'));
    let imageCount = 0;
    const failures = [];
    for (const filename of files.sort()) {
        const result = inspectNextImages(await readFile(filename, 'utf8'), path.relative(root, filename));
        imageCount += result.imageCount;
        failures.push(...result.failures);
    }
    insist(imageCount > 0, 'source inventory found no next/image JSX; inspection must not silently skip the site');
    insist(!failures.length, `image optimization source regressions:\n${failures.join('\n')}`);
    return { sourceFiles: files.length, unoptimizedImages: imageCount };
}

function assertStatic(route, record, type) {
    insist(record && typeof record === 'object', `${route}: missing prerendered output`);
    insist(record.routeType === type, `${route}: expected ${type} prerender record`);
    insist(record.compute === 'static', `${route}: public content requires static compute, got ${record.compute}`);
    insist(record.response === 'complete', `${route}: public content requires a complete static response`);
    insist(record.initialRevalidateSeconds === false, `${route}: automatic ISR/revalidation needs explicit cost and freshness review`);
}

/** Pure validator: unit tests supply fixtures, never a private pack or prior build. */
export function validateBuildManifests({ prerender, images, middleware, appRoutes, appPaths }) {
    insist(prerender?.version === 4, 'unsupported or missing Next prerender manifest version');
    insist(images?.version === 1, 'unsupported or missing Next image manifest version');
    insist(middleware?.version === 3, 'unsupported or missing Next middleware manifest version');
    insist(images.images?.unoptimized === true, 'image optimizer must be disabled in the built image configuration');
    insist(Array.isArray(images.images.remotePatterns) && images.images.remotePatterns.length === 0,
        'built remote image allowlist must remain empty');
    insist(Array.isArray(images.images.domains) && images.images.domains.length === 0,
        'built legacy remote image domains must remain empty');
    for (const field of ['middleware', 'functions']) {
        insist(middleware[field] && Object.keys(middleware[field]).length === 0, `routing ${field} must remain empty`);
    }
    insist(Array.isArray(middleware.sortedMiddleware) && !middleware.sortedMiddleware.length, 'routing middleware order must remain empty');
    insist(appPaths && appRoutes && Object.keys(appPaths).length > 0, 'app route inventory is missing or empty');
    insist(JSON.stringify(Object.keys(appPaths).sort()) === JSON.stringify(Object.keys(appRoutes).sort()),
        'app-paths and app-path-routes inventories disagree');
    insist(prerender.routes && prerender.dynamicRoutes, 'prerender route inventories are missing');
    for (const [route, record] of Object.entries(prerender.routes)) {
        if (internalPages.has(route)) continue;
        insist(record.routeType === 'page' || record.routeType === 'route', `${route}: unsupported public route type`);
        assertStatic(route, record, record.routeType);
    }
    let templates = 0;
    for (const [source, route] of Object.entries(appRoutes)) {
        insist(typeof route === 'string' && route.startsWith('/'), `${source}: invalid app route inventory`);
        if (internalPages.has(route)) continue;
        const type = source.endsWith('/page') ? 'page' : source.endsWith('/route') ? 'route' : null;
        insist(type, `${source}: unsupported app route convention`);
        if (route.includes('[')) {
            const dynamic = prerender.dynamicRoutes[route];
            insist(dynamic, `${route}: missing static parameter template`);
            insist(dynamic.fallback === false, `${route}: runtime fallback rendering needs explicit review`);
            const generated = Object.entries(prerender.routes).filter(([, record]) => record.srcRoute === route);
            insist(generated.length > 0, `${route}: no concrete static routes were generated`);
            for (const [url, record] of generated) assertStatic(url, record, type);
            templates++;
        } else assertStatic(route, prerender.routes[route], type);
    }
    for (const [route, dynamic] of Object.entries(prerender.dynamicRoutes)) {
        insist(Object.values(appRoutes).includes(route), `${route}: untracked runtime route template`);
        insist(dynamic.fallback === false, `${route}: runtime fallback rendering needs explicit review`);
    }
    for (const route of requiredStaticPages) assertStatic(route, prerender.routes[route], 'page');
    return {
        staticPages: Object.entries(prerender.routes).filter(([route, record]) => !internalPages.has(route) && record.routeType === 'page').length,
        staticRouteHandlers: Object.values(prerender.routes).filter(record => record.routeType === 'route').length,
        staticParameterTemplates: templates,
        requiredPages: requiredStaticPages.length,
        optimizerDisabled: true,
        routingMiddleware: 0,
    };
}

export async function runCostCheck(root = process.cwd()) {
    const source = await inspectSourceImages(root);
    const links = await inspectSourceCoreLinks(root);
    const buildId = (await readFile(path.join(root, '.next/BUILD_ID'), 'utf8')).trim();
    insist(buildId, 'production BUILD_ID is missing; run npm run build before cost:check');
    const files = {
        prerender: 'prerender-manifest.json', images: 'images-manifest.json',
        middleware: 'server/middleware-manifest.json', appRoutes: 'app-path-routes-manifest.json',
        appPaths: 'server/app-paths-manifest.json',
    };
    const manifests = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([name, filename]) =>
        [name, JSON.parse(await readFile(path.join(root, '.next', filename), 'utf8'))])));
    return { ...source, ...links, ...validateBuildManifests(manifests), buildId };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        insist(process.argv.length === 2, 'cost:check takes no options; run it from the project root after a fresh production build');
        console.log(JSON.stringify({ status: 'passed', ...await runCostCheck() }));
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}
