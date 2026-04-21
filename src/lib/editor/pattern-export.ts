import type { Printer } from '../core/printer/printer';
import type { Project } from '../core/model/project/project.model';

type CoreExportId = 'pdf' | 'svg' | 'png' | 'jpg' | 'xlsx';

type PrinterConstructor = new () => Printer;

export type EditorPrinterLoader = () => Promise<PrinterConstructor>;

export type ExportEditorPatternOptions = {
    exportId: string;
    reducedColor: Uint8ClampedArray;
    beadsUsage: Map<string, number>;
    project: Project;
    fileName: string;
    exportGridPng: () => void;
    printerLoaders?: Partial<Record<CoreExportId, EditorPrinterLoader>>;
};

const DEFAULT_PRINTER_LOADERS: Record<CoreExportId, EditorPrinterLoader> = {
    pdf: async () => {
        const { PdfPrinter } = await import('../core/printer/pdf/pdf.printer');
        return PdfPrinter;
    },
    svg: async () => {
        const { SvgPrinter } = await import('../core/printer/svg/svg.printer');
        return SvgPrinter;
    },
    png: async () => {
        const { PngPrinter } = await import('../core/printer/png/png.printer');
        return PngPrinter;
    },
    jpg: async () => {
        const { JpgPrinter } = await import('../core/printer/jpg/jpg.printer');
        return JpgPrinter;
    },
    xlsx: async () => {
        const { XlsxPrinter } = await import(
            '../core/printer/xlsx/xlsx.printer'
        );
        return XlsxPrinter;
    },
};

function isCoreExportId(exportId: string): exportId is CoreExportId {
    return exportId in DEFAULT_PRINTER_LOADERS;
}

export async function exportEditorPattern({
    exportId,
    reducedColor,
    beadsUsage,
    project,
    fileName,
    exportGridPng,
    printerLoaders = {},
}: ExportEditorPatternOptions): Promise<void> {
    if (exportId === 'grid_png') {
        exportGridPng();
        return;
    }

    if (!isCoreExportId(exportId)) {
        throw new Error(`Unsupported export format: ${exportId}`);
    }

    const loadPrinter =
        printerLoaders[exportId] ?? DEFAULT_PRINTER_LOADERS[exportId];
    const Printer = await loadPrinter();

    new Printer().print(reducedColor, beadsUsage, project, fileName);
}
