import { createElement, isValidElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SITE_LOCALES } from '../../lib/i18n/locales';
import { getEditorTranslator } from '../../lib/editor/messages';
import { PdfPaperField } from './PdfPaperField';

describe('PDF paper selector', () => {
    it.each(SITE_LOCALES)('shows actual paper sizes, native labels and the saved Letter selection in %s', locale => {
        const t = getEditorTranslator(locale);
        const html = renderToStaticMarkup(createElement(PdfPaperField, { locale, id: 'paper', value: 'letter', onChange: () => undefined }));
        expect(html).toContain('name="pdfPaperSize"');
        expect(html).toContain('value="letter" selected=""');
        expect(html).toContain('for="paper"');
        expect(html).toContain('aria-describedby="paper-help"');
        expect(html).toContain(t('PDF paper size'));
        expect(html).toContain('210 × 297');
        expect(html).toContain(t('Choose the paper in your printer. Paper size is saved in your project; changing it does not change beads or board layout.'));
    });

    it('accepts only explicit paper values and preserves technical enum values across languages', () => {
        for (const locale of SITE_LOCALES) {
            const onChange = vi.fn();
            const element = PdfPaperField({ locale, id: 'paper', value: 'a4', onChange });
            const children = element.props.children as unknown[];
            const select = children.find(child => isValidElement(child) && child.type === 'select') as ReactElement<{ onChange: (event: { target: { value: string } }) => void }>;
            for (const value of ['letter', 'a4', 'legal', 'A4', '']) select.props.onChange({ target: { value } });
            expect(onChange.mock.calls).toEqual([['letter'], ['a4']]);
        }
    });
});
