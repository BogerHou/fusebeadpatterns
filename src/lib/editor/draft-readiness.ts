type PatternSize = { width: number; height: number };

/** The generation ref and React's rendered dimensions may update in different frames. */
export function isEditorPatternSnapshotReady(
    pixels: Uint8ClampedArray | null,
    actualSize: PatternSize | null,
    renderedSize: PatternSize,
): boolean {
    if (!pixels || !actualSize ||
        !Number.isSafeInteger(actualSize.width) || actualSize.width < 1 ||
        !Number.isSafeInteger(actualSize.height) || actualSize.height < 1 ||
        actualSize.width !== renderedSize.width ||
        actualSize.height !== renderedSize.height) {
        return false;
    }

    return pixels.byteLength === actualSize.width * actualSize.height * 4;
}
