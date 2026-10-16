import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import copy from './print-labels.json';
import manifest from '../../../scripts/perler-color-labels-assets.json';

const root = process.cwd();
const digest = (path: string) => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');

describe('downloadable storage labels remain tied to the actual color chart', () => {
    it('requires regeneration when the source palette or localized instructions change', () => {
        expect(digest('public/palettes/perler.csv')).toBe(manifest.paletteSHA256);
        expect(digest('src/lib/color-chart/print-labels.json')).toBe(manifest.copySHA256);
        expect(manifest.layout).toEqual({ labelMM: [35, 15], gapMM: [2, 2], columns: 5, rows: 11, pageLabels: [55, 48] });
    });

    for (const locale of ['en', 'de', 'fr', 'ja'] as const) {
        it(`ships the reviewed localized A4 and Letter artifacts in ${locale}`, () => {
            expect(copy[locale].pdfPage).toContain('{page}');
            for (const paper of ['a4', 'letter'] as const) {
                const name = `perler-midi-${locale}-${paper}.pdf` as keyof typeof manifest.files;
                const info = manifest.files[name];
                expect(digest(`public/downloads/color-labels/${name}`)).toBe(info.sha256);
                expect(info.pages).toBe(2);
                expect(info.labels).toBe(103);
                const pdf = readFileSync(resolve(root, 'public/downloads/color-labels', name));
                expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
                expect(pdf.toString('latin1')).toContain(`/Lang (${locale})`);
                expect(pdf.toString('latin1')).toContain('/PrintScaling /None');
            }
        });
    }
});
