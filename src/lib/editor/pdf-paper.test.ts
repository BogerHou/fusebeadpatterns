import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { SITE_LOCALES } from '../i18n/locales';
import { createEditorProjectFile, decodeEditorPatternDraft, EDITOR_DRAFT_STORAGE_KEY, loadEditorDraft, parseEditorProject, saveEditorDraft, serializeEditorProject, type EditorDraft } from './draft';
import { consumeEditorLocaleDraft, consumeLargeEditorLocaleDraft, saveEditorLocaleDraft, saveLargeEditorLocaleDraft } from './locale-navigation';
import { isPdfPaperSize, PDF_PAPER_DIMENSIONS, resolvePdfPaperSize, type PdfPaperSize } from './pdf-paper';
import type { PixelLocaleStore } from '../pixel-grid/locale-storage';

function storage() {
    const values = new Map<string, string>();
    return {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value); },
        removeItem: (key: string) => { values.delete(key); },
    };
}

const originalText = readFileSync('public/patterns/original-sunset-mountain-lake/pattern.bead-pattern.json', 'utf8');
const original = parseEditorProject(originalText)!;
const originalPixels = decodeEditorPatternDraft(original.editedPattern)!;
function draft(paper?: PdfPaperSize): EditorDraft {
    return { ...original, ...(paper ? { pdfPaperSize: paper } : {}) };
}

afterEach(() => vi.unstubAllGlobals());

describe('PDF paper persistence', () => {
    it('keeps the existing published project readable and A4 in every interface language', () => {
        const reopened = parseEditorProject(originalText)!;
        expect(reopened.pdfPaperSize).toBeUndefined();
        expect(resolvePdfPaperSize(reopened.pdfPaperSize)).toBe('a4');
        expect(PDF_PAPER_DIMENSIONS.a4).toEqual({ width: 210, height: 297 });
        expect(PDF_PAPER_DIMENSIONS.letter).toEqual({ width: 215.9, height: 279.4 });
        for (const locale of SITE_LOCALES) {
            const session = storage(), href = `/${locale}/editor`;
            expect(saveEditorLocaleDraft(reopened, href, session, 1000)).toBe(true);
            expect(resolvePdfPaperSize(consumeEditorLocaleDraft(href, session, 1001)!.draft.pdfPaperSize)).toBe('a4');
        }
    });

    it.each(['a4', 'letter'] as const)('saves %s in the local draft and project without changing source, palettes or pixels', paper => {
        const session = storage(), saved = draft(paper);
        vi.stubGlobal('window', { sessionStorage: session });
        expect(saveEditorDraft(saved)).toBe(true);
        expect(loadEditorDraft()).toEqual(saved);
        const restored = parseEditorProject(serializeEditorProject(saved))!;
        expect(restored).toEqual(saved);
        expect(restored.pdfPaperSize).toBe(paper);
        expect(Buffer.from(decodeEditorPatternDraft(restored.editedPattern)!)).toEqual(Buffer.from(originalPixels));
        const { pdfPaperSize: _paper, ...withoutPaper } = restored;
        expect(_paper).toBe(paper);
        expect(withoutPaper).toEqual(original);
    });

    it.each(SITE_LOCALES)('preserves the selected paper in both language transfer paths to %s', async locale => {
        const saved = draft('letter'), href = locale === 'en' ? '/editor' : `/${locale}/editor`;
        const session = storage();
        expect(saveEditorLocaleDraft(saved, href, session, 1000)).toBe(true);
        const ordinary = consumeEditorLocaleDraft(href, session, 1001)!;
        expect(ordinary.draft).toEqual(saved);
        const records = new Map<string, string>();
        const large: PixelLocaleStore = {
            async put(key, raw) { records.set(key, raw); },
            async take(key) { const raw = records.get(key) ?? null; records.delete(key); return raw; },
            async remove(key) { records.delete(key); },
        };
        expect(await saveLargeEditorLocaleDraft(saved, href, session, 2000, null, null, large)).toBe(true);
        const bulk = await consumeLargeEditorLocaleDraft(href, session, 2001, large);
        expect(bulk!.draft).toEqual(saved);
        expect(records.size).toBe(0);
        expect(Buffer.from(decodeEditorPatternDraft(bulk!.draft.editedPattern)!)).toEqual(Buffer.from(originalPixels));
    });

    it.each([null, false, 210, '', 'A4', 'legal', {}, [], { paper: 'letter' }])('rejects bad paper %j in files, drafts and language recovery without rewriting stored evidence', value => {
        const session = storage(), file = createEditorProjectFile(draft());
        const bad = { ...file.draft, pdfPaperSize: value };
        expect(isPdfPaperSize(value)).toBe(false);
        expect(parseEditorProject(JSON.stringify({ ...file, draft: bad }))).toBeNull();
        vi.stubGlobal('window', { sessionStorage: session });
        const corruptText = JSON.stringify(bad);
        session.setItem(EDITOR_DRAFT_STORAGE_KEY, corruptText);
        expect(loadEditorDraft()).toBeNull();
        expect(session.getItem(EDITOR_DRAFT_STORAGE_KEY)).toBe(corruptText);
        expect(saveEditorLocaleDraft(bad as EditorDraft, '/ja/editor', session, 1000)).toBe(false);
        expect(session.getItem(EDITOR_DRAFT_STORAGE_KEY)).toBe(corruptText);
    });
});
