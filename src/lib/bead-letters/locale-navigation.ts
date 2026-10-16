import { beadLetterPaths } from './routes';
import type { LetterPalette, LetterState } from './types';

export const LETTER_LOCALE_KEY = 'bead-letters-locale-transfer-v1';
const MAX_AGE = 5 * 60 * 1000;
type StorageArea = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type LetterLocaleSnapshot = { state: LetterState; saved: boolean };
export type LetterLocaleRead = { snapshot: LetterLocaleSnapshot; raw: string };
const paths = Object.values(beadLetterPaths);
const path = (href: string) => new URL(href, 'https://fusebeadpatterns.art').pathname.replace(/\/$/, '');
const integer = (v: unknown, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;

export function isLetterLocaleNavigation(from: string, to: string): boolean {
    try {
        const source = new URL(from), target = new URL(to, source);
        return source.origin === target.origin && paths.includes(path(source.href)) && paths.includes(path(target.href));
    } catch { return false; }
}

// Invalid text remains editable after changing language: do not require a valid
// finished pattern to carry input such as a currently unsupported character.
function checkedSnapshot(value: unknown, palettes: LetterPalette[]): LetterLocaleSnapshot {
    if (!value || typeof value !== 'object' || !('state' in value) || !('saved' in value) || typeof value.saved !== 'boolean') throw new Error('INVALID_TRANSFER');
    const s = value.state as LetterState;
    if (!s || typeof s !== 'object' || typeof s.text !== 'string' || [...s.text].length > 200
        || !integer(s.letterSpacing, 4) || !integer(s.lineSpacing, 6) || !integer(s.padding, 4)
        || !['left', 'center', 'right'].includes(s.align) || typeof s.backgroundEnabled !== 'boolean' || !['a4', 'letter'].includes(s.paper)) throw new Error('INVALID_TRANSFER');
    const palette = palettes.find(p => p.id === s.paletteId);
    if (!palette || !palette.colors.some(c => c.ref === s.foregroundRef) || !palette.colors.some(c => c.ref === s.backgroundRef)) throw new Error('INVALID_TRANSFER');
    return { state: { text: s.text, letterSpacing: s.letterSpacing, lineSpacing: s.lineSpacing, padding: s.padding, align: s.align,
        paletteId: s.paletteId, foregroundRef: s.foregroundRef, backgroundRef: s.backgroundRef, backgroundEnabled: s.backgroundEnabled, paper: s.paper }, saved: value.saved };
}

export function saveLetterLocaleSnapshot(snapshot: LetterLocaleSnapshot, href: string, storage: StorageArea, palettes: LetterPalette[], now = Date.now()): boolean {
    let previous: string | null = null;
    let attempted = false;
    try {
        if (!paths.includes(path(href)) || !Number.isFinite(now)) return false;
        const checked = checkedSnapshot(snapshot, palettes);
        const raw = JSON.stringify({ version: 1, destination: path(href), savedAt: now, snapshot: checked });
        previous = storage.getItem(LETTER_LOCALE_KEY);
        attempted = true;
        storage.setItem(LETTER_LOCALE_KEY, raw);
        if (storage.getItem(LETTER_LOCALE_KEY) !== raw) throw new Error('TRANSFER_NOT_SAVED');
        return true;
    } catch {
        if (attempted) try {
            if (previous === null) storage.removeItem(LETTER_LOCALE_KEY);
            else storage.setItem(LETTER_LOCALE_KEY, previous);
        } catch { /* The source form is still open and unchanged. */ }
        return false;
    }
}

// Reading never removes the only recoverable copy. In particular, a storage
// read error is not the same thing as an absent transfer.
export function readLetterLocaleSnapshot(href: string, storage: StorageArea, palettes: LetterPalette[], now = Date.now()): LetterLocaleRead | null {
    const raw = storage.getItem(LETTER_LOCALE_KEY);
    if (raw === null) return null;
    if (!paths.includes(path(href))) throw new Error('INVALID_TRANSFER');
    if (raw.length > 4096) throw new Error('INVALID_TRANSFER');
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || !paths.includes(value.destination)
        || typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt)
        || !Number.isFinite(now) || value.savedAt > now || now - value.savedAt > MAX_AGE) throw new Error('INVALID_TRANSFER');
    if (value.destination !== path(href)) throw new Error('TRANSFER_DESTINATION_MISMATCH');
    return { snapshot: checkedSnapshot(value.snapshot, palettes), raw };
}

// Acknowledgement is best-effort after the caller installs the recovered state.
// Never delete a newer record or turn a successful read into a failed restore.
export function acknowledgeLetterLocaleSnapshot(read: LetterLocaleRead, storage: StorageArea): boolean {
    try {
        if (storage.getItem(LETTER_LOCALE_KEY) !== read.raw) return false;
        storage.removeItem(LETTER_LOCALE_KEY);
        return storage.getItem(LETTER_LOCALE_KEY) === null;
    } catch { return false; }
}

export function discardLetterLocaleSnapshot(storage: StorageArea): boolean {
    try {
        storage.removeItem(LETTER_LOCALE_KEY);
        return storage.getItem(LETTER_LOCALE_KEY) === null;
    } catch { return false; }
}

export function consumeLetterLocaleSnapshot(href: string, storage: StorageArea, palettes: LetterPalette[], now = Date.now()): LetterLocaleSnapshot | null {
    const read = readLetterLocaleSnapshot(href, storage, palettes, now);
    if (!read) return null;
    acknowledgeLetterLocaleSnapshot(read, storage);
    return read.snapshot;
}
