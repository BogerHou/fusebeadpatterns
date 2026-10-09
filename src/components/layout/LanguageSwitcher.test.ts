import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import LanguageSwitcher from './LanguageSwitcher';

let pathname = '/editor';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

describe('language switcher server output', () => {
    it('provides crawlable native links for every editor language before hydration', () => {
        pathname = '/fr/editor';
        const html = renderToStaticMarkup(createElement(LanguageSwitcher, { locale: 'fr' }));
        for (const href of ['/editor', '/de/editor', '/fr/editor', '/ja/editor']) expect(html).toContain(`href="${href}"`);
        expect(html.match(/<a\b/g)).toHaveLength(4);
        expect(html).toContain('<details');
        expect(html).toContain('<summary');
        expect(html).toContain('aria-label="Langue: Français"');
        expect(html).not.toContain('cette page n’est pas disponible');
    });

    it('labels a relevant library fallback instead of pretending a selected download page is translated', () => {
        pathname = '/fr/modeles-perles-a-repasser';
        const html = renderToStaticMarkup(createElement(LanguageSwitcher, { locale: 'fr' }));
        for (const href of ['/patterns', '/de/patterns', '/fr/modeles-perles-a-repasser', '/ja/patterns']) expect(html).toContain(`href="${href}"`);
        expect(html.match(/Voir tous les modèles dans cette langue/g)).toHaveLength(3);
        expect(html).toContain('aria-current="true"');
    });
});
