import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { parseEditorProject } from '../editor/draft';
import {
    getCollectionBySlug,
    getPatternById,
    getPatternBySlug,
    getPatternHref,
    getPatternsForCollection,
    patternCollections,
    patterns,
} from './catalog';
import { getLibraryProject } from './project-links';

const publicPath = (url: string) => path.join(process.cwd(), 'public', url);

describe('pattern library content integrity', () => {
    it('has unique stable routes, valid collections and explicit reference versions', () => {
        expect(patterns).toHaveLength(19);
        expect(new Set(patterns.map(({ id }) => id)).size).toBe(patterns.length);
        expect(new Set(patterns.map(({ slug }) => slug)).size).toBe(patterns.length);
        expect(new Set(patternCollections.map(({ slug }) => slug)).size).toBe(patternCollections.length);
        expect(patternCollections.map(({ slug }) => slug)).toEqual(['stardew-valley', 'pokemon']);
        for (const pattern of patterns) {
            expect(pattern.slug).toMatch(/^[a-z0-9-]+(?:\/[a-z0-9-]+)?$/);
            expect(getPatternById(pattern.id)).toBe(pattern);
            expect(getPatternBySlug(pattern.slug)).toBe(pattern);
            expect(getPatternHref(pattern)).toBe(`/patterns/${pattern.slug}`);
            expect(pattern.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(Number.isNaN(Date.parse(pattern.updatedAt))).toBe(false);
            expect(pattern.description.trim()).not.toBe('');
            if (pattern.collectionId) {
                const collection = getCollectionBySlug(pattern.collectionId);
                expect(collection).toBeDefined();
                expect(pattern.slug.startsWith(`${collection!.slug}/`)).toBe(true);
                expect(pattern.source?.url).toMatch(/^https:\/\//);
                if (pattern.collectionId === 'pokemon') {
                    expect(pattern.version).toBe('Gen V menu icon');
                    expect(pattern.source?.url).toContain('/0b133a62e914976d3d7ea33aaa1ac676ca248c30/');
                    expect(pattern.source?.url).toContain('/generation-v/icons/');
                } else {
                    expect(pattern.version).toBe('Wiki game depiction');
                    expect(pattern.source?.url).toMatch(/^https:\/\/stardewvalleywiki.com\/File:/);
                }
            } else {
                expect(pattern.source).toBeNull();
                expect(pattern.version).toBe('Original scene');
            }
        }
        expect(getPatternsForCollection('stardew-valley')).toHaveLength(6);
        expect(getPatternsForCollection('pokemon')).toHaveLength(11);
        expect(getPatternBySlug('missing')).toBeUndefined();
        expect(getPatternById('missing')).toBeUndefined();
        expect(getCollectionBySlug('missing')).toBeUndefined();
        expect(getPatternsForCollection('missing')).toEqual([]);
    });

    it('allows only known local projects into the editor', () => {
        for (const pattern of patterns) {
            expect(getLibraryProject(pattern.id)).toEqual({
                id: pattern.id,
                title: pattern.title,
                projectUrl: pattern.assets.project,
            });
        }
        for (const untrusted of ['', '../editor', 'https://example.com/project.json', 'toString', '__proto__', 'pokemon-eevee']) {
            expect(getLibraryProject(untrusted)).toBeUndefined();
        }
    });

    it('keeps the disconnected Junimo construction warning', () => {
        const junimo = getPatternById('sdv-junimo');
        expect(junimo?.notes.join(' ')).toContain('three separate parts');
        expect(junimo?.notes.join(' ')).toContain('backing');
    });

    for (const pattern of patterns) {
        it(`${pattern.id}: downloadable pixels, editor project, palette and bead counts agree`, async () => {
            for (const asset of Object.values(pattern.assets)) {
                expect(asset.startsWith(`/patterns/${pattern.id}/`)).toBe(true);
                expect(asset).not.toContain('..');
                expect((await stat(publicPath(asset))).size).toBeGreaterThan(0);
            }
            expect((await readFile(publicPath(pattern.assets.grid.replace('.png', '.svg')), 'utf8')).startsWith('<svg')).toBe(true);

            const draft = parseEditorProject(await readFile(publicPath(pattern.assets.project), 'utf8'));
            expect(draft).not.toBeNull();
            expect(draft!.sourceMode).toBe('blank');
            expect(draft!.imageSrc).toBeNull();
            expect(draft!.boardId).toBe('midi');
            expect([draft!.boardWidth, draft!.boardHeight]).toEqual([1, 1]);
            expect(draft!.imageAdjustments).toEqual({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0 });
            const project = draft!.editedPattern!;
            expect([project.width, project.height]).toEqual([pattern.gridWidth, pattern.gridHeight]);
            expect([pattern.gridWidth, pattern.gridHeight]).toEqual([29, 29]);
            const data = Buffer.from(project.data, 'base64');
            expect(data.length).toBe(project.width * project.height * 4);
            expect(project.byteLength).toBe(data.length);
            const { data: pngData, info } = await sharp(publicPath(pattern.assets.pixels)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
            expect([info.width, info.height, info.channels]).toEqual([pattern.gridWidth, pattern.gridHeight, 4]);
            expect(pngData.equals(data)).toBe(true);

            const counts = new Map<string, number>();
            let minX = project.width;
            let minY = project.height;
            let maxX = -1;
            let maxY = -1;
            for (let offset = 0; offset < data.length; offset += 4) {
                expect([0, 255]).toContain(data[offset + 3]);
                if (data[offset + 3] === 0) continue;
                const color = `#${data.subarray(offset, offset + 3).toString('hex')}`;
                counts.set(color, (counts.get(color) || 0) + 1);
                const x = (offset / 4) % project.width;
                const y = Math.floor(offset / 4 / project.width);
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
            expect([...counts.values()].reduce((sum, count) => sum + count, 0)).toBe(pattern.beads);
            expect(counts.size).toBe(pattern.colorCount);
            expect([maxX - minX + 1, maxY - minY + 1]).toEqual([pattern.motifWidth, pattern.motifHeight]);
            expect(pattern.palette).toHaveLength(pattern.colorCount);
            expect(new Set(pattern.palette.map(({ symbol }) => symbol)).size).toBe(pattern.colorCount);
            expect(new Set(pattern.palette.map(({ hex }) => hex)).size).toBe(pattern.colorCount);
            expect(new Set(pattern.palette.map(({ ref }) => ref)).size).toBe(pattern.colorCount);
            const projectPalette = draft!.activePalettes.flatMap(({ entries }) => entries);
            expect(projectPalette).toHaveLength(pattern.colorCount);
            for (const entry of pattern.palette) {
                expect(counts.get(entry.hex)).toBe(entry.count);
                expect(entry.count).toBeGreaterThan(0);
                const projectEntry = projectPalette.find(({ ref }) => ref === entry.ref);
                expect(projectEntry).toBeDefined();
                expect(projectEntry!.name).toBe(entry.name);
                expect(projectEntry!.symbol).toBe(entry.symbol);
                expect(projectEntry!.enabled).toBe(true);
                const { r, g, b, a } = projectEntry!.color;
                expect(`#${Buffer.from([r, g, b]).toString('hex')}`).toBe(entry.hex);
                expect(a).toBe(255);
            }
            const pdf = await readFile(publicPath(pattern.assets.pdf));
            expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
            expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
        });
    }
});
