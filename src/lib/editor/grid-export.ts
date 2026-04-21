export type GridExportDrawingContext = {
    fillStyle: string | CanvasGradient | CanvasPattern;
    strokeStyle: string | CanvasGradient | CanvasPattern;
    lineWidth: number;
    fillRect(x: number, y: number, width: number, height: number): void;
    beginPath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    stroke(): void;
};

export type DrawGridExportPatternOptions = {
    cellSize: number;
    beadsPerBoard: number;
};

export function drawGridExportPattern(
    exportContext: GridExportDrawingContext,
    sourceData: Uint8ClampedArray,
    sourceWidth: number,
    sourceHeight: number,
    { cellSize, beadsPerBoard }: DrawGridExportPatternOptions
): void {
    const safeCellSize = Math.max(1, Math.floor(cellSize));
    const safeBeadsPerBoard = Math.max(1, Math.floor(beadsPerBoard));
    const exportWidth = sourceWidth * safeCellSize;
    const exportHeight = sourceHeight * safeCellSize;

    for (let y = 0; y < sourceHeight; y++) {
        for (let x = 0; x < sourceWidth; x++) {
            const index = (y * sourceWidth + x) * 4;
            const alpha = sourceData[index + 3];

            if (alpha === 0) {
                continue;
            }

            exportContext.fillStyle = `rgba(${sourceData[index]}, ${sourceData[index + 1]}, ${sourceData[index + 2]}, ${alpha / 255})`;
            exportContext.fillRect(
                x * safeCellSize,
                y * safeCellSize,
                safeCellSize,
                safeCellSize
            );
        }
    }

    exportContext.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    exportContext.lineWidth = 1;

    for (let x = 0; x <= sourceWidth; x++) {
        exportContext.beginPath();
        exportContext.moveTo(x * safeCellSize, 0);
        exportContext.lineTo(x * safeCellSize, exportHeight);
        exportContext.stroke();
    }

    for (let y = 0; y <= sourceHeight; y++) {
        exportContext.beginPath();
        exportContext.moveTo(0, y * safeCellSize);
        exportContext.lineTo(exportWidth, y * safeCellSize);
        exportContext.stroke();
    }

    exportContext.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    exportContext.lineWidth = 3;

    for (let x = 0; x <= sourceWidth; x += safeBeadsPerBoard) {
        exportContext.beginPath();
        exportContext.moveTo(x * safeCellSize, 0);
        exportContext.lineTo(x * safeCellSize, exportHeight);
        exportContext.stroke();
    }

    for (let y = 0; y <= sourceHeight; y += safeBeadsPerBoard) {
        exportContext.beginPath();
        exportContext.moveTo(0, y * safeCellSize);
        exportContext.lineTo(exportWidth, y * safeCellSize);
        exportContext.stroke();
    }
}
