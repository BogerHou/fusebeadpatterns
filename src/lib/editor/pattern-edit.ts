import { PaletteEntry } from '../core/model/palette/palette.model';

export type PatternPoint = {
    x: number;
    y: number;
};

type RgbaColor = [number, number, number, number];

export function getPatternDataIndex(width: number, point: PatternPoint): number {
    return (point.y * width + point.x) * 4;
}

export function setPatternPixelToEntry(
    data: Uint8ClampedArray,
    width: number,
    point: PatternPoint,
    entry: PaletteEntry | null
): void {
    const index = getPatternDataIndex(width, point);

    if (!entry) {
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
        data[index + 3] = 0;
        return;
    }

    data[index] = entry.color.r;
    data[index + 1] = entry.color.g;
    data[index + 2] = entry.color.b;
    data[index + 3] = entry.color.a ?? 255;
}

export function patternPixelMatchesColor(
    data: Uint8ClampedArray,
    index: number,
    color: RgbaColor
): boolean {
    return (
        data[index] === color[0] &&
        data[index + 1] === color[1] &&
        data[index + 2] === color[2] &&
        data[index + 3] === color[3]
    );
}

export function paletteEntryMatchesPatternPixel(
    entry: PaletteEntry,
    data: Uint8ClampedArray,
    index: number
): boolean {
    return (
        entry.color.r === data[index] &&
        entry.color.g === data[index + 1] &&
        entry.color.b === data[index + 2] &&
        (entry.color.a ?? 255) === data[index + 3]
    );
}

export function fillMatchingPatternRegion(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    startPoint: PatternPoint,
    replacementEntry: PaletteEntry
): boolean {
    if (
        startPoint.x < 0 ||
        startPoint.y < 0 ||
        startPoint.x >= width ||
        startPoint.y >= height
    ) {
        return false;
    }

    const startIndex = getPatternDataIndex(width, startPoint);
    const targetColor: RgbaColor = [
        data[startIndex],
        data[startIndex + 1],
        data[startIndex + 2],
        data[startIndex + 3],
    ];
    const replacementColor: RgbaColor = [
        replacementEntry.color.r,
        replacementEntry.color.g,
        replacementEntry.color.b,
        replacementEntry.color.a ?? 255,
    ];

    if (
        targetColor[0] === replacementColor[0] &&
        targetColor[1] === replacementColor[1] &&
        targetColor[2] === replacementColor[2] &&
        targetColor[3] === replacementColor[3]
    ) {
        return false;
    }

    const queue: PatternPoint[] = [startPoint];
    const visited = new Uint8Array(width * height);
    let didFill = false;

    while (queue.length > 0) {
        const point = queue.pop()!;
        const key = point.y * width + point.x;

        if (visited[key]) {
            continue;
        }

        visited[key] = 1;

        const index = key * 4;

        if (!patternPixelMatchesColor(data, index, targetColor)) {
            continue;
        }

        setPatternPixelToEntry(data, width, point, replacementEntry);
        didFill = true;

        if (point.x > 0) {
            queue.push({ x: point.x - 1, y: point.y });
        }
        if (point.x < width - 1) {
            queue.push({ x: point.x + 1, y: point.y });
        }
        if (point.y > 0) {
            queue.push({ x: point.x, y: point.y - 1 });
        }
        if (point.y < height - 1) {
            queue.push({ x: point.x, y: point.y + 1 });
        }
    }

    return didFill;
}
