import { getBoardOption, getPaletteOption, type BoardOptionId } from './config';
import { decodeEditorPatternDraft, parseEditorProject, EDITOR_PROJECT_FILE_TYPE, EDITOR_DRAFT_BOARD_COUNT_MAX, type EditorDraft } from './draft';
import { PatternHistory, type PatternHistorySnapshot } from './pattern-history';
import type { EditorShortcutTool } from './shortcuts';
import type { Palette } from '../core/model/palette/palette.model';
import { localeRoutes } from '../i18n/routes';

/** A disabled-storage ordinary visit is distinct from arriving at a language equivalent. */
export function isEditorLanguageArrival(fromHref: string, toHref: string): boolean {
    try {
        if (!fromHref) return false;
        const from = new URL(fromHref), to = new URL(toHref);
        if (from.origin !== to.origin) return false;
        const path = (url: URL) => url.pathname.replace(/\/$/, '') || '/';
        const route = (url: URL) => Object.entries(localeRoutes).flatMap(([locale, routes]) => [
            { locale, kind: 'home', pathname: routes.home },
            { locale, kind: 'editor', pathname: routes.editor },
            { locale, kind: 'hama-maker', pathname: routes.hamaMaker },
        ]).find(item => item.pathname === path(url));
        const source = route(from), target = route(to);
        return Boolean(source && target && source.kind === target.kind && source.locale !== target.locale);
    } catch { return false; }
}

/** Tab-local working state only. Downloaded projects and persistent drafts stay v1. */
export type EditorLocaleContext = {
    history: PatternHistorySnapshot;
    tool: EditorShortcutTool;
    colorRef: string | null;
    colorSelection: 'auto' | 'manual';
    pendingPaletteId: string;
    pendingBoardId: BoardOptionId;
    pendingBoardWidth: number;
    pendingBoardHeight: number;
    manualRevision: number;
    colorPickerPaletteId: string;
    colorPickerQuery: string;
    paletteHistory: Palette[][];
    advancedOpen: boolean;
    editorPanel: 'file' | 'edit' | 'colors' | 'setup' | null;
    homePanel: 'image' | 'brand' | 'pegboard' | 'advanced' | 'export' | null;
    viewport: { left: number; top: number };
};

function record(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function count(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= EDITOR_DRAFT_BOARD_COUNT_MAX;
}

/** Validate against the exact saved grid before any work is handed to a new page. */
export function parseEditorLocaleContext(value: unknown, draft: EditorDraft): EditorLocaleContext | null {
    try {
        if (!record(value) || !record(value.viewport) ||
            !['bead', 'fill', 'erase', 'pick', 'pan'].includes(value.tool as string) ||
            !['auto', 'manual'].includes(value.colorSelection as string) ||
            !(value.colorRef === null || (typeof value.colorRef === 'string' && value.colorRef.length <= 4096)) ||
            typeof value.pendingPaletteId !== 'string' || !getPaletteOption(value.pendingPaletteId) ||
            !['midi', 'mini', 'mini_artkal'].includes(value.pendingBoardId as string) ||
            !count(value.pendingBoardWidth) || !count(value.pendingBoardHeight) ||
            typeof value.manualRevision !== 'number' || !Number.isSafeInteger(value.manualRevision) || value.manualRevision < 0 ||
            typeof value.colorPickerPaletteId !== 'string' || !getPaletteOption(value.colorPickerPaletteId) ||
            typeof value.colorPickerQuery !== 'string' || value.colorPickerQuery.length > 4096 ||
            !Array.isArray(value.paletteHistory) || value.paletteHistory.length > 10_000 ||
            typeof value.advancedOpen !== 'boolean' ||
            ![null, 'file', 'edit', 'colors', 'setup'].includes(value.editorPanel as null | string) ||
            ![null, 'image', 'brand', 'pegboard', 'advanced', 'export'].includes(value.homePanel as null | string) ||
            ![value.viewport.left, value.viewport.top].every(offset => typeof offset === 'number' && Number.isFinite(offset) && offset >= 0)) return null;

        const board = getBoardOption(draft.boardId), pattern = draft.editedPattern;
        const pixels = decodeEditorPatternDraft(pattern);
        if (!board || !pattern || !pixels || pattern.width !== draft.boardWidth * board.beadsPerRow ||
            pattern.height !== draft.boardHeight * board.beadsPerRow ||
            !new PatternHistory().restore(value.history, pixels, pattern.width, pattern.height)) return null;
        if (value.colorRef !== null && !draft.activePalettes.some(palette => palette.entries.some(entry => entry.enabled && entry.ref === value.colorRef))) return null;

        const paletteHistory: Palette[][] = [];
        for (const palettes of value.paletteHistory) {
            // Validate only this palette snapshot; do not repeatedly serialize
            // the multi-megabyte original image/current pixels for each old state.
            const parsed = parseEditorProject(JSON.stringify({ type: EDITOR_PROJECT_FILE_TYPE, version: 1, draft: { ...draft, sourceMode: 'blank', imageSrc: null, editedPattern: null, activePalettes: palettes } }));
            if (!parsed) return null;
            paletteHistory.push(parsed.activePalettes);
        }
        return {
            ...(value as unknown as EditorLocaleContext),
            history: JSON.parse(JSON.stringify(value.history)) as PatternHistorySnapshot,
            paletteHistory,
            viewport: { left: value.viewport.left as number, top: value.viewport.top as number },
        };
    } catch {
        return null;
    }
}
