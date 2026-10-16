import { describe, expect, it } from 'vitest';
import { acknowledgeBannerTransfer, BANNER_TRANSFER_KEY, BANNER_TRANSFER_MAX_BYTES, discardBannerTransfer, isBannerNavigation, readBannerTransfer, saveBannerTransfer } from './locale';
import { defaultBannerWorkspace } from './project';
import { bannerPaths } from './routes';

class MemoryStorage {
    values = new Map<string, string>();
    getItem(key: string) { return this.values.get(key) ?? null; }
    setItem(key: string, value: string) { this.values.set(key, value); }
    removeItem(key: string) { this.values.delete(key); }
}
const origin = 'https://fusebeadpatterns.art';

describe('banner workspace page transfer', () => {
    it('recognizes all eight same-origin task/language routes and no other tools', () => {
        for (const from of Object.values(bannerPaths).flatMap(Object.values)) for (const to of Object.values(bannerPaths).flatMap(Object.values)) {
            expect(isBannerNavigation(origin + from, to)).toBe(true);
        }
        for (const to of ['/editor', '/sprite-maker', 'https://example.com/minecraft-banner-maker', 'javascript:alert(1)']) expect(isBannerNavigation(origin + bannerPaths.designer.en, to)).toBe(false);
    });
    it('keeps both tools, step selection, invalid text draft and unsaved state until acknowledged', () => {
        const workspace = defaultBannerWorkspace(), storage = new MemoryStorage(), to = origin + bannerPaths.letters.ja;
        workspace.design = { base: 'lime', layers: [{ pattern: 'border', color: 'blue' }] }; workspace.activeLayer = 1;
        workspace.letters.text = 'A 🧵'; workspace.activeLetter = 2;
        storage.setItem('pixel-art-grid-project', 'other work');
        expect(saveBannerTransfer({ workspace, saved: false }, to, storage, 100)).toBe(true);
        const snapshot = readBannerTransfer(to, storage, 101)!;
        expect(snapshot.workspace).toEqual(workspace); expect(snapshot.saved).toBe(false);
        expect(storage.getItem(BANNER_TRANSFER_KEY)).toBe(snapshot.raw);
        snapshot.workspace.design.base = 'black';
        expect(readBannerTransfer(to, storage, 101)!.workspace.design.base).toBe('lime');
        expect(acknowledgeBannerTransfer(snapshot.raw, storage)).toBe(true);
        expect(storage.getItem(BANNER_TRANSFER_KEY)).toBeNull(); expect(storage.getItem('pixel-art-grid-project')).toBe('other work');
    });
    it('does not erase a record changed after reading', () => {
        const storage = new MemoryStorage(); storage.setItem(BANNER_TRANSFER_KEY, 'newer work');
        expect(acknowledgeBannerTransfer('old work', storage)).toBe(false); expect(storage.getItem(BANNER_TRANSFER_KEY)).toBe('newer work');
    });
    it('rolls back failed or silently ignored writes without changing the live workspace', () => {
        const workspace = defaultBannerWorkspace(), before = structuredClone(workspace), to = origin + bannerPaths.designer.fr;
        const storage = new MemoryStorage(); storage.setItem(BANNER_TRANSFER_KEY, 'previous');
        storage.setItem = () => { throw new Error('write denied'); };
        expect(saveBannerTransfer({ workspace, saved: true }, to, storage)).toBe(false);
        expect(storage.getItem(BANNER_TRANSFER_KEY)).toBe('previous'); expect(workspace).toEqual(before);
        const silent = new MemoryStorage(); silent.setItem = () => {};
        expect(saveBannerTransfer({ workspace, saved: false }, to, silent)).toBe(false); expect(silent.values.size).toBe(0);
    });
    it('rejects malformed, oversized, expired, future and different-destination records', () => {
        const storage = new MemoryStorage(), to = origin + bannerPaths.letters.de, now = 1234;
        expect(readBannerTransfer(to, storage, now)).toBeNull();
        expect(saveBannerTransfer({ workspace: defaultBannerWorkspace(), saved: false }, to, storage, now)).toBe(true);
        const valid = JSON.parse(storage.getItem(BANNER_TRANSFER_KEY)!);
        for (const patch of [{ version: 2 }, { savedAt: now + 1 }, { savedAt: now - 300001 }, { saved: 'yes' }, { destination: '/editor' }, { project: '{}' }, { extra: 1 }]) {
            storage.setItem(BANNER_TRANSFER_KEY, JSON.stringify({ ...valid, ...patch })); expect(() => readBannerTransfer(to, storage, now)).toThrow();
        }
        storage.setItem(BANNER_TRANSFER_KEY, JSON.stringify(valid)); expect(() => readBannerTransfer(origin + bannerPaths.designer.de, storage, now)).toThrow();
        storage.setItem(BANNER_TRANSFER_KEY, 'x'.repeat(BANNER_TRANSFER_MAX_BYTES + 1)); expect(() => readBannerTransfer(to, storage, now)).toThrow();
    });
    it('reports inaccessible or uncleared storage honestly for explicit blank-start', () => {
        expect(discardBannerTransfer(() => { throw new Error('getter denied'); })).toBe(false);
        const storage = new MemoryStorage(); storage.setItem(BANNER_TRANSFER_KEY, 'keep'); storage.removeItem = () => {};
        expect(discardBannerTransfer(() => storage)).toBe(false); expect(storage.getItem(BANNER_TRANSFER_KEY)).toBe('keep');
        const unreadable = new MemoryStorage(); unreadable.getItem = () => { throw new Error('read denied'); };
        expect(discardBannerTransfer(() => unreadable)).toBe(false);
    });
});
