import { jsPDF } from 'jspdf';
import _ from 'lodash';

// Huge hack to get the font working in jsPDF, I give up doing it properly TBH
import './MonoFont';

import { Printer } from './../printer';
import { downloadBlob } from '../download';
import { Project } from '../../model/project/project.model';
import type { SiteLocale } from '../../../i18n/locales';
import type { PdfScaleMode } from '../../../editor/pdf-scale';
import { getBoardMaterials, type BoardMaterials } from '../../../editor/board-materials';
import { isPdfPaperSize, PDF_PAPER_DIMENSIONS, type PdfPaperSize } from '../../../editor/pdf-paper';
import { boardPosition, exportMessages, pdfPrintingInstruction, type PrinterOptions } from '../messages';
import { JAPANESE_EXPORT_FONT_NAME, loadJapaneseExportFont, registerJapaneseExportFont } from './japanese-font';
import {
    createPaletteEntryColorMap,
    createPaletteEntryRefMap,
    foreground,
    getPaletteEntryColorKey,
    getPaletteEntryFromRefMap,
} from '../../utils/utils';

/** A board's cell count alone is not evidence of physical bead spacing. */
export function isMidiActualSizeProject(project: Project): boolean {
    const confirmedMidiNames = new Set(['Perler Midi', 'Hama Midi', 'Artkal S Mini', 'Artkal S (5 mm)']);
    const palettes = project.paletteConfiguration.palettes;
    return project.boardConfiguration.board.nbBeadPerRow === 29 &&
        palettes.length > 0 && palettes.every((palette) => confirmedMidiNames.has(palette.name));
}

function labelFont(doc: jsPDF, locale: SiteLocale, size: number): void {
    doc.setFont(locale === 'ja' ? JAPANESE_EXPORT_FONT_NAME : 'helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(0, 0, 0);
}

function boardGlobalRange(locale: SiteLocale, board: BoardMaterials): string {
    const copy = exportMessages(locale);
    return `${copy.pattern} / ${copy.row} ${board.globalRows.from}-${board.globalRows.to} / ${copy.column} ${board.globalColumns.from}-${board.globalColumns.to}`;
}

class Rect {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    scale(ratio_x: number, ratio_y: number = ratio_x): Rect {
        return new Rect(
            this.x + (this.width - this.width * ratio_x) / 2,
            this.y + (this.height - this.height * ratio_y) / 2,
            this.width * ratio_x,
            this.height * ratio_y
        );
    }
}

export class PdfPrinter implements Printer {
    name(): string {
        return 'PDF';
    }

    async print(
        reducedColor: Uint8ClampedArray,
        usage: Map<string, number>,
        project: Project,
        filename: string,
        { locale = 'en', pdfScaleMode = 'fit-page', pdfPaperSize = 'a4', pdfBoard }: PrinterOptions = {}
    ): Promise<void> {
        if (!isPdfPaperSize(pdfPaperSize)) {
            throw new Error(exportMessages(locale).paperUnsupported);
        }
        if (pdfScaleMode !== 'fit-page' && pdfScaleMode !== 'midi-5mm') {
            throw new Error(exportMessages(locale).scaleUnsupported);
        }
        if (pdfScaleMode === 'midi-5mm' && !isMidiActualSizeProject(project)) {
            throw new Error(exportMessages(locale).midiSizeUnsupported);
        }
        // Derive the selected inventory from the same full snapshot as the grid.
        // Never treat the caller's whole-pattern usage as a single-board total.
        const selectedBoard = pdfBoard === undefined ? undefined : getBoardMaterials(
            reducedColor, project.paletteConfiguration.palettes,
            project.boardConfiguration.board.nbBeadPerRow,
            project.boardConfiguration.nbBoardWidth, project.boardConfiguration.nbBoardHeight, pdfBoard
        );
        const { width, height } = PDF_PAPER_DIMENSIONS[pdfPaperSize];
        const margin = 5;

        // Keep the established A4 constructor and coordinates for old callers.
        const doc: jsPDF = pdfPaperSize === 'letter' ? new jsPDF({ format: 'letter' }) : new jsPDF();
        if (locale === 'ja') {
            registerJapaneseExportFont(doc, await loadJapaneseExportFont());
        }
        if (locale !== 'en' || pdfScaleMode === 'midi-5mm' || pdfPaperSize === 'letter' || selectedBoard) {
            const copy = exportMessages(locale);
            // jsPDF supports Japanese as "ja"; "ja-JP" is silently ignored.
            doc.setLanguage(({ en: 'en', de: 'de-DE', fr: 'fr-FR', ja: 'ja' } as const)[locale]);
            doc.setProperties({ title: copy.title, subject: copy.inventory, author: 'Fuse Bead Patterns' });
        }
        doc.setFont('MonoFont');

        if (!selectedBoard) this.boardMapping(doc, project, margin, width, height, locale, pdfScaleMode, pdfPaperSize);
        this.usage(doc, selectedBoard?.usage ?? usage, width, height, margin, project, locale, pdfScaleMode, pdfPaperSize, selectedBoard);
        this.beadMapping(doc, project, reducedColor, width, height, margin, locale, pdfScaleMode, pdfPaperSize, selectedBoard);
        if (
            selectedBoard || (project.boardConfiguration.nbBoardWidth === 1 &&
            project.boardConfiguration.nbBoardHeight === 1)
        ) {
            // A board-position index is only useful when assembling multiple boards.
            doc.deletePage(1);
        }
        const blob = doc.output('blob');
        if (!(blob instanceof Blob)) {
            throw new Error(exportMessages(locale).pdfFailed);
        }
        downloadBlob(blob, `${filename}.pdf`);
    }

    boardMapping(
        doc: jsPDF,
        project: Project,
        margin: number,
        width: number,
        height: number,
        locale: SiteLocale = 'en',
        pdfScaleMode: PdfScaleMode = 'fit-page',
        pdfPaperSize: PdfPaperSize = 'a4'
    ) {
        const boardSize = Math.min(
            (width - margin * 2) / project.boardConfiguration.nbBoardHeight,
            (width - margin * 2) / project.boardConfiguration.nbBoardWidth
        );
        const boardSheetWidthOffset =
            (width - boardSize * project.boardConfiguration.nbBoardWidth) / 2;
        const boardSheetHeightOffset =
            (height - boardSize * project.boardConfiguration.nbBoardHeight) / 2;
        const fontSize = 12;

        const showLabels = locale !== 'en' || pdfScaleMode === 'midi-5mm' || pdfPaperSize === 'letter';
        if (showLabels) {
            const copy = exportMessages(locale);
            labelFont(doc, locale, 14);
            doc.text(`${copy.boards} / ${copy.row} - ${copy.column}`, width / 2, 15, { align: 'center' });
            doc.setFont('MonoFont');
        }
        doc.setFontSize(fontSize);
        for (let y = 0; y < project.boardConfiguration.nbBoardHeight; y++) {
            for (let x = 0; x < project.boardConfiguration.nbBoardWidth; x++) {
                const container = new Rect(
                    x * boardSize + boardSheetWidthOffset,
                    y * boardSize + boardSheetHeightOffset,
                    boardSize,
                    boardSize
                );
                doc.rect(
                    container.x,
                    container.y,
                    container.width,
                    container.height
                );

                const txtContainer = container.scale(0.5);
                const text = showLabels ? `${y + 1} - ${x + 1}` : `${y} - ${x}`;
                doc.setFontSize(this.biggestFontSize(text, txtContainer));
                doc.text(
                    text,
                    txtContainer.x + txtContainer.width / 2,
                    txtContainer.y +
                        txtContainer.height / 2 +
                        this.fontSizeToHeightMm(doc.getFontSize()) / 2,
                    {
                        align: 'center',
                    }
                );
            }
        }
    }

    usage(
        doc: jsPDF,
        usage: Map<string, number>,
        width: number,
        height: number,
        margin: number,
        project: Project,
        locale: SiteLocale = 'en',
        pdfScaleMode: PdfScaleMode = 'fit-page',
        pdfPaperSize: PdfPaperSize = 'a4',
        selectedBoard?: BoardMaterials
    ) {
        const usagePerPage = 30;

        const maxUsage = '' + _.max(Array.from(usage.values()));
        const longestRef = _.maxBy(Array.from(usage.keys()), (s) => s.length) ?? '';
        const paletteEntriesByRef = createPaletteEntryRefMap(
            project.paletteConfiguration.palettes
        );

        const longestWord =
            maxUsage.length > longestRef.length ? maxUsage : longestRef;

        const refWidth = 50;
        const symbolWidth = project.exportConfiguration.useSymbols ? 50 : 0;
        const usageWidth = 50;

        const showLabels = locale !== 'en' || pdfScaleMode === 'midi-5mm' || pdfPaperSize === 'letter' || !!selectedBoard;
        const headerHeight = selectedBoard ? 39 : showLabels ? 22 : 0;
        const heightWithMargins = height - 2 * margin - headerHeight;
        const rowHeight = heightWithMargins / usagePerPage;

        const chunks = _.chunk(
            Array.from(usage.entries()).sort(([, v1], [, v2]) => v2 - v1),
            usagePerPage
        );
        // An empty selected board still has a materials page showing Count 0.
        if (selectedBoard && chunks.length === 0) chunks.push([]);
        chunks.forEach((entries) => {
            doc.addPage();
            const usageSheetWidthOffset =
                (width - refWidth - usageWidth - symbolWidth) / 2;
            const usageSheetHeightOffset = margin + headerHeight;
            if (showLabels) {
                const copy = exportMessages(locale);
                labelFont(doc, locale, 14);
                doc.text(copy.inventory, width / 2, 13, { align: 'center' });
                labelFont(doc, locale, 8);
                if (selectedBoard) {
                    doc.text(boardPosition(locale, selectedBoard.selection.row, selectedBoard.selection.column), width / 2, 20, { align: 'center' });
                    doc.text(boardGlobalRange(locale, selectedBoard), width / 2, 26, { align: 'center' });
                    doc.text(`${copy.count} ${selectedBoard.beadCount}`, width / 2, 32, { align: 'center' });
                }
                const labelY = selectedBoard ? 40 : 23;
                doc.text(copy.reference, usageSheetWidthOffset + refWidth / 2, labelY, { align: 'center' });
                if (symbolWidth) doc.text(copy.symbol, usageSheetWidthOffset + refWidth + symbolWidth / 2, labelY, { align: 'center' });
                doc.text(copy.count, usageSheetWidthOffset + refWidth + symbolWidth + usageWidth / 2, labelY, { align: 'center' });
                doc.setFont('MonoFont');
            }

            // ref column
            Array.from(entries).forEach(([k], idx) => {
                const entry = getPaletteEntryFromRefMap(
                    paletteEntriesByRef,
                    '' + k
                );
                const bg = entry.color;
                const fg = foreground(bg);
                doc.setFillColor(bg.r, bg.g, bg.b);
                doc.setTextColor(fg.r, fg.g, fg.b);

                const container = new Rect(
                    usageSheetWidthOffset,
                    rowHeight * idx + usageSheetHeightOffset,
                    refWidth,
                    rowHeight
                );
                doc.rect(
                    container.x,
                    container.y,
                    container.width,
                    container.height,
                    'FD'
                );

                const txtContainer = container.scale(0.7);
                const text = k;
                doc.setFontSize(
                    this.biggestFontSize(longestWord, txtContainer)
                );
                doc.text(
                    text,
                    txtContainer.x + txtContainer.width / 2,
                    txtContainer.y +
                        txtContainer.height / 2 +
                        this.fontSizeToHeightMm(doc.getFontSize()) / 2,
                    {
                        align: 'center',
                    }
                );
            });

            if (project.exportConfiguration.useSymbols) {
                // symbol column
                Array.from(entries).forEach(([k], idx) => {
                    const entry = getPaletteEntryFromRefMap(
                        paletteEntriesByRef,
                        '' + k
                    );
                    const bg = entry.color;
                    const fg = foreground(bg);
                    doc.setFillColor(bg.r, bg.g, bg.b);
                    doc.setTextColor(fg.r, fg.g, fg.b);

                    const container = new Rect(
                        usageSheetWidthOffset + refWidth,
                        rowHeight * idx + usageSheetHeightOffset,
                        symbolWidth,
                        rowHeight
                    );
                    doc.rect(
                        container.x,
                        container.y,
                        container.width,
                        container.height,
                        'FD'
                    );

                    const txtContainer = container.scale(0.7);
                    const text =
                        (project.paletteConfiguration.palettes.length > 1
                            ? entry.prefix
                            : '') + entry.symbol;
                    doc.setFontSize(
                        this.biggestFontSize(longestWord, txtContainer)
                    );
                    doc.text(
                        text,
                        txtContainer.x + txtContainer.width / 2,
                        txtContainer.y +
                            txtContainer.height / 2 +
                            this.fontSizeToHeightMm(doc.getFontSize()) / 2,
                        {
                            align: 'center',
                        }
                    );
                });
            }

            // usage column
            Array.from(entries).forEach(([k, v], idx) => {
                const entry = getPaletteEntryFromRefMap(
                    paletteEntriesByRef,
                    '' + k
                );
                const bg = entry.color;
                const fg = foreground(bg);
                doc.setFillColor(bg.r, bg.g, bg.b);
                doc.setTextColor(fg.r, fg.g, fg.b);

                const container = new Rect(
                    usageSheetWidthOffset + refWidth + symbolWidth,
                    rowHeight * idx + usageSheetHeightOffset,
                    usageWidth,
                    rowHeight
                );
                doc.rect(
                    container.x,
                    container.y,
                    container.width,
                    container.height,
                    'FD'
                );

                const txtContainer = container.scale(0.7);
                const text = '' + v;
                doc.setFontSize(
                    this.biggestFontSize(longestWord, txtContainer)
                );
                doc.text(
                    text,
                    txtContainer.x + txtContainer.width / 2,
                    txtContainer.y +
                        txtContainer.height / 2 +
                        this.fontSizeToHeightMm(doc.getFontSize()) / 2,
                    {
                        align: 'center',
                    }
                );
            });
        });
    }

    beadMapping(
        doc: jsPDF,
        project: Project,
        reducedColor: Uint8ClampedArray,
        width: number,
        height: number,
        margin: number,
        locale: SiteLocale = 'en',
        pdfScaleMode: PdfScaleMode = 'fit-page',
        pdfPaperSize: PdfPaperSize = 'a4',
        selectedBoard?: BoardMaterials
    ) {
        const actualMidi = pdfScaleMode === 'midi-5mm';
        const beadSize = actualMidi ? 5 :
            (width - margin * 2) / project.boardConfiguration.board.nbBeadPerRow;
        const beadLeft = actualMidi ? (width - 29 * beadSize) / 2 : margin;
        const beadSheetOffset =
            (height -
                beadSize * project.boardConfiguration.board.nbBeadPerRow) /
            2;
        const paletteEntriesByColor = createPaletteEntryColorMap(
            project.paletteConfiguration.palettes
        );
        const beadsPerRow = project.boardConfiguration.board.nbBeadPerRow;
        const patternWidth = beadsPerRow * project.boardConfiguration.nbBoardWidth;

        for (let i = 0; i < project.boardConfiguration.nbBoardHeight; i++) {
            for (let j = 0; j < project.boardConfiguration.nbBoardWidth; j++) {
                if (selectedBoard && (i !== selectedBoard.selection.row || j !== selectedBoard.selection.column)) continue;
                doc.addPage();
                doc.setFontSize(24);
                const showLabels = locale !== 'en' || actualMidi || pdfPaperSize === 'letter' || !!selectedBoard;
                let text = showLabels ? boardPosition(locale, i, j) : `${i} - ${j}`;
                if (showLabels) labelFont(doc, locale, 14);
                const textWidth =
                    (doc.getStringUnitWidth(text) *
                        doc.getFontSize()) /
                    doc.internal.scaleFactor;
                const textOffset =
                    (doc.internal.pageSize.width - textWidth) / 2;
                doc.setTextColor(0, 0, 0);
                doc.text(text, textOffset, margin * 2);
                if (selectedBoard) {
                    labelFont(doc, locale, 8);
                    doc.text(boardGlobalRange(locale, selectedBoard), width / 2, 17, { align: 'center' });
                    doc.text(`${exportMessages(locale).count} ${selectedBoard.beadCount}`, width / 2, 23, { align: 'center' });
                }
                if (showLabels) {
                    const copy = exportMessages(locale);
                    labelFont(doc, locale, 7);
                    // A4 retains its original positions. Letter's shorter page
                    // keeps the whole ruler inside the 5 mm bottom margin.
                    const rulerY = Math.min(274, height - margin - 2);
                    doc.text(copy.caution, 15, rulerY - 22);
                    doc.text(pdfPrintingInstruction(locale, pdfPaperSize), 15, rulerY - 16);
                    doc.text(actualMidi ? copy.pitch : copy.scaled, 15, rulerY - 10);
                    doc.setDrawColor(0, 0, 0);
                    doc.line(15, rulerY, 65, rulerY);
                    doc.line(15, rulerY - 2, 15, rulerY + 2);
                    doc.line(65, rulerY - 2, 65, rulerY + 2);
                    doc.text('50 mm', 70, rulerY + 1);
                    doc.setFont('MonoFont');
                }

                for (
                    let y = 0;
                    y < project.boardConfiguration.board.nbBeadPerRow;
                    y++
                ) {
                    for (
                        let x = 0;
                        x < project.boardConfiguration.board.nbBeadPerRow;
                        x++
                    ) {
                        doc.rect(
                            x * beadSize + beadLeft,
                            y * beadSize + beadSheetOffset,
                            beadSize,
                            beadSize
                        );

                        const colorIndex = selectedBoard ? (y * beadsPerRow + x) * 4 :
                            ((y + i * beadsPerRow) * patternWidth +
                                x +
                                j * beadsPerRow) *
                            4;
                        const source = selectedBoard?.pixels ?? reducedColor;
                        const paletteEntry = paletteEntriesByColor.get(
                            getPaletteEntryColorKey(
                                source[colorIndex],
                                source[colorIndex + 1],
                                source[colorIndex + 2],
                                source[colorIndex + 3]
                            )
                        );
                        if (paletteEntry) {
                            doc.setFillColor(
                                paletteEntry.color.r,
                                paletteEntry.color.g,
                                paletteEntry.color.b
                            );
                            const container = new Rect(
                                x * beadSize + beadLeft,
                                y * beadSize + beadSheetOffset,
                                beadSize,
                                beadSize
                            );
                            doc.rect(
                                container.x,
                                container.y,
                                container.width,
                                container.height,
                                'FD'
                            );

                            const txtContainer = container.scale(0.8);
                            text = paletteEntry.ref;
                            if (project.exportConfiguration.useSymbols) {
                                text =
                                    (project.paletteConfiguration.palettes
                                        .length > 1
                                        ? paletteEntry.prefix
                                        : '') + paletteEntry.symbol;
                            }
                            doc.setFontSize(
                                this.biggestFontSize(text, txtContainer)
                            );
                            const fg = foreground(paletteEntry.color);
                            doc.setTextColor(fg.r, fg.g, fg.b);
                            doc.text(
                                text,
                                txtContainer.x + txtContainer.width / 2,
                                txtContainer.y +
                                    txtContainer.height / 2 +
                                    this.fontSizeToHeightMm(doc.getFontSize()) /
                                        2,
                                {
                                    align: 'center',
                                }
                            );
                        } else {
                            doc.line(
                                x * beadSize + beadLeft,
                                y * beadSize + beadSheetOffset,
                                x * beadSize + beadLeft + beadSize,
                                y * beadSize + beadSheetOffset + beadSize
                            );
                        }
                    }
                }
            }
        }
    }

    // Welcome to realm of magic values, works only for current font
    fontSizeToHeightMm(fontSize: number) {
        return (fontSize * 0.3527777778) / 1.8;
    }
    biggestFontSize(text: string, r: Rect): number {
        const biggestForWidth =
            r.width / ((text.length * 0.60009765625) / (72 / 25.6));
        const expectedHeight = (biggestForWidth * 0.3527777778) / 1.15;

        if (expectedHeight <= r.height) {
            return biggestForWidth;
        }

        return (biggestForWidth * r.height) / expectedHeight;
    }
}
