import { cloneMosaic, validateBrickCatalog, validateMosaic, type BrickCatalog, type Mosaic } from './core';

export const MOSAIC_PROJECT_FORMAT = 'fusebead-brick-mosaic-project';
export const MOSAIC_PROJECT_VERSION = 1;
export const MOSAIC_PROJECT_MAX_BYTES = 1_048_576;
const invalid = (): never => { throw new Error('INVALID_MOSAIC_PROJECT'); };
function budget(raw: string): void {
    if (typeof raw !== 'string' || raw.length > MOSAIC_PROJECT_MAX_BYTES || new TextEncoder().encode(raw).length > MOSAIC_PROJECT_MAX_BYTES) throw new Error('MOSAIC_PROJECT_TOO_LARGE');
}
/** Only this feature's versioned, selected-part model is emitted. No source image or account data. */
export function serializeMosaicProject(model: Mosaic, catalog: BrickCatalog): string {
    const checked = validateBrickCatalog(catalog), mosaic = cloneMosaic(model, checked);
    const raw = JSON.stringify({ format: MOSAIC_PROJECT_FORMAT, version: MOSAIC_PROJECT_VERSION, catalogVersion: checked.version, designId: checked.part.designId, mosaic });
    budget(raw); return raw;
}
/** Parse and validate completely before callers may replace their live workspace. */
export function parseMosaicProject(raw: string, catalog: BrickCatalog): Mosaic {
    budget(raw); const checked = validateBrickCatalog(catalog);
    try {
        const value: unknown = JSON.parse(raw);
        if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
        const row = value as Record<string, unknown>;
        if (Object.keys(row).sort().join(',') !== 'catalogVersion,designId,format,mosaic,version'
            || row.format !== MOSAIC_PROJECT_FORMAT || row.version !== MOSAIC_PROJECT_VERSION
            || row.catalogVersion !== checked.version || row.designId !== checked.part.designId) return invalid();
        return validateMosaic(row.mosaic, checked);
    } catch { return invalid(); }
}
