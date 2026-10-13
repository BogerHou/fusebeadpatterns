/** A rectangular region measured in decoded, natural source-image pixels. */
export type EditorSourceCrop = {
    sourceWidth: number;
    sourceHeight: number;
    x: number;
    y: number;
    width: number;
    height: number;
};

const cropKeys = ['sourceWidth', 'sourceHeight', 'x', 'y', 'width', 'height'] as const;

export function isValidSourceCrop(value: unknown): value is EditorSourceCrop {
    try {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null) return false;
        const keys = Reflect.ownKeys(value);
        if (keys.length !== cropKeys.length || keys.some(key => typeof key !== 'string' || !cropKeys.includes(key as typeof cropKeys[number]))) return false;
        for (const key of cropKeys) {
            const property = Object.getOwnPropertyDescriptor(value, key);
            if (!property?.enumerable || !('value' in property) || !Number.isSafeInteger(property.value)) return false;
        }
        const crop = value as EditorSourceCrop;
        // Subtraction avoids accepting an overflowed x + width / y + height.
        return crop.sourceWidth > 0 && crop.sourceHeight > 0 && crop.x >= 0 && crop.y >= 0 &&
            crop.width > 0 && crop.height > 0 && crop.x < crop.sourceWidth && crop.y < crop.sourceHeight &&
            crop.width <= crop.sourceWidth - crop.x && crop.height <= crop.sourceHeight - crop.y;
    } catch {
        return false;
    }
}

/** Full-image selections have the same public representation as no crop. */
export function normalizeSourceCrop(crop: EditorSourceCrop | null | undefined): EditorSourceCrop | null {
    if (crop === null || crop === undefined) return null;
    if (!isValidSourceCrop(crop)) throw new Error('Invalid source crop.');
    if (crop.x === 0 && crop.y === 0 && crop.width === crop.sourceWidth && crop.height === crop.sourceHeight) return null;
    return { ...crop };
}
