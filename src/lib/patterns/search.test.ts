import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as catalog from './catalog';
import * as localizedContent from './localized-content';
import * as presentation from './presentation';
import * as localizedUi from './localized-ui';
import * as libraryOverview from './library-overview';
import { filterPatterns, normalizePatternSearch } from './search';
import { readPatternFilters, writePatternFilters } from './browser-state';
import { getLocaleDestination } from '../i18n/routes';
import { SITE_LOCALES, type SiteLocale } from '../i18n/locales';
import type { PatternCardData } from '../../components/patterns/PatternCards';

// Use the actual card converters. UI-only imports are unused by these functions;
// resolving them here keeps the existing Node test environment free of browser state.
const require = createRequire(import.meta.url);
const modules: Record<string, unknown> = {
    '@/lib/patterns/catalog': catalog,
    '@/lib/patterns/localized-content': localizedContent,
    '@/lib/patterns/presentation': presentation,
    '@/lib/patterns/localized-ui': localizedUi,
    '@/lib/patterns/library-overview': libraryOverview,
    'next/image': {}, 'next/link': {}, './PatternSectionNav': {}, './PatternBrowser': {},
};
function loadCardModule(filename: string): Record<string, unknown> {
    const compiled = ts.transpileModule(readFileSync(new URL(filename, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const exports: Record<string, unknown> = {};
    new Script(compiled).runInNewContext({ exports, require: (id: string) => modules[id] ?? require(id) });
    return exports;
}
const cardModule = loadCardModule('../../components/patterns/PatternCards.tsx');
modules['./PatternCards'] = cardModule;
const localizedCardModule = loadCardModule('../../components/patterns/LocalizedPatternCatalog.tsx');
const toPatternCard = cardModule.toPatternCard as (pattern: catalog.Pattern) => PatternCardData;
const toLocalizedPatternCard = localizedCardModule.toLocalizedPatternCard as (pattern: catalog.Pattern, locale: Exclude<SiteLocale, 'en'>) => PatternCardData;
const cards = Object.fromEntries(SITE_LOCALES.map(locale => [locale,
    catalog.patterns.map(pattern => locale === 'en' ? toPatternCard(pattern) : toLocalizedPatternCard(pattern, locale)),
])) as Record<SiteLocale, PatternCardData[]>;
const ids = (patterns: readonly { id: string }[]) => patterns.map(pattern => pattern.id).sort();
const matches = (locale: SiteLocale, query: string, theme = 'all') => ids(filterPatterns(cards[locale], { query, theme }));
function expectEveryLanguage(query: string, expectedIds: readonly string[]) {
    for (const locale of SITE_LOCALES) expect(matches(locale, query), `${locale}: ${query}`).toEqual([...expectedIds].sort());
}

describe('real catalog discovery across page languages', () => {
    it.each([
        ['ポケモン', 'pokemon', 46],
        ['スーパーマリオ', 'super-mario', 15],
        ['星のカービィ', 'kirby', 3],
        ['マインクラフト', 'minecraft', 29],
        ['マイクラ', 'minecraft', 29],
        ['スターデューバレー', 'stardew-valley', 6],
    ] as const)('finds the complete %s collection in all four languages', (query, collectionId, count) => {
        const expected = catalog.patterns.filter(pattern => pattern.collectionId === collectionId);
        expect(expected).toHaveLength(count);
        expectEveryLanguage(query, ids(expected));
    });

    it.each([
        'perler bead ornament patterns',
        'Bügelperlen Weihnachtskugel Vorlage',
        'modèle perles à repasser boule de Noël',
        'アイロンビーズ クリスマス オーナメント 図案',
    ])('finds the bauble ornament for the complete native query %s in every language', query => {
        expectEveryLanguage(query, ['original-christmas-bauble-ornament']);
    });

    it.each(['ピカチュウ', 'ぴかちゅう', 'ﾋﾟｶﾁｭｳ', 'ヒ\u309aカチュウ', 'ひ\u309aかちゅう', 'Pikachu', 'Ｐｉｋａｃｈｕ'])('finds the same Pikachu for %s', query => {
        expectEveryLanguage(query, ['pokemon-pikachu-gen5']);
    });

    it.each(['ダイヤモンド', 'タ\u3099イヤモント\u3099', 'ﾀﾞｲﾔﾓﾝﾄﾞ', 'だいやもんど'])('finds exactly the diamond designs for %s', query => {
        expectEveryLanguage(query, [
            'minecraft-diamond-sword-1-21-1', 'minecraft-diamond-pickaxe-1-21-1',
            'minecraft-diamond-1-21-1', 'minecraft-diamond-ore-1-21-1',
        ]);
    });

    it.each([
        ['coeur', 'minecraft-full-heart-1-21-1'], ['cœur', 'minecraft-full-heart-1-21-1'],
        ['oeil', 'minecraft-ender-eye-1-21-1'], ['Œil', 'minecraft-ender-eye-1-21-1'],
        ['Fussball', 'original-soccer-ball'], ['Fußball', 'original-soccer-ball'],
        ['weisses huhn', 'sdv-white-chicken'], ['weißes huhn', 'sdv-white-chicken'],
        ['Evoli', 'pokemon-eevee-gen5'], ['Évoli', 'pokemon-eevee-gen5'],
    ])('accepts the local input variant %s', (query, id) => {
        expectEveryLanguage(query, [id]);
    });

    it.each(['Schattenhuhn', 'Poulet vide', 'Poulet du vide', 'Poule du vide', '闇ニワトリ', 'Void Chicken'])('finds only the real Void Chicken for %s', query => {
        expectEveryLanguage(query, ['sdv-void-chicken']);
        for (const locale of SITE_LOCALES) expect(matches(locale, query, 'pokemon')).toEqual([]);
    });

    it.each(['Bloups', 'Blooper', 'ゲッソー'])('keeps the same Blooper for %s', query => {
        expectEveryLanguage(query, ['smb-blooper']);
    });

    it.each(['Retro Diamond Coaster', 'Perler bead coaster', 'perler bead coaster patterns', 'Bügelperlen Untersetzer Vorlagen', 'Untersetzer', 'sous-verre', 'modèles dessous de verre', 'dessous de verre', 'アイロンビーズ コースター 図案', 'コースター'])('finds the original coaster for %s in every page language', query => {
        expectEveryLanguage(query, ['original-retro-diamond-coaster']);
        for (const locale of SITE_LOCALES) expect(matches(locale, query, 'minecraft')).toEqual([]);
    });

    it('retains multi-word AND matching and excludes unrelated subjects', () => {
        expectEveryLanguage('マイクラ ダイヤモンド 剣', ['minecraft-diamond-sword-1-21-1']);
        expectEveryLanguage('ピカチュウ マイクラ', []);
        expectEveryLanguage('闇ニワトリ 卵', []);
        expectEveryLanguage('Poulet du vide egg', []);
        expectEveryLanguage('no-such-pattern', []);
    });

    it('preserves Japanese voiced and semi-voiced distinctions', () => {
        expectEveryLanguage('ひかちゅう', []);
        expectEveryLanguage('フロッフー', []);
        expectEveryLanguage('ダイヤモント', []);
        expectEveryLanguage('だいやもんと', []);
        expectEveryLanguage('ﾀﾞｲﾔﾓﾝﾄ', []);
        expectEveryLanguage('ゲンカ', []);
        expectEveryLanguage('ビカチュウ', []);
        // The coaster subject contains ひし形 in every language's aliases. The
        // ornament's Japanese description also contains the real word ひも.
        for (const locale of SITE_LOCALES) {
            const expected = ['pokemon-charmander-gen5', 'pokemon-cyndaquil-gen5', 'pokemon-chimchar-gen5', 'original-retro-diamond-coaster'];
            if (locale === 'ja') expected.push('original-christmas-bauble-ornament');
            for (const query of ['ヒ', 'ﾋ']) expect(matches(locale, query)).toEqual(expected.sort());
        }
        expect(normalizePatternSearch('ピ')).not.toBe(normalizePatternSearch('ヒ'));
        expect(normalizePatternSearch('ピ')).not.toBe(normalizePatternSearch('ビ'));
        expect(normalizePatternSearch('ガ')).not.toBe(normalizePatternSearch('カ'));
        expect(normalizePatternSearch('ﾋﾟ')).toBe(normalizePatternSearch('ぴ'));
    });

    it('keeps catalog order, empty queries and all/original/category filters', () => {
        for (const locale of SITE_LOCALES) {
            expect(filterPatterns(cards[locale], { query: ' \t　', theme: 'all' })).toEqual(cards[locale]);
            expect(filterPatterns(cards[locale], { query: '', theme: 'originals' }).map(card => card.id))
                .toEqual(catalog.patterns.filter(pattern => pattern.collectionId === null).map(pattern => pattern.id));
            expect(matches(locale, 'マイクラ', 'pokemon')).toEqual([]);
            expect(matches(locale, 'マイクラ', 'originals')).toEqual([]);
            expect(matches(locale, 'Bloups', 'super-mario')).toEqual(['smb-blooper']);
        }
    });

    it('keeps an actual local search and theme useful after every language change', () => {
        const query = 'マイクラ ダイヤモンド 剣';
        const path = writePatternFilters('https://fusebeadpatterns.art/ja/patterns?from=bookmark#all-patterns', { query, theme: 'minecraft' });
        const source = new URL(path, 'https://fusebeadpatterns.art');
        for (const locale of SITE_LOCALES) {
            const destination = new URL(getLocaleDestination(source.pathname, locale, source).href, source.origin);
            expect(destination.searchParams.get('q')).toBe(query);
            expect(destination.searchParams.get('from')).toBe('bookmark');
            expect(destination.hash).toBe('#all-patterns');
            const filters = readPatternFilters(destination.search, catalog.patternCollections.map(collection => collection.id));
            expect(ids(filterPatterns(cards[locale], filters))).toEqual(['minecraft-diamond-sword-1-21-1']);
        }
    });
});
