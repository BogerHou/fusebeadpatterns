/** Stable validation codes; default English wording remains compatible with existing users. */
export const PIXEL_GRID_ERROR_MESSAGES = Object.freeze({
    INVALID_DIMENSIONS: 'Use whole-number dimensions from 1 to 128, with at most 16,384 pixels.',
    PIXEL_DATA_LENGTH: 'Pixel data length does not match the canvas dimensions.',
    INVALID_RGBA_CHANNELS: 'RGBA channels must be integers from 0 to 255.',
    INVALID_PIXEL_POSITION: 'Pixel positions must be whole numbers.',
    INVALID_RESIZE_MODE: 'Choose keep proportions, center crop, or stretch.',
    SOURCE_IMAGE_LIMIT: 'Decoded image exceeds the source-image size limit.',
    INVALID_HISTORY_LIMIT: 'History needs a positive step limit.',
    PROJECT_TOO_LARGE: 'Project files must be 512 KiB or smaller.',
    PROJECT_INVALID_JSON: 'The project is not valid JSON.',
    PROJECT_UNSUPPORTED_FORMAT: 'Choose a Pixel Grid project (format pixel-grid-project, version 1). Bead projects are not supported.',
    PROJECT_MISSING_FIELDS: 'The project is missing required fields.',
    PROJECT_UNSUPPORTED_FIELDS: 'The project contains unsupported fields.',
    IMAGE_FILE_SIZE: 'Choose an image no larger than 8 MiB.',
    PNG_INCOMPLETE_CHUNK: 'The PNG has an incomplete chunk.',
    PNG_ANIMATED: 'Animated PNG is not supported. Choose a static PNG.',
    JPEG_INVALID_MARKER: 'Invalid JPEG marker.',
    JPEG_INCOMPLETE_SEGMENT: 'The JPEG has an incomplete segment.',
    JPEG_INVALID_DIMENSIONS: 'The JPEG dimensions are invalid.',
    WEBP_INCOMPLETE_CHUNK: 'The WebP has an incomplete chunk.',
    WEBP_ANIMATED: 'Animated WebP is not supported. Choose a static image.',
    IMAGE_UNSUPPORTED_FORMAT: 'Supported image files: static PNG, JPEG and WebP. SVG and GIF are not supported.',
    IMAGE_MIME_MISMATCH: 'The image content does not match its file type.',
    IMAGE_DIMENSIONS_LIMIT: 'Source images must be at most 2048 × 2048 (4,194,304 pixels).',
    PNG_EXPORT_UNSUPPORTED: 'This browser does not support exact RGBA PNG export. Save the project file or use a browser with CompressionStream.',
    COLOR_LIMIT_INVALID: 'Choose original, 8, 16, 32 or 64 colors.',
    PNG_SCALE_INVALID: 'Choose a PNG scale of 1, 2, 4, 8 or 16.',
} as const);

export type PixelGridErrorCode = keyof typeof PIXEL_GRID_ERROR_MESSAGES;

export class PixelGridError extends Error {
    readonly code: PixelGridErrorCode;
    constructor(code: PixelGridErrorCode) {
        super(PIXEL_GRID_ERROR_MESSAGES[code]);
        this.name = 'PixelGridError';
        this.code = code;
    }
}
