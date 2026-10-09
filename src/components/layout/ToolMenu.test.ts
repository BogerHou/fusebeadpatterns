import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SITE_LOCALES, siteNavigation } from '../../lib/i18n/locales';
import { localeRoutes } from '../../lib/i18n/routes';
import ToolMenu from './ToolMenu';

let pathname = '/pixel-art-grid';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

describe('tool navigation', () => {
    it('exposes real native links to the three tools in each current language before hydration', () => {
        for (const locale of SITE_LOCALES) {
            const routes = localeRoutes[locale];
            pathname = routes.pixelGrid!;
            const html = renderToStaticMarkup(createElement(ToolMenu, { locale }));
            for (const href of [routes.home, routes.pixelGrid, routes.beadLoom]) expect(html).toContain(`href="${href}"`);
            expect(html.match(/<a\b/g)).toHaveLength(3);
            expect(html).toContain(`aria-label="${siteNavigation[locale].tools}"`);
            expect(html.match(/aria-current="page"/g)).toHaveLength(1);
            expect(html).not.toContain('data-locale-navigation');
        }
    });
});
