import type { Palette } from '../core/model/palette/palette.model';
import { computeUsage, createPaletteEntryColorMap, drawImageInsideCanvas, getPaletteEntryColorKey } from '../core/utils/utils';
import { getBoardOption, getPaletteOption, parsePaletteCsv } from '../editor/config';
import { createEditorDraft, decodeEditorPatternDraft, encodeEditorProjectPattern, parseEditorProject, serializeEditorProject } from '../editor/draft';
import { clonePalettes } from '../editor/palette-state';
import { remapPatternPalette } from '../editor/pattern-palette';
import { quantizePattern } from '../editor/pattern-quantization';
import { buildEditorProject } from '../editor/project';

export type JapanesePaletteId = 'perler' | 'hama' | 'artkal_a';
export const JAPANESE_PALETTES: { id: JapanesePaletteId; label: string }[] = [
    { id: 'perler', label: 'Perler Midi' },
    { id: 'hama', label: 'Hama Midi' },
    { id: 'artkal_a', label: 'Artkal A' },
];
export const JAPANESE_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const JAPANESE_PROJECT_MAX_BYTES = 16 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 16_000_000;
const SOURCE_IMAGE_PREFIX = /^data:image\/(?:png|jpeg|webp);base64,/;
const MATCHING_ID = 'delta_e_cie2000';
const ADJUSTMENTS = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 };
const RENDERER = { center: true, fit: true, showGrid: true };

export type JapaneseSettings = { paletteId: JapanesePaletteId; boardWidth: number; boardHeight: number };
export type JapaneseExportSnapshot = JapaneseSettings & {
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
    palette: Palette;
    usage: Map<string, number>;
    fileName: string;
};
export type JapanesePattern = JapaneseExportSnapshot & { imageSrc: string | null };
type JapaneseErrorCode = 'image_type' | 'image_size' | 'image_read' | 'image_dimensions' | 'palette' | 'settings' | 'project' | 'project_scope' | 'project_colors' | 'canvas' | 'generation' | 'export';
const ERRORS: Record<JapaneseErrorCode, string> = {
    image_type: 'PNG・JPEG・WebPの静止画像を選んでください。GIF・SVG・HEICには対応していません。',
    image_size: '画像は8 MB以下にしてください。小さく保存した画像で、もう一度お試しください。',
    image_read: '画像を読み込めませんでした。別のPNG・JPEG・WebP画像を選んでください。現在の図案は残っています。',
    image_dimensions: '画像は1,600万画素以下、縦横それぞれ8,192ピクセル以下にしてください。',
    palette: 'ブランドの色表を読み込めませんでした。接続を確認して、もう一度お試しください。現在の図案は残っています。',
    settings: 'プレートの枚数は縦横それぞれ1〜4枚にしてください。',
    project: 'プロジェクトを開けませんでした。このツールで保存した.bead-pattern.jsonファイルを選んでください。現在の図案は残っています。',
    project_scope: 'このページで開けるのは、Perler Midi・Hama Midi・Artkal Aの29×29マスのプレートを縦横1〜4枚使うプロジェクトです。その他の設定は英語の編集ツールで開いてください。現在の図案は残っています。',
    project_colors: 'プロジェクトの色表または透明データが、このブランドの設定と一致しません。現在の図案は残っています。',
    canvas: 'このブラウザで図案の描画を開始できませんでした。別のブラウザでお試しください。',
    generation: '図案を作れませんでした。画像や設定を確認して、もう一度お試しください。現在の図案は残っています。',
    export: 'ファイルを保存できませんでした。現在の図案は残っています。もう一度試すか、プロジェクトを保存してください。',
};

export class JapaneseGeneratorError extends Error {
    constructor(public readonly code: JapaneseErrorCode) { super(ERRORS[code]); this.name = 'JapaneseGeneratorError'; }
}
export function japaneseErrorMessage(error: unknown, fallback: JapaneseErrorCode = 'generation'): string {
    return error instanceof JapaneseGeneratorError ? error.message : ERRORS[fallback];
}
export function isJapanesePaletteId(value: string): value is JapanesePaletteId {
    return JAPANESE_PALETTES.some(({ id }) => id === value);
}
export function validateJapaneseSettings(settings: JapaneseSettings): void {
    if (!isJapanesePaletteId(settings.paletteId) || ![settings.boardWidth, settings.boardHeight].every(value => Number.isInteger(value) && value >= 1 && value <= 4)) {
        throw new JapaneseGeneratorError('settings');
    }
}
function checkAbort(signal?: AbortSignal): void {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
}

/** A failed or superseded operation cannot publish a partial state. */
export class JapaneseRequestGate {
    private active: AbortController | null = null;
    begin(): AbortController { this.cancel(); this.active = new AbortController(); return this.active; }
    isCurrent(request: AbortController): boolean { return this.active === request && !request.signal.aborted; }
    cancel(): void { this.active?.abort(); this.active = null; }
}

export async function loadJapanesePalette(paletteId: JapanesePaletteId, signal?: AbortSignal): Promise<Palette> {
    if (!isJapanesePaletteId(paletteId)) throw new JapaneseGeneratorError('palette');
    const option = getPaletteOption(paletteId)!;
    try {
        const response = await fetch(`/palettes/${option.file}`, { signal });
        if (!response.ok) throw new JapaneseGeneratorError('palette');
        const csv = await response.text();
        const rows = csv.trim().split(/\r?\n/).map(line => line.split(','));
        if (rows.length < 2 || rows.some(row => row.length < 6 || !row[0]?.trim() || !row[1]?.trim() || !row.slice(3, 6).every(value => /^\d+$/.test(value.trim()) && Number(value) <= 255))) throw new JapaneseGeneratorError('palette');
        const palette = parsePaletteCsv(csv, option);
        if (!palette.entries.length || palette.entries.some(entry => !entry.ref || ![entry.color.r, entry.color.g, entry.color.b].every(channel => Number.isInteger(channel) && channel >= 0 && channel <= 255))) throw new JapaneseGeneratorError('palette');
        checkAbort(signal);
        return palette;
    } catch (error) { checkAbort(signal); throw error instanceof JapaneseGeneratorError ? error : new JapaneseGeneratorError('palette'); }
}

export function loadJapaneseImage(imageSrc: string, signal?: AbortSignal): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        if (!SOURCE_IMAGE_PREFIX.test(imageSrc)) { reject(new JapaneseGeneratorError('image_type')); return; }
        const image = new Image();
        const cleanup = () => { image.onload = null; image.onerror = null; signal?.removeEventListener('abort', aborted); };
        const aborted = () => { cleanup(); image.src = ''; reject(new DOMException('Cancelled', 'AbortError')); };
        image.onload = () => {
            cleanup();
            if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 8192 || image.naturalHeight > 8192 || image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) { reject(new JapaneseGeneratorError('image_dimensions')); return; }
            resolve(image);
        };
        image.onerror = () => { cleanup(); reject(new JapaneseGeneratorError('image_read')); };
        signal?.addEventListener('abort', aborted, { once: true });
        if (signal?.aborted) { aborted(); return; }
        image.src = imageSrc;
    });
}

export async function readJapaneseImage(file: File, signal?: AbortSignal): Promise<string> {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new JapaneseGeneratorError('image_type');
    if (!file.size || file.size > JAPANESE_IMAGE_MAX_BYTES) throw new JapaneseGeneratorError('image_size');
    // Reject animated WebP/APNG rather than silently choosing a frame.
    const header = new Uint8Array(await file.arrayBuffer());
    checkAbort(signal);
    const ascii = (start: number, length: number) => String.fromCharCode(...header.subarray(start, start + length));
    if (file.type === 'image/webp') {
        if (ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WEBP') throw new JapaneseGeneratorError('image_read');
        for (let offset = 12; offset + 8 <= header.length;) {
            const kind = ascii(offset, 4);
            if (kind === 'ANIM' || kind === 'ANMF') throw new JapaneseGeneratorError('image_type');
            const size = new DataView(header.buffer).getUint32(offset + 4, true);
            offset += 8 + size + (size % 2);
        }
    } else if (file.type === 'image/png') {
        if (header[0] !== 137 || ascii(1, 3) !== 'PNG') throw new JapaneseGeneratorError('image_read');
        for (let offset = 8; offset + 8 <= header.length;) {
            const size = new DataView(header.buffer).getUint32(offset);
            if (ascii(offset + 4, 4) === 'acTL') throw new JapaneseGeneratorError('image_type');
            offset += 12 + size;
        }
    } else if (header[0] !== 255 || header[1] !== 216) throw new JapaneseGeneratorError('image_read');
    const imageSrc = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        const cleanup = () => signal?.removeEventListener('abort', aborted);
        const aborted = () => { reader.abort(); cleanup(); reject(new DOMException('Cancelled', 'AbortError')); };
        reader.onload = () => {
            cleanup();
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject(new JapaneseGeneratorError('image_read'));
        };
        reader.onerror = () => { cleanup(); reject(new JapaneseGeneratorError('image_read')); };
        signal?.addEventListener('abort', aborted, { once: true });
        if (signal?.aborted) { aborted(); return; }
        reader.readAsDataURL(file);
    });
    await loadJapaneseImage(imageSrc, signal);
    return imageSrc;
}

export async function generateJapanesePattern(imageSrc: string, settings: JapaneseSettings, palette: Palette, fileName: string, signal?: AbortSignal): Promise<JapanesePattern> {
    validateJapaneseSettings(settings);
    const image = await loadJapaneseImage(imageSrc, signal);
    checkAbort(signal);
    const width = settings.boardWidth * 29, height = settings.boardHeight * 29;
    const project = buildEditorProject({ palettes: [palette], boardOption: getBoardOption('midi')!, boardWidth: settings.boardWidth, boardHeight: settings.boardHeight, matchingId: MATCHING_ID, ditheringId: 'none', imageAdjustments: ADJUSTMENTS, rendererSettings: RENDERER, useSymbols: true });
    image.style.filter = project.imageConfiguration.css();
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new JapaneseGeneratorError('canvas');
    const position = drawImageInsideCanvas(canvas, image, project.rendererConfiguration);
    const data = context.getImageData(0, 0, width, height);
    const pixels = await quantizePattern({ pixels: data.data, width, height, palettes: [palette], matchingId: MATCHING_ID, dithering: { enable: false, hardness: 0 }, drawingPosition: { x: position.xStart, y: position.yStart, width: position.width, height: position.height } }, { signal });
    checkAbort(signal);
    const result: JapanesePattern = { ...settings, width, height, pixels, palette: clonePalettes([palette])[0], usage: computeUsage(pixels, [palette]), fileName, imageSrc };
    validateJapanesePattern(result);
    return result;
}

export function validateJapanesePattern(pattern: JapaneseExportSnapshot): void {
    validateJapaneseSettings(pattern);
    if (pattern.width !== pattern.boardWidth * 29 || pattern.height !== pattern.boardHeight * 29 || pattern.pixels.length !== pattern.width * pattern.height * 4) throw new JapaneseGeneratorError('project_scope');
    const colors = createPaletteEntryColorMap([pattern.palette]);
    for (let offset = 0; offset < pattern.pixels.length; offset += 4) {
        const alpha = pattern.pixels[offset + 3];
        if (alpha !== 0 && (alpha !== 255 || !colors.has(getPaletteEntryColorKey(pattern.pixels[offset], pattern.pixels[offset + 1], pattern.pixels[offset + 2], alpha)))) throw new JapaneseGeneratorError('project_colors');
    }
}

export function snapshotJapanesePattern(pattern: JapanesePattern, fileName = pattern.fileName): JapaneseExportSnapshot {
    validateJapanesePattern(pattern);
    const palette = clonePalettes([pattern.palette])[0], pixels = new Uint8ClampedArray(pattern.pixels);
    return { paletteId: pattern.paletteId, boardWidth: pattern.boardWidth, boardHeight: pattern.boardHeight, width: pattern.width, height: pattern.height, palette, pixels, usage: computeUsage(pixels, [palette]), fileName };
}

export async function remapJapanesePattern(pattern: JapanesePattern, paletteId: JapanesePaletteId, palette: Palette, signal?: AbortSignal): Promise<JapanesePattern> {
    validateJapanesePattern(pattern);
    if (!isJapanesePaletteId(paletteId)) throw new JapaneseGeneratorError('settings');
    const pixels = await remapPatternPalette(pattern.pixels, pattern.width, pattern.height, [palette], MATCHING_ID, { signal, sourcePalettes: [pattern.palette] });
    checkAbort(signal);
    return { ...pattern, paletteId, palette: clonePalettes([palette])[0], pixels, usage: computeUsage(pixels, [palette]) };
}

export function serializeJapaneseProject(pattern: JapanesePattern): string {
    const snapshot = snapshotJapanesePattern(pattern);
    return serializeEditorProject(createEditorDraft({ sourceMode: pattern.imageSrc ? 'image' : 'blank', imageSrc: pattern.imageSrc, fileName: snapshot.fileName, selectedPaletteIds: [snapshot.paletteId], activePalettes: [snapshot.palette], boardId: 'midi', boardWidth: snapshot.boardWidth, boardHeight: snapshot.boardHeight, matchingId: MATCHING_ID, ditheringId: 'none', useSymbols: true, exportFormatId: 'pdf', imageAdjustments: ADJUSTMENTS, rendererSettings: RENDERER, showReference: false, referenceOpacity: 0.3, previewZoom: 1, editedPattern: encodeEditorProjectPattern(snapshot.pixels, snapshot.width, snapshot.height) }));
}

export function inspectJapaneseProject(raw: string): { paletteId: JapanesePaletteId } {
    if (raw.length > JAPANESE_PROJECT_MAX_BYTES) throw new JapaneseGeneratorError('project');
    const draft = parseEditorProject(raw);
    if (!draft?.editedPattern) throw new JapaneseGeneratorError('project');
    if (draft.boardId !== 'midi' || draft.selectedPaletteIds.length !== 1 || draft.activePalettes.length !== 1 || !isJapanesePaletteId(draft.selectedPaletteIds[0]) || ![draft.boardWidth, draft.boardHeight].every(value => Number.isInteger(value) && value >= 1 && value <= 4) || draft.editedPattern.width !== draft.boardWidth * 29 || draft.editedPattern.height !== draft.boardHeight * 29) throw new JapaneseGeneratorError('project_scope');
    if (draft.imageSrc && (!SOURCE_IMAGE_PREFIX.test(draft.imageSrc) || draft.imageSrc.length > Math.ceil(JAPANESE_IMAGE_MAX_BYTES * 4 / 3) + 80)) throw new JapaneseGeneratorError('project');
    if (!draft.activePalettes[0].entries.length) throw new JapaneseGeneratorError('project_colors');
    return { paletteId: draft.selectedPaletteIds[0] };
}

/** The caller loads the selected official CSV; imported colors cannot silently redefine it. */
export function restoreJapaneseProject(raw: string, palette: Palette): JapanesePattern {
    const { paletteId } = inspectJapaneseProject(raw);
    const draft = parseEditorProject(raw)!;
    const expectedRefs = new Map(palette.entries.map(entry => [entry.ref, entry]));
    for (const entry of draft.activePalettes[0].entries) {
        const expected = expectedRefs.get(entry.ref);
        if (!expected || ['r', 'g', 'b', 'a'].some((channel: 'r'|'g'|'b'|'a') => entry.color[channel] !== expected.color[channel])) throw new JapaneseGeneratorError('project_colors');
    }
    const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
    const restored: JapanesePattern = { paletteId, palette: clonePalettes([palette])[0], boardWidth: draft.boardWidth, boardHeight: draft.boardHeight, width: draft.editedPattern.width, height: draft.editedPattern.height, pixels, usage: computeUsage(pixels, [palette]), fileName: draft.fileName || 'bead-pattern', imageSrc: draft.imageSrc };
    validateJapanesePattern(restored);
    return restored;
}

export function japaneseDownloadName(value: string): string {
    return Array.from(value).filter(char => char.charCodeAt(0) >= 32 && !'<>:"/\\|?*'.includes(char)).join('').trim().slice(0, 120) || 'bead-pattern';
}
