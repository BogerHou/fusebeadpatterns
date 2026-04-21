type PreviewDimensions = {
    width: number;
    height: number;
};

type PreviewBounds = {
    maxWidth: number;
    maxHeight: number;
};

const MAX_AUTO_FIT_SCALE = 32;

export function svgMarkupToDataUrl(svgMarkup: string): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
}

export function fitPreviewSize(
    size: PreviewDimensions,
    bounds: PreviewBounds
): PreviewDimensions & { scale: number } {
    const safeWidth = Math.max(1, size.width);
    const safeHeight = Math.max(1, size.height);
    const safeMaxWidth = Math.max(1, bounds.maxWidth);
    const safeMaxHeight = Math.max(1, bounds.maxHeight);
    const scale = Math.min(
        safeMaxWidth / safeWidth,
        safeMaxHeight / safeHeight,
        1
    );

    return {
        width: Math.max(1, Math.floor(safeWidth * scale)),
        height: Math.max(1, Math.floor(safeHeight * scale)),
        scale,
    };
}

export function getPreviewRenderSize(
    size: PreviewDimensions,
    bounds: PreviewBounds,
    zoom = 1
): PreviewDimensions & { scale: number; zoom: number } {
    const safeWidth = Math.max(1, size.width);
    const safeHeight = Math.max(1, size.height);
    const safeMaxWidth = Math.max(1, bounds.maxWidth);
    const safeMaxHeight = Math.max(1, bounds.maxHeight);
    const fitScale = Math.min(
        safeMaxWidth / safeWidth,
        safeMaxHeight / safeHeight,
        MAX_AUTO_FIT_SCALE
    );
    const safeZoom = Math.max(0.25, zoom);
    const scale = fitScale * safeZoom;

    return {
        width: Math.max(1, Math.floor(safeWidth * scale)),
        height: Math.max(1, Math.floor(safeHeight * scale)),
        scale,
        zoom: safeZoom,
    };
}
