import { BannerError, createBanner, exactKeys, plainRecord, validateBanner, validateDye, type BannerDesign } from './core';
import { GAME_VERSION } from './data';
import type { LetterSpec } from './letters';

export const BANNER_PROJECT_MAX_BYTES = 32_768;
export type BannerWorkspace = { design: BannerDesign; activeLayer: number; letters: LetterSpec; activeLetter: number };
export function validateWorkspace(value: unknown): BannerWorkspace {
    if (!plainRecord(value) || !exactKeys(value, ['design', 'activeLayer', 'letters', 'activeLetter'])
        || !plainRecord(value.letters) || !exactKeys(value.letters, ['text', 'base', 'ink'])
        || typeof value.letters.text !== 'string' || [...value.letters.text].length > 32
        || !Number.isInteger(value.activeLetter) || (value.activeLetter as number) < 0 || (value.activeLetter as number) > 63) throw new BannerError('INVALID_PROJECT');
    const design = validateBanner(value.design);
    if (!Number.isInteger(value.activeLayer) || (value.activeLayer as number) < 0 || (value.activeLayer as number) > design.layers.length) throw new BannerError('INVALID_PROJECT');
    return { design, activeLayer: value.activeLayer as number,
        letters: { text: value.letters.text, base: validateDye(value.letters.base), ink: validateDye(value.letters.ink) }, activeLetter: value.activeLetter as number };
}
export function defaultBannerWorkspace(): BannerWorkspace {
    return validateWorkspace({ design: createBanner(), activeLayer: 0, letters: { text: 'HELLO', base: 'white', ink: 'black' }, activeLetter: 0 });
}
export function serializeBannerProject(input: BannerWorkspace): string {
    const raw = JSON.stringify({ format: 'fusebead-banner-project', version: 1, gameVersion: GAME_VERSION, workspace: validateWorkspace(input) });
    if (new TextEncoder().encode(raw).length > BANNER_PROJECT_MAX_BYTES) throw new BannerError('INVALID_PROJECT');
    return raw;
}
export function parseBannerProject(raw: string): BannerWorkspace {
    if (typeof raw !== 'string' || raw.length > BANNER_PROJECT_MAX_BYTES || new TextEncoder().encode(raw).length > BANNER_PROJECT_MAX_BYTES) throw new BannerError('INVALID_PROJECT');
    try {
        const value: unknown = JSON.parse(raw);
        if (!plainRecord(value) || !exactKeys(value, ['format', 'version', 'gameVersion', 'workspace'])
            || value.format !== 'fusebead-banner-project' || value.version !== 1 || value.gameVersion !== GAME_VERSION) throw new BannerError('INVALID_PROJECT');
        return validateWorkspace(value.workspace);
    } catch { throw new BannerError('INVALID_PROJECT'); }
}
/** Whole workspace transactions, with owned snapshots at every boundary. */
export class BannerHistory {
    private present: BannerWorkspace;
    private past: BannerWorkspace[] = [];
    private future: BannerWorkspace[] = [];
    constructor(workspace: BannerWorkspace) { this.present = validateWorkspace(workspace); }
    current(): BannerWorkspace { return validateWorkspace(this.present); }
    canUndo(): boolean { return this.past.length > 0; }
    canRedo(): boolean { return this.future.length > 0; }
    commit(workspace: BannerWorkspace): BannerWorkspace {
        const next = validateWorkspace(workspace);
        if (JSON.stringify(next) === JSON.stringify(this.present)) return this.current();
        this.past.push(this.present); this.past = this.past.slice(-30); this.present = next; this.future = []; return this.current();
    }
    undo(): BannerWorkspace {
        if (this.past.length) { this.future.push(this.present); this.present = this.past.pop()!; }
        return this.current();
    }
    redo(): BannerWorkspace {
        if (this.future.length) { this.past.push(this.present); this.present = this.future.pop()!; }
        return this.current();
    }
}
