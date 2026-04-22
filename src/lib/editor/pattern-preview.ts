const PREVIEW_RENDER_MAX_DIMENSION = 1600;
const PREVIEW_RENDER_MIN_BEAD_SIZE = 6;
const PREVIEW_RENDER_MAX_BEAD_SIZE = 18;
const PREVIEW_RENDER_BACKGROUND = 'rgb(229, 229, 229)';

export type PreviewRulerTick = {
    value: number;
    ratio: number;
    showLabel: boolean;
};

export type PreviewPoint = {
    x: number;
    y: number;
};

export function clampNumber(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export function getPreviewRulerLabelStep(cellSize: number): number {
    if (cellSize >= 14) {
        return 1;
    }

    if (cellSize >= 9) {
        return 2;
    }

    if (cellSize >= 8) {
        return 5;
    }

    return 10;
}

export function getPreviewRulerTicks(
    length: number,
    renderedLength: number
): PreviewRulerTick[] {
    const safeLength = Math.max(1, Math.floor(length));
    const cellSize = renderedLength / safeLength;
    const labelStep = getPreviewRulerLabelStep(cellSize);

    return Array.from({ length: safeLength }, (_, index) => {
        const value = index + 1;
        const isPenultimateTick = value === safeLength - 1;
        const shouldHideNearFinalLabel = labelStep > 1 && isPenultimateTick;

        return {
            value,
            ratio: (index + 0.5) / safeLength,
            showLabel:
                value === 1 ||
                value === safeLength ||
                (value % labelStep === 0 && !shouldHideNearFinalLabel),
        };
    });
}

export function getPreviewBeadRenderSize(width: number, height: number): number {
    return clampNumber(
        Math.floor(
            PREVIEW_RENDER_MAX_DIMENSION / Math.max(1, width, height)
        ),
        PREVIEW_RENDER_MIN_BEAD_SIZE,
        PREVIEW_RENDER_MAX_BEAD_SIZE
    );
}

function drawPatternPreviewBead(
    previewContext: CanvasRenderingContext2D,
    reducedColor: Uint8ClampedArray,
    width: number,
    point: PreviewPoint,
    beadSizePx: number
): void {
    const cellX = point.x * beadSizePx;
    const cellY = point.y * beadSizePx;
    const index = (point.y * width + point.x) * 4;
    const alpha = reducedColor[index + 3];
    const cx = cellX + beadSizePx / 2;
    const cy = cellY + beadSizePx / 2;
    const beadRadius = Math.max(1, beadSizePx / 2 - beadSizePx * 0.08);
    const beadCenterRadius = Math.max(1, beadSizePx / 6);

    previewContext.fillStyle = PREVIEW_RENDER_BACKGROUND;
    previewContext.fillRect(cellX, cellY, beadSizePx, beadSizePx);

    if (alpha !== 255) {
        previewContext.strokeStyle = 'rgba(99, 116, 132, 0.2)';
        previewContext.lineWidth = Math.max(1, Math.round(beadSizePx * 0.08));
        previewContext.beginPath();
        previewContext.arc(cx, cy, beadRadius, 0, Math.PI * 2);
        previewContext.closePath();
        previewContext.stroke();
        return;
    }

    previewContext.fillStyle = `rgba(${reducedColor[index]}, ${reducedColor[index + 1]}, ${reducedColor[index + 2]}, ${alpha / 255})`;
    previewContext.beginPath();
    previewContext.arc(cx, cy, beadRadius, 0, Math.PI * 2);
    previewContext.closePath();
    previewContext.fill();

    previewContext.fillStyle = PREVIEW_RENDER_BACKGROUND;
    previewContext.beginPath();
    previewContext.arc(cx, cy, beadCenterRadius, 0, Math.PI * 2);
    previewContext.closePath();
    previewContext.fill();
}

function drawPatternPreviewBoardOutline(
    previewContext: CanvasRenderingContext2D,
    point: PreviewPoint,
    beadSizePx: number,
    beadsPerBoard: number
): void {
    const boardX = Math.floor(point.x / beadsPerBoard);
    const boardY = Math.floor(point.y / beadsPerBoard);

    previewContext.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    previewContext.lineWidth = Math.max(1, Math.round(beadSizePx * 0.12));
    previewContext.strokeRect(
        boardX * beadsPerBoard * beadSizePx,
        boardY * beadsPerBoard * beadSizePx,
        beadsPerBoard * beadSizePx,
        beadsPerBoard * beadSizePx
    );
}

export function drawPatternPreviewToCanvas(
    previewContext: CanvasRenderingContext2D,
    reducedColor: Uint8ClampedArray,
    width: number,
    height: number,
    beadSizePx: number,
    beadsPerBoard: number,
    showGrid: boolean
): void {
    const canvasWidth = width * beadSizePx;
    const canvasHeight = height * beadSizePx;

    previewContext.fillStyle = PREVIEW_RENDER_BACKGROUND;
    previewContext.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            drawPatternPreviewBead(
                previewContext,
                reducedColor,
                width,
                { x, y },
                beadSizePx
            );
        }
    }

    if (showGrid) {
        previewContext.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        previewContext.lineWidth = Math.max(1, Math.round(beadSizePx * 0.12));

        for (let boardY = 0; boardY * beadsPerBoard < height; boardY++) {
            for (let boardX = 0; boardX * beadsPerBoard < width; boardX++) {
                previewContext.strokeRect(
                    boardX * beadsPerBoard * beadSizePx,
                    boardY * beadsPerBoard * beadSizePx,
                    beadsPerBoard * beadSizePx,
                    beadsPerBoard * beadSizePx
                );
            }
        }
    }
}

export function drawPatternPreviewBeadToCanvas(
    previewContext: CanvasRenderingContext2D,
    reducedColor: Uint8ClampedArray,
    width: number,
    point: PreviewPoint,
    beadSizePx: number,
    beadsPerBoard: number,
    showGrid: boolean
): void {
    drawPatternPreviewBead(
        previewContext,
        reducedColor,
        width,
        point,
        beadSizePx
    );

    if (showGrid) {
        drawPatternPreviewBoardOutline(
            previewContext,
            point,
            beadSizePx,
            beadsPerBoard
        );
    }
}

export function createPatternPreviewDataUrl(
    reducedColor: Uint8ClampedArray,
    width: number,
    height: number,
    beadsPerBoard: number,
    showGrid: boolean
): string {
    const beadSizePx = getPreviewBeadRenderSize(width, height);
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = width * beadSizePx;
    previewCanvas.height = height * beadSizePx;

    const previewContext = previewCanvas.getContext('2d');

    if (!previewContext) {
        throw new Error('Preview canvas 2D context is unavailable.');
    }

    drawPatternPreviewToCanvas(
        previewContext,
        reducedColor,
        width,
        height,
        beadSizePx,
        beadsPerBoard,
        showGrid
    );

    return previewCanvas.toDataURL('image/png');
}
