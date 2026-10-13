export type PdfPaperSize = 'a4' | 'letter';

/** Paper dimensions are millimetres; bead spacing is a separate setting. */
export const PDF_PAPER_DIMENSIONS = {
    a4: { width: 210, height: 297 },
    letter: { width: 215.9, height: 279.4 },
} as const;

export function isPdfPaperSize(value: unknown): value is PdfPaperSize {
    return value === 'a4' || value === 'letter';
}

/** Existing version 1 files omit paper size and retain their A4 output. */
export function resolvePdfPaperSize(saved: PdfPaperSize | undefined): PdfPaperSize {
    return saved ?? 'a4';
}
