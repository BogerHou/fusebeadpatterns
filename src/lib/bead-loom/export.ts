import { jsPDF } from 'jspdf';
import { getCounts, getRowInstructions, rowNumberAt, validateChart, type LoomChart } from './core';
import { loomSymbolInk } from './contrast';
import { LOOM_EXPORT_MESSAGES, type LoomExportLocale } from './export-messages';

export type LoomPaper = 'a4' | 'letter';

const PAPER = {
    a4: { width: 595.28, height: 841.89 },
    letter: { width: 612, height: 792 },
} as const;
const MARGIN = 36;
const INK = '#202d2a';
const RULE = '#8c9892';

export interface LoomPdfTile {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    left: number;
    top: number;
    width: number;
    height: number;
    cellWidth: number;
    cellHeight: number;
    symbolSize: number;
    firstRow: number;
    lastRow: number;
}

export interface LoomLegendItem {
    colorId: string;
    symbol: string;
    hex: string;
    count: number;
    lines: string[];
    y: number;
    height: number;
}

export interface LoomInstructionItem {
    rowNumber: number;
    y: number;
    height: number;
    direction: 'left-to-right' | 'right-to-left';
    headingLines: string[];
    lines: string[];
}

export interface LoomPdfPlan {
    paper: LoomPaper;
    locale: LoomExportLocale;
    width: number;
    height: number;
    titleLines: string[];
    contentTop: number;
    contentBottom: number;
    keyNoticeLines: string[];
    tileNoticeLines: string[];
    instructionNoticeLines: string[];
    tiles: LoomPdfTile[];
    legendPages: LoomLegendItem[][];
    instructionPages: LoomInstructionItem[][];
    pageCount: number;
}

/** A conservative width budget keeps browser font fallback inside PDF/PNG bounds.
 * Unlike transliteration, code-point wrapping preserves every user label character.
 */
export function wrapLoomLabel(text: string, width: number, size: number): string[] {
    const limit = Math.max(1, Math.floor(width / (size * 1.1)));
    const characters = Array.from(text);
    if (!characters.length) return [''];
    const lines: string[] = [];
    for (let start = 0; start < characters.length;) {
        let end = Math.min(characters.length, start + limit);
        if (end < characters.length) {
            for (let index = end - 1; index > start; index--) {
                // Keep spaces in the preceding line so joining lines restores the exact label.
                if (characters[index] === ' ') { end = index + 1; break; }
            }
        }
        lines.push(characters.slice(start, end).join(''));
        start = end;
    }
    return lines;
}

function wrapRuns(runs: { symbol: string; count: number }[], width: number): string[] {
    // Courier has an exact glyph advance of 0.6 em. Never split a color run.
    const maxCharacters = Math.floor(width / (9 * 0.6));
    const lines: string[] = [];
    let line = '';
    for (const run of runs) {
        const token = `${run.count}${run.symbol}`;
        if (line && line.length + token.length + 2 > maxCharacters) {
            lines.push(line);
            line = token;
        } else line += `${line ? '  ' : ''}${token}`;
    }
    if (line) lines.push(line);
    return lines;
}

/** Layout only: safe to test in Node without creating a PDF or using a canvas. */
export function planLoomPdf(chart: LoomChart, paper: LoomPaper, locale: LoomExportLocale = 'en'): LoomPdfPlan {
    validateChart(chart);
    if (!Object.hasOwn(PAPER, paper)) throw new Error('Choose A4 or US Letter paper.');
    const { width, height } = PAPER[paper];
    const messages = LOOM_EXPORT_MESSAGES[locale];
    const contentWidth = width - MARGIN * 2;
    const titleLines = wrapLoomLabel(chart.title || messages.untitled, contentWidth, 15);
    // Reserve the longest section heading before planning any chart cells. English
    // retains its original geometry; longer translated headings get extra space.
    const sectionLines = locale === 'en' ? 1 : Math.max(...[
        messages.overview, messages.keyHeading(999, 999), messages.instructionsHeading(999, 999),
        messages.tileHeading(999, 999, 100, 100, 400, 400),
    ].map(text => wrapLoomLabel(text, contentWidth, 11).length));
    const contentTop = 84 + titleLines.length * 19 + (sectionLines - 1) * 15;
    const contentBottom = height - 61;
    const keyNoticeLines = locale === 'en' ? [messages.keyNotice] : wrapLoomLabel(messages.keyNotice, contentWidth, 9);
    const tileNoticeLines = locale === 'en' ? [messages.tileNotice] : wrapLoomLabel(messages.tileNotice, contentWidth, 8);
    const instructionNoticeLines = locale === 'en' ? [messages.instructionsNotice] : wrapLoomLabel(messages.instructionsNotice, contentWidth, 9);
    const gridLeft = MARGIN + 43;
    const gridTop = contentTop + 40 + (tileNoticeLines.length - 1) * 12;
    // The narrowest side stays at 12 pt, so letters never shrink below 9 pt.
    const cellWidth = 12 * Math.max(1, chart.cellAspect);
    const cellHeight = 12 * Math.max(1, 1 / chart.cellAspect);
    const tileColumns = Math.floor((width - MARGIN - gridLeft) / cellWidth);
    const tileRows = Math.floor((contentBottom - gridTop) / cellHeight);
    const tiles: LoomPdfTile[] = [];
    for (let y0 = 0; y0 < chart.rows; y0 += tileRows) {
        for (let x0 = 0; x0 < chart.columns; x0 += tileColumns) {
            const x1 = Math.min(chart.columns, x0 + tileColumns);
            const y1 = Math.min(chart.rows, y0 + tileRows);
            tiles.push({ x0, x1, y0, y1, left: gridLeft, top: gridTop,
                width: (x1 - x0) * cellWidth, height: (y1 - y0) * cellHeight,
                cellWidth, cellHeight, symbolSize: 9,
                firstRow: rowNumberAt(chart, y0), lastRow: rowNumberAt(chart, y1 - 1) });
        }
    }

    const legendPages: LoomLegendItem[][] = [[]];
    const legendTop = contentTop + 31 + (keyNoticeLines.length - 1) * 13;
    let y = legendTop;
    for (const color of getCounts(chart)) {
        const lines = [
            ...wrapLoomLabel(`${messages.name}: ${color.name}`, contentWidth - 56, 10),
            ...wrapLoomLabel(`${messages.code}: ${color.code}`, contentWidth - 56, 10),
            messages.count(color.hex, color.count),
        ];
        const itemHeight = lines.length * 14 + 14;
        if (y + itemHeight > contentBottom && legendPages.at(-1)!.length) {
            legendPages.push([]);
            y = legendTop;
        }
        legendPages.at(-1)!.push({ colorId: color.id, symbol: color.symbol, hex: color.hex,
            count: color.count, lines, y, height: itemHeight });
        y += itemHeight;
    }

    const instructionPages: LoomInstructionItem[][] = [[]];
    const instructionTop = contentTop + 35 + (instructionNoticeLines.length - 1) * 13;
    y = instructionTop;
    for (const row of getRowInstructions(chart)) {
        const lines = wrapRuns(row.runs, width - MARGIN * 2);
        const heading = messages.rowHeading(row.rowNumber, row.direction, chart.columns);
        const headingLines = locale === 'en' ? [heading] : wrapLoomLabel(heading, contentWidth, 10);
        const itemHeight = 18 + (headingLines.length - 1) * 14 + lines.length * 13 + 13;
        if (y + itemHeight > contentBottom && instructionPages.at(-1)!.length) {
            instructionPages.push([]);
            y = instructionTop;
        }
        instructionPages.at(-1)!.push({ rowNumber: row.rowNumber, direction: row.direction, headingLines, lines, y, height: itemHeight });
        y += itemHeight;
    }
    return { paper, locale, width, height, titleLines, contentTop, contentBottom, keyNoticeLines, tileNoticeLines, instructionNoticeLines, tiles, legendPages, instructionPages,
        pageCount: 1 + legendPages.length + tiles.length + instructionPages.length };
}

function snapshot(chart: LoomChart): LoomChart {
    return validateChart(chart);
}

function setFill(doc: jsPDF, hex: string) {
    // jsPDF rounds numeric RGB channels; strings retain the palette's precision.
    const rgb = [1, 3, 5].map(index => (parseInt(hex.slice(index, index + 2), 16) / 255).toFixed(6));
    const setRgb = doc.setFillColor as unknown as (r: string, g: string, b: string) => jsPDF;
    setRgb.call(doc, rgb[0], rgb[1], rgb[2]);
}

function pdfFont(doc: jsPDF, size: number, color = INK, family = 'helvetica') {
    doc.setFont(family, 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color);
}

function canvasContext(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not create an export canvas.');
    return context;
}

/** Browser fonts preserve arbitrary Unicode labels without shipping a partial font
 * or silently changing user color codes. Unicode labels are rasterized at 3x;
 * chart cells, symbols, row/column numbers and color-run instructions stay vector.
 */
function pdfLabel(doc: jsPDF, lines: string[], x: number, y: number, width: number, size: number, lineHeight: number, color = INK) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * 3);
    canvas.height = Math.ceil(lines.length * lineHeight * 3);
    const ctx = canvasContext(canvas);
    ctx.scale(3, 3);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, lines.length * lineHeight);
    ctx.fillStyle = color; ctx.font = `${size}px Arial, sans-serif`;
    lines.forEach((line, index) => ctx.fillText(line, 0, size + index * lineHeight));
    doc.addImage(canvas, 'PNG', x, y, width, lines.length * lineHeight, undefined, 'FAST');
    canvas.width = 0; canvas.height = 0;
}

/** Keep ASCII text searchable/vector; browser fallback fonts render localized
 * accents and Japanese at their planned, readable size instead of mojibake.
 */
function pdfText(doc: jsPDF, lines: string[], x: number, baseline: number, width: number, size: number, lineHeight: number, color = INK) {
    if (lines.some(line => /[^\x20-\x7e]/.test(line))) {
        pdfLabel(doc, lines, x, baseline - size, width, size, lineHeight, color);
    } else {
        pdfFont(doc, size, color);
        lines.forEach((line, index) => doc.text(line, x, baseline + index * lineHeight));
    }
}

function pdfHeader(doc: jsPDF, plan: LoomPdfPlan, section: string, page: number) {
    const messages = LOOM_EXPORT_MESSAGES[plan.locale];
    const width = plan.width - MARGIN * 2;
    pdfText(doc, [messages.brand], MARGIN, 30, width, 9, 12, '#596761');
    pdfLabel(doc, plan.titleLines, MARGIN, 42, plan.width - MARGIN * 2, 15, 19);
    const sectionLines = plan.locale === 'en' ? [section] : wrapLoomLabel(section, width, 11);
    pdfText(doc, sectionLines, MARGIN, plan.contentTop - 8 - (sectionLines.length - 1) * 15, width, 11, 15);
    doc.setDrawColor(RULE); doc.setLineWidth(0.5);
    doc.line(MARGIN, plan.contentTop, plan.width - MARGIN, plan.contentTop);
    const footerSize = plan.locale === 'en' ? 7 : 8;
    const footerLines = plan.locale === 'en' ? [messages.footer] : wrapLoomLabel(messages.footer, width, footerSize);
    pdfText(doc, footerLines, MARGIN, plan.height - 36 - (footerLines.length - 1) * 10, width, footerSize, 10, '#596761');
    pdfFont(doc, 7, '#596761');
    doc.text('fusebeadpatterns.art', MARGIN, plan.height - 24);
    doc.text(`${page} / ${plan.pageCount}`, plan.width - MARGIN, plan.height - 24, { align: 'right' });
}

function pdfOverview(doc: jsPDF, chart: LoomChart, plan: LoomPdfPlan) {
    const messages = LOOM_EXPORT_MESSAGES[plan.locale];
    pdfHeader(doc, plan, messages.overview, 1);
    let y = plan.contentTop + 22;
    const width = plan.width - MARGIN * 2;
    const block = (text: string, size: number, lineHeight: number, nextGap: number) => {
        const lines = plan.locale === 'en' ? [text] : wrapLoomLabel(text, width, size);
        pdfText(doc, lines, MARGIN, y, width, size, lineHeight);
        y += (lines.length - 1) * lineHeight + nextGap;
    };
    block(messages.overviewSummary(chart), 10, 14, 18);
    block(messages.overviewSettings(chart), 10, 14, 20);
    block(messages.columnsNotice, 8, 11, 14);
    block(messages.backgroundNotice, 8, 11, 20);
    messages.notices.forEach(line => {
        pdfFont(doc, 8);
        const wrapped = plan.locale === 'en' ? doc.splitTextToSize(line, width) as string[] : wrapLoomLabel(line, width, 8);
        pdfText(doc, wrapped, MARGIN, y, width, 8, 11); y += wrapped.length * 11 + 4;
    });
    y += 15;
    const captionLines = plan.locale === 'en' ? [messages.previewCaption] : wrapLoomLabel(messages.previewCaption, width, 8);
    const maxHeight = plan.contentBottom - y - 27 - (captionLines.length - 1) * 11;
    const unit = Math.min((plan.width - MARGIN * 2) / (chart.columns * chart.cellAspect), maxHeight / chart.rows);
    const cellWidth = unit * chart.cellAspect;
    const gridWidth = cellWidth * chart.columns;
    const left = (plan.width - gridWidth) / 2;
    const byId = new Map(chart.palette.map(color => [color.id, color]));
    for (let row = 0; row < chart.rows; row++) {
        for (let column = 0; column < chart.columns; column++) {
            setFill(doc, byId.get(chart.cells[row * chart.columns + column])!.hex);
            doc.rect(left + column * cellWidth, y + row * unit, cellWidth, unit, 'F');
        }
    }
    doc.setDrawColor(RULE); doc.rect(left, y, gridWidth, chart.rows * unit);
    pdfText(doc, captionLines, MARGIN, y + chart.rows * unit + 19, width, 8, 11);
}

function pdfTile(doc: jsPDF, chart: LoomChart, tile: LoomPdfTile, locale: LoomExportLocale) {
    const byId = new Map(chart.palette.map(color => [color.id, color]));
    const instructions = new Map(getRowInstructions(chart).map(row => [row.y, row]));
    for (let y = tile.y0; y < tile.y1; y++) {
        for (let x = tile.x0; x < tile.x1; x++) {
            const color = byId.get(chart.cells[y * chart.columns + x])!;
            const left = tile.left + (x - tile.x0) * tile.cellWidth;
            const top = tile.top + (y - tile.y0) * tile.cellHeight;
            setFill(doc, color.hex); doc.rect(left, top, tile.cellWidth, tile.cellHeight, 'F');
            pdfFont(doc, tile.symbolSize, loomSymbolInk(color.hex));
            doc.text(color.symbol, left + tile.cellWidth / 2, top + tile.cellHeight / 2 + tile.symbolSize * 0.33, { align: 'center' });
        }
    }
    doc.setDrawColor(RULE); doc.setLineWidth(0.3);
    for (let x = 0; x <= tile.x1 - tile.x0; x++) doc.line(tile.left + x * tile.cellWidth, tile.top, tile.left + x * tile.cellWidth, tile.top + tile.height);
    for (let y = 0; y <= tile.y1 - tile.y0; y++) doc.line(tile.left, tile.top + y * tile.cellHeight, tile.left + tile.width, tile.top + y * tile.cellHeight);
    pdfFont(doc, 8);
    pdfText(doc, [LOOM_EXPORT_MESSAGES[locale].row], MARGIN, tile.top - 9, tile.left - MARGIN - 7, 8, 11);
    for (let x = tile.x0; x < tile.x1; x++) doc.text(String(x + 1), tile.left + (x - tile.x0 + 0.5) * tile.cellWidth, tile.top - 9, { align: 'center' });
    for (let y = tile.y0; y < tile.y1; y++) {
        const row = instructions.get(y)!;
        doc.text(`${row.rowNumber} ${row.direction === 'left-to-right' ? '>' : '<'}`, tile.left - 7,
            tile.top + (y - tile.y0 + 0.5) * tile.cellHeight + 2.6, { align: 'right' });
    }
}

export async function exportLoomPdf(input: LoomChart, paper: LoomPaper, locale: LoomExportLocale = 'en'): Promise<Uint8Array<ArrayBuffer>> {
    const chart = snapshot(input);
    const plan = planLoomPdf(chart, paper, locale);
    const messages = LOOM_EXPORT_MESSAGES[locale];
    const width = plan.width - MARGIN * 2;
    await document.fonts.ready;
    const doc = new jsPDF({ unit: 'pt', format: paper, compress: true });
    doc.setProperties({ title: chart.title || messages.metadataTitle, author: 'Fuse Bead Patterns', subject: messages.metadataSubject });
    pdfOverview(doc, chart, plan);
    let page = 1;
    for (const [index, items] of plan.legendPages.entries()) {
        doc.addPage(); pdfHeader(doc, plan, messages.keyHeading(index + 1, plan.legendPages.length), ++page);
        pdfText(doc, plan.keyNoticeLines, MARGIN, plan.contentTop + 19, width, 9, 13);
        for (const item of items) {
            setFill(doc, item.hex); doc.setDrawColor(RULE); doc.rect(MARGIN, item.y, 32, 26, 'FD');
            pdfFont(doc, 15, loomSymbolInk(item.hex)); doc.text(item.symbol, MARGIN + 16, item.y + 18, { align: 'center' });
            pdfLabel(doc, item.lines, MARGIN + 48, item.y, plan.width - MARGIN * 2 - 56, 10, 14);
        }
    }
    for (const [index, tile] of plan.tiles.entries()) {
        doc.addPage();
        pdfHeader(doc, plan, messages.tileHeading(index + 1, plan.tiles.length, tile.x0 + 1, tile.x1, tile.firstRow, tile.lastRow), ++page);
        pdfText(doc, plan.tileNoticeLines, MARGIN, plan.contentTop + 13, width, 8, 12);
        pdfTile(doc, chart, tile, locale);
    }
    for (const [index, items] of plan.instructionPages.entries()) {
        doc.addPage(); pdfHeader(doc, plan, messages.instructionsHeading(index + 1, plan.instructionPages.length), ++page);
        pdfText(doc, plan.instructionNoticeLines, MARGIN, plan.contentTop + 19, width, 9, 13);
        for (const item of items) {
            pdfText(doc, item.headingLines, MARGIN, item.y + 10, width, 10, 14);
            pdfFont(doc, 9, INK, 'courier');
            item.lines.forEach((line, lineIndex) => doc.text(line, MARGIN, item.y + 27 + (item.headingLines.length - 1) * 14 + lineIndex * 13));
        }
    }
    const result = doc.output('arraybuffer');
    if (!(result instanceof ArrayBuffer) || !result.byteLength) throw new Error('PDF export failed. Please try again.');
    return new Uint8Array(result);
}

export async function exportLoomPng(input: LoomChart, locale: LoomExportLocale = 'en'): Promise<Blob> {
    const chart = snapshot(input);
    const messages = LOOM_EXPORT_MESSAGES[locale];
    await document.fonts.ready;
    const cellWidth = 16 * Math.max(1, chart.cellAspect);
    const cellHeight = 16 * Math.max(1, 1 / chart.cellAspect);
    const left = 73, margin = 28;
    const width = Math.max(780, left + chart.columns * cellWidth + margin);
    const contentWidth = width - margin * 2;
    const titleLines = wrapLoomLabel(chart.title || messages.untitled, contentWidth, 24);
    const summaryLines = locale === 'en' ? [messages.pngSummary(chart)] : wrapLoomLabel(messages.pngSummary(chart), contentWidth, 14);
    const directionLines = locale === 'en' ? [messages.pngDirections(chart)] : wrapLoomLabel(messages.pngDirections(chart), contentWidth, 13);
    const notices = messages.notices.flatMap(line => wrapLoomLabel(line, contentWidth, 13));
    const keyLines = locale === 'en' ? [messages.pngKey] : wrapLoomLabel(messages.pngKey, contentWidth, 18);
    const gridTop = 118 + titleLines.length * 29 + notices.length * 17 + (summaryLines.length - 1) * 21 + (directionLines.length - 1) * 17;
    const legendTop = gridTop + chart.rows * cellHeight + 62 + (keyLines.length - 1) * 22;
    const legend = getCounts(chart).map(color => ({ ...color, lines: [
        ...wrapLoomLabel(`${messages.name}: ${color.name}`, contentWidth - 56, 14),
        ...wrapLoomLabel(`${messages.code}: ${color.code}`, contentWidth - 56, 14),
        messages.count(color.hex, color.count),
    ] }));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = legendTop + legend.reduce((sum, color) => sum + color.lines.length * 19 + 17, 0) + 30;
    const ctx = canvasContext(canvas);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = INK; ctx.font = '12px Arial, sans-serif';
    ctx.fillText(messages.brand, margin, 25);
    ctx.font = '24px Arial, sans-serif'; titleLines.forEach((line, index) => ctx.fillText(line, margin, 60 + index * 29));
    let textY = 68 + titleLines.length * 29;
    ctx.font = '14px Arial, sans-serif';
    summaryLines.forEach((line, index) => ctx.fillText(line, margin, textY + index * 21));
    textY += summaryLines.length * 21;
    ctx.font = '13px Arial, sans-serif';
    directionLines.forEach((line, index) => ctx.fillText(line, margin, textY + index * 17));
    textY += (directionLines.length - 1) * 17;
    for (const line of notices) { textY += 17; ctx.fillText(line, margin, textY); }
    const byId = new Map(chart.palette.map(color => [color.id, color]));
    const instructions = new Map(getRowInstructions(chart).map(row => [row.y, row]));
    ctx.font = '11px Arial, sans-serif'; ctx.textAlign = 'center';
    for (let y = 0; y < chart.rows; y++) {
        for (let x = 0; x < chart.columns; x++) {
            const color = byId.get(chart.cells[y * chart.columns + x])!;
            ctx.fillStyle = color.hex; ctx.fillRect(left + x * cellWidth, gridTop + y * cellHeight, cellWidth, cellHeight);
            ctx.fillStyle = loomSymbolInk(color.hex); ctx.fillText(color.symbol, left + (x + 0.5) * cellWidth, gridTop + (y + 0.5) * cellHeight + 4);
        }
    }
    ctx.strokeStyle = RULE; ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let x = 0; x <= chart.columns; x++) { ctx.moveTo(left + x * cellWidth, gridTop); ctx.lineTo(left + x * cellWidth, gridTop + chart.rows * cellHeight); }
    for (let y = 0; y <= chart.rows; y++) { ctx.moveTo(left, gridTop + y * cellHeight); ctx.lineTo(left + chart.columns * cellWidth, gridTop + y * cellHeight); }
    ctx.stroke(); ctx.fillStyle = INK; ctx.font = '10px Arial, sans-serif';
    if (locale !== 'en') { ctx.textAlign = 'left'; ctx.fillText(messages.row, margin, gridTop - 10); ctx.textAlign = 'center'; }
    for (let x = 0; x < chart.columns; x++) ctx.fillText(String(x + 1), left + (x + 0.5) * cellWidth, gridTop - 10);
    ctx.textAlign = 'right';
    for (let y = 0; y < chart.rows; y++) {
        const row = instructions.get(y)!;
        ctx.fillText(`${row.rowNumber} ${row.direction === 'left-to-right' ? '>' : '<'}`, left - 9, gridTop + (y + 0.5) * cellHeight + 3.5);
    }
    ctx.textAlign = 'left'; ctx.font = '18px Arial, sans-serif';
    keyLines.forEach((line, index) => ctx.fillText(line, margin, legendTop - 23 - (keyLines.length - 1 - index) * 22));
    let y = legendTop;
    for (const color of legend) {
        ctx.fillStyle = color.hex; ctx.fillRect(margin, y, 32, 28);
        ctx.strokeStyle = RULE; ctx.strokeRect(margin, y, 32, 28);
        ctx.fillStyle = loomSymbolInk(color.hex); ctx.font = '18px Arial, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(color.symbol, margin + 16, y + 21);
        ctx.fillStyle = INK; ctx.font = '14px Arial, sans-serif'; ctx.textAlign = 'left';
        color.lines.forEach((line, index) => ctx.fillText(line, margin + 48, y + 14 + index * 19));
        y += color.lines.length * 19 + 17;
    }
    try {
        return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed.')), 'image/png'));
    } finally {
        canvas.width = 0; canvas.height = 0;
    }
}
