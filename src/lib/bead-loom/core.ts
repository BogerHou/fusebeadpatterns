/** Independent rectangular bead-loom model. Every cell is a bead, including the background. */
export interface LoomColor {
    id: string;
    symbol: string;
    name: string;
    code: string;
    hex: string;
}

export interface LoomChart {
    title: string;
    columns: number;
    rows: number;
    /** Physical bead width divided by bead height. */
    cellAspect: number;
    palette: LoomColor[];
    backgroundId: string;
    /** Screen order: top to bottom, and left to right within each row. */
    cells: string[];
    startCorner: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
    serpentine: boolean;
}

export interface LoomRowInstruction {
    rowNumber: number;
    y: number;
    direction: 'left-to-right' | 'right-to-left';
    runs: Array<{ symbol: string; count: number }>;
}

export interface LoomImageSource {
    width: number;
    height: number;
    pixels: readonly number[] | Uint8Array | Uint8ClampedArray;
}

export const LIMITS = Object.freeze({
    minColumns: 1,
    maxColumns: 100,
    minRows: 1,
    maxRows: 400,
    maxCells: 20000,
    minCellAspect: 0.5,
    maxCellAspect: 2,
    minColors: 1,
    maxColors: 26,
    maxTitleLength: 80,
    maxNameLength: 60,
    maxCodeLength: 40,
    maxIdLength: 40,
    maxProjectBytes: 1048576,
    maxImageBytes: 8388608,
    maxImageSide: 2048,
    maxImagePixels: 4194304,
});

const CHART_FIELDS = ['title', 'columns', 'rows', 'cellAspect', 'palette', 'backgroundId', 'cells', 'startCorner', 'serpentine'];
const COLOR_FIELDS = ['id', 'symbol', 'name', 'code', 'hex'];
const CORNERS = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];

function exactObject(value: unknown, fields: readonly string[], label: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
        throw new Error(`${label} must be an object.`);
    }
    const keys = Reflect.ownKeys(value);
    if (keys.length !== fields.length || fields.some(key => !Object.hasOwn(value, key)) ||
        keys.some(key => typeof key !== 'string' || !fields.includes(key))) {
        throw new Error(`${label} has missing or unsupported fields.`);
    }
    return value as Record<string, unknown>;
}

function limitedText(value: unknown, maximum: number, label: string): string {
    if (typeof value !== 'string' || value.length > maximum * 2 || [...value].length > maximum) {
        throw new Error(`${label} must contain at most ${maximum} characters.`);
    }
    if ([...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
        throw new Error(`${label} must be a single line without control characters.`);
    }
    return value;
}

function dimensions(columns: unknown, rows: unknown): { columns: number; rows: number } {
    if (typeof columns !== 'number' || typeof rows !== 'number' || !Number.isInteger(columns) ||
        !Number.isInteger(rows) || columns < LIMITS.minColumns || columns > LIMITS.maxColumns ||
        rows < LIMITS.minRows || rows > LIMITS.maxRows || columns * rows > LIMITS.maxCells) {
        throw new Error('Choose 1–100 columns and 1–400 rows, with no more than 20,000 beads.');
    }
    return { columns, rows };
}

/** Validate the entire schema and return an isolated model without renumbering symbols. */
export function validateChart(input: unknown): LoomChart {
    const chart = exactObject(input, CHART_FIELDS, 'Chart');
    const size = dimensions(chart.columns, chart.rows);
    const title = limitedText(chart.title, LIMITS.maxTitleLength, 'Title');
    if (typeof chart.cellAspect !== 'number' || !Number.isFinite(chart.cellAspect) ||
        chart.cellAspect < LIMITS.minCellAspect || chart.cellAspect > LIMITS.maxCellAspect) {
        throw new Error('Bead width / height must be between 0.5 and 2.');
    }
    if (!Array.isArray(chart.palette) || chart.palette.length < LIMITS.minColors || chart.palette.length > LIMITS.maxColors) {
        throw new Error('The palette must contain 1–26 colors.');
    }
    const ids = new Set<string>(), symbols = new Set<string>();
    const palette: LoomColor[] = [];
    for (const entry of chart.palette) {
        const color = exactObject(entry, COLOR_FIELDS, 'Color');
        if (typeof color.id !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(color.id) || ids.has(color.id)) {
            throw new Error('Color IDs must be unique, with 1–40 letters, numbers, hyphens or underscores.');
        }
        if (typeof color.symbol !== 'string' || !/^[A-Z]$/.test(color.symbol) || symbols.has(color.symbol)) {
            throw new Error('Each color needs a unique symbol from A to Z.');
        }
        if (typeof color.hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color.hex)) {
            throw new Error('Each color needs a six-digit hex value such as #AABBCC.');
        }
        palette.push({
            id: color.id,
            symbol: color.symbol,
            name: limitedText(color.name, LIMITS.maxNameLength, 'Color name'),
            code: limitedText(color.code, LIMITS.maxCodeLength, 'Color code'),
            hex: color.hex,
        });
        ids.add(color.id);
        symbols.add(color.symbol);
    }
    if (typeof chart.backgroundId !== 'string' || !ids.has(chart.backgroundId)) {
        throw new Error('The background must be one of the palette colors.');
    }
    if (!Array.isArray(chart.cells) || chart.cells.length !== size.columns * size.rows) {
        throw new Error('Every position in the rectangular chart must contain one bead.');
    }
    const cells: string[] = [];
    for (const id of chart.cells) {
        if (typeof id !== 'string' || !ids.has(id)) throw new Error('A cell refers to an unknown color.');
        cells.push(id);
    }
    if (typeof chart.startCorner !== 'string' || !CORNERS.includes(chart.startCorner)) {
        throw new Error('Choose one of the four starting corners.');
    }
    if (typeof chart.serpentine !== 'boolean') throw new Error('Alternating row direction must be true or false.');
    return {
        title,
        ...size,
        cellAspect: chart.cellAspect,
        palette,
        backgroundId: chart.backgroundId,
        cells,
        startCorner: chart.startCorner as LoomChart['startCorner'],
        serpentine: chart.serpentine,
    };
}

export function createChart(columns: number = 11, rows: number = 31): LoomChart {
    const size = dimensions(columns, rows);
    // Generic editable colors. These are not an official manufacturer palette.
    const palette: LoomColor[] = [
        { id: 'color-a', symbol: 'A', name: 'Ivory', code: '', hex: '#F4EDDF' },
        { id: 'color-b', symbol: 'B', name: 'Midnight', code: '', hex: '#293C4B' },
        { id: 'color-c', symbol: 'C', name: 'Terracotta', code: '', hex: '#C36B51' },
        { id: 'color-d', symbol: 'D', name: 'Sage', code: '', hex: '#879A83' },
        { id: 'color-e', symbol: 'E', name: 'Ochre', code: '', hex: '#D3AA55' },
    ];
    return {
        title: '',
        ...size,
        cellAspect: 1,
        palette,
        backgroundId: palette[0].id,
        cells: new Array<string>(columns * rows).fill(palette[0].id),
        startCorner: 'bottom-left',
        serpentine: true,
    };
}

export function getCounts(chart: LoomChart): Array<LoomColor & { count: number }> {
    const checked = validateChart(chart);
    const counts = new Map(checked.palette.map(color => [color.id, 0]));
    for (const id of checked.cells) counts.set(id, counts.get(id)! + 1);
    return checked.palette.map(color => ({ ...color, count: counts.get(color.id)! }));
}

export function rowNumberAt(chart: LoomChart, y: number): number {
    if (!Number.isInteger(y) || y < 0 || y >= chart.rows) throw new Error('Row position is outside the chart.');
    return chart.startCorner.startsWith('bottom') ? chart.rows - y : y + 1;
}

export function getRowInstructions(chart: LoomChart): LoomRowInstruction[] {
    const checked = validateChart(chart);
    const symbols = new Map(checked.palette.map(color => [color.id, color.symbol]));
    const startsAtBottom = checked.startCorner.startsWith('bottom');
    const startsAtRight = checked.startCorner.endsWith('right');
    return Array.from({ length: checked.rows }, (_, index) => {
        const y = startsAtBottom ? checked.rows - 1 - index : index;
        const reverse = startsAtRight !== (checked.serpentine && index % 2 === 1);
        const runs: LoomRowInstruction['runs'] = [];
        for (let step = 0; step < checked.columns; step++) {
            const x = reverse ? checked.columns - 1 - step : step;
            const symbol = symbols.get(checked.cells[y * checked.columns + x])!;
            const last = runs[runs.length - 1];
            if (last?.symbol === symbol) last.count++;
            else runs.push({ symbol, count: 1 });
        }
        return { rowNumber: index + 1, y, direction: reverse ? 'right-to-left' : 'left-to-right', runs };
    });
}

function requireColor(chart: LoomChart, id: string): void {
    if (!chart.palette.some(color => color.id === id)) throw new Error('Choose a color from the palette.');
}

export function paintLine(chart: LoomChart, from: [number, number], to: [number, number], colorId: string): LoomChart {
    const next = validateChart(chart);
    requireColor(next, colorId);
    for (const point of [from, to]) {
        if (!Array.isArray(point) || point.length !== 2 || !Number.isInteger(point[0]) || !Number.isInteger(point[1]) ||
            point[0] < 0 || point[0] >= next.columns || point[1] < 0 || point[1] >= next.rows) {
            throw new Error('Line endpoints must be whole-number positions inside the chart.');
        }
    }
    let [x, y] = from;
    const [endX, endY] = to;
    const dx = Math.abs(endX - x), dy = -Math.abs(endY - y);
    const stepX = x < endX ? 1 : -1, stepY = y < endY ? 1 : -1;
    let error = dx + dy;
    for (;;) {
        next.cells[y * next.columns + x] = colorId;
        if (x === endX && y === endY) break;
        const twice = 2 * error;
        if (twice >= dy) { error += dy; x += stepX; }
        if (twice <= dx) { error += dx; y += stepY; }
    }
    return next;
}

/** Replace beads, retaining both palette entries and their stable symbols. */
export function replaceColor(chart: LoomChart, fromId: string, toId: string): LoomChart {
    const next = validateChart(chart);
    requireColor(next, fromId);
    requireColor(next, toId);
    next.cells = next.cells.map(id => id === fromId ? toId : id);
    return next;
}

export function serializeProject(chart: LoomChart): string {
    return JSON.stringify({ format: 'bead-loom-project', version: 1, chart: validateChart(chart) });
}

export function parseProject(text: string): LoomChart {
    if (typeof text !== 'string' || text.length > LIMITS.maxProjectBytes ||
        new TextEncoder().encode(text).length > LIMITS.maxProjectBytes) {
        throw new Error('The project file must be no larger than 1 MiB.');
    }
    let parsed: unknown;
    try { parsed = JSON.parse(text); }
    catch { throw new Error('The project file must contain valid JSON.'); }
    const project = exactObject(parsed, ['format', 'version', 'chart'], 'Project');
    if (project.format !== 'bead-loom-project' || project.version !== 1) {
        throw new Error('Only bead-loom-project version 1 files are supported.');
    }
    return validateChart(project.chart);
}

export function chartsEqual(a: LoomChart, b: LoomChart): boolean {
    return a.title === b.title && a.columns === b.columns && a.rows === b.rows &&
        a.cellAspect === b.cellAspect && a.backgroundId === b.backgroundId &&
        a.startCorner === b.startCorner && a.serpentine === b.serpentine &&
        a.palette.length === b.palette.length && a.palette.every((color, index) => {
            const other = b.palette[index];
            return color.id === other.id && color.symbol === other.symbol && color.name === other.name &&
                color.code === other.code && color.hex === other.hex;
        }) && a.cells.length === b.cells.length && a.cells.every((id, index) => id === b.cells[index]);
}

function rgb(hex: string): [number, number, number] {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** Nearest-neighbor sampling, then alpha compositing and nearest custom RGB color.
 * Fit/crop use physical chart width (columns × bead width/height), not cell count alone.
 * RGB-distance ties keep the earlier palette entry. Fully transparent pixels use backgroundId.
 */
export function convertImage(source: LoomImageSource, chart: LoomChart, mode: 'fit' | 'crop' | 'stretch'): LoomChart {
    const next = validateChart(chart);
    if (!['fit', 'crop', 'stretch'].includes(mode)) throw new Error('Choose fit, crop or stretch.');
    if (!source || !Number.isInteger(source.width) || !Number.isInteger(source.height) || source.width < 1 ||
        source.height < 1 || source.width > LIMITS.maxImageSide || source.height > LIMITS.maxImageSide ||
        source.width * source.height > LIMITS.maxImagePixels) {
        throw new Error('Source images must be at most 2048 × 2048 pixels.');
    }
    const pixels = source.pixels;
    if ((!Array.isArray(pixels) && !(pixels instanceof Uint8Array) && !(pixels instanceof Uint8ClampedArray)) ||
        pixels.length !== source.width * source.height * 4) {
        throw new Error('Source RGBA data must have four channels per pixel.');
    }
    if (Array.isArray(pixels)) {
        for (const value of pixels) {
            if (!Number.isInteger(value) || value < 0 || value > 255) throw new Error('RGBA channels must be whole numbers from 0 to 255.');
        }
    }
    const palette = next.palette.map(color => ({ id: color.id, channels: rgb(color.hex) }));
    const background = palette.find(color => color.id === next.backgroundId)!.channels;
    next.cells.fill(next.backgroundId);
    const physicalWidth = next.columns * next.cellAspect;
    let drawColumns = next.columns, drawRows = next.rows, left = 0, top = 0;
    let sourceLeft = 0, sourceTop = 0, sourceWidth = source.width, sourceHeight = source.height;
    if (mode === 'fit') {
        const scale = Math.min(physicalWidth / source.width, next.rows / source.height);
        drawColumns = Math.max(1, Math.min(next.columns, Math.round(source.width * scale / next.cellAspect)));
        drawRows = Math.max(1, Math.min(next.rows, Math.round(source.height * scale)));
        left = Math.floor((next.columns - drawColumns) / 2);
        top = Math.floor((next.rows - drawRows) / 2);
    } else if (mode === 'crop') {
        const scale = Math.max(physicalWidth / source.width, next.rows / source.height);
        sourceWidth = physicalWidth / scale;
        sourceHeight = next.rows / scale;
        sourceLeft = (source.width - sourceWidth) / 2;
        sourceTop = (source.height - sourceHeight) / 2;
    }
    for (let y = 0; y < drawRows; y++) {
        const sy = Math.min(source.height - 1, Math.floor(sourceTop + (y + 0.5) * sourceHeight / drawRows));
        for (let x = 0; x < drawColumns; x++) {
            const sx = Math.min(source.width - 1, Math.floor(sourceLeft + (x + 0.5) * sourceWidth / drawColumns));
            const offset = (sy * source.width + sx) * 4;
            const alpha = pixels[offset + 3] / 255;
            if (alpha === 0) continue;
            const composited = [0, 1, 2].map(channel => pixels[offset + channel] * alpha + background[channel] * (1 - alpha));
            let nearest = palette[0].id, bestDistance = Infinity;
            for (const color of palette) {
                const distance = color.channels.reduce((sum, channel, index) => sum + (channel - composited[index]) ** 2, 0);
                if (distance < bestDistance) { bestDistance = distance; nearest = color.id; }
            }
            next.cells[(y + top) * next.columns + x + left] = nearest;
        }
    }
    return next;
}
