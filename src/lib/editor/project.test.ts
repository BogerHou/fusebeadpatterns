import { describe, expect, it } from 'vitest';

import { BOARDS } from '../core/model/board/board.model';
import { Color } from '../core/model/color/color.model';
import { MATCHINGS } from '../core/model/matching/matching.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { BOARD_OPTIONS } from './config';
import { buildEditorProject } from './project';

function createPalette(): Palette {
    const entry = new PaletteEntry('Red', new Color(255, 0, 0, 255));
    entry.ref = 'P01';
    entry.symbol = 'A';
    entry.prefix = 'P';
    entry.enabled = false;

    return new Palette('Perler Midi', [entry]);
}

describe('editor project builder', () => {
    it('maps editor settings to core project configuration', () => {
        const boardOption = BOARD_OPTIONS.find((option) => option.id === 'mini');

        if (!boardOption) {
            throw new Error('Expected mini board option to exist.');
        }

        const project = buildEditorProject({
            palettes: [createPalette()],
            boardOption,
            boardWidth: 3,
            boardHeight: 4,
            matchingId: 'delta_e_cie2000',
            ditheringId: 'atkinson',
            imageAdjustments: {
                brightness: 105,
                contrast: 95,
                saturation: 115,
                grayscale: 10,
            },
            rendererSettings: {
                center: false,
                fit: true,
                showGrid: true,
            },
            useSymbols: true,
        });

        expect(project.boardConfiguration.board).toBe(BOARDS.MINI);
        expect(project.boardConfiguration.nbBoardWidth).toBe(3);
        expect(project.boardConfiguration.nbBoardHeight).toBe(4);
        expect(project.matchingConfiguration.matching).toBe(
            MATCHINGS.DELTA_E_CIE2000
        );
        expect(project.imageConfiguration.css()).toBe(
            'brightness(105%) contrast(95%) saturate(115%) grayscale(10%)'
        );
        expect(project.ditheringConfiguration.enable).toBe(true);
        expect(project.ditheringConfiguration.hardness).toBe(70);
        expect(project.rendererConfiguration.center).toBe(false);
        expect(project.rendererConfiguration.fit).toBe(true);
        expect(project.rendererConfiguration.showGrid).toBe(true);
        expect(project.exportConfiguration.useSymbols).toBe(true);
    });

    it('clones palettes before attaching them to the project', () => {
        const palette = createPalette();
        const boardOption = BOARD_OPTIONS[0];

        if (!boardOption) {
            throw new Error('Expected a board option to exist.');
        }

        const project = buildEditorProject({
            palettes: [palette],
            boardOption,
            boardWidth: 1,
            boardHeight: 1,
            matchingId: 'euclidean',
            ditheringId: 'none',
            imageAdjustments: {
                brightness: 100,
                contrast: 100,
                saturation: 100,
                grayscale: 0,
            },
            rendererSettings: {
                center: true,
                fit: true,
                showGrid: false,
            },
            useSymbols: false,
        });

        const clonedPalette = project.paletteConfiguration.palettes[0];
        const clonedEntry = clonedPalette?.entries[0];

        expect(clonedPalette).not.toBe(palette);
        expect(clonedEntry).not.toBe(palette.entries[0]);
        expect(clonedEntry?.enabled).toBe(false);

        palette.entries[0].enabled = true;

        expect(clonedEntry?.enabled).toBe(false);
    });

    it('preserves default fallback behavior for unknown options', () => {
        const boardOption = BOARD_OPTIONS[0];

        if (!boardOption) {
            throw new Error('Expected a board option to exist.');
        }

        const project = buildEditorProject({
            palettes: [createPalette()],
            boardOption,
            boardWidth: 2,
            boardHeight: 2,
            matchingId: 'unknown',
            ditheringId: 'unknown',
            imageAdjustments: {
                brightness: 100,
                contrast: 100,
                saturation: 100,
                grayscale: 0,
            },
            rendererSettings: {
                center: true,
                fit: true,
                showGrid: false,
            },
            useSymbols: false,
        });

        expect(project.matchingConfiguration.matching).toBe(MATCHINGS.EUCLIDEAN);
        expect(project.ditheringConfiguration.enable).toBe(true);
        expect(project.ditheringConfiguration.hardness).toBe(0);
    });

    it('disables dithering for the none option', () => {
        const boardOption = BOARD_OPTIONS[0];

        if (!boardOption) {
            throw new Error('Expected a board option to exist.');
        }

        const project = buildEditorProject({
            palettes: [createPalette()],
            boardOption,
            boardWidth: 2,
            boardHeight: 2,
            matchingId: 'euclidean',
            ditheringId: 'none',
            imageAdjustments: {
                brightness: 100,
                contrast: 100,
                saturation: 100,
                grayscale: 0,
            },
            rendererSettings: {
                center: true,
                fit: true,
                showGrid: false,
            },
            useSymbols: false,
        });

        expect(project.ditheringConfiguration.enable).toBe(false);
        expect(project.ditheringConfiguration.hardness).toBe(0);
    });
});
