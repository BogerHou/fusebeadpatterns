import { describe, expect, it } from 'vitest';
import { getLetterPalettes } from './data';
import { defaultLetterState } from './project';
import { beadLetterPaths } from './routes';
import { LETTER_LOCALE_KEY, acknowledgeLetterLocaleSnapshot, consumeLetterLocaleSnapshot, discardLetterLocaleSnapshot, isLetterLocaleNavigation, readLetterLocaleSnapshot, saveLetterLocaleSnapshot } from './locale-navigation';

const palettes = getLetterPalettes();
const store = () => {
    const data = new Map<string, string>();
    return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
};

describe('letter settings across site languages', () => {
    it('only intercepts equivalent tools on the same origin', () => {
        expect(isLetterLocaleNavigation('https://fusebeadpatterns.art/bead-letter-generator', beadLetterPaths.ja)).toBe(true);
        expect(isLetterLocaleNavigation('http://127.0.0.1:4416/bead-letter-generator', beadLetterPaths.de)).toBe(true);
        expect(isLetterLocaleNavigation('https://fusebeadpatterns.art/bead-letter-generator', 'https://example.org' + beadLetterPaths.fr)).toBe(false);
        expect(isLetterLocaleNavigation('https://fusebeadpatterns.art/editor', beadLetterPaths.fr)).toBe(false);
        expect(isLetterLocaleNavigation('https://fusebeadpatterns.art/bead-letter-generator', '/fr')).toBe(false);
    });

    it.each(Object.values(beadLetterPaths))('carries full settings and saved state to %s once', href => {
        const storage = store(), snapshot = { state: { ...defaultLetterState(palettes), text: 'Alice\n2026', padding: 3, lineSpacing: 4, letterSpacing: 2, align: 'right' as const, paper: 'letter' as const, backgroundEnabled: false }, saved: false };
        storage.setItem('bead-pattern-editor-draft-v1', 'old editor work');
        storage.setItem('pixel-grid-locale-transfer-v1', 'old pixel work');
        expect(saveLetterLocaleSnapshot(snapshot, href, storage, palettes, 1000)).toBe(true);
        expect(consumeLetterLocaleSnapshot(href, storage, palettes, 1001)).toEqual(snapshot);
        expect(consumeLetterLocaleSnapshot(href, storage, palettes, 1002)).toBeNull();
        expect(storage.data.get('bead-pattern-editor-draft-v1')).toBe('old editor work');
        expect(storage.data.get('pixel-grid-locale-transfer-v1')).toBe('old pixel work');
    });

    it('keeps unsupported input editable instead of silently losing it when changing language', () => {
        const storage = store(), snapshot = { state: { ...defaultLetterState(palettes), text: 'Éva\n名前🙂' }, saved: false };
        expect(saveLetterLocaleSnapshot(snapshot, beadLetterPaths.ja, storage, palettes, 1000)).toBe(true);
        expect(consumeLetterLocaleSnapshot(beadLetterPaths.ja, storage, palettes, 1001)).toEqual(snapshot);
    });

    it('does not consume a transfer at a different destination', () => {
        const storage = store(), snapshot = { state: defaultLetterState(palettes), saved: true };
        saveLetterLocaleSnapshot(snapshot, beadLetterPaths.de, storage, palettes, 1000);
        const raw = storage.data.get(LETTER_LOCALE_KEY);
        expect(() => readLetterLocaleSnapshot(beadLetterPaths.fr, storage, palettes, 1001)).toThrow('TRANSFER_DESTINATION_MISMATCH');
        expect(storage.data.get(LETTER_LOCALE_KEY)).toBe(raw);
    });

    it('keeps the prior transfer when a write reports failure after changing storage', () => {
        const storage = store(), snapshot = { state: defaultLetterState(palettes), saved: true };
        saveLetterLocaleSnapshot(snapshot, beadLetterPaths.de, storage, palettes, 1000);
        const previous = storage.data.get(LETTER_LOCALE_KEY);
        let failed = false;
        const faulty = { ...storage, setItem(key: string, value: string) { storage.setItem(key, value); if (!failed) { failed = true; throw new Error('blocked'); } } };
        expect(saveLetterLocaleSnapshot({ ...snapshot, saved: false }, beadLetterPaths.ja, faulty, palettes, 1001)).toBe(false);
        expect(storage.data.get(LETTER_LOCALE_KEY)).toBe(previous);
    });

    it.each([0, 301_001])('rejects future or expired timestamps without a default overwrite: %s', now => {
        const storage = store();
        saveLetterLocaleSnapshot({ state: defaultLetterState(palettes), saved: false }, beadLetterPaths.fr, storage, palettes, 1000);
        expect(() => consumeLetterLocaleSnapshot(beadLetterPaths.fr, storage, palettes, now)).toThrow('INVALID_TRANSFER');
    });

    it('does not publish invalid brand/color settings', () => {
        const storage = store(), state = { ...defaultLetterState(palettes), foregroundRef: 'made-up' };
        expect(saveLetterLocaleSnapshot({ state, saved: false }, beadLetterPaths.fr, storage, palettes, 1000)).toBe(false);
        expect(storage.data.size).toBe(0);
    });

    it('reads before acknowledgement so failed removal cannot lose a valid recovery', () => {
        const storage = store(), snapshot = { state: { ...defaultLetterState(palettes), text: 'KEEP ME' }, saved: false };
        saveLetterLocaleSnapshot(snapshot, beadLetterPaths.ja, storage, palettes, 1000);
        const raw = storage.data.get(LETTER_LOCALE_KEY);
        const read = readLetterLocaleSnapshot(beadLetterPaths.ja, storage, palettes, 1001)!;
        expect(read.snapshot).toEqual(snapshot);
        expect(storage.data.get(LETTER_LOCALE_KEY)).toBe(raw);
        const blocked = { ...storage, removeItem() { throw new Error('blocked'); } };
        expect(acknowledgeLetterLocaleSnapshot(read, blocked)).toBe(false);
        expect(consumeLetterLocaleSnapshot(beadLetterPaths.ja, blocked, palettes, 1002)).toEqual(snapshot);
        expect(storage.data.get(LETTER_LOCALE_KEY)).toBe(raw);
        expect(acknowledgeLetterLocaleSnapshot(read, storage)).toBe(true);
        expect(storage.data.has(LETTER_LOCALE_KEY)).toBe(false);
    });

    it('does not acknowledge a newer pending record', () => {
        const storage = store(), state = defaultLetterState(palettes);
        saveLetterLocaleSnapshot({ state, saved: false }, beadLetterPaths.ja, storage, palettes, 1000);
        const read = readLetterLocaleSnapshot(beadLetterPaths.ja, storage, palettes, 1001)!;
        saveLetterLocaleSnapshot({ state: { ...state, text: 'NEWER' }, saved: false }, beadLetterPaths.fr, storage, palettes, 1002);
        const newer = storage.data.get(LETTER_LOCALE_KEY);
        expect(acknowledgeLetterLocaleSnapshot(read, storage)).toBe(false);
        expect(storage.data.get(LETTER_LOCALE_KEY)).toBe(newer);
    });

    it('propagates storage read failures rather than reporting no saved settings', () => {
        const storage = store();
        const blocked = { ...storage, getItem() { throw new Error('read blocked'); } };
        expect(() => readLetterLocaleSnapshot(beadLetterPaths.ja, blocked, palettes, 1001)).toThrow('read blocked');
        storage.setItem(LETTER_LOCALE_KEY, '');
        expect(() => readLetterLocaleSnapshot(beadLetterPaths.ja, storage, palettes, 1001)).toThrow();
        expect(storage.data.get(LETTER_LOCALE_KEY)).toBe('');
    });

    it('requires confirmed removal before an explicit discard can start over', () => {
        const storage = store();
        storage.setItem(LETTER_LOCALE_KEY, 'damaged transfer');
        storage.setItem('bead-pattern-editor-draft-v1', 'other editor work');
        expect(discardLetterLocaleSnapshot({ ...storage, removeItem() {} })).toBe(false);
        expect(discardLetterLocaleSnapshot({ ...storage, removeItem() { throw new Error('blocked'); } })).toBe(false);
        expect(storage.data.get(LETTER_LOCALE_KEY)).toBe('damaged transfer');
        expect(discardLetterLocaleSnapshot(storage)).toBe(true);
        expect(storage.data.get('bead-pattern-editor-draft-v1')).toBe('other editor work');
    });
});
