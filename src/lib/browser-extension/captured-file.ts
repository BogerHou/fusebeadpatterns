import { MAX_IMAGE_BYTES } from './protocol';
import { SourceImportError } from './source-import';
import { inspectImage } from '../pixel-grid/core';
import { PixelGridError } from '../pixel-grid/errors';

/** Only the bounded still-image bytes returned by our service worker. */
export function capturedImageFile(dataUrl: string): File {
    if (dataUrl.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 64) throw new SourceImportError('image_too_large');
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
    if (!match) throw new SourceImportError('unsupported_image');
    let binary: string;
    try { binary = atob(match[2]); } catch { throw new SourceImportError('unsupported_image'); }
    if (binary.length > MAX_IMAGE_BYTES) throw new SourceImportError('image_too_large');
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    try { inspectImage(bytes, match[1]); }
    catch (error) { throw new SourceImportError(error instanceof PixelGridError && error.code === 'IMAGE_DIMENSIONS_LIMIT' ? 'image_dimensions' : 'unsupported_image'); }
    const extension = match[1] === 'image/jpeg' ? 'jpg' : match[1].slice(6);
    return new File([bytes], `Selected image.${extension}`, { type: match[1] });
}
