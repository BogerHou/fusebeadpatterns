import type { jsPDF as JsPdf } from 'jspdf';
import type { SiteLocale } from '../i18n/locales';
import { BLOCK_SHAPE_JAPANESE_FONT_NAME, loadBlockShapeJapaneseFont, registerBlockShapeJapaneseFont } from './japanese-font';
import { generateShape, type ShapeModel } from './core';
import { blockShapeCopy } from './copy';
import { validateShapeState, type BlockShapeState } from './project';

export type ShapePdfPage = { kind: 'summary' | 'layer' | 'tile'; layer: number; x: number; z: number; width: number; depth: number };
export const SHAPE_PDF_TILE = 56;
export function planShapePdf(input: BlockShapeState, allLayers: boolean) {
    const state = validateShapeState(input);
    if (typeof allLayers !== 'boolean') throw new Error('INVALID_OPTIONS');
    const widthMm = state.paper === 'a4' ? 210 : 215.9, heightMm = state.paper === 'a4' ? 297 : 279.4;
    const cellMm = Math.min(8, (widthMm - 48) / state.spec.width, (heightMm - 100) / state.spec.depth);
    const pages: ShapePdfPage[] = [];
    if (allLayers && state.spec.height > 1) pages.push({ kind: 'summary', layer: 0, x: 0, z: 0, width: state.spec.width, depth: state.spec.depth });
    const layers = allLayers ? Array.from({ length: state.spec.height }, (_, y) => y) : [state.layer];
    for (const layer of layers) {
        pages.push({ kind: 'layer', layer, x: 0, z: 0, width: state.spec.width, depth: state.spec.depth });
        if (cellMm < 3) for (let z = 0; z < state.spec.depth; z += SHAPE_PDF_TILE) for (let x = 0; x < state.spec.width; x += SHAPE_PDF_TILE) {
            pages.push({ kind: 'tile', layer, x, z, width: Math.min(SHAPE_PDF_TILE, state.spec.width - x), depth: Math.min(SHAPE_PDF_TILE, state.spec.depth - z) });
        }
    }
    return { state, pages, widthMm, heightMm, cellMm };
}
export function shapePdfJapaneseCharacters(): string {
    const labels = blockShapeCopy.ja;
    return [...new Set(Object.entries(labels).filter(([key, value]) => (key.startsWith('pdf') || ['ellipse', 'sphere', 'dome', 'cylinder', 'cone', 'solid', 'hollow'].includes(key)) && typeof value === 'string').map(([, value]) => value).join(''))].join('');
}
function verifyFont(doc: JsPdf, text: string) {
    doc.setFont(BLOCK_SHAPE_JAPANESE_FONT_NAME, 'normal');
    const font = doc.getFont() as unknown as { metadata?: { cmap?: { unicode?: { codeMap?: Record<number, number> } } } };
    const map = font.metadata?.cmap?.unicode?.codeMap;
    if (!map || [...text].some(character => !map[character.codePointAt(0)!])) throw new Error('PDF_GLYPHS_MISSING');
}
function colorRgb(hex: string): [number, number, number] {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
function axisLabels(start: number, count: number, cell: number): number[] {
    const values: number[] = [], step = Math.max(1, Math.ceil(5 / cell));
    for (let offset = 0; offset < count; offset++) if (offset === 0 || offset === count - 1 || (start + offset) % step === 0) values.push(offset);
    if (values.length > 2 && (values.at(-1)! - values.at(-2)!) * cell < 5) values.splice(-2, 1);
    return values;
}
const yieldPage = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const format = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/** Frozen parameters regenerate the complete shape. No preview guides or ghost cells enter the file. */
export async function createBlockShapePdf(input: BlockShapeState, locale: SiteLocale, allLayers: boolean, signal?: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
    signal?.throwIfAborted();
    if (!Object.hasOwn(blockShapeCopy, locale)) throw new Error('INVALID_OPTIONS');
    const layout = planShapePdf(input, allLayers), state = layout.state;
    const model: ShapeModel = generateShape(state.spec), copy = blockShapeCopy[locale];
    let japanese: string | undefined;
    if (locale === 'ja') {
        japanese = await loadBlockShapeJapaneseFont(); signal?.throwIfAborted();
    }
    const { jsPDF } = await import('jspdf'); signal?.throwIfAborted();
    const doc = new jsPDF({ unit: 'mm', format: state.paper, orientation: 'portrait', compress: false, precision: 6, putOnlyUsedFonts: true });
    if (japanese !== undefined) { registerBlockShapeJapaneseFont(doc, japanese); verifyFont(doc, shapePdfJapaneseCharacters()); }
    const font = locale === 'ja' ? BLOCK_SHAPE_JAPANESE_FONT_NAME : 'helvetica';
    doc.setProperties({ title: copy.pdfTitle, author: 'Fuse Bead Patterns', creator: 'Fuse Bead Patterns', subject: `${state.spec.kind} ${model.width}x${model.depth}x${model.height}` });
    doc.setLanguage(({ en: 'en', de: 'de-DE', fr: 'fr-FR', ja: 'ja' } as const)[locale]);
    doc.viewerPreferences({ PrintScaling: 'None' });
    const text = (value: string | string[], x: number, y: number, size = 8, align: 'left' | 'center' | 'right' = 'left', latin = false) => {
        doc.setFont(latin ? 'helvetica' : font, 'normal'); doc.setFontSize(size); doc.setTextColor(35, 49, 42);
        doc.text(value, x, y, { align, lineHeightFactor: 1.3 });
    };
    const wrapped = (value: string, y: number, size = 7) => {
        doc.setFont(font, 'normal'); doc.setFontSize(size);
        text(doc.splitTextToSize(value, layout.widthMm - 32) as string[], 16, y, size);
    };
    const shapeName = copy[state.spec.kind];
    const rgb = colorRgb(state.color), dark = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 < 140;
    for (let index = 0; index < layout.pages.length; index++) {
        signal?.throwIfAborted();
        const page = layout.pages[index];
        if (index) doc.addPage(state.paper, 'portrait');
        text('FUSE BEAD PATTERNS', 16, 12, 7, 'left', true);
        text(copy.pdfTitle, 16, 24, 15);
        text(`${shapeName} / ${state.spec.style === 'filled' ? copy.solid : copy.hollow} / ${model.width} x ${model.depth} x ${model.height}`, 16, 33, 8);
        if (page.kind === 'summary') {
            text(format(copy.pdfTotal, { count: model.total }), 16, 43, 10);
            text(copy.pdfLayerSummary, 16, 53, 10);
            for (let y = 0; y < model.height; y++) {
                const column = Math.floor(y / 32), row = y % 32;
                text(`Y ${y}`, 16 + column * 60, 64 + row * 4.5, 8, 'left', true);
                text(String(model.layerCounts[y]), 65 + column * 60, 64 + row * 4.5, 8, 'right', true);
            }
            wrapped(copy.pdfManual, 217);
            wrapped(copy.pdfMethod, 229, 6.5);
        } else {
            text(`${format(copy.pdfLayer, { layer: page.layer + 1, count: model.height })} (Y = ${page.layer}) / ${format(copy.pdfCount, { count: model.layerCounts[page.layer] })} / ${format(copy.pdfTotal, { count: model.total })}`, 16, 42, 8);
            const cell = page.kind === 'tile' ? 3 : layout.cellMm;
            const left = (layout.widthMm - page.width * cell) / 2, top = 65;
            text(`${format(copy.pdfColumns, { start: page.x, end: page.x + page.width - 1 })} / ${format(copy.pdfRows, { start: page.z, end: page.z + page.depth - 1 })}`, 16, 50, 8);
            const tileNumber = Math.floor(page.z / SHAPE_PDF_TILE) * Math.ceil(model.width / SHAPE_PDF_TILE) + Math.floor(page.x / SHAPE_PDF_TILE) + 1;
            text(page.kind === 'tile' ? format(copy.pdfTile, { tile: tileNumber, count: Math.ceil(model.width / SHAPE_PDF_TILE) * Math.ceil(model.depth / SHAPE_PDF_TILE) }) : copy.pdfOverview, 16, 56, 7);
            for (let z = 0; z < page.depth; z++) {
                for (let x = 0; x < page.width; x++) {
                    if (!model.mask[(page.layer * model.depth + page.z + z) * model.width + page.x + x]) continue;
                    doc.setFillColor(...rgb); doc.rect(left + x * cell, top + z * cell, cell, cell, 'F');
                    if (cell >= 3) {
                        doc.setTextColor(dark ? 255 : 0, dark ? 255 : 0, dark ? 255 : 0);
                        doc.setFont('helvetica', 'normal'); doc.setFontSize(Math.min(7, cell * 1.5));
                        doc.text('x', left + (x + 0.5) * cell, top + (z + 0.68) * cell, { align: 'center' });
                    }
                }
                if (z % 16 === 15) { await yieldPage(); signal?.throwIfAborted(); }
            }
            doc.setDrawColor(125, 135, 128);
            for (let x = 0; x <= page.width; x++) { doc.setLineWidth(x === 0 || x === page.width || (page.x + x) % 5 === 0 ? 0.2 : 0.07); doc.line(left + x * cell, top, left + x * cell, top + page.depth * cell); }
            for (let z = 0; z <= page.depth; z++) { doc.setLineWidth(z === 0 || z === page.depth || (page.z + z) % 5 === 0 ? 0.2 : 0.07); doc.line(left, top + z * cell, left + page.width * cell, top + z * cell); }
            for (const x of axisLabels(page.x, page.width, cell)) text(String(page.x + x), left + (x + 0.5) * cell, top - 2, 6, 'center', true);
            for (const z of axisLabels(page.z, page.depth, cell)) text(String(page.z + z), left - 2, top + (z + 0.65) * cell, 6, 'right', true);
        }
        wrapped(copy.pdfCoordinates, layout.heightMm - 39);
        wrapped(copy.pdfScale, layout.heightMm - 27);
        text('fusebeadpatterns.art', 16, layout.heightMm - 9, 7, 'left', true);
        text(format(copy.pdfPage, { page: index + 1, count: layout.pages.length }), layout.widthMm - 16, layout.heightMm - 9, 7, 'right');
        await yieldPage();
    }
    signal?.throwIfAborted();
    const bytes = doc.output('arraybuffer');
    if (!(bytes instanceof ArrayBuffer) || bytes.byteLength < 100) throw new Error('PDF_GENERATION_FAILED');
    return new Uint8Array(bytes);
}
