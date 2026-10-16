import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SpriteTool, { discardSpriteTransfer, isSpriteLocaleNavigation, readSpriteTransfer, saveSpriteTransfer, spriteSheetMetrics, SPRITE_LOCALE_KEY, strokePoints } from './SpriteTool';
import { spriteCopy } from '../../lib/sprites/copy';
import { spritePaths } from '../../lib/sprites/routes';
import { addFrame, createAnimation, setAnimationFps } from '../../lib/sprites/core';

class MemoryStorage {
    values = new Map<string, string>();
    getItem(key: string) { return this.values.get(key) ?? null; }
    setItem(key: string, value: string) { this.values.set(key, value); }
    removeItem(key: string) { this.values.delete(key); }
}

describe('sprite workspace user contract', () => {
    it.each(['en', 'de', 'fr', 'ja'] as const)('%s starts on a blank keyboard-accessible 16-pixel grid and exposes complete local export choices', locale => {
        const html = renderToStaticMarkup(createElement(SpriteTool, { locale }));
        expect(html.match(/role="gridcell"/g)).toHaveLength(256);
        expect(html).toContain('aria-rowcount="16"');
        expect(html).toContain('aria-colcount="16"');
        expect(html.match(/tabindex="0"/g)).toHaveLength(1);
        expect(html.match(/role="row"/g)).toHaveLength(16);
        expect(html.match(/aria-rowindex="16"/g)).toHaveLength(1);
        expect(html.match(/aria-colindex="16"/g)).toHaveLength(16);
        expect(html).toContain('RGBA 0,0,0,0');
        for (const key of ['save', 'open', 'framePng', 'sheetPng', 'coordinates', 'gif', 'resizeMode', 'onion', 'keyboard'] as const) {
            expect(html).toContain(spriteCopy[locale][key].replaceAll('&', '&amp;'));
        }
        expect(html).not.toContain('<img');
        expect(html).not.toMatch(/\/patterns\//);
        expect(html).not.toContain('localStorage');
    });

    it('limits language transfer to real same-origin sprite routes', () => {
        const from = 'https://fusebeadpatterns.art' + spritePaths.en;
        for (const path of Object.values(spritePaths)) expect(isSpriteLocaleNavigation(from, path)).toBe(true);
        for (const path of ['/pixel-art-grid', '/editor', 'https://example.com' + spritePaths.fr]) expect(isSpriteLocaleNavigation(from, path)).toBe(false);
    });

    it('round-trips all frames, speed, active selection and saved status through its own tab key', () => {
        const storage = new MemoryStorage(), now = 12345, to = 'https://fusebeadpatterns.art' + spritePaths.ja;
        const animation = setAnimationFps(addFrame(createAnimation(3, 2), true), 13);
        animation.frames[1].pixels.set([12, 34, 56, 17]);
        expect(saveSpriteTransfer(animation, false, to, storage, now)).toBe(true);
        const restored = readSpriteTransfer(to, storage, now + 1)!;
        expect(restored.animation).toEqual(animation);
        expect(restored.saved).toBe(false);
        expect([...storage.values.keys()]).toEqual([SPRITE_LOCALE_KEY]);
        expect(() => readSpriteTransfer('https://fusebeadpatterns.art' + spritePaths.de, storage, now + 1)).toThrow();
        expect(() => readSpriteTransfer(to, storage, now + 300001)).toThrow();
    });

    it('reports failed writes/readback without losing current animation or a previous transfer', () => {
        const animation = addFrame(createAnimation(2, 1)), before = structuredClone(animation), storage = new MemoryStorage();
        storage.setItem(SPRITE_LOCALE_KEY, 'previous');
        storage.setItem = () => { throw new Error('Storage unavailable'); };
        expect(saveSpriteTransfer(animation, false, 'https://fusebeadpatterns.art' + spritePaths.de, storage)).toBe(false);
        expect(storage.getItem(SPRITE_LOCALE_KEY)).toBe('previous');
        expect(animation).toEqual(before);
        const silent = new MemoryStorage(); silent.setItem = () => {};
        expect(saveSpriteTransfer(animation, false, 'https://fusebeadpatterns.art' + spritePaths.fr, silent)).toBe(false);
        expect(silent.values.size).toBe(0);
    });

    it('rejects malformed, oversized, future and foreign-destination transfer records', () => {
        const storage = new MemoryStorage(), to = 'https://fusebeadpatterns.art' + spritePaths.fr, now = 54321;
        expect(readSpriteTransfer(to, storage, now)).toBeNull();
        expect(saveSpriteTransfer(createAnimation(), true, to, storage, now)).toBe(true);
        const valid = JSON.parse(storage.getItem(SPRITE_LOCALE_KEY)!);
        for (const patch of [{ version: 2 }, { savedAt: now + 1 }, { saved: 'yes' }, { destination: '/editor' }, { project: '{}' }, { extra: true }]) {
            storage.setItem(SPRITE_LOCALE_KEY, JSON.stringify({ ...valid, ...patch }));
            expect(() => readSpriteTransfer(to, storage, now)).toThrow();
        }
        storage.setItem(SPRITE_LOCALE_KEY, 'x'.repeat(2 * 1024 * 1024 + 1));
        expect(() => readSpriteTransfer(to, storage, now)).toThrow();
    });

    it('reports inaccessible or uncleared transfer storage so explicit blank-start can keep navigation blocked', () => {
        expect(discardSpriteTransfer(() => { throw new Error('sessionStorage getter denied'); })).toBe(false);
        const inaccessible = new MemoryStorage(); inaccessible.getItem = () => { throw new Error('read denied'); };
        expect(discardSpriteTransfer(() => inaccessible)).toBe(false);
        const retained = new MemoryStorage(); retained.setItem(SPRITE_LOCALE_KEY, 'keep'); retained.removeItem = () => {};
        expect(discardSpriteTransfer(() => retained)).toBe(false);
        expect(retained.getItem(SPRITE_LOCALE_KEY)).toBe('keep');
        const available = new MemoryStorage(); available.setItem(SPRITE_LOCALE_KEY, 'old');
        expect(discardSpriteTransfer(() => available)).toBe(true);
        expect(available.getItem(SPRITE_LOCALE_KEY)).toBeNull();
    });

    it('interpolates complete contiguous strokes in both directions, including a single pixel', () => {
        expect(strokePoints([2, 3], [2, 3])).toEqual([[2, 3]]);
        for (const [from, to] of [[[0, 0], [7, 3]], [[7, 3], [0, 0]], [[0, 0], [0, 7]]] as const) {
            const points = strokePoints(from, to);
            expect(points[0]).toEqual(from); expect(points.at(-1)).toEqual(to);
            expect(new Set(points.map(point => point.join(','))).size).toBe(points.length);
            for (let i = 1; i < points.length; i++) expect(Math.max(Math.abs(points[i][0] - points[i - 1][0]), Math.abs(points[i][1] - points[i - 1][1]))).toBe(1);
        }
    });

    it('distinguishes oversized strips from usable grid layouts and clamps a stale columns choice after deleting frames', () => {
        let animation = createAnimation(64, 64);
        for (let i = 1; i < 32; i++) animation = addFrame(animation);
        expect(spriteSheetMetrics(animation, 'horizontal', 1, 8)).toEqual({ width: 16384, height: 512, canExport: false });
        expect(spriteSheetMetrics(animation, 'vertical', 1, 8)).toEqual({ width: 512, height: 16384, canExport: false });
        expect(spriteSheetMetrics(animation, 'grid', 8, 8)).toEqual({ width: 4096, height: 2048, canExport: true });
        expect(spriteSheetMetrics(animation, 'horizontal', 1, 4)).toEqual({ width: 8192, height: 256, canExport: true });
        expect(spriteSheetMetrics(createAnimation(3, 5), 'grid', 8, 1)).toEqual({ width: 3, height: 5, canExport: true });
    });
});
