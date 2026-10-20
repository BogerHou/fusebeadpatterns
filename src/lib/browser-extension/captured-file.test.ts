import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { capturedImageFile } from './captured-file';

const png = readFileSync('public/patterns/original-halloween-bat/pixels.png');
const dataUrl = (bytes: Uint8Array, type = 'image/png') => `data:${type};base64,${Buffer.from(bytes).toString('base64')}`;

describe('captured image bytes', () => {
    it('opens the exact bounded image without retaining its original URL or filename', async () => {
        const file = capturedImageFile(dataUrl(png));
        expect(file.name).toBe('Selected image.png');
        expect(file.type).toBe('image/png');
        expect(Buffer.from(await file.arrayBuffer())).toEqual(png);
    });
    it('rejects HTML, remote addresses, MIME mismatches and invalid base64', () => {
        for (const value of ['https://example.org/picture.png', 'data:text/html;base64,PHNjcmlwdD4=', 'data:image/png;base64,%%%=', dataUrl(png, 'image/jpeg')]) {
            expect(() => capturedImageFile(value)).toThrow('unsupported_image');
        }
    });
    it('rejects oversized dimensions before a browser decoder is invoked', () => {
        const oversized = Buffer.from(png);
        oversized.writeUInt32BE(2049, 16);
        expect(() => capturedImageFile(dataUrl(oversized))).toThrow('image_dimensions');
    });
});
