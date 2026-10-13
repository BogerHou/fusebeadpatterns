import { describe, expect, it, vi } from 'vitest';
import { isValidSourceCrop, normalizeSourceCrop, type EditorSourceCrop } from './image-crop';
import { drawImageInsideCanvas, ImagePosition } from './utils';

const crop: EditorSourceCrop = { sourceWidth: 120, sourceHeight: 80, x: 11, y: 7, width: 60, height: 30 };

describe('source crop validation', () => {
    it('accepts full image, asymmetric regions, edge pixels and safe-integer boundaries', () => {
        for (const value of [crop,
            { sourceWidth: 1, sourceHeight: 1, x: 0, y: 0, width: 1, height: 1 },
            { sourceWidth: 120, sourceHeight: 80, x: 119, y: 79, width: 1, height: 1 },
            { sourceWidth: Number.MAX_SAFE_INTEGER, sourceHeight: 1, x: Number.MAX_SAFE_INTEGER - 1, y: 0, width: 1, height: 1 },
        ]) expect(isValidSourceCrop(value)).toBe(true);
    });

    it.each(['sourceWidth', 'sourceHeight', 'x', 'y', 'width', 'height'] as const)('rejects non-integer or unsafe %s values', key => {
        for (const value of [undefined, null, '1', false, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
            expect(isValidSourceCrop({ ...crop, [key]: value })).toBe(false);
        }
        if (key !== 'x' && key !== 'y') expect(isValidSourceCrop({ ...crop, [key]: 0 })).toBe(false);
    });

    it('rejects out-of-bounds and overflowed selections without clamping them', () => {
        for (const value of [
            { ...crop, x: 120 }, { ...crop, y: 80 }, { ...crop, width: 110 }, { ...crop, height: 74 },
            { ...crop, sourceWidth: Number.MAX_SAFE_INTEGER, x: Number.MAX_SAFE_INTEGER - 1, width: 2 },
        ]) expect(isValidSourceCrop(value)).toBe(false);
    });

    it('requires exactly six plain numeric fields and does not execute getters', () => {
        let getterCalls = 0;
        const accessor = { ...crop };
        Object.defineProperty(accessor, 'width', { enumerable: true, get() { getterCalls++; return 60; } });
        const hidden = { ...crop };
        Object.defineProperty(hidden, 'metadata', { value: 1 });
        for (const value of [null, [], false, {}, { ...crop, extra: 1 }, { ...crop, [Symbol('extra')]: 1 },
            Object.create(crop), accessor, hidden]) expect(isValidSourceCrop(value)).toBe(false);
        expect(getterCalls).toBe(0);
        expect(isValidSourceCrop(Object.assign(Object.create(null), crop))).toBe(true);
    });

    it('normalizes full images to null and clones partial selections without changing the input', () => {
        const original = { ...crop };
        expect(normalizeSourceCrop(undefined)).toBeNull();
        expect(normalizeSourceCrop(null)).toBeNull();
        expect(normalizeSourceCrop({ ...crop, x: 0, y: 0, width: 120, height: 80 })).toBeNull();
        const normalized = normalizeSourceCrop(crop)!;
        expect(normalized).toEqual(crop);
        expect(normalized).not.toBe(crop);
        normalized.x = 0;
        expect(crop).toEqual(original);
        expect(() => normalizeSourceCrop({ ...crop, x: -1 })).toThrow('Invalid source crop.');
    });
});

function surface(width = 29, height = 29) {
    const context = { drawImage: vi.fn(), fillRect: vi.fn(), clearRect: vi.fn(), filter: 'none', imageSmoothingEnabled: true, globalCompositeOperation: 'source-over' };
    const getContext = vi.fn(() => context);
    const canvas = { width, height, getContext } as unknown as HTMLCanvasElement;
    // Rendered dimensions deliberately differ from the decoded original.
    const image = { width: 6, height: 4, naturalWidth: 120, naturalHeight: 80, style: { filter: 'brightness(110%)' } } as HTMLImageElement;
    return { context, getContext, canvas, image };
}

describe('drawing a source region', () => {
    it.each([
        { selected: crop, fit: true, center: true, expected: [0, 7, 29, 14] },
        { selected: { ...crop, width: 30, height: 60 }, fit: true, center: true, expected: [7, 0, 14, 29] },
        { selected: { ...crop, width: 20, height: 20 }, fit: true, center: true, expected: [0, 0, 29, 29] },
        { selected: crop, fit: true, center: false, expected: [0, 0, 29, 14] },
        { selected: crop, fit: false, center: true, expected: [-16, -1, 60, 30] },
        { selected: crop, fit: false, center: false, expected: [0, 0, 60, 30] },
        { selected: { ...crop, x: 119, y: 0, width: 1, height: 80 }, fit: true, center: true, expected: [14, 0, 1, 29] },
        { selected: { ...crop, x: 0, y: 79, width: 120, height: 1 }, fit: true, center: true, expected: [0, 14, 29, 1] },
        { selected: { ...crop, width: 31, height: 69 }, fit: true, center: true, expected: [8, 0, 13, 29] },
    ])('draws only the selected source with fit=$fit / center=$center / destination=$expected', ({ selected, fit, center, expected }) => {
        const { canvas, image, context } = surface();
        const original = JSON.stringify(selected);
        const position = drawImageInsideCanvas(canvas, image, { fit, center, showGrid: false }, selected);
        expect(context.drawImage.mock.calls).toEqual([[image, selected.x, selected.y, selected.width, selected.height, ...expected]]);
        expect(position).toEqual(new ImagePosition(expected[0], expected[1], expected[2], expected[3]));
        expect(context.filter).toBe('brightness(110%)');
        expect(context.fillRect).not.toHaveBeenCalled();
        expect(context.clearRect).not.toHaveBeenCalled();
        expect(context.globalCompositeOperation).toBe('source-over');
        expect(context.imageSmoothingEnabled).toBe(true);
        expect(JSON.stringify(selected)).toBe(original);
    });

    it('keeps the old 5-argument drawing contract, rounded dimensions and filters when crop is absent or null', () => {
        const selections: (EditorSourceCrop | null | undefined)[] = [undefined, null];
        for (const selected of selections) {
            const { canvas, image, context } = surface();
            const position = drawImageInsideCanvas(canvas, image, { fit: true, center: true, showGrid: false }, selected);
            expect(context.drawImage.mock.calls).toEqual([[image, 0, 4, 29, 19]]);
            expect(position).toEqual(new ImagePosition(0, 4, 29, 19));
        }
        const { canvas, image, context } = surface();
        drawImageInsideCanvas(canvas, image, { fit: false, center: false, showGrid: false });
        expect(context.drawImage.mock.calls).toEqual([[image, 0, 0, 6, 4]]);
    });

    it('rejects invalid, stale or undecoded source dimensions before any canvas access', () => {
        const { canvas, image, getContext } = surface();
        expect(() => drawImageInsideCanvas(canvas, image, { fit: true, center: true, showGrid: false }, { ...crop, x: -1 })).toThrow('Invalid source crop.');
        expect(() => drawImageInsideCanvas(canvas, image, { fit: true, center: true, showGrid: false }, { ...crop, sourceWidth: 121 })).toThrow('does not match');
        expect(() => drawImageInsideCanvas(canvas, { ...image, naturalHeight: 0 } as HTMLImageElement, { fit: true, center: true, showGrid: false }, crop)).toThrow('does not match');
        expect(getContext).not.toHaveBeenCalled();
    });
});
