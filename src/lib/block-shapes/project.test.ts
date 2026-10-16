import { describe, expect, it } from 'vitest';
import { generateShape } from './core';
import { BLOCK_SHAPE_PROJECT_MAX_BYTES, defaultShapeState, draftMatchesSpec, parseShapeProject, serializeShapeProject, shapeDraft, specFromDraft, validateShapeState } from './project';

describe('versioned complete manual shape projects', () => {
    it('roundtrips all five geometry families, view settings, progress and unfinished input without changing voxel output', () => {
        for (const kind of ['ellipse', 'sphere', 'dome', 'cylinder', 'cone'] as const) {
            const spec = { kind, width: 5, depth: kind === 'ellipse' ? 8 : 5, height: kind === 'ellipse' ? 1 : kind === 'sphere' ? 5 : 3, style: 'hollow' as const, thickness: 2 };
            const state = validateShapeState({ ...defaultShapeState(), spec, layer: spec.height - 1, color: '#12abEF', paper: 'letter', grid: false, center: false, ghost: true, rowCounts: false, stackSize: 16, completedLayers: [0] });
            const draft = { ...shapeDraft(spec), width: '', height: '1e' };
            const restored = parseShapeProject(serializeShapeProject(state, draft));
            expect(restored).toEqual({ state, draft });
            expect(generateShape(restored.state.spec).mask).toEqual(generateShape(state.spec).mask);
            restored.state.completedLayers.push(spec.height - 1); restored.state.spec.width = 1; restored.draft.depth = '42';
            expect(state.spec.width).toBe(5); expect(state.completedLayers).toEqual([0]); expect(draft.depth).toBe(String(spec.depth));
        }
    });
    it('keeps original pixel projects separate and rejects future algorithms, malformed or over-budget native files', () => {
        const raw = serializeShapeProject(defaultShapeState()), value = JSON.parse(raw);
        const patches: Record<string, unknown>[] = [{ format: 'pixel-grid-project' }, { version: 2 }, { algorithm: 'unknown' }, { extra: true }, { draft: undefined }, { state: { ...value.state, layer: 1 } }];
        for (const patch of patches) {
            expect(() => parseShapeProject(JSON.stringify({ ...value, ...patch }))).toThrow();
        }
        expect(() => parseShapeProject(' '.repeat(BLOCK_SHAPE_PROJECT_MAX_BYTES + 1))).toThrow();
        expect(() => parseShapeProject('"' + '語'.repeat(12_000) + '"')).toThrow();
        expect(() => parseShapeProject('{broken')).toThrow();
        expect(parseShapeProject(raw).draft).toEqual(shapeDraft(defaultShapeState().spec));
    });
    it('rejects invalid progress, wrong types, accessors and unknown own properties without mutating current state', () => {
        const state = defaultShapeState(), before = JSON.stringify(state);
        for (const patch of [{ completedLayers: [0, 0] }, { completedLayers: [1] }, { completedLayers: [-1] }, { completedLayers: [0.5] }, { color: '#fff' }, { paper: 'legal' }, { ghost: 1 }, { stackSize: 32 }, { extra: 1 }]) {
            expect(() => validateShapeState({ ...state, ...patch })).toThrow();
        }
        let calls = 0;
        expect(() => validateShapeState({ ...state, get color() { calls++; return '#123456'; } })).toThrow();
        expect(calls).toBe(0);
        expect(() => validateShapeState({ ...state, [Symbol('hidden')]: 1 })).toThrow();
        expect(JSON.stringify(state)).toBe(before);
    });
    it('normalizes only through explicit draft application and never accepts blank or fractional dimensions', () => {
        const state = defaultShapeState(), draft = shapeDraft(state.spec);
        expect(draftMatchesSpec(draft, state.spec)).toBe(true);
        const changed = { ...draft, kind: 'sphere' as const, width: '8' };
        expect(specFromDraft(changed)).toMatchObject({ kind: 'sphere', width: 8, depth: 8, height: 8 });
        expect(draftMatchesSpec(changed, state.spec)).toBe(false);
        for (const width of ['', '1.5', '-1', 'NaN', '129', '1e2']) expect(() => specFromDraft({ ...draft, width })).toThrow();
        expect(() => serializeShapeProject(state, { ...draft, width: '1'.repeat(13) })).toThrow();
    });
});
