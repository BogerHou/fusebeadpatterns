import { describe, expect, it } from 'vitest';

import { getFirstImageFile } from './upload';

describe('editor upload helpers', () => {
    it('returns the first image file from a mixed file list', () => {
        const textFile = new File(['hello'], 'notes.txt', {
            type: 'text/plain',
        });
        const imageFile = new File(['image'], 'pattern.png', {
            type: 'image/png',
        });

        expect(getFirstImageFile([textFile, imageFile])).toBe(imageFile);
    });

    it('returns null when no image file is present', () => {
        const textFile = new File(['hello'], 'notes.txt', {
            type: 'text/plain',
        });

        expect(getFirstImageFile([textFile])).toBeNull();
        expect(getFirstImageFile([])).toBeNull();
        expect(getFirstImageFile(null)).toBeNull();
    });
});
