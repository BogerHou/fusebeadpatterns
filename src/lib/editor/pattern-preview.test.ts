import { describe, expect, it } from 'vitest';
import {
    getPreviewBeadRenderSize,
    getPreviewRulerLabelStep,
    getPreviewRulerTicks,
} from './pattern-preview';

describe('pattern preview helpers', () => {
    it('keeps preview bead size in a practical rendering range', () => {
        expect(getPreviewBeadRenderSize(29, 29)).toBe(18);
        expect(getPreviewBeadRenderSize(300, 300)).toBe(6);
    });

    it('uses denser ruler labels when cells are large', () => {
        expect(getPreviewRulerLabelStep(16)).toBe(1);
        expect(getPreviewRulerLabelStep(10)).toBe(2);
        expect(getPreviewRulerLabelStep(8)).toBe(5);
        expect(getPreviewRulerLabelStep(4)).toBe(10);
    });

    it('always labels first and last ruler ticks', () => {
        const ticks = getPreviewRulerTicks(29, 160);

        expect(ticks).toHaveLength(29);
        expect(ticks[0]).toMatchObject({
            value: 1,
            ratio: 0,
            showLabel: true,
        });
        expect(ticks[28]).toMatchObject({
            value: 29,
            ratio: 1,
            showLabel: true,
        });
    });

    it('centers a single-cell ruler tick', () => {
        expect(getPreviewRulerTicks(1, 20)).toEqual([
            {
                value: 1,
                ratio: 0.5,
                showLabel: true,
            },
        ]);
    });
});
