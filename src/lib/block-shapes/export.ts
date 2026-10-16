import { downloadBlob } from '../core/printer/download';
import { encodePng, serializeProject } from '../pixel-grid/core';
import type { SiteLocale } from '../i18n/locales';
import { generateShape, layerGrid } from './core';
import { createBlockShapePdf } from './pdf';
import { serializeShapeProject, validateShapeState, type BlockShapeState, type ShapeDraft } from './project';

export type ShapeExportKind = 'png' | 'pdf' | 'allPdf' | 'layerProject' | 'project';
export async function exportBlockShape(input: BlockShapeState, locale: SiteLocale, kind: ShapeExportKind, signal?: AbortSignal, draft?: ShapeDraft): Promise<void> {
    const state = validateShapeState(input); signal?.throwIfAborted();
    const stem = `block-shape-${state.spec.kind}-${state.spec.width}x${state.spec.depth}x${state.spec.height}`;
    if (kind === 'project') {
        downloadBlob(new Blob([serializeShapeProject(state, draft)], { type: 'application/json' }), `${stem}.block-shape.json`);
    } else if (kind === 'pdf' || kind === 'allPdf') {
        const bytes = await createBlockShapePdf(state, locale, kind === 'allPdf', signal); signal?.throwIfAborted();
        downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `${stem}-${kind === 'allPdf' ? 'all' : `y${state.layer}`}-${state.paper}.pdf`);
    } else if (kind === 'png' || kind === 'layerProject') {
        const grid = layerGrid(generateShape(state.spec), state.layer, state.color);
        if (kind === 'layerProject') downloadBlob(new Blob([serializeProject(grid)], { type: 'application/json' }), `${stem}-y${state.layer}.pixel-grid.json`);
        else { const bytes = await encodePng(grid); signal?.throwIfAborted(); downloadBlob(new Blob([bytes], { type: 'image/png' }), `${stem}-y${state.layer}.png`); }
    } else throw new Error('INVALID_OPTIONS');
}
