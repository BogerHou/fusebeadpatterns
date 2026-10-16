/** Original mathematical front-view diagrams, not Minecraft texture data.
 * Coordinates face the banner: x increases to the viewer's right, y downwards.
 * The 20×40 face and principal axes are version-specific reference dimensions.
 * Edges are intentionally schematic; in particular, gradients are smooth linear
 * opacity ramps rather than the game's textured/dithered alpha values.
 */
export const BANNER_WIDTH = 20;
export const BANNER_HEIGHT = 40;
export const PATTERN_IDS = [
    'square_bottom_left', 'square_bottom_right', 'square_top_left', 'square_top_right',
    'stripe_bottom', 'stripe_top', 'stripe_left', 'stripe_right', 'stripe_center', 'stripe_middle',
    'stripe_downright', 'stripe_downleft', 'small_stripes', 'cross', 'straight_cross',
    'triangle_bottom', 'triangle_top', 'triangles_bottom', 'triangles_top',
    'diagonal_left', 'diagonal_up_right', 'diagonal_up_left', 'diagonal_right',
    'circle', 'rhombus', 'half_vertical', 'half_horizontal',
    'half_vertical_right', 'half_horizontal_bottom', 'border', 'gradient', 'gradient_up',
] as const;
export type PatternId = typeof PATTERN_IDS[number];

function assertPattern(value: unknown): asserts value is PatternId {
    if (typeof value !== 'string' || !(PATTERN_IDS as readonly string[]).includes(value)) throw new RangeError('INVALID_PATTERN');
}
function assertPoint(x: number, y: number): void {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= BANNER_WIDTH || y >= BANNER_HEIGHT) {
        throw new RangeError('INVALID_PATTERN_COORDINATES');
    }
}
const solid = (inside: boolean) => inside ? 255 : 0;
const mirrorX = (x: number) => BANNER_WIDTH - 1 - x;
const mirrorY = (y: number) => BANNER_HEIGHT - 1 - y;

// A centred sloping band on a face with a 1:2 aspect ratio.
function diagonalBand(x: number, y: number, halfWidth: number): boolean {
    return Math.abs(x + .5 - (y + .5) / 2) <= halfWidth;
}
function upperTriangle(x: number, y: number): boolean {
    return y < 20 && Math.abs(x + .5 - 10) <= (21 - y) / 2;
}
function upperTeeth(x: number, y: number): boolean {
    // Three evenly spaced triangular teeth, seven pixels deep.
    const distance = Math.abs(((x + .5) * 3 % 20) - 10);
    return y < 7 && distance <= (7 - y) * 1.5;
}
function opacity(id: PatternId, x: number, y: number): number {
    switch (id) {
        case 'square_bottom_left': return solid(x < 10 && y >= 26);
        case 'square_bottom_right': return solid(x >= 10 && y >= 26);
        case 'square_top_left': return solid(x < 10 && y < 14);
        case 'square_top_right': return solid(x >= 10 && y < 14);
        case 'stripe_bottom': return solid(y >= 26);
        case 'stripe_top': return solid(y < 14);
        case 'stripe_left': return solid(x < 7);
        case 'stripe_right': return solid(x >= 13);
        case 'stripe_center': return solid(x >= 7 && x < 13);
        case 'stripe_middle': return solid(y >= 17 && y < 23);
        case 'stripe_downright': return solid(diagonalBand(x, y, 3.5));
        case 'stripe_downleft': return solid(diagonalBand(mirrorX(x), y, 3.5));
        case 'small_stripes': return solid(x % 5 >= 1 && x % 5 <= 3);
        case 'cross': return solid(diagonalBand(x, y, 2.5) || diagonalBand(mirrorX(x), y, 2.5));
        case 'straight_cross': return solid((x >= 8 && x < 12) || (y >= 18 && y < 22));
        case 'triangle_bottom': return solid(upperTriangle(x, mirrorY(y)));
        case 'triangle_top': return solid(upperTriangle(x, y));
        case 'triangles_bottom': return solid(upperTeeth(x, mirrorY(y)));
        case 'triangles_top': return solid(upperTeeth(x, y));
        // ID names are game identifiers, not guesses at their English direction.
        // These four triangles occupy upper-left / lower-right / lower-left / upper-right.
        case 'diagonal_left': return solid(2 * x + y <= 39);
        case 'diagonal_up_right': return solid(2 * mirrorX(x) + mirrorY(y) <= 39);
        case 'diagonal_up_left': return solid(2 * x + mirrorY(y) <= 39);
        case 'diagonal_right': return solid(2 * mirrorX(x) + y <= 39);
        case 'circle': return solid((x + .5 - 10) ** 2 + (y + .5 - 20) ** 2 <= 36);
        case 'rhombus': return solid(y >= 8 && y < 32 &&
            Math.abs(x + .5 - 10) <= 7 * (1 - Math.abs(y + .5 - 20) / 12) + .5);
        case 'half_vertical': return x < 10 ? 255 : x === 10 ? 128 : 0;
        case 'half_vertical_right': return x > 9 ? 255 : x === 9 ? 128 : 0;
        case 'half_horizontal': return y < 20 ? 255 : y === 20 ? 128 : 0;
        case 'half_horizontal_bottom': return y > 19 ? 255 : y === 19 ? 128 : 0;
        case 'border': return solid(x < 3 || x >= 17 || y < 3 || y >= 37);
        case 'gradient': return Math.round(255 * (39 - y) / 39);
        case 'gradient_up': return Math.round(255 * y / 39);
    }
}

/** 0..255 diagram opacity, without game fabric texture, lighting or edge sampling. */
export function patternOpacity(id: PatternId, x: number, y: number): number {
    assertPattern(id); assertPoint(x, y); return opacity(id, x, y);
}

/** Fresh independently mutable 20×40 opacity mask, row-major. */
export function patternMask(id: PatternId): Uint8Array<ArrayBuffer> {
    assertPattern(id);
    const result = new Uint8Array(BANNER_WIDTH * BANNER_HEIGHT);
    for (let y = 0; y < BANNER_HEIGHT; y++) for (let x = 0; x < BANNER_WIDTH; x++) result[y * BANNER_WIDTH + x] = opacity(id, x, y);
    return result;
}
