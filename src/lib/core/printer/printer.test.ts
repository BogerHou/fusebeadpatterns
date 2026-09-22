import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Project } from '../model/project/project.model';
import { JpgPrinter } from './jpg/jpg.printer';
import { PdfPrinter } from './pdf/pdf.printer';
import { PngPrinter } from './png/png.printer';
import { SvgPrinter } from './svg/svg.printer';
import { XlsxPrinter } from './xlsx/xlsx.printer';

const { writeBuffer, outputPdf } = vi.hoisted(() => ({
    writeBuffer: vi.fn<() => Promise<Uint8Array>>(),
    outputPdf: vi.fn<() => Blob | undefined>(),
}));

vi.mock('canvas2svg', () => ({}));
vi.mock('./svg/MonoFont', () => ({ defsStyle: '' }));
vi.mock('./pdf/MonoFont', () => ({}));
vi.mock('exceljs/dist/exceljs', () => ({
    Workbook: class {
        xlsx = { writeBuffer };
    },
}));
vi.mock('jspdf', () => ({
    jsPDF: class {
        setFont = vi.fn();
        output = outputPdf;
    },
}));

const pixels = new Uint8ClampedArray([1, 2, 3, 255]);
const usage = new Map([['P-001', 1]]);
const project = {} as Project;
const svg = {
    getAttribute: (name: string) => name === 'width' ? '200' : '100',
} as SVGElement;

let images: FakeImage[];
let encoded: BlobCallback[];
let drawImage: ReturnType<typeof vi.fn>;
let toBlob: ReturnType<typeof vi.fn>;
let createObjectURL: ReturnType<typeof vi.spyOn>;
let revokeObjectURL: ReturnType<typeof vi.spyOn>;
let anchor: {
    href: string;
    download: string;
    click: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
};

class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src = '';

    constructor() {
        images.push(this);
    }
}

beforeEach(() => {
    vi.useFakeTimers();
    images = [];
    encoded = [];
    drawImage = vi.fn();
    toBlob = vi.fn((callback: BlobCallback) => encoded.push(callback));
    anchor = {
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn(),
    };
    const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage }),
        toBlob,
    };
    vi.stubGlobal('document', {
        createElement: vi.fn((tag: string) => tag === 'canvas' ? canvas : anchor),
        body: { appendChild: vi.fn() },
    });
    vi.stubGlobal('Image', FakeImage);
    vi.stubGlobal('XMLSerializer', class {
        serializeToString() {
            return '<svg width="200" height="100" />';
        }
    });
    createObjectURL = vi.spyOn(URL, 'createObjectURL');
    createObjectURL.mockImplementation(() => `blob:export-${createObjectURL.mock.calls.length}`);
    revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(SvgPrinter.prototype, 'drawSVG').mockReturnValue(svg);
    writeBuffer.mockReset();
    outputPdf.mockReset();
});

afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe.each([
    ['PNG', PngPrinter, 'image/png', 'pattern.png'],
    ['JPEG', JpgPrinter, 'image/jpeg', 'pattern.jpeg'],
] as const)('%s printer', (_, Printer, mimeType, filename) => {
    it('waits for image loading and encoding, then downloads and releases both URLs', async () => {
        const completed = vi.fn();
        const result = new Printer().print(pixels, usage, project, 'pattern');
        void result.then(completed);
        await vi.advanceTimersByTimeAsync(0);
        expect(completed).not.toHaveBeenCalled();
        expect(anchor.click).not.toHaveBeenCalled();

        images[0].onload?.();
        await vi.advanceTimersByTimeAsync(0);
        expect(drawImage).toHaveBeenCalledWith(images[0], 0, 0);
        expect(toBlob).toHaveBeenCalledWith(expect.any(Function), mimeType);
        expect(completed).not.toHaveBeenCalled();

        encoded[0](new Blob(['image'], { type: mimeType }));
        await result;
        expect(completed).toHaveBeenCalledOnce();
        expect(anchor.download).toBe(filename);
        expect(anchor.click).toHaveBeenCalledOnce();
        expect(anchor.remove).toHaveBeenCalledOnce();
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:export-1');
        expect(images[0].onload).toBeNull();
        expect(images[0].onerror).toBeNull();

        await vi.advanceTimersByTimeAsync(1_000);
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:export-2');
        expect(vi.getTimerCount()).toBe(0);
    });

    it('rejects a failed image load and releases its URL', async () => {
        const result = new Printer().print(pixels, usage, project, 'pattern');
        const rejection = expect(result).rejects.toThrow('could not be loaded');
        images[0].onerror?.();
        await rejection;
        expect(anchor.click).not.toHaveBeenCalled();
        expect(revokeObjectURL).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each(['draw', 'encode'] as const)('propagates %s exceptions from the load callback', async (stage) => {
        const error = new Error(`${stage} failed`);
        (stage === 'draw' ? drawImage : toBlob).mockImplementation(() => {
            throw error;
        });
        const result = new Printer().print(pixels, usage, project, 'pattern');
        const rejection = expect(result).rejects.toBe(error);
        images[0].onload?.();
        await rejection;
        expect(anchor.click).not.toHaveBeenCalled();
        expect(revokeObjectURL).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('rejects when the canvas cannot encode an image', async () => {
        const result = new Printer().print(pixels, usage, project, 'pattern');
        const rejection = expect(result).rejects.toThrow('could not be encoded');
        images[0].onload?.();
        encoded[0](null);
        await rejection;
        expect(anchor.click).not.toHaveBeenCalled();
        expect(revokeObjectURL).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each(['load', 'encode'] as const)('times out a stalled %s without a late download', async (stage) => {
        const result = new Printer().print(pixels, usage, project, 'pattern');
        const rejection = expect(result).rejects.toThrow('timed out');
        if (stage === 'encode') {
            images[0].onload?.();
        }

        await vi.advanceTimersByTimeAsync(60_000);
        await rejection;
        encoded[0]?.(new Blob(['late image'], { type: mimeType }));
        await vi.advanceTimersByTimeAsync(0);
        expect(anchor.click).not.toHaveBeenCalled();
        expect(revokeObjectURL).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('XLSX printer', () => {
    beforeEach(() => {
        vi.spyOn(XlsxPrinter.prototype, 'pattern').mockImplementation(() => undefined);
        vi.spyOn(XlsxPrinter.prototype, 'usage').mockImplementation(() => undefined);
    });

    it('waits for writeBuffer before downloading the workbook', async () => {
        let finish!: (data: Uint8Array) => void;
        writeBuffer.mockReturnValue(new Promise((resolve) => {
            finish = resolve;
        }));
        const completed = vi.fn();
        const result = new XlsxPrinter().print(pixels, usage, project, 'pattern');
        void result.then(completed);
        await vi.advanceTimersByTimeAsync(0);
        expect(completed).not.toHaveBeenCalled();
        expect(anchor.click).not.toHaveBeenCalled();

        finish(new Uint8Array([1, 2, 3]));
        await result;
        expect(anchor.click).toHaveBeenCalledOnce();
        expect(anchor.download).toBe('pattern.xlsx');
        await vi.advanceTimersByTimeAsync(1_000);
        expect(revokeObjectURL).toHaveBeenCalledOnce();
    });

    it('propagates asynchronous writeBuffer failures', async () => {
        const error = new Error('Workbook encoding failed');
        writeBuffer.mockRejectedValue(error);

        await expect(new XlsxPrinter().print(pixels, usage, project, 'pattern')).rejects.toBe(error);
        expect(createObjectURL).not.toHaveBeenCalled();
        expect(anchor.click).not.toHaveBeenCalled();
    });
});

describe('PDF printer', () => {
    beforeEach(() => {
        vi.spyOn(PdfPrinter.prototype, 'boardMapping').mockImplementation(() => undefined);
        vi.spyOn(PdfPrinter.prototype, 'usage').mockImplementation(() => undefined);
        vi.spyOn(PdfPrinter.prototype, 'beadMapping').mockImplementation(() => undefined);
    });

    it('generates a PDF blob and triggers its download before completing', async () => {
        outputPdf.mockReturnValue(new Blob(['pdf'], { type: 'application/pdf' }));

        await new PdfPrinter().print(pixels, usage, project, 'pattern');

        expect(outputPdf).toHaveBeenCalledWith('blob');
        expect(anchor.click).toHaveBeenCalledOnce();
        expect(anchor.download).toBe('pattern.pdf');
        await vi.advanceTimersByTimeAsync(1_000);
        expect(revokeObjectURL).toHaveBeenCalledOnce();
    });

    it('propagates PDF generation errors', async () => {
        const error = new Error('PDF generation failed');
        outputPdf.mockImplementation(() => { throw error; });

        await expect(new PdfPrinter().print(pixels, usage, project, 'pattern')).rejects.toBe(error);
    });

    it('rejects when jsPDF returns no output after an internal error', async () => {
        outputPdf.mockReturnValue(undefined);

        await expect(new PdfPrinter().print(pixels, usage, project, 'pattern')).rejects.toThrow('could not be generated');
        expect(anchor.click).not.toHaveBeenCalled();
    });
});

describe('SVG printer', () => {
    it('releases the download URL after triggering a download', async () => {
        await new SvgPrinter().print(pixels, usage, project, 'pattern');

        expect(anchor.click).toHaveBeenCalledOnce();
        expect(anchor.download).toBe('pattern.svg');
        await vi.advanceTimersByTimeAsync(1_000);
        expect(revokeObjectURL).toHaveBeenCalledOnce();
    });

    it('rejects download failures and still removes the anchor and URL', async () => {
        const error = new Error('Download failed');
        anchor.click.mockImplementation(() => {
            throw error;
        });

        await expect(new SvgPrinter().print(pixels, usage, project, 'pattern')).rejects.toBe(error);
        expect(anchor.remove).toHaveBeenCalledOnce();
        await vi.advanceTimersByTimeAsync(1_000);
        expect(revokeObjectURL).toHaveBeenCalledOnce();
    });
});
