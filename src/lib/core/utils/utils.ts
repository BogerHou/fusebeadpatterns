import { Palette, PaletteEntry } from '../model/palette/palette.model';
import { Color } from '../model/color/color.model';

import { Matching } from '../model/matching/matching.model';
import { Project } from '../model/project/project.model';
import { RendererConfiguration } from '../model/configuration/renderer-configuration.model';

export type PaletteEntryColorKeyMode = 'rgb' | 'rgba';

export class ImagePosition {
    xStart: number;
    yStart: number;
    width: number;
    height: number;
    constructor(xStart: number, yStart: number, width: number, height: number) {
        this.xStart = xStart;
        this.yStart = yStart;
        this.width = width;
        this.height = height;
    }

    contains(x: number, y: number): boolean {
        if (x < this.xStart || x >= this.xStart + this.width) {
            return false;
        }
        if (y < this.yStart || y >= this.yStart + this.height) {
            return false;
        }
        return true;
    }
}

export function drawImageInsideCanvas(
    canvas: HTMLCanvasElement,
    image: HTMLImageElement,
    rendererConfiguration: RendererConfiguration
): ImagePosition {
    /**
     * Credit to : https://sdqali.in/blog/2013/10/03/fitting-an-image-in-to-a-canvas-object/
     */

    const imageAspectRatio = image.width / image.height;
    const canvasAspectRatio = canvas.width / canvas.height;
    let renderableHeight: number, renderableWidth: number;

    // If image's aspect ratio is less than canvas's we fit on height
    // and place the image centrally along width
    if (imageAspectRatio < canvasAspectRatio) {
        renderableHeight = rendererConfiguration.fit
            ? canvas.height
            : image.height;
        renderableWidth = rendererConfiguration.fit
            ? image.width * (renderableHeight / image.height)
            : image.width;
    } else if (imageAspectRatio > canvasAspectRatio) {
        renderableWidth = rendererConfiguration.fit
            ? canvas.width
            : image.width;
        renderableHeight = rendererConfiguration.fit
            ? image.height * (renderableWidth / image.width)
            : image.height;
    } else {
        renderableHeight = rendererConfiguration.fit
            ? canvas.height
            : image.height;
        renderableWidth = rendererConfiguration.fit
            ? canvas.width
            : image.width;
    }

    const xStart = rendererConfiguration.center
        ? (canvas.width - renderableWidth) / 2
        : 0;
    const yStart = rendererConfiguration.center
        ? (canvas.height - renderableHeight) / 2
        : 0;

    const rxStart = Math.floor(xStart);
    const ryStart = Math.floor(yStart);
    const rrenderableWidth = Math.floor(renderableWidth);
    const rrenderableHeight = Math.floor(renderableHeight);

    const ctx = canvas.getContext('2d')!;
    ctx.filter = image.style.filter;
    ctx.drawImage(
        image,
        rxStart,
        ryStart,
        rrenderableWidth,
        rrenderableHeight
    );
    return new ImagePosition(
        rxStart,
        ryStart,
        rrenderableWidth,
        rrenderableHeight
    );
}

export function reduceColor(
    canvas: HTMLCanvasElement,
    project: Project,
    drawingPosition: ImagePosition
): ImageData {
    const context = canvas.getContext('2d', {
        willReadFrequently: true,
    })!;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    reduceColorPixels(imageData.data, canvas.width, canvas.height, {
        palettes: project.paletteConfiguration.palettes,
        matching: project.matchingConfiguration.matching,
        dithering: project.ditheringConfiguration,
        drawingPosition: {
            x: drawingPosition.xStart,
            y: drawingPosition.yStart,
            width: drawingPosition.width,
            height: drawingPosition.height,
        },
    });

    return imageData;
}

export interface ReduceColorPixelsOptions {
    palettes: Palette[];
    matching: Matching;
    dithering: { enable: boolean; hardness: number };
    drawingPosition: { x: number; y: number; width: number; height: number };
}

// Bound per-conversion memory even for photographs with mostly unique colors.
const MAX_COLOR_MATCH_CACHE_ENTRIES = 4096;

/** Quantize RGBA pixels in place without requiring Canvas or other DOM APIs. */
export function reduceColorPixels(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: ReduceColorPixelsOptions
): Uint8ClampedArray {
    const enabledPaletteEntries = getEnabledPaletteEntries(options.palettes);
    const matchedColors = new Map<number, PaletteEntry>();
    const drawingPosition = new ImagePosition(
        options.drawingPosition.x,
        options.drawingPosition.y,
        options.drawingPosition.width,
        options.drawingPosition.height
    );

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = getPixel(data, width, x, y);
            if (color.a !== 0) {
                // Read after diffusion so a changed pixel never reuses its
                // original image color's match. Alpha participates in matching.
                const key = getPackedColorKey(color.r, color.g, color.b, color.a);
                let closestPaletteEntry = matchedColors.get(key);
                if (!closestPaletteEntry) {
                    closestPaletteEntry = getClosestPaletteEntryFromEntries(
                        enabledPaletteEntries,
                        color,
                        options.matching
                    );
                    if (matchedColors.size < MAX_COLOR_MATCH_CACHE_ENTRIES) {
                        matchedColors.set(key, closestPaletteEntry);
                    }
                }
                setPixel(data, width, x, y, closestPaletteEntry.color);

                if (options.dithering.enable) {
                    const quantError = color.sub(closestPaletteEntry.color);

                    if (drawingPosition.contains(x + 1, y)) {
                        setPixel(
                            data,
                            width,
                            x + 1,
                            y,
                            getPixel(data, width, x + 1, y).add(
                                scaleColor(
                                    quantError,
                                    ((options.dithering.hardness / 100) * 7) / 16
                                )
                            )
                        );
                    }
                    if (drawingPosition.contains(x - 1, y + 1)) {
                        setPixel(
                            data,
                            width,
                            x - 1,
                            y + 1,
                            getPixel(data, width, x - 1, y + 1).add(
                                scaleColor(
                                    quantError,
                                    ((options.dithering.hardness / 100) * 3) / 16
                                )
                            )
                        );
                    }
                    if (drawingPosition.contains(x, y + 1)) {
                        setPixel(
                            data,
                            width,
                            x,
                            y + 1,
                            getPixel(data, width, x, y + 1).add(
                                scaleColor(
                                    quantError,
                                    ((options.dithering.hardness / 100) * 5) / 16
                                )
                            )
                        );
                    }
                    if (drawingPosition.contains(x + 1, y + 1)) {
                        setPixel(
                            data,
                            width,
                            x + 1,
                            y + 1,
                            getPixel(data, width, x + 1, y + 1).add(
                                scaleColor(
                                    quantError,
                                    ((options.dithering.hardness / 100) * 1) / 16
                                )
                            )
                        );
                    }
                }
            }
        }
    }

    return data;
}

function scaleColor(color: Color, factor: number): Color {
    // Color.mult mutates its input; each neighbor needs the original error.
    return new Color(
        color.r * factor,
        color.g * factor,
        color.b * factor,
        color.a
    );
}

function getPixel(
    data: Uint8ClampedArray,
    width: number,
    x: number,
    y: number
): Color {
    return new Color(
        data[y * width * 4 + x * 4],
        data[y * width * 4 + x * 4 + 1],
        data[y * width * 4 + x * 4 + 2],
        data[y * width * 4 + x * 4 + 3]
    );
}

function setPixel(
    data: Uint8ClampedArray,
    width: number,
    x: number,
    y: number,
    color: Color
) {
    data[y * width * 4 + x * 4] = color.r;
    data[y * width * 4 + x * 4 + 1] = color.g;
    data[y * width * 4 + x * 4 + 2] = color.b;
    data[y * width * 4 + x * 4 + 3] = color.a;
}

export function getClosestPaletteEntry(
    palettes: Palette[],
    color: Color,
    matching: Matching
): PaletteEntry {
    return getClosestPaletteEntryFromEntries(
        getEnabledPaletteEntries(palettes),
        color,
        matching
    );
}

export function clearNode(node: Element) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

export function parsePalette(json: unknown): Palette {
    try {
        return JSON.parse(JSON.stringify(json)) as Palette;
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        throw new Error(`Invalid palette : ${message}`);
    }
}

export function computeUsage(
    colors: Uint8ClampedArray,
    palettes: Palette[]
): Map<string, number> {
    const usage = new Map<string, number>();
    const entriesByColor = createPaletteEntryColorMap(palettes);

    for (let index = 0; index < colors.length; index += 4) {
        const entry = entriesByColor.get(
            getPaletteEntryColorKey(
                colors[index],
                colors[index + 1],
                colors[index + 2],
                colors[index + 3]
            )
        );

        if (entry) {
            usage.set(entry.ref, (usage.get(entry.ref) || 0) + 1);
        }
    }

    return usage;
}

export function countBeads(usage: Map<string, number>): number {
    return Array.from(usage.values()).reduce((total, value) => total + value, 0);
}

export function hasUsageUnderPercent(
    percent: number,
    usage: Map<string, number>
) {
    const total = countBeads(usage);
    const lowerBound = total * (percent / 100);
    return Array.from(usage.values()).find((value) => value < lowerBound);
}

export function removeColorUnderPercent(
    percent: number,
    usage: Map<string, number>,
    palettes: Palette[]
) {
    const total = countBeads(usage);
    const lowerBound = total * (percent / 100);
    const refsToDisable = new Set(
        Array.from(usage.entries())
            .filter(([, value]) => value < lowerBound)
            .map(([ref]) => ref)
    );

    getPaletteEntries(palettes)
        .filter((entry) => refsToDisable.has(entry.ref))
        .forEach((entry) => {
            entry.enabled = false;
        });
}

export function getPaletteEntryByColorRef(
    palettes: Palette[],
    ref: string
): PaletteEntry {
    return getPaletteEntryFromRefMap(createPaletteEntryRefMap(palettes), ref);
}

export function createPaletteEntryRefMap(
    palettes: Palette[]
): Map<string, PaletteEntry> {
    const entriesByRef = new Map<string, PaletteEntry>();

    getPaletteEntries(palettes).forEach((entry) => {
        if (entry.enabled && !entriesByRef.has(entry.ref)) {
            entriesByRef.set(entry.ref, entry);
        }
    });

    return entriesByRef;
}

export function getPaletteEntryFromRefMap(
    entriesByRef: Map<string, PaletteEntry>,
    ref: string
): PaletteEntry {
    const entry = entriesByRef.get(ref);

    if (!entry) {
        throw new Error(`No enabled palette entry found for color ref "${ref}".`);
    }

    return entry;
}

export function foreground(color: Color): Color {
    if (0.299 * color.r + 0.587 * color.g + 0.114 * color.b > 255 / 2) {
        return new Color(0, 0, 0, 255);
    }
    return new Color(255, 255, 255, 255);
}

export function createPaletteEntryColorMap(
    palettes: Palette[],
    keyMode: PaletteEntryColorKeyMode = 'rgba'
): Map<number, PaletteEntry> {
    const entriesByColor = new Map<number, PaletteEntry>();

    getPaletteEntries(palettes).forEach((entry) => {
        const key = getPaletteEntryColorKey(
            entry.color.r,
            entry.color.g,
            entry.color.b,
            entry.color.a,
            keyMode
        );

        if (!entriesByColor.has(key)) {
            entriesByColor.set(key, entry);
        }
    });

    return entriesByColor;
}

export function getPaletteEntryColorKey(
    r: number,
    g: number,
    b: number,
    a = 255,
    keyMode: PaletteEntryColorKeyMode = 'rgba'
): number {
    return keyMode === 'rgb'
        ? getPackedColorKey(r, g, b, 255)
        : getPackedColorKey(r, g, b, a);
}

function getPaletteEntries(palettes: Palette[]): PaletteEntry[] {
    return palettes.flatMap((palette) => palette.entries);
}

function getEnabledPaletteEntries(palettes: Palette[]): PaletteEntry[] {
    return getPaletteEntries(palettes).filter((entry) => entry.enabled);
}

function getClosestPaletteEntryFromEntries(
    entries: PaletteEntry[],
    color: Color,
    matching: Matching
): PaletteEntry {
    const [firstEntry, ...remainingEntries] = entries;

    if (!firstEntry) {
        throw new Error('No enabled palette entries are available.');
    }

    let closestEntry = firstEntry;
    let closestDelta = matching.delta(firstEntry.color, color);

    remainingEntries.forEach((entry) => {
        const delta = matching.delta(entry.color, color);

        if (delta < closestDelta) {
            closestEntry = entry;
            closestDelta = delta;
        }
    });

    return closestEntry;
}

function getPackedColorKey(r: number, g: number, b: number, a: number): number {
    return (
        (((r & 0xff) << 24) |
            ((g & 0xff) << 16) |
            ((b & 0xff) << 8) |
            (a & 0xff)) >>>
        0
    );
}
