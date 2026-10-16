import { DEFAULT_SPEC, canonicalSpec, validateSpec, type ShapeKind, type ShapeSpec, type ShapeStyle } from './core';

export const BLOCK_SHAPE_PROJECT_MAX_BYTES = 32_768;
export const BLOCK_SHAPE_ALGORITHM = 'cell-centre-axis-v1';
export type BlockShapeState = {
    spec: ShapeSpec;
    color: string;
    paper: 'a4' | 'letter';
    layer: number;
    grid: boolean;
    center: boolean;
    ghost: boolean;
    rowCounts: boolean;
    stackSize: 16 | 64;
    completedLayers: number[];
};
export type ShapeDraft = { kind: ShapeKind; width: string; depth: string; height: string; style: ShapeStyle; thickness: string };

export function plainRecord(value: unknown): value is Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return (prototype === Object.prototype || prototype === null)
        && Object.values(Object.getOwnPropertyDescriptors(value)).every(item => 'value' in item && item.enumerable);
}
export function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
    return Reflect.ownKeys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

export function validateShapeState(value: unknown): BlockShapeState {
    if (!plainRecord(value) || !exactKeys(value, ['spec', 'color', 'paper', 'layer', 'grid', 'center', 'ghost', 'rowCounts', 'stackSize', 'completedLayers'])) throw new Error('INVALID_PROJECT');
    const spec = validateSpec(value.spec);
    if (typeof value.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(value.color)
        || !['a4', 'letter'].includes(value.paper as string)
        || !Number.isInteger(value.layer) || (value.layer as number) < 0 || (value.layer as number) >= spec.height
        || !['grid', 'center', 'ghost', 'rowCounts'].every(key => typeof value[key] === 'boolean')
        || (value.stackSize !== 16 && value.stackSize !== 64)
        || !Array.isArray(value.completedLayers) || value.completedLayers.length > spec.height) throw new Error('INVALID_PROJECT');
    const completedLayers: number[] = [];
    for (const layer of value.completedLayers) {
        if (!Number.isInteger(layer) || layer < 0 || layer >= spec.height || completedLayers.includes(layer)) throw new Error('INVALID_PROJECT');
        completedLayers.push(layer);
    }
    return { spec, color: value.color.toUpperCase(), paper: value.paper as BlockShapeState['paper'], layer: value.layer as number,
        grid: value.grid as boolean, center: value.center as boolean, ghost: value.ghost as boolean, rowCounts: value.rowCounts as boolean,
        stackSize: value.stackSize, completedLayers: completedLayers.sort((a, b) => a - b) };
}

export function defaultShapeState(): BlockShapeState {
    return validateShapeState({ spec: { ...DEFAULT_SPEC }, color: '#487A60', paper: 'a4', layer: 0,
        grid: true, center: true, ghost: false, rowCounts: true, stackSize: 64, completedLayers: [] });
}
export function shapeDraft(spec: ShapeSpec): ShapeDraft {
    return { kind: spec.kind, width: String(spec.width), depth: String(spec.depth), height: String(spec.height), style: spec.style, thickness: String(spec.thickness) };
}
export function validateShapeDraft(value: unknown): ShapeDraft {
    if (!plainRecord(value) || !exactKeys(value, ['kind', 'width', 'depth', 'height', 'style', 'thickness'])
        || !['ellipse', 'sphere', 'dome', 'cylinder', 'cone'].includes(value.kind as string)
        || !['filled', 'hollow'].includes(value.style as string)
        || !['width', 'depth', 'height', 'thickness'].every(key => typeof value[key] === 'string' && value[key].length <= 12)) throw new Error('INVALID_PROJECT');
    return { kind: value.kind as ShapeKind, width: value.width as string, depth: value.depth as string,
        height: value.height as string, style: value.style as ShapeStyle, thickness: value.thickness as string };
}
export function specFromDraft(draft: ShapeDraft): ShapeSpec {
    const checked = validateShapeDraft(draft);
    if (![checked.width, checked.depth, checked.height, checked.thickness].every(value => /^\d+$/.test(value))) throw new Error('INVALID_SPEC');
    return canonicalSpec(checked.kind, Number(checked.width), Number(checked.depth), Number(checked.height), checked.style, Number(checked.thickness));
}
export function draftMatchesSpec(draft: ShapeDraft, spec: ShapeSpec): boolean {
    try { const a = specFromDraft(draft), b = validateSpec(spec); return (Object.keys(a) as Array<keyof ShapeSpec>).every(key => a[key] === b[key]); } catch { return false; }
}
export type ShapeProject = { state: BlockShapeState; draft: ShapeDraft };
export function serializeShapeProject(state: BlockShapeState, draft: ShapeDraft = shapeDraft(state.spec)): string {
    const raw = JSON.stringify({ format: 'block-shape-project', version: 1, algorithm: BLOCK_SHAPE_ALGORITHM, state: validateShapeState(state), draft: validateShapeDraft(draft) });
    if (new TextEncoder().encode(raw).length > BLOCK_SHAPE_PROJECT_MAX_BYTES) throw new Error('INVALID_PROJECT');
    return raw;
}
export function parseShapeProject(raw: string): ShapeProject {
    if (typeof raw !== 'string' || raw.length > BLOCK_SHAPE_PROJECT_MAX_BYTES || new TextEncoder().encode(raw).length > BLOCK_SHAPE_PROJECT_MAX_BYTES) throw new Error('INVALID_PROJECT');
    const parsed: unknown = JSON.parse(raw);
    if (!plainRecord(parsed) || !exactKeys(parsed, ['format', 'version', 'algorithm', 'state', 'draft'])
        || parsed.format !== 'block-shape-project' || parsed.version !== 1 || parsed.algorithm !== BLOCK_SHAPE_ALGORITHM) throw new Error('INVALID_PROJECT');
    return { state: validateShapeState(parsed.state), draft: validateShapeDraft(parsed.draft) };
}
