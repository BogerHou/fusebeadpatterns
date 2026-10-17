import { collectMosaicMaterials, renderMosaicRGBA, validateMosaic, type BrickCatalog, type Mosaic } from './core';
import { encodePng, encodeScaledPng } from '../pixel-grid/core';

/** Chart keys are our legend indices, never a manufacturer's color identifier. */
export function brickLegend(model: Mosaic, catalog: BrickCatalog) {
    const snapshot = validateMosaic(model, catalog);
    return collectMosaicMaterials(snapshot, catalog).usedColors.map((entry, index) => ({ ...entry, key: String(index + 1) }));
}

function csvCell(value: string | number | null) {
    const text = value === null ? '' : String(value);
    // Even a future catalogue name must not become a spreadsheet formula.
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
}

/** One regular rectangular CSV; empty cells and padding never become parts. */
export function brickMaterialsCsv(model: Mosaic, catalog: BrickCatalog): string {
    const snapshot = validateMosaic(model, catalog), materials = collectMosaicMaterials(snapshot, catalog);
    const legend = brickLegend(snapshot, catalog);
    const rows: (string | number | null)[][] = [[
        'scope', 'board_row', 'board_column', 'chart_key', 'design_id', 'element_id',
        'lego_color_id', 'ldraw_color_id', 'color_name', 'approx_srgb', 'quantity', 'rgb_source', 'rgb_license',
    ]];
    const add = (scope: string, row: number | null, column: number | null, quantities: number[]) => {
        legend.forEach(({ color, key }, index) => rows.push([scope, row, column, key, catalog.part.designId,
            color.elementId, color.legoColorId, color.ldrawCode, color.name, color.hex, quantities[index],
            'LDraw.org - Colour Definition Reference https://ldraw.org/parts/colour.html (adapted subset)', 'CC BY 4.0 https://creativecommons.org/licenses/by/4.0/',
        ]));
    };
    add('whole', null, null, legend.map(entry => entry.count));
    materials.boards.forEach(board => add('board', board.row + 1, board.column + 1, board.counts.map(entry => entry.count)));
    return '\ufeff' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export async function brickMosaicPng(model: Mosaic, catalog: BrickCatalog, scale = 1, signal?: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
    if (!Number.isInteger(scale) || scale < 1 || scale > 16) throw new Error('INVALID_SCALE');
    signal?.throwIfAborted();
    const grid = renderMosaicRGBA(validateMosaic(model, catalog), catalog);
    const bytes = scale === 1 ? await encodePng(grid) : await encodeScaledPng(grid, scale);
    signal?.throwIfAborted();
    return bytes;
}
