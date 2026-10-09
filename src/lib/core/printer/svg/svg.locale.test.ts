import { afterEach, expect, it, vi } from 'vitest';
import { Color } from '../../model/color/color.model';
import { Palette, PaletteEntry } from '../../model/palette/palette.model';
import type { Project } from '../../model/project/project.model';
import { EXPORT_MESSAGES } from '../messages';
import { SvgPrinter } from './svg.printer';

vi.mock('canvas2svg', () => ({}));

class Element {
    children: Element[] = [];
    attributes = new Map<string, string>();
    innerHTML = '';
    textContent = '';
    constructor(readonly tagName: string) {}
    get firstChild() { return this.children[0] ?? null; }
    insertBefore(child: Element, before: Element | null) {
        this.children.splice(before ? this.children.indexOf(before) : this.children.length, 0, child);
    }
    setAttribute(name: string, value: string) { this.attributes.set(name, value); }
}

afterEach(() => vi.unstubAllGlobals());

it.each(['de', 'fr', 'ja'] as const)('%s adds native SVG document labels without changing the drawing/raster input', (locale) => {
    const recordings: unknown[][] = [];
    class RecordingCanvas {
        operations: unknown[] = [];
        svg = new Element('svg');
        fillStyle = ''; strokeStyle = ''; font = ''; textBaseline = ''; textAlign = '';
        constructor(width: number, height: number) {
            this.operations.push(['dimensions', width, height]);
            recordings.push(this.operations);
        }
        fillRect(...args: number[]) { this.operations.push(['rect', args, this.fillStyle]); }
        fillText(text: string, x: number, y: number) { this.operations.push(['text', text, x, y, this.font, this.fillStyle]); }
        beginPath() { this.operations.push(['begin']); }
        moveTo(x: number, y: number) { this.operations.push(['move', x, y]); }
        lineTo(x: number, y: number) { this.operations.push(['line', x, y]); }
        stroke() { this.operations.push(['stroke', this.strokeStyle]); }
        getSvg() { return this.svg; }
    }
    vi.stubGlobal('C2S', RecordingCanvas);
    vi.stubGlobal('document', {
        createElement: (name: string) => new Element(name),
        createElementNS: (_namespace: string, name: string) => new Element(name),
    });
    const entry = new PaletteEntry('Untranslated brand color', new Color(18, 25, 34, 255));
    entry.ref = 'H18'; entry.symbol = ')'; entry.prefix = 'H';
    const project = {
        boardConfiguration: { board: { nbBeadPerRow: 29 }, nbBoardWidth: 2, nbBoardHeight: 1 },
        paletteConfiguration: { palettes: [new Palette('Hama Midi', [entry])] },
        exportConfiguration: { useSymbols: true },
    } as Project;
    const pixels = new Uint8ClampedArray(58 * 29 * 4);
    pixels.set([18, 25, 34, 255]);
    const printer = new SvgPrinter();
    printer.drawSVG(pixels, new Map([['H18', 1]]), project);
    const output = printer.drawSVG(pixels, new Map([['H18', 1]]), project, locale) as unknown as Element;
    expect(JSON.stringify(recordings[1]) === JSON.stringify(recordings[0])).toBe(true);
    expect(output.attributes.get('lang')).toBe(locale);
    expect(output.children.find((child) => child.tagName === 'title')?.textContent).toBe(EXPORT_MESSAGES[locale].title);
    expect(output.children.find((child) => child.tagName === 'desc')?.textContent).toBe(`${EXPORT_MESSAGES[locale].inventory}: ${EXPORT_MESSAGES[locale].reference} / ${EXPORT_MESSAGES[locale].symbol} / ${EXPORT_MESSAGES[locale].count}`);
});
