import { BoardConfiguration } from '../core/model/configuration/board-configuration.model';
import { DitheringConfiguration } from '../core/model/configuration/dithering-configuration.model';
import { ExportConfiguration } from '../core/model/configuration/export-configuration.model';
import { ImageConfiguration } from '../core/model/configuration/image-configuration.model';
import { MatchingConfiguration } from '../core/model/configuration/matching-configuration.model';
import { PaletteConfiguration } from '../core/model/configuration/palette-configuration.model';
import { RendererConfiguration } from '../core/model/configuration/renderer-configuration.model';
import { Palette } from '../core/model/palette/palette.model';
import { Project } from '../core/model/project/project.model';
import { getDitheringOption, getMatchingOption } from './config';
import type { BoardOption } from './config';
import { clonePalettes } from './palette-state';

export type EditorImageAdjustments = {
    brightness: number;
    contrast: number;
    saturation: number;
    grayscale: number;
};

export type EditorRendererSettings = {
    center: boolean;
    fit: boolean;
    showGrid: boolean;
};

export type BuildEditorProjectOptions = {
    palettes: Palette[];
    boardOption: BoardOption;
    boardWidth: number;
    boardHeight: number;
    matchingId: string;
    ditheringId: string;
    imageAdjustments: EditorImageAdjustments;
    rendererSettings: EditorRendererSettings;
    useSymbols: boolean;
};

export function buildEditorProject({
    palettes,
    boardOption,
    boardWidth,
    boardHeight,
    matchingId,
    ditheringId,
    imageAdjustments,
    rendererSettings,
    useSymbols,
}: BuildEditorProjectOptions): Project {
    const paletteConfig = new PaletteConfiguration(clonePalettes(palettes));

    const boardConfig = new BoardConfiguration();
    boardConfig.board = boardOption.value;
    boardConfig.nbBoardWidth = boardWidth;
    boardConfig.nbBoardHeight = boardHeight;

    const matchingOption = getMatchingOption(matchingId);
    const matchingConfig = new MatchingConfiguration();
    matchingConfig.matching = matchingOption?.value ?? matchingConfig.matching;

    const imageConfig = new ImageConfiguration();
    imageConfig.add(`brightness(${imageAdjustments.brightness}%)`);
    imageConfig.add(`contrast(${imageAdjustments.contrast}%)`);
    imageConfig.add(`saturate(${imageAdjustments.saturation}%)`);
    imageConfig.add(`grayscale(${imageAdjustments.grayscale}%)`);

    const ditheringConfig = new DitheringConfiguration();
    const ditheringOption = getDitheringOption(ditheringId);
    ditheringConfig.enable = ditheringId !== 'none';
    ditheringConfig.hardness = ditheringOption?.hardness ?? 0;

    const rendererConfig = new RendererConfiguration();
    rendererConfig.center = rendererSettings.center;
    rendererConfig.fit = rendererSettings.fit;
    rendererConfig.showGrid = rendererSettings.showGrid;

    const exportConfig = new ExportConfiguration();
    exportConfig.useSymbols = useSymbols;

    return new Project(
        paletteConfig,
        boardConfig,
        matchingConfig,
        imageConfig,
        ditheringConfig,
        rendererConfig,
        exportConfig
    );
}
