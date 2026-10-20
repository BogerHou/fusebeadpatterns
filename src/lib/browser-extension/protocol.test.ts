import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createEditorDraft, decodeEditorPatternDraft, encodeEditorProjectPattern, serializeEditorProject } from '../editor/draft';
import { PALETTE_OPTIONS, getBoardOption, getPaletteOption, parsePaletteCsv } from '../editor/config';
import { preparePixelBeadEditorDraft } from '../editor/pixel-bead-entry';
import {
    EXTENSION_MESSAGE_SOURCE, getHandoffToken, getImageOriginPattern, HANDOFF_TTL_MS,
    isAuthorizedHandoffFinish, isAuthorizedHandoffSender, isAuthorizedSourceSender,
    isExtensionProjectMessage, isExtensionToken, isFreshTimestamp, isStudioSender,
    isWebsiteBridgeMessage, makeHandoffUrl, MAX_HANDOFF_BYTES, parseExtensionProject, sanitizeHomepageCaptureDraft, WEBSITE_MESSAGE_SOURCE,
} from './protocol';

const token = 'beadbead-1234-4321-9123-123456789abc';
const otherToken = 'beadbead-1234-4321-9123-123456789abd';
const extensionId = 'abcdefghijklmnopabcdefghijklmnop';
function project(id = 'perler', count = 1) {
    const palette = getPaletteOption(id)!;
    const board = getBoardOption(palette.boardId)!;
    const width = board.beadsPerRow * count;
    const pixels = new Uint8ClampedArray(width * width * 4);
    pixels.set([0, 0, 0, 255]);
    return createEditorDraft({ sourceMode: 'blank', imageSrc: null, fileName: 'image-29x29-perler',
        selectedPaletteIds: [id], activePalettes: [parsePaletteCsv('01,Black,B,0,0,0', palette)],
        boardId: board.id, boardWidth: count, boardHeight: count, matchingId: 'euclidean', ditheringId: 'none',
        useSymbols: true, exportFormatId: 'pdf', previewZoom: 1,
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: false, fit: false, showGrid: true }, editedPattern: encodeEditorProjectPattern(pixels, width, width) });
}

describe('extension transport safety', () => {
    it('accepts opaque UUIDs and only canonical editor URLs with a single token', () => {
        expect(isExtensionToken(token)).toBe(true);
        for (const locale of ['en', 'de', 'fr', 'ja'] as const) expect(getHandoffToken(makeHandoffUrl(token, locale))).toBe(token);
        const valid = makeHandoffUrl(token);
        for (const url of [valid + '&x=1', valid + '&extension-project=' + otherToken, valid + '#x', valid.replace('https:', 'http:'),
            valid.replace('fusebeadpatterns.art', 'fusebeadpatterns.art.evil.example'), valid.replace('/editor?', '/editor/other?'),
            valid.replace('/editor?', '/editor/?'), valid.replace('https://', 'https://x@'), 'not a URL', '/editor?extension-project=' + token]) {
            expect(getHandoffToken(url)).toBeNull();
        }
        expect(isExtensionToken('../editor')).toBe(false);
        expect(() => makeHandoffUrl('bad')).toThrow();
    });

    it('checks message source, type, token and string limits before accepting payloads', () => {
        expect(isWebsiteBridgeMessage({ source: WEBSITE_MESSAGE_SOURCE, type: 'extension-ready', token }, token)).toBe(true);
        expect(isWebsiteBridgeMessage({ source: WEBSITE_MESSAGE_SOURCE, type: 'extension-dismissed', token }, token)).toBe(true);
        expect(isWebsiteBridgeMessage({ source: EXTENSION_MESSAGE_SOURCE, type: 'extension-ready', token }, token)).toBe(false);
        expect(isWebsiteBridgeMessage({ source: WEBSITE_MESSAGE_SOURCE, type: 'extension-ready', token: otherToken }, token)).toBe(false);
        expect(isExtensionProjectMessage({ source: EXTENSION_MESSAGE_SOURCE, type: 'extension-project', token, project: 'x' }, token)).toBe(true);
        expect(isExtensionProjectMessage({ source: EXTENSION_MESSAGE_SOURCE, type: 'extension-project', token, project: 'x'.repeat(MAX_HANDOFF_BYTES + 1) }, token)).toBe(false);
    });

    it('validates standard public image hosts without granting URL credentials, local hosts or alternate schemes', () => {
        expect(getImageOriginPattern('https://images.example.com/a.png?token=secret')).toBe('https://images.example.com/*');
        expect(getImageOriginPattern('http://cdn.example.com/a.png')).toBe('http://cdn.example.com/*');
        for (const url of ['https://u:p@images.example.com/a', 'https://127.0.0.1/a', 'https://0x7f000001/a', 'https://2130706433/a',
            'http://192.168.1.2/a', 'http://10.0.0.3/a', 'http://169.254.169.254/a', 'https://[::1]/a', 'http://localhost/a',
            'https://x.local/a', 'https://metadata.google.internal/a', 'https://cdn.example.com:8443/a', 'file:///tmp/a.png',
            'blob:https://example.com/id', 'data:image/png;base64,x', 'javascript:alert(1)', 'https://example.com./a']) {
            expect(getImageOriginPattern(url)).toBeNull();
        }
    });

    it('bounds byte size, brand/board association, opacity and palette membership', () => {
        expect(parseExtensionProject(serializeEditorProject(project()))).not.toBeNull();
        expect(parseExtensionProject(serializeEditorProject(project('artkal_s', 3)))?.editedPattern?.width).toBe(150);
        expect(parseExtensionProject(serializeEditorProject(project('perler', 5)))?.editedPattern?.width).toBe(145);
        expect(parseExtensionProject('x'.repeat(MAX_HANDOFF_BYTES + 1))).toBeNull();
        const utf8 = JSON.parse(serializeEditorProject(project()));
        utf8.extra = '图'.repeat(Math.ceil(MAX_HANDOFF_BYTES / 3));
        expect(parseExtensionProject(JSON.stringify(utf8))).toBeNull();
        for (const mutate of [
            (draft: ReturnType<typeof project>) => { draft.imageSrc = 'https://private.example.com/picture'; },
            (draft: ReturnType<typeof project>) => { draft.sourceMode = 'image'; },
            (draft: ReturnType<typeof project>) => { draft.boardId = 'mini'; },
            (draft: ReturnType<typeof project>) => { draft.selectedPaletteIds = ['perler_mini']; },
            (draft: ReturnType<typeof project>) => { draft.selectedPaletteIds = ['invented-brand']; },
            (draft: ReturnType<typeof project>) => { draft.selectedPaletteIds = ['perler', 'perler']; draft.activePalettes.push(draft.activePalettes[0]); },
            (draft: ReturnType<typeof project>) => { draft.activePalettes.push(draft.activePalettes[0]); },
            (draft: ReturnType<typeof project>) => { draft.ditheringId = 'invented-dithering'; },
            (draft: ReturnType<typeof project>) => { draft.exportFormatId = 'script'; },
            (draft: ReturnType<typeof project>) => { draft.boardWidth = 21; },
            (draft: ReturnType<typeof project>) => { draft.activePalettes[0].entries[0].enabled = false; },
            (draft: ReturnType<typeof project>) => { const pixels = new Uint8ClampedArray(29 * 29 * 4); pixels.set([0, 0, 0, 128]); draft.editedPattern = encodeEditorProjectPattern(pixels, 29, 29); },
            (draft: ReturnType<typeof project>) => { const pixels = new Uint8ClampedArray(29 * 29 * 4); pixels.set([1, 2, 3, 255]); draft.editedPattern = encodeEditorProjectPattern(pixels, 29, 29); },
        ]) { const draft = project(); mutate(draft); expect(parseExtensionProject(serializeEditorProject(draft))).toBeNull(); }
    });

    it('carries all homepage brands and the full supported mini-board size', () => {
        for (const palette of PALETTE_OPTIONS) {
            const draft = project(palette.id, 6);
            draft.ditheringId = 'atkinson';
            expect(parseExtensionProject(serializeEditorProject(draft))).toMatchObject({
                selectedPaletteIds: [palette.id], boardWidth: 6, boardHeight: 6, ditheringId: 'atkinson',
            });
        }
        const maximum = project('perler_mini', 20);
        const raw = serializeEditorProject(maximum);
        expect(raw.length).toBeLessThan(MAX_HANDOFF_BYTES);
        expect(parseExtensionProject(raw)?.editedPattern).toEqual(maximum.editedPattern);
        expect(maximum.editedPattern?.width).toBe(1140);
    });

    it('keeps an 87 by 87 Artkal S homepage grid on its chosen midi boards instead of forcing the palette default', () => {
        const option = getPaletteOption('artkal_s')!;
        expect(option.boardId).toBe('mini_artkal');
        const palette = parsePaletteCsv(readFileSync(new URL('../../../public/palettes/artkal_s.csv', import.meta.url), 'utf8'), option);
        const draft = project('perler', 3);
        const pixels = new Uint8ClampedArray(87 * 87 * 4);
        for (let y = 3; y < 62; y++) for (let x = 7; x < 71; x++) {
            const color = palette.entries[(x + y) % 8].color;
            pixels.set([color.r, color.g, color.b, 255], (y * 87 + x) * 4);
        }
        draft.selectedPaletteIds = ['artkal_s']; draft.activePalettes = [palette];
        draft.maxBeadColors = 8; draft.editedPattern = encodeEditorProjectPattern(pixels, 87, 87);
        const sanitized = sanitizeHomepageCaptureDraft(draft)!;
        expect(sanitized).not.toBeNull();
        expect(sanitized).toMatchObject({ boardId: 'midi', boardWidth: 3, boardHeight: 3, selectedPaletteIds: ['artkal_s'], maxBeadColors: 8 });
        const received = parseExtensionProject(serializeEditorProject(sanitized))!;
        const prepared = preparePixelBeadEditorDraft(received, { allowIndependentBoardLayout: true });
        expect(prepared.prepared.pixels).toEqual(pixels);
        expect(prepared.prepared.width).toBe(87); expect(prepared.prepared.height).toBe(87);
        expect(prepared.draft.activePalettes).toEqual([palette]);
        // The separate pixel-grid conversion still uses its brand-selected board.
        expect(() => preparePixelBeadEditorDraft(received)).toThrow('Invalid pixel bead board');
        received.editedPattern!.width = 86;
        expect(() => preparePixelBeadEditorDraft(received, { allowIndependentBoardLayout: true })).toThrow();
    });

    it('detaches a generated homepage grid while preserving exact pixels and conversion settings', () => {
        const draft = project('perler', 2), before = structuredClone(draft);
        const hama = parsePaletteCsv('01,Red,R,255,0,0\n02,Blue,B,0,0,255', getPaletteOption('hama')!);
        hama.entries[1].enabled = false;
        draft.selectedPaletteIds.push('hama'); draft.activePalettes.push(hama);
        const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
        pixels.set([255, 0, 0, 255], 4);
        pixels.set([42, 32, 12, 0], 8);
        draft.editedPattern = encodeEditorProjectPattern(pixels, 58, 58);
        draft.sourceMode = 'image';
        draft.imageSrc = 'data:image/png;base64,private-original';
        draft.fileName = 'private-original.png';
        draft.sourceCrop = { x: 10, y: 20, width: 60, height: 70, sourceWidth: 100, sourceHeight: 100 };
        draft.matchingId = 'delta_e_cie2000'; draft.ditheringId = 'floyd-steinberg'; draft.maxBeadColors = 16;
        draft.imageAdjustments = { brightness: 90, contrast: 120, saturation: 80, grayscale: 10 };
        draft.rendererSettings = { center: true, fit: true, showGrid: false };
        draft.previewZoom = 1.5; draft.exportFormatId = 'grid_png';
        draft.pdfPaperSize = 'letter'; draft.pdfScaleMode = 'midi-5mm';
        const snapshot = structuredClone(draft);
        const sanitized = sanitizeHomepageCaptureDraft(draft)!;
        expect(sanitized).not.toBeNull();
        expect(sanitized.sourceMode).toBe('blank'); expect(sanitized.imageSrc).toBeNull();
        expect(sanitized.sourceCrop).toBeNull(); expect(sanitized.sourceBackground).toBeNull();
        expect(JSON.stringify(sanitized)).not.toContain('private-original');
        expect(sanitized.selectedPaletteIds).toEqual(['perler', 'hama']);
        expect(sanitized.activePalettes).toEqual(draft.activePalettes);
        expect(sanitized.activePalettes).not.toBe(draft.activePalettes);
        expect(decodeEditorPatternDraft(sanitized.editedPattern)).toEqual(pixels);
        expect(sanitized).toMatchObject({
            matchingId: 'delta_e_cie2000', ditheringId: 'floyd-steinberg', maxBeadColors: 16,
            imageAdjustments: draft.imageAdjustments, rendererSettings: draft.rendererSettings,
            previewZoom: 1.5, exportFormatId: 'grid_png', pdfPaperSize: 'letter', pdfScaleMode: 'midi-5mm',
        });
        expect(draft).toEqual(snapshot);
        expect(sanitizeHomepageCaptureDraft({ ...before, editedPattern: null })).toBeNull();
        expect(sanitizeHomepageCaptureDraft({ ...draft, selectedPaletteIds: ['perler', 'hama_mini'] })).toBeNull();
    });

    it('removes unknown fields at every project level instead of forwarding source data', () => {
        const raw = JSON.parse(serializeEditorProject(project()));
        const privateUrl = 'https://private.example.com/secret.png';
        raw.source = privateUrl; raw.draft.hiddenImage = privateUrl;
        raw.draft.activePalettes[0].source = privateUrl;
        raw.draft.activePalettes[0].entries[0].source = privateUrl;
        raw.draft.activePalettes[0].entries[0].color.source = privateUrl;
        raw.draft.editedPattern.source = privateUrl;
        raw.draft.imageAdjustments.source = privateUrl;
        raw.draft.rendererSettings.source = privateUrl;
        const parsed = parseExtensionProject(JSON.stringify(raw));
        expect(parsed).not.toBeNull();
        expect(parsed?.fileName).toBe('Bead Capture');
        expect(JSON.stringify(parsed)).not.toContain(privateUrl);
        expect(parsed?.activePalettes[0].entries[0].color.add).toBeTypeOf('function');
    });

    it('requires the original tab, extension, top frame, token, editor and unexpired timestamp', () => {
        const now = 1000000, binding = { token, tabId: 77, targetUrl: makeHandoffUrl(token), createdAt: now };
        const sender = { id: extensionId, tab: { id: 77 }, frameId: 0, url: binding.targetUrl };
        expect(isAuthorizedHandoffSender(binding, sender, extensionId, token, now)).toBe(true);
        for (const invalid of [{ ...sender, id: 'other' }, { ...sender, tab: { id: 78 } }, { ...sender, frameId: 1 },
            { ...sender, frameId: undefined }, { ...sender, url: makeHandoffUrl(otherToken) }, { ...sender, url: binding.targetUrl.replace('/editor?', '/de/editor?') }]) {
            expect(isAuthorizedHandoffSender(binding, invalid, extensionId, token, now)).toBe(false);
        }
        expect(isAuthorizedHandoffSender(binding, sender, extensionId, otherToken, now)).toBe(false);
        expect(isAuthorizedHandoffSender(binding, sender, extensionId, token, now + HANDOFF_TTL_MS)).toBe(false);
        expect(isAuthorizedHandoffSender(binding, sender, extensionId, token, now - 1)).toBe(false);
        expect(isAuthorizedHandoffFinish(binding, { ...sender, url: 'https://fusebeadpatterns.art/editor' }, extensionId, token, now)).toBe(true);
        expect(isAuthorizedHandoffFinish(binding, { ...sender, url: 'https://fusebeadpatterns.art/de/editor' }, extensionId, token, now)).toBe(false);
        expect(isFreshTimestamp(NaN, now)).toBe(false);
    });

    it('allows a trusted studio without sender.tab but binds its exact source query and any available tab ID', () => {
        const sender = { id: extensionId, url: `chrome-extension://${extensionId}/studio.html?source=${token}` };
        expect(isStudioSender(sender, extensionId)).toBe(true);
        expect(isAuthorizedSourceSender(sender, extensionId, token, 77)).toBe(true);
        expect(isAuthorizedSourceSender({ ...sender, tab: { id: 77 } }, extensionId, token, 77)).toBe(true);
        expect(isAuthorizedSourceSender({ ...sender, tab: { id: 78 } }, extensionId, token, 77)).toBe(false);
        expect(isAuthorizedSourceSender(sender, extensionId, otherToken, 77)).toBe(false);
        expect(isStudioSender({ ...sender, url: sender.url + '&source=' + token }, extensionId)).toBe(false);
        expect(isStudioSender({ ...sender, frameId: 1 }, extensionId)).toBe(false);
        expect(isStudioSender({ ...sender, url: 'https://fusebeadpatterns.art/studio.html' }, extensionId)).toBe(false);
    });
});
