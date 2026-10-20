import { canMeasureAnalyticsEvent as canMeasureAnalytics } from './analytics-consent';
import { getLibraryProject } from './patterns/project-links';

const PRODUCTION_HOSTS = new Set(['fusebeadpatterns.art', 'www.fusebeadpatterns.art']);
const PALETTES = new Set([
    'perler', 'perler_mini', 'perler_caps', 'hama', 'hama_mini', 'hama_maxi',
    'artkal_a', 'artkal_c', 'artkal_m', 'artkal_r', 'artkal_s', 'nabbi',
    'mard', 'diamonddotz', 'yant',
]);
const ENTRY_POINTS = new Set(['pattern_detail', 'palette_guide', 'collection', 'patterns', 'editor', 'home']);
const DOWNLOAD_FORMATS = new Set(['pdf', 'grid_png', 'project', 'png']);
const EXPORT_FORMATS = new Set(['pdf', 'grid_png', 'svg', 'png', 'jpg', 'xlsx']);
const PIXEL_GRID_EXPORT_FORMATS = new Set(['png', 'grid_png', 'project', 'pdf']);
const BEAD_LOOM_EXPORT_FORMATS = new Set(['pdf', 'png', 'project']);
const TOOL_EXPORT_FORMATS = {
    bead_letters: ['png', 'pdf', 'project'],
    block_shapes: ['png', 'pdf', 'project', 'layer_project'],
    qr_beads: ['png', 'grid_png', 'pdf', 'project'],
    sprite: ['png', 'sprite_sheet_png', 'gif', 'coordinates_json', 'project'],
    minecraft_banners: ['png', 'json', 'txt', 'project'],
    brick_mosaic: ['png', 'csv', 'pdf', 'project'],
} as const;
export type MeasuredTool = keyof typeof TOOL_EXPORT_FORMATS;
type ToolEventInput = { name: string; tool: string; format?: string };
type ToolEvent = {
    name: 'tool_generate' | 'tool_export';
    parameters: { entry_point: MeasuredTool; file_format?: string };
};

export type PatternEventInput = {
    name: string;
    patternId?: string | null;
    paletteId: string;
    entryPoint: string;
    format?: string;
};

type PatternEvent = {
    name: 'pattern_download' | 'pattern_editor_open' | 'pattern_export';
    parameters: {
        entry_point: string;
        primary_palette_id: string;
        pattern_id?: string;
        file_format?: string;
    };
};

type PixelGridExportInput = { format: string };
type PixelGridExportEvent = {
    name: 'pixel_grid_export';
    parameters: { entry_point: 'pixel_grid'; file_format: string };
};
type BeadLoomExportInput = { format: string };
type BeadLoomExportEvent = {
    name: 'bead_loom_export';
    parameters: { entry_point: 'bead_loom'; file_format: string };
};

export function isProductionAnalyticsHost(hostname: string): boolean {
    return PRODUCTION_HOSTS.has(hostname);
}

// Only fixed product identifiers are accepted. Never forward filenames, URLs,
// DOM text, image data, project contents, or arbitrary caller-supplied fields.
export function buildPatternEvent(input: PatternEventInput): PatternEvent | null {
    if (!PALETTES.has(input.paletteId) || !ENTRY_POINTS.has(input.entryPoint)) return null;
    if (input.patternId && !getLibraryProject(input.patternId)) return null;
    if (input.name !== 'pattern_download' && input.name !== 'pattern_editor_open' && input.name !== 'pattern_export') return null;
    if (input.name !== 'pattern_export' && !input.patternId) return null;
    if (input.name === 'pattern_download' && !DOWNLOAD_FORMATS.has(input.format ?? '')) return null;
    if (input.name === 'pattern_export' && !EXPORT_FORMATS.has(input.format ?? '')) return null;

    return {
        name: input.name,
        parameters: {
            entry_point: input.entryPoint,
            primary_palette_id: input.paletteId,
            ...(input.patternId ? { pattern_id: input.patternId } : {}),
            ...(input.name !== 'pattern_editor_open' ? { file_format: input.format } : {}),
        },
    };
}

type AnalyticsWindow = Pick<Window, 'location'> & {
    gtag?: (command: 'event', name: string, parameters: PatternEvent['parameters'] | PixelGridExportEvent['parameters'] | BeadLoomExportEvent['parameters'] | ToolEvent['parameters']) => void;
};

export function buildToolEvent(input: ToolEventInput): ToolEvent | null {
    if (!Object.hasOwn(TOOL_EXPORT_FORMATS, input.tool)) return null;
    const tool = input.tool as MeasuredTool;
    if (input.name === 'tool_generate') {
        if (input.format !== undefined) return null;
        return { name: 'tool_generate', parameters: { entry_point: tool } };
    }
    if (input.name !== 'tool_export' || !(TOOL_EXPORT_FORMATS[tool] as readonly string[]).includes(input.format ?? '')) return null;
    return { name: 'tool_export', parameters: { entry_point: tool, file_format: input.format } };
}

// Only the fixed tool/action/format are read. Export means a download was started,
// not that the user saved it. Call after downloadBlob()/the exporter resolves.
export function trackToolEvent(input: ToolEventInput): boolean {
    try {
        if (!canMeasureAnalytics()) return false;
        const analyticsWindow = window as AnalyticsWindow;
        if (typeof analyticsWindow.gtag !== 'function') return false;
        const event = buildToolEvent(input);
        if (!event) return false;
        analyticsWindow.gtag('event', event.name, event.parameters);
        return true;
    } catch { return false; }
}

// One successful user-created preview/edit per workspace project, rather than
// one event per keystroke, pixel, effect, restore, or settings slider. Mark it
// attempted even without consent: a later consent choice must not replay work.
// Reset only after an explicit project replacement; reset itself sends nothing.
export function createToolGenerationTracker(tool: MeasuredTool) {
    let recorded = false;
    return {
        get recorded() { return recorded; },
        reset() { recorded = false; },
        record() {
            if (recorded) return false;
            recorded = true;
            return trackToolEvent({ name: 'tool_generate', tool });
        },
    };
}

export function trackPatternEvent(input: PatternEventInput): boolean {
    // Measurement is best effort. A blocked/missing/late GA script must never
    // block navigation, file downloads, or a successfully generated export.
    try {
        if (!canMeasureAnalytics()) return false;
        const analyticsWindow = window as AnalyticsWindow;
        if (typeof analyticsWindow.gtag !== 'function') return false;
        const event = buildPatternEvent(input);
        if (!event) return false;
        analyticsWindow.gtag('event', event.name, event.parameters);
        return true;
    } catch {
        return false;
    }
}

export function buildPixelGridExportEvent(input: PixelGridExportInput): PixelGridExportEvent | null {
    const format = input.format;
    if (!PIXEL_GRID_EXPORT_FORMATS.has(format)) return null;
    return {
        name: 'pixel_grid_export',
        parameters: { entry_point: 'pixel_grid', file_format: format },
    };
}

// Call only after the prepared file's download starts. This measures initiation,
// not a confirmed disk save. Analytics failure must not affect the editor state.
export function trackPixelGridExport(input: PixelGridExportInput): boolean {
    try {
        if (!canMeasureAnalytics()) return false;
        const analyticsWindow = window as AnalyticsWindow;
        if (typeof analyticsWindow.gtag !== 'function') return false;
        const event = buildPixelGridExportEvent(input);
        if (!event) return false;
        analyticsWindow.gtag('event', event.name, event.parameters);
        return true;
    } catch {
        return false;
    }
}

export function buildBeadLoomExportEvent(input: BeadLoomExportInput): BeadLoomExportEvent | null {
    const format = input.format;
    if (!BEAD_LOOM_EXPORT_FORMATS.has(format)) return null;
    return {
        name: 'bead_loom_export',
        parameters: { entry_point: 'bead_loom', file_format: format },
    };
}

// Call after download() returns. This measures download initiation, not disk save.
// Only the fixed format is read; chart content and caller-supplied extras are ignored.
export function trackBeadLoomExport(input: BeadLoomExportInput): boolean {
    try {
        if (!canMeasureAnalytics()) return false;
        const analyticsWindow = window as AnalyticsWindow;
        if (typeof analyticsWindow.gtag !== 'function') return false;
        const event = buildBeadLoomExportEvent(input);
        if (!event) return false;
        analyticsWindow.gtag('event', event.name, event.parameters);
        return true;
    } catch {
        return false;
    }
}

export function getPatternLinkEvent(dataset: DOMStringMap): PatternEventInput | null {
    if (dataset.patternEvent !== 'pattern_download' && dataset.patternEvent !== 'pattern_editor_open') return null;
    const input: PatternEventInput = {
        name: dataset.patternEvent,
        patternId: dataset.patternId,
        paletteId: dataset.patternPalette ?? '',
        entryPoint: dataset.patternEntry ?? '',
        format: dataset.patternFormat,
    };
    return buildPatternEvent(input) ? input : null;
}
