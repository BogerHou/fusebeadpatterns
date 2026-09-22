import type { Palette } from '../core/model/palette/palette.model';
import { MATCHINGS } from '../core/model/matching/matching.model';
import { reduceColorPixels } from '../core/utils/utils';
import { getMatchingOption } from './config';

export type QuantizationRequest = {
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
    palettes: Palette[];
    matchingId: string;
    dithering: { enable: boolean; hardness: number };
    drawingPosition: { x: number; y: number; width: number; height: number };
};

export type QuantizationResponse =
    | { type: 'ready' }
    | { type: 'result'; pixels: Uint8ClampedArray }
    | { type: 'error'; message: string };

/** Both execution paths use the same algorithm and configuration mapping. */
export function runPatternQuantization(request: QuantizationRequest): Uint8ClampedArray {
    return reduceColorPixels(request.pixels, request.width, request.height, {
        palettes: request.palettes,
        matching: getMatchingOption(request.matchingId)?.value ?? MATCHINGS.EUCLIDEAN,
        dithering: request.dithering,
        drawingPosition: request.drawingPosition,
    });
}
