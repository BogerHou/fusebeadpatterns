import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { brickCatalog, brickCatalogSources } from './catalog';
import { validateBrickCatalog } from './core';

describe('manufacturer-checked 3024 colour subset', () => {
    it('pins one physical part and an explicit snapshot version', () => {
        expect(brickCatalog.version).toBe('3024-2026-10-17');
        expect(brickCatalog.part).toEqual({ designId: '3024', name: 'Plate 1 x 1', kind: 'plate' });
        expect(brickCatalog.colors.length).toBeGreaterThanOrEqual(10);
        expect(validateBrickCatalog(brickCatalog)).toEqual(brickCatalog);
    });

    it('keeps colour-system IDs distinct and unambiguous', () => {
        const ids = new Set<string>();
        const ldrawCodes = new Set<number>();
        const legoCodes = new Set<number>();
        const elementIds = new Set<string>();
        for (const colour of brickCatalog.colors) {
            expect(colour.id).toBe(`ldraw-${colour.ldrawCode}`);
            expect(ids.has(colour.id)).toBe(false);
            expect(ldrawCodes.has(colour.ldrawCode)).toBe(false);
            expect(legoCodes.has(colour.legoColorId)).toBe(false);
            expect(elementIds.has(colour.elementId)).toBe(false);
            expect(colour.hex).toMatch(/^#[0-9A-F]{6}$/);
            expect(colour.elementId).toMatch(/^\d{6,7}$/);
            expect(colour.name).not.toMatch(/transparen|metallic|pearl|glitter/i);
            ids.add(colour.id);
            ldrawCodes.add(colour.ldrawCode);
            legoCodes.add(colour.legoColorId);
            elementIds.add(colour.elementId);
        }
    });

    it('retains the common white, black, red, blue, yellow and green combinations', () => {
        const byName = new Map<string, (typeof brickCatalog.colors)[number]>(brickCatalog.colors.map((colour) => [colour.name, colour]));
        for (const name of ['White', 'Black', 'Bright Red', 'Bright Blue', 'Bright Yellow', 'Dark Green']) {
            expect(byName.has(name)).toBe(true);
        }
        // These independent numbering systems differ, including the green name alias.
        expect(byName.get('Black')).toMatchObject({ legoColorId: 26, ldrawCode: 0, elementId: '302426' });
        expect(byName.get('Dark Green')).toMatchObject({ legoColorId: 28, ldrawCode: 2, elementId: '302428' });
        expect(byName.get('Medium Stone Grey')).toMatchObject({ legoColorId: 194, ldrawCode: 71, elementId: '4211399' });
        expect(byName.get('Dark Stone Grey')).toMatchObject({ legoColorId: 199, ldrawCode: 72, elementId: '4210719' });
    });

    it('uses a documented RGB approximation without asserting manufacturer equality', () => {
        const black = brickCatalog.colors.find((colour) => colour.name === 'Black');
        expect(black?.hex).toBe('#1B2A34');
        expect(brickCatalogSources.note).toContain('may differ');
        expect(brickCatalogSources.note).toContain('do not guarantee current stock');
    });

    it('publishes an attributable colour source and public manufacturer provenance', () => {
        expect(brickCatalogSources.retrievedAt).toBe('2026-10-17');
        expect(brickCatalogSources.colour.author).toBe('LDraw.org');
        expect(brickCatalogSources.colour.license).toBe('CC BY 4.0');
        expect(brickCatalogSources.colour.licenseURL).toBe('https://creativecommons.org/licenses/by/4.0/');
        expect(brickCatalogSources.modifications).toContain('RGB values unchanged');
        expect(brickCatalogSources.partColour.sourceURLs.length).toBeGreaterThan(0);
        for (const source of brickCatalogSources.partColour.sourceURLs) {
            const url = new URL(source);
            expect(url.origin).toBe('https://www.lego.com');
            expect(url.pathname).toContain('/pick-and-build/pick-a-brick');
            expect([...url.searchParams.keys()].every((key) => ['appearsIn', 'elementGroup', 'includeOutOfStock', 'perPage'].includes(key))).toBe(true);
        }
    });

    it('includes the source, licence, changes and availability boundary in the distributed notice', () => {
        const notice = readFileSync(new URL('../../../public/licenses/brick-mosaic-ldraw.txt', import.meta.url), 'utf8');
        expect(notice).toContain(brickCatalogSources.colour.url);
        expect(notice).toContain(brickCatalogSources.colour.licenseURL);
        expect(notice).toContain('Original creator: LDraw.org');
        expect(notice).toContain('Changes: selected 20 opaque colours');
        expect(notice).toContain('not current stock');
        for (const source of brickCatalogSources.partColour.sourceURLs) expect(notice).toContain(source);
    });
});
