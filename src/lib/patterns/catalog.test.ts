import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
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
        expect(patterns).toHaveLength(113);
        expect(patterns.filter(pattern => !['minecraft-creeper-face-v1', 'original-retro-diamond-coaster', 'original-christmas-bauble-ornament', 'original-black-cat'].includes(pattern.id))).toHaveLength(109);
        expect(new Set(patterns.map(({ id }) => id)).size).toBe(patterns.length);
        expect(new Set(patterns.map(({ slug }) => slug)).size).toBe(patterns.length);
        expect(new Set(patternCollections.map(({ slug }) => slug)).size).toBe(patternCollections.length);
        expect(patternCollections.map(({ slug }) => slug)).toEqual(['stardew-valley', 'pokemon', 'minecraft', 'super-mario', 'kirby']);
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
                } else if (pattern.collectionId === 'stardew-valley') {
                    expect(pattern.version).toBe('Wiki game depiction');
                    expect(pattern.source?.url).toMatch(/^https:\/\/stardewvalleywiki.com\/File:/);
                } else if (pattern.collectionId === 'minecraft') {
                    if (pattern.id === 'minecraft-creeper-face-v1') {
                        expect(pattern.kind).toBe('fan-art');
                        expect(pattern.slug).toBe('minecraft/creeper-face');
                        expect(pattern.version).toBe('Hand-drawn Creeper face fan art v1');
                        expect(pattern.source).toMatchObject({
                            kind: 'fan-art', label: 'Minecraft: Meet the Creeper',
                            url: 'https://www.minecraft.net/en-us/article/meet-creeper',
                            rightsHolder: 'Mojang/Microsoft', permission: 'unconfirmed',
                        });
                    } else {
                        expect(pattern.version).toBe('Java Edition 1.21.1');
                        expect(pattern.source?.url).toContain('/aef047f783f44424a591eeecf6b230d5bb0c8095/');
                    }
                } else if (pattern.collectionId === 'super-mario') {
                    expect(['Super Mario Bros. (NES)', 'Super Mario Bros. 3 (NES)']).toContain(pattern.version);
                    expect(pattern.source?.url).toMatch(/^https:\/\/www.mariowiki.com\/File:/);
                } else if (pattern.collectionId === 'kirby') {
                    expect(pattern.version).toBe('Kirby’s Adventure (NES)');
                    expect(pattern.source?.url).toMatch(/^https:\/\/wikirby.com\/wiki\/File:KA_/);
                } else {
                    throw new Error(`Reference version checks missing for ${pattern.collectionId}`);
                }
            } else {
                expect(pattern.source).toBeNull();
                const originalVersions: Record<string, string> = {
                    'capybara-potion': 'Original scene',
                    'ghost-cat-pumpkin': 'Original scene',
                    'original-soccer-ball': 'Original soccer ball design v1',
                    'original-friendly-ghost': 'Original ghost design v1',
                    'original-christmas-tree': 'Original Christmas tree design v1',
                    'original-halloween-bat': 'Original Halloween bat design v1',
                    'original-snowman': 'Original snowman design v1',
                    'original-gingerbread-man': 'Original gingerbread man design v1',
                    'original-santa-hat': 'Original Santa hat design v1',
                    'original-christmas-stocking': 'Original Christmas stocking design v1',
                    'original-snowflake': 'Original six-branch snowflake design v1',
                    'original-retro-diamond-coaster': 'Original retro diamond coaster design v1',
                    'original-christmas-bauble-ornament': 'Original Christmas bauble ornament design v1',
                    'original-black-cat': 'Original Black Cat design v1',
                };
                expect(originalVersions[pattern.id]).toBeDefined();
                expect(pattern.version).toBe(originalVersions[pattern.id]);
            }
        }
        expect(getPatternsForCollection('stardew-valley')).toHaveLength(6);
        expect(getPatternsForCollection('pokemon')).toHaveLength(46);
        expect(getPatternsForCollection('minecraft')).toHaveLength(29);
        expect(getPatternsForCollection('minecraft').filter(pattern => pattern.id !== 'minecraft-creeper-face-v1')).toHaveLength(28);
        expect(getPatternsForCollection('super-mario')).toHaveLength(15);
        expect(getPatternsForCollection('kirby')).toHaveLength(3);
        expect(getPatternBySlug('missing')).toBeUndefined();
        expect(getPatternById('missing')).toBeUndefined();
        expect(getCollectionBySlug('missing')).toBeUndefined();
        expect(getPatternsForCollection('missing')).toEqual([]);
    });

    it('preserves all 112 preexisting catalog records byte-for-byte after adding the black cat', () => {
        const previous = patterns.filter(pattern => pattern.id !== 'original-black-cat');
        expect(previous).toHaveLength(112);
        // Frozen canonical objects from 86db85c: includes all old descriptions, assets and timestamps.
        expect(createHash('sha256').update(JSON.stringify(previous)).digest('hex')).toBe('853569c5b388b5da418a90fb999a69000b3ad3e4badd65e26da8d029763f4d17');
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

    it.each([
        {
            id: 'original-snowman', slug: 'snowman', motif: [21, 25], beads: 351,
            rgbaSha256: 'fb93ee3e1a39210b05f032a1799c279affb14a6eaa40c8104c0b02c17be5f778',
            colors: [['80-19001', 'White', '#eaefee', 247], ['80-19018', 'Black', '#323234', 56], ['80-19005', 'Red', '#b0353c', 43], ['80-19004', 'Orange', '#eb7b31', 5]],
        },
        {
            id: 'original-gingerbread-man', slug: 'gingerbread-man', motif: [23, 25], beads: 327,
            rgbaSha256: '65b0551ed86c1af5b24c26fa4219c0d08ff8e9d8f3eb2c7cbc30fd191c3da92b',
            colors: [['80-15250', 'Gingerbread', '#7e5446', 264], ['80-19001', 'White', '#eaefee', 51], ['80-19005', 'Red', '#b0353c', 12]],
        },
        {
            id: 'original-retro-diamond-coaster', slug: 'retro-diamond-coaster', motif: [23, 23], beads: 517,
            rgbaSha256: '3548cce963d03b9ca9d23ba3bc0f8415dc4e611edb9285c91eb814f28c75b8be',
            colors: [['80-19057', 'Cheddar', '#fbb146', 217], ['80-15201', 'Midnight', '#2f3c55', 216], ['80-19001', 'White', '#eaefee', 84]],
        },
        {
            id: 'original-christmas-bauble-ornament', slug: 'christmas-bauble-ornament', motif: [21, 25], beads: 362,
            rgbaSha256: 'f5490475146d52acef508c9660bcc1beaf829ba78aa3573088e9f71168ab2773',
            colors: [['80-19005', 'Red', '#b0353c', 249], ['80-19001', 'White', '#eaefee', 60], ['80-19057', 'Cheddar', '#fbb146', 53]],
        },
        {
            id: 'original-black-cat', slug: 'black-cat', motif: [16, 16], beads: 181,
            rgbaSha256: 'fbf706e0c20bde55d98825408c5f2e1b94bc4be7a8ab298c1d8b248b99accb2d',
            colors: [['80-19018', 'Black', '#323234', 177], ['80-19003', 'Yellow', '#e7ce3e', 4]],
        },
    ])('$id keeps its reviewed native grid and Perler material list', async ({ id, slug, motif, beads, rgbaSha256, colors }) => {
        const pattern = getPatternById(id)!;
        expect(pattern.slug).toBe(slug);
        expect(pattern.source).toBeNull();
        expect(pattern.collectionId).toBeNull();
        expect([pattern.motifWidth, pattern.motifHeight]).toEqual(motif);
        expect(pattern.beads).toBe(beads);
        expect(pattern.palette.map(({ ref, name, hex, count }) => [ref, name, hex, count])).toEqual(colors);
        const pixels = await sharp(publicPath(pattern.assets.pixels)).ensureAlpha().raw().toBuffer();
        // Locked to the reviewed v1 source, independently of future catalog regeneration.
        expect(createHash('sha256').update(pixels).digest('hex')).toBe(rgbaSha256);
        const draft = parseEditorProject(await readFile(publicPath(pattern.assets.project), 'utf8'))!;
        expect(draft.selectedPaletteIds).toEqual(['perler']);
        expect(draft.activePalettes.map(({ name }) => name)).toEqual(['Perler Midi']);
    });

    it('does not count duplicate pixel artwork as separate patterns', async () => {
        const pixels = await Promise.all(patterns.map(async (pattern) =>
            (await sharp(publicPath(pattern.assets.pixels)).ensureAlpha().raw().toBuffer()).toString('base64')
        ));
        expect(new Set(pixels).size).toBe(patterns.length);
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
