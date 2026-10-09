import { describe, expect, it } from 'vitest';
import { SITE_LOCALES } from '../i18n/locales';
import { createEditorDraft, createEditorProjectFile, parseEditorProject, serializeEditorProject } from './draft';
import { getInitialPdfScaleMode, isMidiActualSizeSupported, isPdfScaleMode, resolvePdfScaleMode, type PdfScaleMode } from './pdf-scale';

function draft(pdfScaleMode?: PdfScaleMode) {
    return createEditorDraft({
        sourceMode: 'blank', imageSrc: null, fileName: 'scale-check',
        selectedPaletteIds: ['perler'], activePalettes: [],
        boardId: 'midi', boardWidth: 1, boardHeight: 1,
        matchingId: 'euclidean', ditheringId: 'none', useSymbols: false,
        exportFormatId: 'pdf', pdfScaleMode,
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: true, fit: true, showGrid: false },
        previewZoom: 1,
    });
}

describe('explicit PDF scale', () => {
    it.each(['fit-page', 'midi-5mm'] as const)('preserves saved %s geometry regardless of the next interface language', (mode) => {
        const reopened = parseEditorProject(serializeEditorProject(draft(mode)));
        expect(reopened?.pdfScaleMode).toBe(mode);
        for (const locale of SITE_LOCALES) {
            expect(resolvePdfScaleMode(reopened?.pdfScaleMode, locale)).toBe(mode);
        }
    });

    it('keeps version 1 project files without a scale readable and applies only the initial locale default', () => {
        const oldFile = createEditorProjectFile(draft());
        delete oldFile.draft.pdfScaleMode;
        const reopened = parseEditorProject(JSON.stringify(oldFile));
        expect(reopened).not.toBeNull();
        expect(reopened?.pdfScaleMode).toBeUndefined();
        expect(resolvePdfScaleMode(reopened?.pdfScaleMode, 'ja')).toBe('midi-5mm');
        for (const locale of ['en', 'de', 'fr'] as const) {
            expect(resolvePdfScaleMode(reopened?.pdfScaleMode, locale)).toBe('fit-page');
            expect(getInitialPdfScaleMode(locale)).toBe('fit-page');
        }
    });

    it.each([null, false, 5, 'actual', {}, [], { mode: 'midi-5mm' }])('rejects invalid or incorrectly shaped scale fields: %j', value => {
        const project = createEditorProjectFile(draft());
        expect(parseEditorProject(JSON.stringify({ ...project, draft: { ...project.draft, pdfScaleMode: value } }))).toBeNull();
        expect(isPdfScaleMode(value)).toBe(false);
    });

    it('enables 5 mm scale only for confirmed Midi brands on the 29 × 29 board', () => {
        expect(isMidiActualSizeSupported(['perler'], 'midi')).toBe(true);
        expect(isMidiActualSizeSupported(['hama'], 'midi')).toBe(true);
        expect(isMidiActualSizeSupported(['artkal_s'], 'midi')).toBe(true);
        expect(isMidiActualSizeSupported(['perler', 'hama', 'artkal_s'], 'midi')).toBe(true);
        expect(isMidiActualSizeSupported([], 'midi')).toBe(false);
        expect(isMidiActualSizeSupported(['perler', 'perler_caps'], 'midi')).toBe(false);
        expect(isMidiActualSizeSupported(['hama'], 'mini')).toBe(false);
        expect(isMidiActualSizeSupported(['artkal_s'], 'mini_artkal')).toBe(false);
        expect(isMidiActualSizeSupported(['hama_mini'], 'midi')).toBe(false);
        expect(isMidiActualSizeSupported(['unknown'], 'midi')).toBe(false);
    });
});
