import { describe, expect, it } from 'vitest';
import { appendLayer } from './core';
import { BannerHistory, defaultBannerWorkspace, parseBannerProject, serializeBannerProject, validateWorkspace } from './project';

describe('independent banner workspace projects', () => {
    it('round-trips design, current loom step, text draft and selected letter', () => {
        const workspace = defaultBannerWorkspace();
        workspace.design = appendLayer(workspace.design, { pattern: 'stripe_left', color: 'blue' });
        workspace.activeLayer = 1; workspace.letters.text = 'Hi 🍒'; workspace.activeLetter = 2;
        expect(parseBannerProject(serializeBannerProject(workspace))).toEqual(workspace);
        expect(serializeBannerProject(workspace)).toContain('"gameVersion":"26.3"');
        const copy = validateWorkspace(workspace); copy.design.layers[0].color = 'black'; expect(workspace.design.layers[0].color).toBe('blue');
    });
    it('keeps unsupported text and equal colors as drafts without silently deleting work', () => {
        const workspace = defaultBannerWorkspace(); workspace.letters.text = 'A/🌱'; workspace.letters.ink = 'white';
        expect(parseBannerProject(serializeBannerProject(workspace)).letters).toEqual(workspace.letters);
    });
    it('enforces 32 Unicode code points and exact own project format', () => {
        const workspace = defaultBannerWorkspace(); workspace.letters.text = '🌱'.repeat(32);
        expect(parseBannerProject(serializeBannerProject(workspace)).letters.text).toBe(workspace.letters.text);
        workspace.letters.text += 'x'; expect(() => serializeBannerProject(workspace)).toThrow();
        for (const raw of ['', '{}', '{', ' '.repeat(32769), JSON.stringify({ format: 'pixel-grid', version: 1 }), JSON.stringify({ format: 'fusebead-banner-project', version: 1, gameVersion: '1.21', workspace: defaultBannerWorkspace() })]) expect(() => parseBannerProject(raw)).toThrow('INVALID_PROJECT');
    });
    it('rejects impossible selections, unknown state and additional format fields', () => {
        for (const patch of [{ activeLayer: 1 }, { activeLayer: -1 }, { activeLetter: 64 }, { activeLetter: -1 }, { activeLetter: 0.5 }, { extra: true }]) expect(() => validateWorkspace({ ...defaultBannerWorkspace(), ...patch })).toThrow();
        const raw = JSON.parse(serializeBannerProject(defaultBannerWorkspace())); raw.other = 1;
        expect(() => parseBannerProject(JSON.stringify(raw))).toThrow();
    });
    it('undoes a whole combined workspace transaction and resets redo after an edit', () => {
        const initial = defaultBannerWorkspace(), history = new BannerHistory(initial), next = history.current();
        next.design = appendLayer(next.design, { pattern: 'border', color: 'red' }); next.activeLayer = 1; next.letters.text = 'SHOP';
        history.commit(next); next.letters.text = 'mutated';
        expect(history.current().letters.text).toBe('SHOP'); expect(history.canUndo()).toBe(true);
        expect(history.undo()).toEqual(initial); expect(history.canRedo()).toBe(true); expect(history.redo().activeLayer).toBe(1);
        history.undo(); const replacement = history.current(); replacement.letters.text = 'NEW'; history.commit(replacement);
        expect(history.canRedo()).toBe(false);
    });
    it('retains at most 30 past transactions and does not store no-op changes', () => {
        const history = new BannerHistory(defaultBannerWorkspace()); history.commit(history.current()); expect(history.canUndo()).toBe(false);
        for (let index = 0; index < 40; index++) { const next = history.current(); next.letters.text = String(index); history.commit(next); }
        let count = 0; while (history.canUndo()) { history.undo(); count++; }
        expect(count).toBe(30); expect(history.current().letters.text).toBe('9');
        const copy = history.current(); copy.letters.text = 'changed'; expect(history.current().letters.text).toBe('9');
    });
});
