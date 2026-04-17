type PreviewDimensions = {
    width: number;
    height: number;
};

type PreviewBounds = {
    maxWidth: number;
    maxHeight: number;
};

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
    const fitted = fitPreviewSize(size, bounds);
    const safeZoom = Math.max(1, zoom);

    return {
        width: Math.max(1, Math.floor(fitted.width * safeZoom)),
        height: Math.max(1, Math.floor(fitted.height * safeZoom)),
        scale: fitted.scale * safeZoom,
        zoom: safeZoom,
    };
}
