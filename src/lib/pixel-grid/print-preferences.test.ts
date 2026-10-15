import { describe, expect, it, vi } from 'vitest';
import { createPixelGridPrintPreferenceStore, DEFAULT_PIXEL_GRID_PRINT_PREFERENCES as defaults, PIXEL_GRID_PRINT_PREFERENCES_KEY as key } from './print-preferences';

function storage() {
    const values = new Map<string, string>();
    return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

describe('pixel grid print preferences', () => {
    it('hydrates from stable server defaults and retains only three enums across fresh page stores', () => {
        const area = storage(), first = createPixelGridPrintPreferenceStore(() => area);
        expect(first.getServerSnapshot()).toBe(defaults);
        expect(first.getSnapshot()).toBe(defaults);
        expect(first.setPreferences({ paper: 'letter', mode: 'tiled', content: 'blank' })).toBe(true);
        const selected = first.getSnapshot();
        expect(Object.isFrozen(selected)).toBe(true);
        for (let i = 0; i < 10; i++) expect(first.getSnapshot()).toBe(selected);
        const translatedPage = createPixelGridPrintPreferenceStore(() => area);
        expect(translatedPage.getServerSnapshot()).toBe(defaults);
        expect(translatedPage.getSnapshot()).toEqual(selected);
        expect([...area.values]).toEqual([[key, '{"paper":"letter","mode":"tiled","content":"blank"}']]);
        area.values.set(key, '{"mode":"tiled","content":"blank","paper":"letter"}');
        expect(first.getSnapshot()).toBe(selected);
    });

    it.each([null, '', 'null', '[]', '1', 'true', '{', '{"paper":"a4","mode":"overview"}',
        '{"paper":"A4","mode":"overview","content":"artwork"}',
        '{"paper":"a4","mode":"overview","content":"artwork","image":"private"}',
        '{"paper":"a4","mode":"overview","content":"artwork","__proto__":{}}',
        ' '.repeat(129),
    ])('falls back without touching current projects for missing or invalid storage %s', raw => {
        const area = storage();
        if (raw !== null) area.values.set(key, raw);
        const store = createPixelGridPrintPreferenceStore(() => area);
        expect(store.getSnapshot()).toBe(defaults);
        expect(store.getSnapshot()).toBe(defaults);
        expect(area.values.size).toBe(raw === null ? 0 : 1);
    });

    it('rejects inherited fields, getters, symbols, wrong values and extra content without invoking getters or writing', () => {
        const area = storage(), write = vi.spyOn(area, 'setItem');
        const store = createPixelGridPrintPreferenceStore(() => area);
        const getter = vi.fn(() => 'a4');
        for (const invalid of [
            Object.create({ paper: 'a4', mode: 'overview', content: 'artwork' }),
            { get paper() { return getter(); }, mode: 'overview', content: 'artwork' },
            { paper: 'a4', mode: 'overview', content: 'artwork', [Symbol('image')]: 'private' },
            { paper: 'a4', mode: 'poster', content: 'artwork' },
            { paper: 'a4', mode: 'overview', content: 'artwork', fileName: 'private' },
            new Proxy({}, { ownKeys() { throw new Error('Hostile input'); } }),
        ]) expect(store.setPreferences(invalid)).toBe(false);
        expect(getter).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled();
        expect(store.getSnapshot()).toBe(defaults);
    });

    it('handles blocked getters and quota failures while preserving usable controls in the current page', () => {
        const blocked = createPixelGridPrintPreferenceStore(() => { throw new Error('Blocked'); });
        expect(blocked.getSnapshot()).toBe(defaults);
        expect(blocked.setPreferences({ paper: 'letter', mode: 'overview', content: 'blank' })).toBe(true);
        expect(blocked.getSnapshot()).toEqual({ paper: 'letter', mode: 'overview', content: 'blank' });
        const quota = createPixelGridPrintPreferenceStore(() => ({ getItem: () => null, setItem: () => { throw new Error('Quota'); } }));
        expect(quota.setPreferences({ paper: 'a4', mode: 'tiled', content: 'artwork' })).toBe(true);
        expect(quota.getSnapshot().mode).toBe('tiled');
        expect(createPixelGridPrintPreferenceStore(() => null).getSnapshot()).toBe(defaults);
    });

    it('notifies only on changed values and follows same-session external updates', () => {
        const area = storage(), store = createPixelGridPrintPreferenceStore(() => area), listener = vi.fn();
        const unsubscribe = store.subscribe(listener);
        store.getSnapshot(); store.setPreferences(defaults); expect(listener).not.toHaveBeenCalled();
        area.values.set(key, '{"paper":"letter","mode":"tiled","content":"blank"}');
        store.refresh(); expect(listener).toHaveBeenCalledOnce();
        expect(store.getSnapshot()).toEqual({ paper: 'letter', mode: 'tiled', content: 'blank' });
        store.refresh(); expect(listener).toHaveBeenCalledOnce();
        unsubscribe(); store.setPreferences(defaults); expect(listener).toHaveBeenCalledOnce();
    });
});
