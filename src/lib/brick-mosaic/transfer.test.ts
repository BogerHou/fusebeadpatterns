import { afterEach, describe, expect, it, vi } from 'vitest';
import { brickCatalog } from './catalog';
import { createMosaic, type Mosaic } from './core';
import { brickPaths } from './routes';
import { BRICK_LOCALE_KEY, discardBrickTransfer, isBrickLocaleNavigation, readBrickTransfer, saveBrickTransfer, type StorageArea } from './transfer';

const ORIGIN = 'https://fusebeadpatterns.art';
const NOW = 1_000_000;
const href = (path = brickPaths.en) => `${ORIGIN}${path}`;
const model = () => createMosaic(2, 2, 48, brickCatalog, ['ldraw-0', 'ldraw-4', null, 'ldraw-15']);
function memory(initial?: string): StorageArea {
    const entries = new Map<string, string>();
    if (initial !== undefined) entries.set(BRICK_LOCALE_KEY, initial);
    return {
        getItem: key => entries.get(key) ?? null,
        setItem: (key, value) => { entries.set(key, value); },
        removeItem: key => { entries.delete(key); },
    };
}
function seeded(patch: Record<string, unknown> = {}): StorageArea {
    const storage = memory();
    expect(saveBrickTransfer(model(), false, href(brickPaths.ja), storage, NOW)).toBe(true);
    const raw = storage.getItem(BRICK_LOCALE_KEY)!;
    storage.setItem(BRICK_LOCALE_KEY, JSON.stringify({ ...JSON.parse(raw), ...patch }));
    return storage;
}
afterEach(() => { vi.unstubAllGlobals(); });

describe('brick mosaic locale transfer', () => {
    it.each([false, true])('preserves the mosaic, board size and saved=%s without consuming the record', saved => {
        const storage = memory(), original = model(), before = structuredClone(original);
        expect(saveBrickTransfer(original, saved, href(brickPaths.ja), storage, NOW)).toBe(true);
        const raw = storage.getItem(BRICK_LOCALE_KEY);
        const first = readBrickTransfer(href(brickPaths.ja), storage, NOW);
        expect(first).toEqual({ mosaic: original, saved, raw });
        expect(first?.mosaic).not.toBe(original);
        expect(first?.mosaic.cells).not.toBe(original.cells);
        expect(first?.mosaic.boardSize).toBe(48);
        expect(readBrickTransfer(href(brickPaths.ja), storage, NOW)).toEqual(first);
        expect(storage.getItem(BRICK_LOCALE_KEY)).toBe(raw);
        expect(original).toEqual(before);
        const envelope = JSON.parse(raw!);
        expect(Object.keys(envelope).sort()).toEqual(['destination', 'origin', 'project', 'saved', 'savedAt', 'version']);
        expect(Object.keys(JSON.parse(envelope.project)).sort()).toEqual(['catalogVersion', 'designId', 'format', 'mosaic', 'version']);
        expect(raw).not.toMatch(/sourceImage|history|cookie|token/i);
    });

    it('recognises only same-origin known locale paths, including queries, fragments and one trailing slash', () => {
        for (const source of Object.values(brickPaths)) {
            for (const destination of Object.values(brickPaths)) {
                expect(isBrickLocaleNavigation(`${href(source)}?utm=one#old`, `${destination}/?mode=draw#workspace`)).toBe(true);
            }
        }
        expect(isBrickLocaleNavigation(href(), `https://foreign.example${brickPaths.ja}`)).toBe(false);
        expect(isBrickLocaleNavigation(href(), `http://fusebeadpatterns.art${brickPaths.ja}`)).toBe(false);
        expect(isBrickLocaleNavigation(href(), `https://fusebeadpatterns.art:4430${brickPaths.ja}`)).toBe(false);
        expect(isBrickLocaleNavigation(`${ORIGIN}/editor?next=${brickPaths.en}`, brickPaths.ja)).toBe(false);
        expect(isBrickLocaleNavigation(`${ORIGIN}/#${brickPaths.en}`, brickPaths.ja)).toBe(false);
        expect(isBrickLocaleNavigation(href(), `${brickPaths.ja}//`)).toBe(false);
        expect(isBrickLocaleNavigation('relative/path', brickPaths.ja)).toBe(false);
        expect(isBrickLocaleNavigation(href(), 'javascript:alert(1)')).toBe(false);
        expect(isBrickLocaleNavigation(href(), `https://user:secret@fusebeadpatterns.art${brickPaths.ja}`)).toBe(false);
    });

    it('normalises destination pathname while binding recovery to the exact origin', () => {
        const storage = memory();
        expect(saveBrickTransfer(model(), false, `${href(brickPaths.de)}/?tracking=unused#grid`, storage, NOW)).toBe(true);
        const envelope = JSON.parse(storage.getItem(BRICK_LOCALE_KEY)!);
        expect(envelope.destination).toBe(brickPaths.de);
        expect(envelope.origin).toBe(ORIGIN);
        expect(storage.getItem(BRICK_LOCALE_KEY)).not.toContain('tracking');
        expect(readBrickTransfer(`${href(brickPaths.de)}?different=query#different`, storage, NOW)?.mosaic).toEqual(model());
        expect(() => readBrickTransfer(`https://foreign.example${brickPaths.de}`, storage, NOW)).toThrow('INVALID_BRICK_TRANSFER');
        expect(() => readBrickTransfer(href(brickPaths.fr), storage, NOW)).toThrow('INVALID_BRICK_TRANSFER');
        expect(() => readBrickTransfer(`${ORIGIN}/editor?next=${brickPaths.de}`, storage, NOW)).toThrow('INVALID_BRICK_TRANSFER');
    });

    it('rejects browser destinations outside location.origin before touching storage', () => {
        vi.stubGlobal('location', { origin: ORIGIN });
        const storage = memory('previous drawing'), get = vi.spyOn(storage, 'getItem');
        expect(saveBrickTransfer(model(), false, `https://foreign.example${brickPaths.ja}`, storage, NOW)).toBe(false);
        expect(get).not.toHaveBeenCalled();
        expect(saveBrickTransfer(model(), false, href(brickPaths.ja), storage, NOW)).toBe(true);
    });

    it('accepts absolute HTTP(S) in a pure non-browser caller but still binds the read origin', () => {
        vi.stubGlobal('location', undefined);
        const storage = memory();
        expect(saveBrickTransfer(model(), false, `http://localhost:4332${brickPaths.ja}`, storage, NOW)).toBe(true);
        expect(() => readBrickTransfer(href(brickPaths.ja), storage, NOW)).toThrow();
        expect(readBrickTransfer(`http://localhost:4332${brickPaths.ja}`, storage, NOW)?.mosaic).toEqual(model());
    });

    it.each([
        { savedAt: NOW + 1 }, { savedAt: NOW - 300_001 }, { savedAt: -1 },
        { savedAt: '1000000' }, { savedAt: null }, { version: 2 }, { saved: 0 },
        { project: {} }, { origin: 'https://foreign.example' }, { destination: `${brickPaths.ja}?mode=draw` },
        { sourceImage: 'private-image' }, { history: [] },
    ])('rejects malformed, stale, future or expanded envelopes without deleting them: %j', patch => {
        const storage = seeded(patch), raw = storage.getItem(BRICK_LOCALE_KEY);
        expect(() => readBrickTransfer(href(brickPaths.ja), storage, NOW)).toThrow();
        expect(storage.getItem(BRICK_LOCALE_KEY)).toBe(raw);
    });

    it('accepts exactly five minutes and rejects invalid caller clocks', () => {
        const storage = seeded();
        expect(readBrickTransfer(href(brickPaths.ja), storage, NOW + 300_000)?.mosaic).toEqual(model());
        for (const now of [NaN, Infinity, -1]) {
            expect(() => readBrickTransfer(href(brickPaths.ja), storage, now)).toThrow();
            expect(saveBrickTransfer(model(), false, href(brickPaths.ja), storage, now)).toBe(false);
        }
    });

    it('enforces UTF-8 bytes rather than only string length', () => {
        const storage = memory('é'.repeat(1_048_577));
        expect(() => readBrickTransfer(href(brickPaths.ja), storage, NOW)).toThrow('BRICK_TRANSFER_TOO_LARGE');
        expect(storage.getItem(BRICK_LOCALE_KEY)).not.toBeNull();
    });

    it.each(['null', '[]', '{', '42', ''])('rejects invalid envelope JSON without consuming it: %j', raw => {
        const storage = memory(raw);
        expect(() => readBrickTransfer(href(brickPaths.ja), storage, NOW)).toThrow();
        expect(storage.getItem(BRICK_LOCALE_KEY)).toBe(raw);
    });

    it('rejects another tool project and invalid mosaic contents', () => {
        const wrong = seeded({ project: JSON.stringify({ format: 'fusebead-sprite-project', version: 1, frames: [] }) });
        expect(() => readBrickTransfer(href(brickPaths.ja), wrong, NOW)).toThrow('INVALID_MOSAIC_PROJECT');
        const storage = seeded(), envelope = JSON.parse(storage.getItem(BRICK_LOCALE_KEY)!);
        const project = JSON.parse(envelope.project);
        project.mosaic.cells[0] = 'ldraw-999999';
        envelope.project = JSON.stringify(project);
        storage.setItem(BRICK_LOCALE_KEY, JSON.stringify(envelope));
        expect(() => readBrickTransfer(href(brickPaths.ja), storage, NOW)).toThrow();
    });

    it('treats missing or throwing storage as a failure, never as a blank recovery', () => {
        const missing = undefined as unknown as StorageArea;
        expect(saveBrickTransfer(model(), false, href(brickPaths.ja), missing, NOW)).toBe(false);
        expect(() => readBrickTransfer(href(brickPaths.ja), missing, NOW)).toThrow();
        const storage = memory(), read = vi.spyOn(storage, 'getItem').mockImplementation(() => { throw new Error('Storage disabled'); });
        expect(saveBrickTransfer(model(), false, href(brickPaths.ja), storage, NOW)).toBe(false);
        expect(() => readBrickTransfer(href(brickPaths.ja), storage, NOW)).toThrow('Storage disabled');
        expect(discardBrickTransfer(() => storage)).toBe(false);
        read.mockRestore();
        expect(readBrickTransfer(href(brickPaths.ja), storage, NOW)).toBeNull();
    });

    it.each([undefined, 'previous drawing'])('rolls back quota failures to the prior value %j', previous => {
        const storage = memory(previous), write = storage.setItem;
        vi.spyOn(storage, 'setItem').mockImplementationOnce((key, value) => {
            write(key, value); // A storage implementation may mutate before throwing.
            throw new Error('QuotaExceededError');
        });
        expect(saveBrickTransfer(model(), false, href(brickPaths.ja), storage, NOW)).toBe(false);
        expect(storage.getItem(BRICK_LOCALE_KEY)).toBe(previous ?? null);
    });

    it('detects a silent write failure and preserves the old record', () => {
        const storage = memory('previous drawing');
        vi.spyOn(storage, 'setItem').mockImplementationOnce(() => undefined);
        expect(saveBrickTransfer(model(), false, href(brickPaths.ja), storage, NOW)).toBe(false);
        expect(storage.getItem(BRICK_LOCALE_KEY)).toBe('previous drawing');
    });

    it('blocks navigation even if failure cleanup is unavailable', () => {
        const storage = memory();
        vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
        vi.spyOn(storage, 'removeItem').mockImplementation(() => { throw new Error('Storage disabled'); });
        const original = model(), before = structuredClone(original);
        expect(saveBrickTransfer(original, false, href(brickPaths.ja), storage, NOW)).toBe(false);
        expect(original).toEqual(before);
    });

    it('rejects wrong destinations and invalid models without changing an earlier recovery', () => {
        const storage = memory('previous drawing');
        for (const destination of ['/relative-only', `${ORIGIN}/editor?next=${brickPaths.ja}`, `file:///tmp${brickPaths.ja}`]) {
            expect(saveBrickTransfer(model(), false, destination, storage, NOW)).toBe(false);
        }
        const wrong = { ...model(), cells: ['ldraw-0'] } as Mosaic;
        expect(saveBrickTransfer(wrong, false, href(brickPaths.ja), storage, NOW)).toBe(false);
        expect(storage.getItem(BRICK_LOCALE_KEY)).toBe('previous drawing');
    });

    it('only discards explicitly, verifying removal and reporting denied cleanup', () => {
        const storage = seeded();
        expect(discardBrickTransfer(() => storage)).toBe(true);
        expect(storage.getItem(BRICK_LOCALE_KEY)).toBeNull();
        storage.setItem(BRICK_LOCALE_KEY, 'retained');
        vi.spyOn(storage, 'removeItem').mockImplementation(() => undefined);
        expect(discardBrickTransfer(() => storage)).toBe(false);
        expect(storage.getItem(BRICK_LOCALE_KEY)).toBe('retained');
        expect(discardBrickTransfer(() => { throw new Error('Denied'); })).toBe(false);
    });
});
