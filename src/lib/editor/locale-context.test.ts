import { describe, expect, it } from 'vitest';

import { createEditorDraft, decodeEditorPatternDraft, encodeEditorProjectPattern } from './draft';
import { getPaletteOption, parsePaletteCsv } from './config';
import { isEditorLanguageArrival, parseEditorLocaleContext, type EditorLocaleContext } from './locale-context';
import { PatternHistory, PatternStroke } from './pattern-history';
import { localeRoutes } from '../i18n/routes';

function fixture() {
    const perler = parsePaletteCsv('P-001,Coral,C,240,106,69\nP-002,Black,B,0,0,0', getPaletteOption('perler')!);
    // A color added from another brand remains part of the applied palette snapshot.
    const hama = parsePaletteCsv('H-001,Blue,U,0,0,255\nH-002,Red,R,255,0,0', getPaletteOption('hama')!);
    const pixels = new Uint8ClampedArray(29 * 29 * 4);
    pixels.set([10, 20, 30, 0], pixels.length - 4);
    const states = [pixels.slice()];
    const history = new PatternHistory();
    for (const [offset, color] of [
        [0, [240, 106, 69, 255]],
        [4, [0, 0, 255, 255]],
        [0, [0, 0, 0, 0]],
    ] as const) {
        const stroke = new PatternStroke(pixels);
        stroke.setPixel(offset, color);
        history.push(stroke.finish());
        states.push(pixels.slice());
    }
    history.undo(pixels);
    const draft = createEditorDraft({
        sourceMode: 'blank', imageSrc: null, fileName: 'language-context',
        selectedPaletteIds: ['perler'], activePalettes: [perler, hama],
        boardId: 'midi', boardWidth: 1, boardHeight: 1,
        matchingId: 'euclidean', ditheringId: 'none',
        useSymbols: true, exportFormatId: 'pdf', pdfScaleMode: 'midi-5mm',
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: true, fit: true, showGrid: true },
        showReference: false, referenceOpacity: 42, previewZoom: 3,
        editedPattern: encodeEditorProjectPattern(pixels, 29, 29),
    });
    const previousPalettes = structuredClone([perler, hama]);
    previousPalettes[1].entries[1].enabled = false;
    const context: EditorLocaleContext = {
        history: history.capture(pixels, 29, 29)!, tool: 'erase',
        colorRef: 'H-002', colorSelection: 'manual',
        pendingPaletteId: 'hama', pendingBoardId: 'mini', pendingBoardWidth: 2, pendingBoardHeight: 3,
        manualRevision: 8, colorPickerPaletteId: 'hama', colorPickerQuery: 'red',
        paletteHistory: [previousPalettes], advancedOpen: true,
        editorPanel: 'setup', homePanel: 'pegboard', viewport: { left: 123.5, top: 78.25 },
    };
    return { draft, context, pixels, states };
}

describe('editor language working context', () => {
    it('restores actual undo and redo branches for a legal 29 × 29 applied board', () => {
        const { draft, context, states } = fixture();
        const parsed = parseEditorLocaleContext(JSON.parse(JSON.stringify(context)), draft);
        expect(parsed).not.toBeNull();
        const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
        const history = new PatternHistory();
        expect(history.restore(parsed!.history, pixels, 29, 29)).toBe(true);
        expect(history.canUndo).toBe(true);
        expect(history.canRedo).toBe(true);

        history.undo(pixels);
        expect(pixels).toEqual(states[1]);
        history.undo(pixels);
        expect(pixels).toEqual(states[0]);
        expect(history.undo(pixels)).toBeNull();
        for (const expected of states.slice(1)) {
            history.redo(pixels);
            expect(pixels).toEqual(expected);
        }
        expect(history.redo(pixels)).toBeNull();
        expect(pixels.slice(-4)).toEqual(new Uint8ClampedArray([10, 20, 30, 0]));
    });

    it('keeps unapplied brand and board controls separate from the applied project', () => {
        const { draft, context } = fixture();
        const before = JSON.stringify(draft);
        const parsed = parseEditorLocaleContext(context, draft)!;

        expect(parsed).toMatchObject({
            pendingPaletteId: 'hama', pendingBoardId: 'mini', pendingBoardWidth: 2, pendingBoardHeight: 3,
            tool: 'erase', colorRef: 'H-002', colorSelection: 'manual', manualRevision: 8,
            advancedOpen: true, editorPanel: 'setup', homePanel: 'pegboard',
            colorPickerPaletteId: 'hama', colorPickerQuery: 'red', viewport: { left: 123.5, top: 78.25 },
        });
        expect(draft).toMatchObject({ selectedPaletteIds: ['perler'], boardId: 'midi', boardWidth: 1, boardHeight: 1 });
        expect(draft.editedPattern).toMatchObject({ width: 29, height: 29 });
        expect(JSON.stringify(draft)).toBe(before);
    });

    it('accepts a manually selected extra-brand color from the full applied palettes and clones history', () => {
        const { draft, context, states } = fixture();
        expect(draft.selectedPaletteIds).not.toContain('hama');
        const parsed = parseEditorLocaleContext(context, draft)!;
        expect(parsed.colorRef).toBe('H-002');
        expect(parsed.paletteHistory[0]).toEqual(context.paletteHistory[0]);
        expect(parsed.paletteHistory).not.toBe(context.paletteHistory);
        expect(parsed.paletteHistory[0][1]).not.toBe(context.paletteHistory[0][1]);
        expect(parsed.paletteHistory[0][1].entries[1].color).not.toBe(context.paletteHistory[0][1].entries[1].color);
        expect(parsed.history).not.toBe(context.history);
        expect(parsed.viewport).not.toBe(context.viewport);

        context.paletteHistory[0][1].entries[1].enabled = true;
        context.paletteHistory[0][1].entries[1].color.r = 1;
        context.history.undo[0].before = context.history.undo[0].after;
        context.viewport.left = 999;
        expect(parsed.paletteHistory[0][1].entries[1].enabled).toBe(false);
        expect(parsed.paletteHistory[0][1].entries[1].color.r).toBe(255);
        expect(parsed.viewport.left).toBe(123.5);
        const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
        const history = new PatternHistory();
        expect(history.restore(parsed.history, pixels, 29, 29)).toBe(true);
        history.undo(pixels);
        history.undo(pixels);
        expect(pixels).toEqual(states[0]);
    });

    it.each(['bead', 'fill', 'erase', 'pick', 'pan'] as const)('retains the valid %s tool and automatic color mode', (tool) => {
        const { draft, context } = fixture();
        expect(parseEditorLocaleContext({ ...context, tool, colorSelection: 'auto', colorRef: null }, draft))
            .toMatchObject({ tool, colorSelection: 'auto', colorRef: null });
    });

    it('rejects unavailable and disabled manual colors without modifying the applied palettes', () => {
        const { draft, context } = fixture();
        const before = JSON.stringify(draft);
        expect(parseEditorLocaleContext({ ...context, colorRef: 'missing-color' }, draft)).toBeNull();
        expect(JSON.stringify(draft)).toBe(before);
        draft.activePalettes[1].entries[1].enabled = false;
        expect(parseEditorLocaleContext(context, draft)).toBeNull();
    });

    it('rejects applied dimensions inconsistent with the board and an independently mismatched history', () => {
        const { draft, context } = fixture();
        expect(parseEditorLocaleContext(context, { ...draft, boardWidth: 2 })).toBeNull();
        expect(parseEditorLocaleContext(context, {
            ...draft, editedPattern: encodeEditorProjectPattern(new Uint8ClampedArray(28 * 29 * 4), 28, 29),
        })).toBeNull();
        const changedPixels = decodeEditorPatternDraft(draft.editedPattern)!;
        changedPixels[80] = 99; // Untouched by any history patch, but still part of the exact grid binding.
        expect(parseEditorLocaleContext(context, {
            ...draft, editedPattern: encodeEditorProjectPattern(changedPixels, 29, 29),
        })).toBeNull();
    });

    const invalidWorkingFields: Array<{ label: string; patch: Record<string, unknown> }> = [
        { label: 'unknown tool', patch: { tool: 'brush' } },
        { label: 'unknown selection mode', patch: { colorSelection: 'custom' } },
        { label: 'non-string color', patch: { colorRef: 123 } },
        { label: 'unknown pending brand', patch: { pendingPaletteId: 'unknown' } },
        { label: 'unknown pending board', patch: { pendingBoardId: 'maxi' } },
        { label: 'zero width', patch: { pendingBoardWidth: 0 } },
        { label: 'negative width', patch: { pendingBoardWidth: -1 } },
        { label: 'fractional width', patch: { pendingBoardWidth: 1.5 } },
        { label: 'oversized width', patch: { pendingBoardWidth: 21 } },
        { label: 'oversized height', patch: { pendingBoardHeight: 21 } },
        { label: 'infinite height', patch: { pendingBoardHeight: Infinity } },
        { label: 'negative manual revision', patch: { manualRevision: -1 } },
        { label: 'fractional manual revision', patch: { manualRevision: 1.5 } },
        { label: 'unknown picker brand', patch: { colorPickerPaletteId: 'unknown' } },
        { label: 'non-string search', patch: { colorPickerQuery: false } },
        { label: 'oversized search', patch: { colorPickerQuery: 'x'.repeat(4097) } },
        { label: 'non-boolean panel state', patch: { advancedOpen: 'true' } },
        { label: 'unknown editor panel', patch: { editorPanel: 'advanced' } },
        { label: 'unknown home panel', patch: { homePanel: 'file' } },
        { label: 'negative viewport', patch: { viewport: { left: -1, top: 0 } } },
        { label: 'infinite viewport', patch: { viewport: { left: 0, top: Infinity } } },
        { label: 'NaN viewport', patch: { viewport: { left: NaN, top: 0 } } },
        { label: 'missing viewport offset', patch: { viewport: { left: 0 } } },
        { label: 'non-object viewport', patch: { viewport: null } },
        { label: 'non-array palette history', patch: { paletteHistory: {} } },
        { label: 'malformed palette history', patch: { paletteHistory: [[{ name: 'Broken', entries: [{}] }]] } },
        { label: 'oversized palette history', patch: { paletteHistory: Array(10_001).fill([]) } },
        { label: 'missing history', patch: { history: null } },
    ];
    it.each(invalidWorkingFields)('rejects $label atomically', ({ patch }) => {
        const { draft, context } = fixture();
        const before = JSON.stringify(draft);
        expect(parseEditorLocaleContext({ ...context, ...patch }, draft)).toBeNull();
        expect(JSON.stringify(draft)).toBe(before);
    });
});

describe('editor language arrival detection', () => {
    const origin = 'https://fusebeadpatterns.art';
    const equivalentRoutes = Object.entries(localeRoutes).flatMap(([fromLocale, from]) => (
        Object.entries(localeRoutes).flatMap(([toLocale, to]) => (['home', 'editor'] as const).map(kind => ({
            fromLocale, toLocale, kind, from: `${origin}${from[kind]}`, to: `${origin}${to[kind]}`,
            expected: fromLocale !== toLocale,
        })))
    ));
    it.each(equivalentRoutes)('$fromLocale → $toLocale $kind = $expected', ({ from, to, expected }) => {
        expect(isEditorLanguageArrival(from, to)).toBe(expected);
    });

    it.each([
        { label: 'first visit without a referrer', from: '', to: `${origin}/ja/editor` },
        { label: 'same-language home to editor', from: `${origin}/de`, to: `${origin}/de/editor` },
        { label: 'different-language home to editor', from: `${origin}/de`, to: `${origin}/ja/editor` },
        { label: 'different-language editor to home', from: `${origin}/de/editor`, to: `${origin}/fr` },
        { label: 'external origin', from: 'https://makebead.com/de/editor', to: `${origin}/ja/editor` },
        { label: 'different scheme', from: 'http://fusebeadpatterns.art/de/editor', to: `${origin}/ja/editor` },
        { label: 'different port', from: 'http://127.0.0.1:4332/de/editor', to: 'http://127.0.0.1:4333/ja/editor' },
        { label: 'catalog routes', from: `${origin}/de/patterns`, to: `${origin}/ja/patterns` },
        { label: 'unrecognized nested editor path', from: `${origin}/de/editor/other`, to: `${origin}/ja/editor` },
        { label: 'relative referrer', from: '/de/editor', to: `${origin}/ja/editor` },
        { label: 'invalid destination', from: `${origin}/de/editor`, to: 'not a URL' },
    ])('returns false for $label', ({ from, to }) => {
        expect(isEditorLanguageArrival(from, to)).toBe(false);
    });

    it('recognizes equivalent arrivals with trailing slashes, queries and fragments', () => {
        expect(isEditorLanguageArrival(`${origin}/de/editor/?pattern=pikachu#canvas`, `${origin}/ja/editor/?pattern=pikachu#canvas`)).toBe(true);
        expect(isEditorLanguageArrival(`${origin}/de/?from=generator`, `${origin}/fr/#ready-patterns`)).toBe(true);
        expect(isEditorLanguageArrival('http://127.0.0.1:4332/editor/', 'http://127.0.0.1:4332/fr/editor/')).toBe(true);
        expect(isEditorLanguageArrival(`${origin}/`, `${origin}/de/`)).toBe(true);
    });
});
