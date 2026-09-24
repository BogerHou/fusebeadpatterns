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
    gtag?: (command: 'event', name: string, parameters: PatternEvent['parameters']) => void;
};

export function trackPatternEvent(input: PatternEventInput): boolean {
    // Measurement is best effort. A blocked/missing/late GA script must never
    // block navigation, file downloads, or a successfully generated export.
    try {
        if (typeof window === 'undefined' || !isProductionAnalyticsHost(window.location.hostname)) return false;
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
