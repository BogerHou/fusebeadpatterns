import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getLocaleDestination } from '../../lib/i18n/routes';
import PatternLibraryHelp from './PatternLibraryHelp';

const locales = ['en', 'de', 'fr', 'ja'] as const;
describe('real printing-section language destinations', () => {
    it.each(locales)('renders the library destination and local guides in %s', locale => {
        const html = renderToStaticMarkup(createElement(PatternLibraryHelp, { locale }));
        const destination = getLocaleDestination('/de/patterns', locale, { hash: '#drucken' });
        expect(html).toContain(`id="${destination.href.split('#')[1]}"`);
        const prefix = locale === 'en' ? '' : `/${locale}`;
        expect(html).toContain(`href="${prefix}/guides/perler-bead-pegboards"`);
        expect(html).toContain(`href="${prefix}/guides/perler-to-hama-artkal"`);
        expect(html.match(/<li\b/g)).toHaveLength(3);
        expect(html).toContain('50');
    });
    it.each(['en', 'de', 'ja'] as const)('provides the actual Christmas printing target in %s', locale => {
        const html = renderToStaticMarkup(createElement(PatternLibraryHelp, { locale, id: 'printing' }));
        const destination = getLocaleDestination('/fr/modeles-perles-a-repasser-noel', locale, { hash: '#imprimer' });
        expect(html).toContain(`id="${destination.href.split('#')[1]}"`);
    });
    it('keeps the German and Japanese quick-download bookmarks usable', () => {
        for (const [locale, href] of [['de', '#vorlagen'], ['ja', '#patterns']] as const) {
            const html = renderToStaticMarkup(createElement(PatternLibraryHelp, { locale, quickDownloadHref: href }));
            expect(html).toContain(`href="${href}"`);
        }
    });
});
