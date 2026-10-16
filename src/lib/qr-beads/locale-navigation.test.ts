import { describe, expect, it } from 'vitest';
import { getLetterPalettes } from '../bead-letters/data';
import { qrBeadPaths } from './routes';
import type { QrState } from './types';
import { QR_LOCALE_KEY, acknowledgeQrLocaleSnapshot, discardQrLocaleSnapshot, isQrLocaleNavigation, readQrLocaleSnapshot, saveQrLocaleSnapshot } from './locale-navigation';

const palettes = getLetterPalettes();
const state: QrState = { text: 'https://fusebeadpatterns.art/', errorCorrection: 'M', beadsPerModule: 1, paletteId: 'perler', foregroundRef: '80-19018', backgroundRef: '80-19001', paper: 'a4' };
function store() {
    const data = new Map<string, string>();
    return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
}

describe('QR settings survive equivalent language navigation privately', () => {
    it('allows only equivalent same-origin QR tools', () => {
        expect(isQrLocaleNavigation('http://127.0.0.1:4420' + qrBeadPaths.en, qrBeadPaths.ja)).toBe(true);
        expect(isQrLocaleNavigation('https://fusebeadpatterns.art' + qrBeadPaths.en, 'https://example.org' + qrBeadPaths.ja)).toBe(false);
        expect(isQrLocaleNavigation('https://fusebeadpatterns.art/editor', qrBeadPaths.de)).toBe(false);
        expect(isQrLocaleNavigation('https://fusebeadpatterns.art' + qrBeadPaths.en, '/fr')).toBe(false);
    });

    it.each(Object.values(qrBeadPaths))('preserves all settings and saved state at %s', href => {
        const storage = store(), snapshot = { state: { ...state, text: '名前🙂\nhttps://example.org/a?x=1', errorCorrection: 'H' as const, beadsPerModule: 3 as const, paper: 'letter' as const }, saved: false };
        storage.setItem('bead-pattern-editor-draft-v1', 'other work');
        expect(saveQrLocaleSnapshot(snapshot, href, storage, palettes, 1000)).toBe(true);
        const read = readQrLocaleSnapshot(href, storage, palettes, 1001)!;
        expect(read.snapshot).toEqual(snapshot);
        expect(storage.getItem(QR_LOCALE_KEY)).toBe(read.raw);
        expect(acknowledgeQrLocaleSnapshot(read, storage)).toBe(true);
        expect(readQrLocaleSnapshot(href, storage, palettes, 1002)).toBeNull();
        expect(storage.getItem('bead-pattern-editor-draft-v1')).toBe('other work');
        expect(JSON.parse(read.raw).destination).toBe(href);
    });

    it.each(['', '日'.repeat(1000), '\ud800'])('retains unfinished, over-limit or invalid text rather than losing it', text => {
        const storage = store(), snapshot = { state: { ...state, text, foregroundRef: state.backgroundRef }, saved: false };
        expect(saveQrLocaleSnapshot(snapshot, qrBeadPaths.fr, storage, palettes, 1000)).toBe(true);
        expect(readQrLocaleSnapshot(qrBeadPaths.fr, storage, palettes, 1001)!.snapshot).toEqual(snapshot);
    });

    it('keeps recovery on wrong destination, future/expired record or storage failure', () => {
        const storage = store();
        saveQrLocaleSnapshot({ state, saved: false }, qrBeadPaths.de, storage, palettes, 1000);
        const raw = storage.getItem(QR_LOCALE_KEY);
        expect(() => readQrLocaleSnapshot(qrBeadPaths.ja, storage, palettes, 1001)).toThrow('TRANSFER_DESTINATION_MISMATCH');
        expect(() => readQrLocaleSnapshot(qrBeadPaths.de, storage, palettes, 999)).toThrow('INVALID_TRANSFER');
        expect(() => readQrLocaleSnapshot(qrBeadPaths.de, storage, palettes, 301001)).toThrow('INVALID_TRANSFER');
        expect(() => readQrLocaleSnapshot(qrBeadPaths.de, { ...storage, getItem() { throw new Error('blocked'); } }, palettes, 1001)).toThrow('blocked');
        expect(storage.getItem(QR_LOCALE_KEY)).toBe(raw);
    });

    it('rolls back a partially successful write and never acknowledges a newer record', () => {
        const storage = store();
        saveQrLocaleSnapshot({ state, saved: true }, qrBeadPaths.de, storage, palettes, 1000);
        const read = readQrLocaleSnapshot(qrBeadPaths.de, storage, palettes, 1001)!;
        let once = false;
        const failed = { ...storage, setItem(key: string, value: string) { storage.setItem(key, value); if (!once) { once = true; throw new Error('blocked'); } } };
        expect(saveQrLocaleSnapshot({ state, saved: false }, qrBeadPaths.ja, failed, palettes, 1002)).toBe(false);
        expect(storage.getItem(QR_LOCALE_KEY)).toBe(read.raw);
        saveQrLocaleSnapshot({ state: { ...state, text: 'newer' }, saved: false }, qrBeadPaths.fr, storage, palettes, 1003);
        expect(acknowledgeQrLocaleSnapshot(read, storage)).toBe(false);
        expect(readQrLocaleSnapshot(qrBeadPaths.fr, storage, palettes, 1004)!.snapshot.state.text).toBe('newer');
    });

    it('requires confirmed removal for discard and keeps data on failed acknowledgement', () => {
        const storage = store();
        saveQrLocaleSnapshot({ state, saved: false }, qrBeadPaths.de, storage, palettes, 1000);
        const read = readQrLocaleSnapshot(qrBeadPaths.de, storage, palettes, 1001)!;
        const blocked = { ...storage, removeItem() {} };
        expect(acknowledgeQrLocaleSnapshot(read, blocked)).toBe(false);
        expect(discardQrLocaleSnapshot(blocked)).toBe(false);
        expect(storage.getItem(QR_LOCALE_KEY)).toBe(read.raw);
        expect(discardQrLocaleSnapshot(storage)).toBe(true);
    });

    it('rejects malformed settings and getters without executing them', () => {
        const storage = store(); let calls = 0;
        const bad = { ...state }; Object.defineProperty(bad, 'text', { enumerable: true, get() { calls++; return 'private'; } });
        expect(saveQrLocaleSnapshot({ state: bad, saved: false }, qrBeadPaths.de, storage, palettes)).toBe(false);
        expect(calls).toBe(0);
        expect(saveQrLocaleSnapshot({ state: { ...state, foregroundRef: 'missing' }, saved: false }, qrBeadPaths.de, storage, palettes)).toBe(false);
        expect(storage.data.size).toBe(0);
    });
});
