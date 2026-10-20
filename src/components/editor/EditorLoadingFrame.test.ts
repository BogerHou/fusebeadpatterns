import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { SiteLocale } from '../../lib/i18n/locales';
import EditorLoadingFrame from './EditorLoadingFrame';

describe('editor first paint', () => {
    it.each<SiteLocale>(['en', 'de', 'fr', 'ja'])('renders a visible %s workspace before browser code or images load', locale => {
        const html = renderToStaticMarkup(createElement(EditorLoadingFrame, { locale }));
        expect(html).toContain(`lang="${locale}"`);
        expect(html).toContain('data-testid="editor-loading-frame"');
        expect(html).toContain('role="status"');
        expect(html).toContain('editor-loading-tools');
        expect(html).toContain('editor-loading-canvas');
        expect(html).not.toMatch(/<(img|canvas|script)\b/);
    });
});
