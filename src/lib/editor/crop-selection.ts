import { isValidSourceCrop, type EditorSourceCrop } from '../core/utils/image-crop';

export type CropPoint = { x: number; y: number };
export type CropCorner = 'nw' | 'ne' | 'sw' | 'se';
export type CropFields = Record<'x' | 'y' | 'width' | 'height', string>;
const bound = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)));

export function cropFields(crop: EditorSourceCrop): CropFields {
    return { x: String(crop.x), y: String(crop.y), width: String(crop.width), height: String(crop.height) };
}

export function parseCropFields(fields: CropFields, sourceWidth: number, sourceHeight: number): EditorSourceCrop | null {
    if (Object.values(fields).some(value => !/^\d+$/.test(value))) return null;
    const crop = { sourceWidth, sourceHeight, x: Number(fields.x), y: Number(fields.y), width: Number(fields.width), height: Number(fields.height) };
    return isValidSourceCrop(crop) ? crop : null;
}

/** Pointer positions are decoded source pixels, independent of preview resolution. */
export function drawCrop(sourceWidth: number, sourceHeight: number, start: CropPoint, end: CropPoint): EditorSourceCrop {
    const x = bound(Math.min(start.x, end.x), 0, sourceWidth - 1);
    const y = bound(Math.min(start.y, end.y), 0, sourceHeight - 1);
    return { sourceWidth, sourceHeight, x, y, width: bound(Math.max(start.x, end.x), x + 1, sourceWidth) - x, height: bound(Math.max(start.y, end.y), y + 1, sourceHeight) - y };
}

export function moveCrop(crop: EditorSourceCrop, dx: number, dy: number): EditorSourceCrop {
    return { ...crop, x: bound(crop.x + dx, 0, crop.sourceWidth - crop.width), y: bound(crop.y + dy, 0, crop.sourceHeight - crop.height) };
}

export function resizeCrop(crop: EditorSourceCrop, corner: CropCorner, point: CropPoint): EditorSourceCrop {
    const left = corner.endsWith('w') ? bound(point.x, 0, crop.x + crop.width - 1) : crop.x;
    const top = corner.startsWith('n') ? bound(point.y, 0, crop.y + crop.height - 1) : crop.y;
    const right = corner.endsWith('e') ? bound(point.x, crop.x + 1, crop.sourceWidth) : crop.x + crop.width;
    const bottom = corner.startsWith('s') ? bound(point.y, crop.y + 1, crop.sourceHeight) : crop.y + crop.height;
    return { ...crop, x: left, y: top, width: right - left, height: bottom - top };
}

/** Keep the original corner under a stable grab offset inside its touch target. */
export function resizeCropBy(crop: EditorSourceCrop, corner: CropCorner, dx: number, dy: number): EditorSourceCrop {
    return resizeCrop(crop, corner, {
        x: crop.x + (corner.endsWith('e') ? crop.width : 0) + dx,
        y: crop.y + (corner.startsWith('s') ? crop.height : 0) + dy,
    });
}
