import { describe, expect, it } from 'vitest';

import {
    fitPreviewSize,
    getPreviewRenderSize,
    svgMarkupToDataUrl,
} from './preview';

describe('editor preview helpers', () => {
    it('encodes svg markup as a browser-safe data url', () => {
        const dataUrl = svgMarkupToDataUrl(
            '<svg viewBox="0 0 10 10"><text>A1 & H7</text></svg>'
        );

        expect(dataUrl.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(
            true
        );
        expect(dataUrl).toContain('%3Csvg');
        expect(dataUrl).toContain('A1%20%26%20H7');
    });

    it('scales oversized previews down to a readable viewport', () => {
        expect(
            fitPreviewSize(
                { width: 4843, height: 4428 },
                { maxWidth: 1200, maxHeight: 900 }
            )
        ).toEqual({
            width: 984,
            height: 900,
            scale: 0.2032520325203252,
        });
    });

    it('does not upscale previews that already fit', () => {
        expect(
            fitPreviewSize(
                { width: 640, height: 480 },
                { maxWidth: 1200, maxHeight: 900 }
            )
        ).toEqual({
            width: 640,
            height: 480,
            scale: 1,
        });
    });

    it('fits to the viewport first and only enlarges when zoom increases', () => {
        expect(
            getPreviewRenderSize(
                { width: 4843, height: 4428 },
                { maxWidth: 760, maxHeight: 520 },
                1
            )
        ).toEqual({
            width: 568,
            height: 520,
            scale: 0.11743450767841011,
            zoom: 1,
        });

        expect(
            getPreviewRenderSize(
                { width: 4843, height: 4428 },
                { maxWidth: 760, maxHeight: 520 },
                1.5
            )
        ).toEqual({
            width: 852,
            height: 780,
            scale: 0.17615176151761516,
            zoom: 1.5,
        });
    });
});
