'use client';

import NextImage from 'next/image';
import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Eraser,
    Hand,
    PaintBucket,
    Pencil,
    Pipette,
    type LucideIcon,
} from 'lucide-react';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EditorDialog } from './EditorDialog';
import { EditorSection } from './EditorSection';

import {
    BOARD_OPTIONS,
    DITHERING_OPTIONS,
    EXPORT_OPTIONS,
    MATCHING_OPTIONS,
    PALETTE_OPTIONS,
    BoardOptionId,
    getBoardOption,
    getPaletteOption,
    parsePaletteCsv,
} from '@/lib/editor/config';
import {
    createEditorDraft,
    decodeEditorPatternDraft,
    encodeEditorPatternDraft,
    EditorPatternDraft,
    loadEditorDraft,
    saveEditorDraft,
} from '@/lib/editor/draft';
import {
    clampNumber,
    drawPatternPreviewBeadToCanvas,
    createPatternPreviewDataUrl,
    drawPatternPreviewToCanvas,
    getPreviewBeadRenderSize,
    getPreviewRulerTicks,
} from '@/lib/editor/pattern-preview';
import {
    fillMatchingPatternRegion,
    getPatternDataIndex,
    paletteEntryMatchesPatternPixel,
    setPatternPixelToEntry,
    type PatternPoint as EditorPoint,
} from '@/lib/editor/pattern-edit';
import { drawGridExportPattern } from '@/lib/editor/grid-export';
import { exportEditorPattern } from '@/lib/editor/pattern-export';
import {
    getEditorShortcutAction,
    type EditorShortcutTool as EditorTool,
} from '@/lib/editor/shortcuts';
import { getPreviewRenderSize } from '@/lib/editor/preview';
import {
    clonePalettes,
    countEnabledEntries,
    enablePaletteEntry,
    getAutomaticEditorColorRef,
    mergePaletteEnabledState,
    togglePaletteEntry,
    togglePaletteGroup,
} from '@/lib/editor/palette-state';
import { buildEditorProject } from '@/lib/editor/project';
import { getFirstImageFile } from '@/lib/editor/upload';
import type { Project } from '@/lib/core/model/project/project.model';
import {
    Palette,
    PaletteEntry,
} from '@/lib/core/model/palette/palette.model';
import { LoadImage } from '@/lib/core/model/image/load-image.model';
import {
    computeUsage,
    countBeads,
    drawImageInsideCanvas,
    reduceColor,
} from '@/lib/core/utils/utils';

const DEFAULT_PALETTE_ID = 'perler';
const DEFAULT_BOARD_ID = getPaletteOption(DEFAULT_PALETTE_ID)?.boardId ?? 'midi';
const DEFAULT_MATCHING_ID = 'delta_e_cie2000';
const DEFAULT_DITHERING_ID = 'none';
const DEFAULT_EXPORT_ID = 'pdf';
const MAX_BOARD_COUNT = 20;
const IMAGE_UPLOAD_INPUT_ID = 'image-upload-input';
const EDITOR_EMPTY_UPLOAD_INPUT_ID = 'editor-empty-upload-input';
const EDITOR_PRIMARY_PALETTE_ID = 'editor-primary-palette';
const EDITOR_BOARD_ID = 'editor-board-id';
const EDITOR_BOARD_WIDTH_ID = 'editor-board-width';
const EDITOR_BOARD_HEIGHT_ID = 'editor-board-height';
const EDITOR_SOURCE_VISIBLE_ID = 'editor-source-visible';
const EDITOR_SOURCE_OPACITY_ID = 'editor-source-opacity';
const EDITOR_MATCHING_ID = 'editor-matching';
const EDITOR_DITHERING_ID = 'editor-dithering';
const EDITOR_RENDER_CENTER_ID = 'editor-render-center';
const EDITOR_RENDER_FIT_ID = 'editor-render-fit';
const EDITOR_RENDER_GRID_ID = 'editor-render-grid';
const EXPORT_FILE_NAME_ID = 'export-file-name';
const EXPORT_FORMAT_ID = 'export-format';
const EXPORT_SYMBOLS_ID = 'export-symbols';
const HOME_PRIMARY_PALETTE_ID = 'home-primary-palette';
const HOME_BOARD_ID = 'home-board-id';
const HOME_BOARD_WIDTH_ID = 'home-board-width';
const HOME_BOARD_HEIGHT_ID = 'home-board-height';
const PREVIEW_FALLBACK_BOUNDS = {
    maxWidth: 1200,
    maxHeight: 900,
};
const PREVIEW_VIEWPORT_PADDING = {
    horizontal: 72,
    vertical: 96,
};
const PREVIEW_RULER_SIZE = {
    top: 30,
    left: 30,
};
const PREVIEW_STAGE_SAFE_AREA = {
    right: 0,
    bottom: 0,
};
const PREVIEW_TOOLBAR_HEIGHT = 46;
const PREVIEW_INFO_BAR_HEIGHT = 34;
const PREVIEW_MIN_ZOOM = 0.5;
const PREVIEW_MAX_ZOOM = 5;
const PREVIEW_ZOOM_STEP = 0.2;
const DEFAULT_IMAGE_ADJUSTMENTS = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
};
const DEFAULT_RENDERER_SETTINGS = {
    center: true,
    fit: true,
    showGrid: false,
};
const DEFAULT_REFERENCE_OPACITY = 100;

type ImageAdjustments = typeof DEFAULT_IMAGE_ADJUSTMENTS;
type RendererSettings = typeof DEFAULT_RENDERER_SETTINGS;
type EditorSourceMode = 'image' | 'blank';
type ColorPickerSelection = {
    paletteId: string;
    entryRef: string;
};

type EditorProps = {
    mode?: 'home' | 'editor';
};

const EDITOR_TOOLS: {
    id: EditorTool;
    label: string;
    description: string;
    shortcut: string;
    icon: LucideIcon;
}[] = [
    {
        id: 'bead',
        label: 'Bead',
        description: 'Place bead color',
        shortcut: 'B',
        icon: Pencil,
    },
    {
        id: 'fill',
        label: 'Fill',
        description: 'Fill matching color area',
        shortcut: 'F',
        icon: PaintBucket,
    },
    {
        id: 'erase',
        label: 'Erase',
        description: 'Remove bead',
        shortcut: 'E',
        icon: Eraser,
    },
    {
        id: 'pick',
        label: 'Pick',
        description: 'Pick bead color',
        shortcut: 'I',
        icon: Pipette,
    },
    {
        id: 'pan',
        label: 'Pan',
        description: 'Move around canvas',
        shortcut: 'P',
        icon: Hand,
    },
];

async function loadPalette(paletteId: string): Promise<Palette> {
    const paletteOption = getPaletteOption(paletteId);

    if (!paletteOption) {
        throw new Error(`Unknown palette preset: ${paletteId}`);
    }

    const response = await fetch(`/palettes/${paletteOption.file}`);

    if (!response.ok) {
        throw new Error(`Failed to load palette file: ${paletteOption.file}`);
    }

    return parsePaletteCsv(await response.text(), paletteOption);
}

function parseBoardCount(value: string): number {
    return clampNumber(Number.parseInt(value, 10) || 1, 1, MAX_BOARD_COUNT);
}

function getControlToken(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function Editor({ mode = 'home' }: EditorProps) {
    const router = useRouter();
    const isEditorPage = mode === 'editor';
    const [sourceMode, setSourceMode] = useState<EditorSourceMode>('image');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [fileName, setFileName] = useState('bead-pattern');
    const [selectedPaletteIds, setSelectedPaletteIds] = useState<string[]>([
        DEFAULT_PALETTE_ID,
    ]);
    const [activePalettes, setActivePalettes] = useState<Palette[]>([]);
    const [boardId, setBoardId] = useState<BoardOptionId>(DEFAULT_BOARD_ID);
    const [boardWidth, setBoardWidth] = useState(1);
    const [boardHeight, setBoardHeight] = useState(1);
    const [pendingPrimaryPaletteId, setPendingPrimaryPaletteId] =
        useState(DEFAULT_PALETTE_ID);
    const [pendingBoardId, setPendingBoardId] =
        useState<BoardOptionId>(DEFAULT_BOARD_ID);
    const [pendingBoardWidth, setPendingBoardWidth] = useState(1);
    const [pendingBoardHeight, setPendingBoardHeight] = useState(1);
    const [matchingId, setMatchingId] = useState(DEFAULT_MATCHING_ID);
    const [ditheringId, setDitheringId] = useState(DEFAULT_DITHERING_ID);
    const [useSymbols, setUseSymbols] = useState(false);
    const [exportFormatId, setExportFormatId] = useState(DEFAULT_EXPORT_ID);
    const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments>(
        DEFAULT_IMAGE_ADJUSTMENTS
    );
    const [rendererSettings, setRendererSettings] = useState<RendererSettings>(
        DEFAULT_RENDERER_SETTINGS
    );
    const [processing, setProcessing] = useState(false);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [beadsUsage, setBeadsUsage] = useState<Map<string, number>>(new Map());
    const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
    const [previewSize, setPreviewSize] = useState({ width: 1, height: 1 });
    const [previewZoom, setPreviewZoom] = useState(1);
    const [previewViewportSize, setPreviewViewportSize] = useState(
        PREVIEW_FALLBACK_BOUNDS
    );
    const [draggingUpload, setDraggingUpload] = useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [isPaletteManagerOpen, setIsPaletteManagerOpen] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isEditorDraftReady, setIsEditorDraftReady] = useState(
        !isEditorPage
    );
    const [activeEditorTool, setActiveEditorTool] =
        useState<EditorTool>('bead');
    const [activeEditorColorRef, setActiveEditorColorRef] = useState<
        string | null
    >(null);
    const [colorPickerPaletteId, setColorPickerPaletteId] =
        useState(DEFAULT_PALETTE_ID);
    const [allBrandPalettes, setAllBrandPalettes] = useState<
        Record<string, Palette>
    >({});
    const [showReference, setShowReference] = useState(true);
    const [referenceOpacity, setReferenceOpacity] = useState(
        DEFAULT_REFERENCE_OPACITY
    );
    const [blankPatternRevision, setBlankPatternRevision] = useState(0);
    const [historyRevision, setHistoryRevision] = useState(0);
    const [manualPatternRevision, setManualPatternRevision] = useState(0);

    const editorRootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const editorPreviewCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewViewportRef = useRef<HTMLDivElement>(null);
    const currentProjectRef = useRef<Project | null>(null);
    const reducedColorRef = useRef<Uint8ClampedArray | null>(null);
    const paletteHistoryRef = useRef<Palette[][]>([]);
    const patternUndoStackRef = useRef<Uint8ClampedArray[]>([]);
    const patternRedoStackRef = useRef<Uint8ClampedArray[]>([]);
    const pendingColorSelectionRef = useRef<ColorPickerSelection | null>(null);
    const pendingEditedPatternRef = useRef<EditorPatternDraft | null>(null);
    const activeEditorColorValueRef = useRef<string | null>(null);
    const editorColorSelectionModeRef = useRef<'auto' | 'manual'>('auto');
    const builtBlankPatternRevisionRef = useRef(-1);
    const skipNextPaletteRebuildRef = useRef(false);
    const panStateRef = useRef<{
        pointerId: number;
        x: number;
        y: number;
        scrollLeft: number;
        scrollTop: number;
    } | null>(null);

    const selectedBoard = getBoardOption(boardId);
    const totalBeads = countBeads(beadsUsage);
    const enabledColorCount = countEnabledEntries(activePalettes);
    const displayPreviewSize = getPreviewRenderSize(
        previewSize,
        previewViewportSize,
        previewZoom
    );
    const colorsUsed = beadsUsage.size;
    const primaryPaletteId = selectedPaletteIds[0] ?? DEFAULT_PALETTE_ID;
    const hasEditablePattern = Boolean(previewDataUrl);
    const canExportPattern =
        hasEditablePattern &&
        totalBeads > 0 &&
        !processing &&
        exportingId === null;
    const hasPendingPatternSettings =
        pendingPrimaryPaletteId !== primaryPaletteId ||
        pendingBoardId !== boardId ||
        pendingBoardWidth !== boardWidth ||
        pendingBoardHeight !== boardHeight;
    const canUndoPattern = historyRevision >= 0 && patternUndoStackRef.current.length > 0;
    const canRedoPattern = historyRevision >= 0 && patternRedoStackRef.current.length > 0;
    const hasManualPatternChanges =
        manualPatternRevision > 0 || canUndoPattern || canRedoPattern;
    const renderEditorCanvasPreview = useCallback(
        (
            patternData: Uint8ClampedArray,
            width: number,
            height: number,
            beadsPerBoard: number,
            showGrid: boolean
        ) => {
            if (!isEditorPage) {
                return;
            }

            const previewCanvas = editorPreviewCanvasRef.current;

            if (!previewCanvas) {
                return;
            }

            const beadSizePx = getPreviewBeadRenderSize(width, height);
            const nextWidth = width * beadSizePx;
            const nextHeight = height * beadSizePx;

            if (previewCanvas.width !== nextWidth) {
                previewCanvas.width = nextWidth;
            }

            if (previewCanvas.height !== nextHeight) {
                previewCanvas.height = nextHeight;
            }

            const previewContext = previewCanvas.getContext('2d');

            if (!previewContext) {
                return;
            }

            drawPatternPreviewToCanvas(
                previewContext,
                patternData,
                width,
                height,
                beadSizePx,
                beadsPerBoard,
                showGrid
            );
        },
        [isEditorPage]
    );
    const patternSize = selectedBoard
        ? `${boardWidth * selectedBoard.beadsPerRow} x ${boardHeight * selectedBoard.beadsPerRow}`
        : 'Unknown';
    const boardCountStatus = `${boardWidth} x ${boardHeight} board${
        boardWidth * boardHeight > 1 ? 's' : ''
    }`;
    const pendingSelectedBoard = getBoardOption(pendingBoardId);
    const pendingPatternSize = pendingSelectedBoard
        ? `${pendingBoardWidth * pendingSelectedBoard.beadsPerRow} x ${pendingBoardHeight * pendingSelectedBoard.beadsPerRow}`
        : 'Unknown';
    const pendingBoardCountStatus = `${pendingBoardWidth} x ${pendingBoardHeight} board${
        pendingBoardWidth * pendingBoardHeight > 1 ? 's' : ''
    }`;
    const pendingPaletteLabel =
        getPaletteOption(pendingPrimaryPaletteId)?.label ?? 'Unknown';
    const primaryPaletteLabel =
        getPaletteOption(primaryPaletteId)?.label ?? 'Unknown';
    const compactColorBrandStatus =
        selectedPaletteIds.length > 1
            ? `${selectedPaletteIds.length} palettes • ${enabledColorCount} colors`
            : `${enabledColorCount} colors`;
    const compactPatternStatus = `${patternSize} pattern • ${boardCountStatus}`;
    const fullscreenPaletteSummary =
        selectedPaletteIds.length > 1
            ? `${primaryPaletteLabel} + ${selectedPaletteIds.length - 1} more`
            : primaryPaletteLabel;
    const allPaletteEntries = activePalettes.flatMap(
        (palette) => palette.entries
    );
    const topUsageEntries = Array.from(beadsUsage.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 8)
        .map(([ref, count]) => ({
            ref,
            count,
            entry: allPaletteEntries.find((paletteEntry) => {
                return paletteEntry.ref === ref;
            }),
        }));
    const activeEditorColorEntry =
        allPaletteEntries.find((entry) => {
            return entry.enabled && entry.ref === activeEditorColorRef;
        }) ??
        topUsageEntries.find(({ entry }) => entry?.enabled)?.entry ??
        allPaletteEntries.find((entry) => entry.enabled) ??
        null;
    const activeEditorColorPaletteId =
        activeEditorColorEntry
            ? selectedPaletteIds.find((paletteId) => {
                  const paletteOption = getPaletteOption(paletteId);

                  if (!paletteOption) {
                      return false;
                  }

                  return activePalettes.some((palette) => {
                      return (
                          palette.name === paletteOption.label &&
                          palette.entries.some((entry) => {
                              return entry.ref === activeEditorColorEntry.ref;
                          })
                      );
                  });
              }) ?? primaryPaletteId
            : primaryPaletteId;
    const loadedAllBrandPaletteCount = Object.keys(allBrandPalettes).length;
    const currentColorPickerPalette =
        allBrandPalettes[colorPickerPaletteId] ?? null;
    const showPreviewRulers = isEditorPage && hasEditablePattern;
    const activeRulerSize = showPreviewRulers
        ? PREVIEW_RULER_SIZE
        : { top: 0, left: 0 };
    const xRulerTicks = showPreviewRulers
        ? getPreviewRulerTicks(previewSize.width, displayPreviewSize.width)
        : [];
    const yRulerTicks = showPreviewRulers
        ? getPreviewRulerTicks(previewSize.height, displayPreviewSize.height)
        : [];
    const previewFrameWidth =
        previewViewportSize.maxWidth + PREVIEW_VIEWPORT_PADDING.horizontal;
    const previewFrameHeight =
        previewViewportSize.maxHeight + PREVIEW_VIEWPORT_PADDING.vertical;
    const previewStageWidth = Math.max(
        previewFrameWidth,
        displayPreviewSize.width +
            activeRulerSize.left +
            PREVIEW_STAGE_SAFE_AREA.right
    );
    const previewStageHeight = Math.max(
        previewFrameHeight,
        displayPreviewSize.height +
            activeRulerSize.top +
            PREVIEW_STAGE_SAFE_AREA.bottom
    );
    const previewUsableWidth =
        previewStageWidth -
        activeRulerSize.left -
        PREVIEW_STAGE_SAFE_AREA.right;
    const previewUsableHeight =
        previewStageHeight -
        activeRulerSize.top -
        PREVIEW_STAGE_SAFE_AREA.bottom;
    const previewImageOffsetLeft =
        activeRulerSize.left +
        Math.max(
            0,
            (previewUsableWidth - displayPreviewSize.width) / 2
        );
    const previewImageOffsetTop =
        activeRulerSize.top +
        Math.max(
            0,
            (previewUsableHeight - displayPreviewSize.height) / 2
        );

    const setAutomaticEditorColorRef = useCallback((nextRef: string | null) => {
        editorColorSelectionModeRef.current = 'auto';
        activeEditorColorValueRef.current = nextRef;
        setActiveEditorColorRef(nextRef);
    }, []);

    const setManualEditorColorRef = useCallback((nextRef: string | null) => {
        editorColorSelectionModeRef.current = 'manual';
        activeEditorColorValueRef.current = nextRef;
        setActiveEditorColorRef(nextRef);
    }, []);

    const syncEditorColorAfterPatternBuild = useCallback(
        (usage: Map<string, number>, palettes: Palette[]) => {
            const currentRef = activeEditorColorValueRef.current;
            const shouldKeepManualSelection =
                editorColorSelectionModeRef.current === 'manual' &&
                Boolean(currentRef) &&
                palettes.some((palette) => {
                    return palette.entries.some((entry) => {
                        return entry.enabled && entry.ref === currentRef;
                    });
                });

            if (shouldKeepManualSelection) {
                return;
            }

            setAutomaticEditorColorRef(
                getAutomaticEditorColorRef(usage, palettes)
            );
        },
        [setAutomaticEditorColorRef]
    );

    const getCurrentEditedPatternDraft = useCallback(() => {
        return encodeEditorPatternDraft(
            reducedColorRef.current,
            previewSize.width,
            previewSize.height
        );
    }, [previewSize.height, previewSize.width]);

    const takePendingEditedPattern = useCallback((
        expectedWidth: number,
        expectedHeight: number
    ) => {
        const pendingDraft = pendingEditedPatternRef.current;

        if (!pendingDraft) {
            return null;
        }

        pendingEditedPatternRef.current = null;

        if (
            pendingDraft.width !== expectedWidth ||
            pendingDraft.height !== expectedHeight
        ) {
            return null;
        }

        return decodeEditorPatternDraft(pendingDraft);
    }, []);

    const syncProjectPalettes = useCallback((palettes: Palette[]) => {
        if (!currentProjectRef.current) {
            return;
        }

        currentProjectRef.current.paletteConfiguration.palettes =
            clonePalettes(palettes);
    }, []);

    const updatePalettes = useCallback((
        updater: (palettes: Palette[]) => Palette[],
        saveHistory = false
    ) => {
        setActivePalettes((previousPalettes) => {
            if (saveHistory) {
                paletteHistoryRef.current.push(clonePalettes(previousPalettes));
            }

            const nextPalettes = updater(previousPalettes);
            syncProjectPalettes(nextPalettes);
            return nextPalettes;
        });
    }, [syncProjectPalettes]);

    const persistEditorDraft = () => {
        saveEditorDraft(
            createEditorDraft({
                sourceMode,
                imageSrc,
                fileName,
                selectedPaletteIds,
                activePalettes,
                boardId,
                boardWidth,
                boardHeight,
                matchingId,
                ditheringId,
                useSymbols,
                exportFormatId,
                imageAdjustments,
                rendererSettings,
                showReference,
                referenceOpacity,
                previewZoom,
                editedPattern: getCurrentEditedPatternDraft(),
            })
        );
    };

    useEffect(() => {
        if (!isEditorPage) {
            return;
        }

        const draft = loadEditorDraft();

        if (draft) {
            const nextSourceMode =
                draft.sourceMode ?? (draft.imageSrc ? 'image' : 'image');

            setSourceMode(nextSourceMode);
            setImageSrc(draft.imageSrc);
            setFileName(draft.fileName);
            setSelectedPaletteIds(draft.selectedPaletteIds);
            setActivePalettes(draft.activePalettes);
            setBoardId(draft.boardId);
            setBoardWidth(draft.boardWidth);
            setBoardHeight(draft.boardHeight);
            setPendingPrimaryPaletteId(
                draft.selectedPaletteIds[0] ?? DEFAULT_PALETTE_ID
            );
            setPendingBoardId(draft.boardId);
            setPendingBoardWidth(draft.boardWidth);
            setPendingBoardHeight(draft.boardHeight);
            setMatchingId(draft.matchingId);
            setDitheringId(draft.ditheringId);
            setUseSymbols(draft.useSymbols);
            setExportFormatId(draft.exportFormatId);
            setImageAdjustments(draft.imageAdjustments);
            setRendererSettings(draft.rendererSettings);
            setShowReference(draft.showReference ?? true);
            setReferenceOpacity(
                clampNumber(
                    draft.referenceOpacity ?? DEFAULT_REFERENCE_OPACITY,
                    0,
                    100
                )
            );
            setPreviewZoom(draft.previewZoom);
            setColorPickerPaletteId(
                draft.selectedPaletteIds[0] ?? DEFAULT_PALETTE_ID
            );
            pendingEditedPatternRef.current = draft.editedPattern ?? null;

            if (nextSourceMode === 'blank') {
                setBlankPatternRevision((previous) => previous + 1);
            }
        }

        setIsEditorDraftReady(true);
    }, [isEditorPage]);

    useEffect(() => {
        activeEditorColorValueRef.current = activeEditorColorRef;
    }, [activeEditorColorRef]);

    useEffect(() => {
        if (!isEditorPage || !previewDataUrl || !selectedBoard) {
            return;
        }

        const patternData = reducedColorRef.current;

        if (!patternData) {
            return;
        }

        renderEditorCanvasPreview(
            patternData,
            previewSize.width,
            previewSize.height,
            selectedBoard.beadsPerRow,
            rendererSettings.showGrid
        );
    }, [
        isEditorPage,
        previewDataUrl,
        previewSize.width,
        previewSize.height,
        selectedBoard,
        rendererSettings.showGrid,
        renderEditorCanvasPreview,
    ]);

    useEffect(() => {
        const viewportElement = previewViewportRef.current;

        if (!viewportElement || !previewDataUrl) {
            return;
        }

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            setPreviewZoom((previousZoom) =>
                clampNumber(
                    Math.round(
                        (previousZoom +
                            (event.deltaY > 0
                                ? -PREVIEW_ZOOM_STEP
                                : PREVIEW_ZOOM_STEP)) *
                            100
                    ) / 100,
                    PREVIEW_MIN_ZOOM,
                    PREVIEW_MAX_ZOOM
                )
            );
        };

        viewportElement.addEventListener('wheel', handleWheel, {
            passive: false,
        });

        return () => {
            viewportElement.removeEventListener('wheel', handleWheel);
        };
    }, [previewDataUrl]);

    useEffect(() => {
        if (!isEditorDraftReady) {
            return;
        }

        saveEditorDraft(
            createEditorDraft({
                sourceMode,
                imageSrc,
                fileName,
                selectedPaletteIds,
                activePalettes,
                boardId,
                boardWidth,
                boardHeight,
                matchingId,
                ditheringId,
                useSymbols,
                exportFormatId,
                imageAdjustments,
                rendererSettings,
                showReference,
                referenceOpacity,
                previewZoom,
                editedPattern: getCurrentEditedPatternDraft(),
            })
        );
    }, [
        activePalettes,
        boardHeight,
        boardId,
        boardWidth,
        ditheringId,
        exportFormatId,
        fileName,
        getCurrentEditedPatternDraft,
        historyRevision,
        imageAdjustments,
        imageSrc,
        isEditorDraftReady,
        matchingId,
        manualPatternRevision,
        previewSize.height,
        previewSize.width,
        referenceOpacity,
        rendererSettings,
        selectedPaletteIds,
        showReference,
        sourceMode,
        useSymbols,
        previewZoom,
    ]);

    useEffect(() => {
        if (!isEditorDraftReady) {
            return;
        }

        let isCancelled = false;

        async function syncSelectedPalettes() {
            try {
                const loadedPalettes = await Promise.all(
                    selectedPaletteIds.map((paletteId) => loadPalette(paletteId))
                );

                if (isCancelled) {
                    return;
                }

                paletteHistoryRef.current = [];
                setActivePalettes((previousPalettes) =>
                    mergePaletteEnabledState(loadedPalettes, previousPalettes)
                );
                setErrorMessage(null);
            } catch (error) {
                const nextMessage =
                    error instanceof Error
                        ? error.message
                        : 'Unexpected palette loading error.';
                setErrorMessage(nextMessage);
            }
        }

        void syncSelectedPalettes();

        return () => {
            isCancelled = true;
        };
    }, [isEditorDraftReady, selectedPaletteIds]);

    useEffect(() => {
        if (
            activeEditorColorRef &&
            allPaletteEntries.some((entry) => {
                return entry.enabled && entry.ref === activeEditorColorRef;
            })
        ) {
            return;
        }

        setAutomaticEditorColorRef(activeEditorColorEntry?.ref ?? null);
    }, [
        activeEditorColorEntry,
        activeEditorColorRef,
        allPaletteEntries,
        setAutomaticEditorColorRef,
    ]);

    useEffect(() => {
        if (
            !isColorPickerOpen ||
            loadedAllBrandPaletteCount === PALETTE_OPTIONS.length
        ) {
            return;
        }

        let isCancelled = false;

        async function loadAllBrandPalettes() {
            try {
                const loadedPalettes = await Promise.all(
                    PALETTE_OPTIONS.map(async (option) => {
                        return [option.id, await loadPalette(option.id)] as const;
                    })
                );

                if (isCancelled) {
                    return;
                }

                setAllBrandPalettes((previous) => {
                    const next = { ...previous };

                    for (const [paletteId, palette] of loadedPalettes) {
                        next[paletteId] = palette;
                    }

                    return next;
                });
            } catch (error) {
                if (isCancelled) {
                    return;
                }

                const nextMessage =
                    error instanceof Error
                        ? error.message
                        : 'Unexpected palette loading error.';
                setErrorMessage(nextMessage);
            }
        }

        void loadAllBrandPalettes();

        return () => {
            isCancelled = true;
        };
    }, [isColorPickerOpen, loadedAllBrandPaletteCount]);

    useEffect(() => {
        const pendingSelection = pendingColorSelectionRef.current;

        if (!pendingSelection) {
            return;
        }

        const paletteOption = getPaletteOption(pendingSelection.paletteId);

        if (!paletteOption) {
            pendingColorSelectionRef.current = null;
            return;
        }

        const targetPalette = activePalettes.find((palette) => {
            return palette.name === paletteOption.label;
        });
        const targetEntry = targetPalette?.entries.find((entry) => {
            return entry.ref === pendingSelection.entryRef;
        });

        if (!targetEntry) {
            return;
        }

        if (!targetEntry.enabled) {
            updatePalettes((palettes) => {
                return enablePaletteEntry(
                    palettes,
                    paletteOption.label,
                    pendingSelection.entryRef
                );
            });
        }

        pendingColorSelectionRef.current = null;
        setManualEditorColorRef(pendingSelection.entryRef);
        setActiveEditorTool('bead');
    }, [activePalettes, setManualEditorColorRef, updatePalettes]);

    useEffect(() => {
        if (!isEditorDraftReady) {
            return;
        }

        if (skipNextPaletteRebuildRef.current) {
            skipNextPaletteRebuildRef.current = false;
            return;
        }

        if (!imageSrc || !selectedBoard || activePalettes.length === 0) {
            return;
        }

        let isCancelled = false;

        async function processImage(): Promise<void> {
            setProcessing(true);
            setErrorMessage(null);

            try {
                const project = buildEditorProject({
                    palettes: activePalettes,
                    boardOption: selectedBoard,
                    boardWidth,
                    boardHeight,
                    matchingId,
                    ditheringId,
                    imageAdjustments,
                    rendererSettings,
                    useSymbols,
                });

                const image = new window.Image();
                image.src = imageSrc;
                image.style.filter = project.imageConfiguration.css();

                await new Promise<void>((resolve, reject) => {
                    image.onload = () => resolve();
                    image.onerror = () =>
                        reject(new Error('Unable to load selected image.'));
                });

                if (isCancelled) {
                    return;
                }

                project.image = { name: fileName, src: image } as LoadImage;
                project.srcWidth = image.width;
                project.srcHeight = image.height;

                const canvas = canvasRef.current;

                if (!canvas) {
                    return;
                }

                canvas.width = boardWidth * selectedBoard.beadsPerRow;
                canvas.height = boardHeight * selectedBoard.beadsPerRow;

                const context = canvas.getContext('2d', {
                    willReadFrequently: true,
                });

                if (!context) {
                    throw new Error('Canvas 2D context is unavailable.');
                }

                context.clearRect(0, 0, canvas.width, canvas.height);

                const imagePosition = drawImageInsideCanvas(
                    canvas,
                    image,
                    project.rendererConfiguration
                );
                const resultImageData = reduceColor(canvas, project, imagePosition);
                const restoredPatternData = takePendingEditedPattern(
                    canvas.width,
                    canvas.height
                );

                if (restoredPatternData) {
                    resultImageData.data.set(restoredPatternData);
                }

                context.putImageData(resultImageData, 0, 0);

                if (isCancelled) {
                    return;
                }

                currentProjectRef.current = project;
                reducedColorRef.current = resultImageData.data;
                patternUndoStackRef.current = [];
                patternRedoStackRef.current = [];
                setManualPatternRevision(restoredPatternData ? 1 : 0);
                setHistoryRevision((previous) => previous + 1);

                const nextUsage = computeUsage(
                    resultImageData.data,
                    project.paletteConfiguration.palettes
                );

                syncEditorColorAfterPatternBuild(
                    nextUsage,
                    project.paletteConfiguration.palettes
                );
                setBeadsUsage(nextUsage);
                setPreviewSize({
                    width: canvas.width,
                    height: canvas.height,
                });
                setPreviewDataUrl(
                    createPatternPreviewDataUrl(
                        resultImageData.data,
                        canvas.width,
                        canvas.height,
                        selectedBoard.beadsPerRow,
                        project.rendererConfiguration.showGrid
                    )
                );
            } catch (error) {
                const nextMessage =
                    error instanceof Error
                        ? error.message
                        : 'Unexpected editor error.';
                setErrorMessage(nextMessage);
                setBeadsUsage(new Map());
                setPreviewDataUrl(null);
                setPreviewSize({ width: 1, height: 1 });
                currentProjectRef.current = null;
                reducedColorRef.current = null;
                patternUndoStackRef.current = [];
                patternRedoStackRef.current = [];
                pendingEditedPatternRef.current = null;
                setManualPatternRevision(0);
                setHistoryRevision((previous) => previous + 1);
            } finally {
                setProcessing(false);
            }
        }

        void processImage();

        return () => {
            isCancelled = true;
        };
    }, [
        activePalettes,
        boardHeight,
        boardId,
        boardWidth,
        ditheringId,
        imageAdjustments,
        imageSrc,
        matchingId,
        rendererSettings,
        selectedBoard,
        setAutomaticEditorColorRef,
        syncEditorColorAfterPatternBuild,
        takePendingEditedPattern,
        fileName,
        useSymbols,
        isEditorDraftReady,
    ]);

    useEffect(() => {
        if (!isEditorDraftReady) {
            return;
        }

        const viewportElement = previewViewportRef.current;

        if (!viewportElement) {
            return;
        }

        const updateViewportSize = () => {
            setPreviewViewportSize({
                maxWidth: Math.max(
                    1,
                    viewportElement.clientWidth - PREVIEW_VIEWPORT_PADDING.horizontal
                ),
                maxHeight: Math.max(
                    1,
                    viewportElement.clientHeight - PREVIEW_VIEWPORT_PADDING.vertical
                ),
            });
        };

        updateViewportSize();

        const resizeObserver = new ResizeObserver(() => {
            updateViewportSize();
        });

        resizeObserver.observe(viewportElement);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isEditorDraftReady, isEditorPage]);

    const createProjectForCurrentSettings = useCallback(
        (
            palettes: Palette[],
            boardOption: NonNullable<typeof selectedBoard>,
            nextBoardWidth: number,
            nextBoardHeight: number
        ) => {
            return buildEditorProject({
                palettes,
                boardOption,
                boardWidth: nextBoardWidth,
                boardHeight: nextBoardHeight,
                matchingId,
                ditheringId,
                imageAdjustments: {
                    brightness: imageAdjustments.brightness,
                    contrast: imageAdjustments.contrast,
                    saturation: imageAdjustments.saturation,
                    grayscale: imageAdjustments.grayscale,
                },
                rendererSettings: {
                    center: rendererSettings.center,
                    fit: rendererSettings.fit,
                    showGrid: rendererSettings.showGrid,
                },
                useSymbols,
            });
        },
        [
            ditheringId,
            imageAdjustments.brightness,
            imageAdjustments.contrast,
            imageAdjustments.grayscale,
            imageAdjustments.saturation,
            matchingId,
            rendererSettings.center,
            rendererSettings.fit,
            rendererSettings.showGrid,
            useSymbols,
        ]
    );

    const initializeBlankPattern = useCallback(
        (
            palettes = activePalettes,
            nextBoardId = boardId,
            nextBoardWidth = boardWidth,
            nextBoardHeight = boardHeight
        ) => {
        const boardOption = getBoardOption(nextBoardId);
        const canvas = canvasRef.current;

        if (!boardOption || !canvas || palettes.length === 0) {
            return;
        }

        const project = createProjectForCurrentSettings(
            palettes,
            boardOption,
            nextBoardWidth,
            nextBoardHeight
        );

        canvas.width = nextBoardWidth * boardOption.beadsPerRow;
        canvas.height = nextBoardHeight * boardOption.beadsPerRow;

        const context = canvas.getContext('2d');

        if (!context) {
            setErrorMessage('Canvas 2D context is unavailable.');
            return;
        }

        const blankData = new Uint8ClampedArray(canvas.width * canvas.height * 4);
        const restoredPatternData = takePendingEditedPattern(
            canvas.width,
            canvas.height
        );
        const nextPatternData = restoredPatternData ?? blankData;
        const blankImageData = context.createImageData(
            canvas.width,
            canvas.height
        );
        blankImageData.data.set(nextPatternData);
        context.putImageData(blankImageData, 0, 0);

        const placeholderImage = new window.Image();
        project.image = {
            name: fileName || 'blank-pattern',
            src: placeholderImage,
        } as LoadImage;
        project.srcWidth = canvas.width;
        project.srcHeight = canvas.height;

        currentProjectRef.current = project;
        reducedColorRef.current = nextPatternData;
        patternUndoStackRef.current = [];
        patternRedoStackRef.current = [];

        const nextUsage = restoredPatternData
            ? computeUsage(nextPatternData, project.paletteConfiguration.palettes)
            : new Map<string, number>();

        setErrorMessage(null);
        syncEditorColorAfterPatternBuild(
            nextUsage,
            project.paletteConfiguration.palettes
        );
        setBeadsUsage(nextUsage);
        setPreviewSize({
            width: canvas.width,
            height: canvas.height,
        });
        setPreviewDataUrl(
            createPatternPreviewDataUrl(
                nextPatternData,
                canvas.width,
                canvas.height,
                boardOption.beadsPerRow,
                rendererSettings.showGrid
            )
        );
        setManualPatternRevision(restoredPatternData ? 1 : 0);
        setHistoryRevision((previous) => previous + 1);
        },
        [
            activePalettes,
            boardHeight,
            boardId,
            boardWidth,
            createProjectForCurrentSettings,
            fileName,
            rendererSettings.showGrid,
            syncEditorColorAfterPatternBuild,
            takePendingEditedPattern,
        ]
    );

    useEffect(() => {
        if (
            !isEditorDraftReady ||
            sourceMode !== 'blank' ||
            activePalettes.length === 0 ||
            builtBlankPatternRevisionRef.current === blankPatternRevision
        ) {
            return;
        }

        builtBlankPatternRevisionRef.current = blankPatternRevision;
        initializeBlankPattern();
    }, [
        activePalettes,
        blankPatternRevision,
        boardHeight,
        boardId,
        boardWidth,
        initializeBlankPattern,
        isEditorDraftReady,
        sourceMode,
    ]);

    const loadSelectedFile = (file: File | null) => {
        if (!file) {
            return;
        }

        editorColorSelectionModeRef.current = 'auto';
        setSourceMode('image');
        builtBlankPatternRevisionRef.current = -1;
        currentProjectRef.current = null;
        reducedColorRef.current = null;
        pendingEditedPatternRef.current = null;
        patternUndoStackRef.current = [];
        patternRedoStackRef.current = [];
        setManualPatternRevision(0);
        setHistoryRevision((previous) => previous + 1);
        setFileName(file.name.replace(/\.[^.]+$/, ''));
        setErrorMessage(null);
        setBeadsUsage(new Map());
        setPreviewDataUrl(null);
        setPreviewSize({ width: 1, height: 1 });
        setPreviewZoom(1);
        setAutomaticEditorColorRef(null);

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            setImageSrc(loadEvent.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        loadSelectedFile(getFirstImageFile(event.target.files));
        event.currentTarget.value = '';
    };

    const handleImageDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setDraggingUpload(false);
        loadSelectedFile(getFirstImageFile(event.dataTransfer.files));
    };

    const handleCreateBlankPattern = () => {
        editorColorSelectionModeRef.current = 'auto';
        setSourceMode('blank');
        setImageSrc(null);
        setFileName('blank-pattern');
        setErrorMessage(null);
        setBeadsUsage(new Map());
        setPreviewDataUrl(null);
        setPreviewSize({ width: 1, height: 1 });
        setPreviewZoom(1);
        setAutomaticEditorColorRef(null);
        pendingEditedPatternRef.current = null;
        patternUndoStackRef.current = [];
        patternRedoStackRef.current = [];
        setManualPatternRevision(0);
        builtBlankPatternRevisionRef.current = -1;
        setBlankPatternRevision((previous) => previous + 1);
    };

    const handleApplyPatternSettings = async () => {
        const boardOption = getBoardOption(pendingBoardId);

        if (!boardOption) {
            setErrorMessage('Selected pegboard is unavailable.');
            return;
        }

        if (
            hasManualPatternChanges &&
            !window.confirm(
                'Changing pattern setup will rebuild the pattern and discard manual bead edits. Continue?'
            )
        ) {
            return;
        }

        setProcessing(true);
        setErrorMessage(null);

        try {
            const nextPalette = await loadPalette(pendingPrimaryPaletteId);
            const nextPalettes = mergePaletteEnabledState(
                [nextPalette],
                activePalettes
            );

            setSelectedPaletteIds([pendingPrimaryPaletteId]);
            setActivePalettes(nextPalettes);
            setBoardId(pendingBoardId);
            setBoardWidth(pendingBoardWidth);
            setBoardHeight(pendingBoardHeight);
            patternUndoStackRef.current = [];
            patternRedoStackRef.current = [];
            pendingEditedPatternRef.current = null;
            setManualPatternRevision(0);

            if (sourceMode === 'blank') {
                builtBlankPatternRevisionRef.current = -1;
                initializeBlankPattern(
                    nextPalettes,
                    pendingBoardId,
                    pendingBoardWidth,
                    pendingBoardHeight
                );
                setBlankPatternRevision((previous) => previous + 1);
            }
        } catch (error) {
            const nextMessage =
                error instanceof Error
                    ? error.message
                    : 'Unexpected settings update error.';
            setErrorMessage(nextMessage);
        } finally {
            setProcessing(false);
        }
    };

    const handlePaletteSelection = (paletteId: string) => {
        setSelectedPaletteIds((previousPaletteIds) => {
            const isSelected = previousPaletteIds.includes(paletteId);

            if (isSelected && previousPaletteIds.length === 1) {
                setErrorMessage('At least one palette must stay enabled.');
                return previousPaletteIds;
            }

            const nextPaletteIds = isSelected
                ? previousPaletteIds.filter((id) => id !== paletteId)
                : PALETTE_OPTIONS.filter((option) => {
                      return [...previousPaletteIds, paletteId].includes(option.id);
                  }).map((option) => option.id);

            setErrorMessage(null);
            return nextPaletteIds;
        });
    };

    const handlePrimaryPaletteChange = (paletteId: string) => {
        setSelectedPaletteIds([paletteId]);
        setPendingPrimaryPaletteId(paletteId);
        setErrorMessage(null);
    };

    const openColorPicker = () => {
        setColorPickerPaletteId(activeEditorColorPaletteId);
        setIsColorPickerOpen(true);
    };

    const handleEditorColorSelection = (
        paletteId: string,
        entry: PaletteEntry
    ) => {
        const paletteOption = getPaletteOption(paletteId);

        if (!paletteOption) {
            return;
        }

        setIsColorPickerOpen(false);
        setErrorMessage(null);

        if (selectedPaletteIds.includes(paletteId)) {
            skipNextPaletteRebuildRef.current = true;
            updatePalettes((palettes) => {
                return enablePaletteEntry(palettes, paletteOption.label, entry.ref);
            });
            setManualEditorColorRef(entry.ref);
            setActiveEditorTool('bead');
            return;
        }

        const paletteFromPicker = allBrandPalettes[paletteId];

        if (!paletteFromPicker) {
            setErrorMessage('Selected color brand is still loading.');
            return;
        }

        pendingColorSelectionRef.current = null;
        skipNextPaletteRebuildRef.current = true;
        updatePalettes((palettes) => {
            const existingPalette = palettes.find((palette) => {
                return palette.name === paletteOption.label;
            });

            if (existingPalette) {
                return enablePaletteEntry(
                    palettes,
                    paletteOption.label,
                    entry.ref
                );
            }

            const clonedPalette = clonePalettes([paletteFromPicker])[0];

            if (!clonedPalette) {
                return palettes;
            }

            const targetEntry = clonedPalette.entries.find((paletteEntry) => {
                return paletteEntry.ref === entry.ref;
            });

            if (targetEntry) {
                targetEntry.enabled = true;
            }

            return [...clonePalettes(palettes), clonedPalette];
        });
        setManualEditorColorRef(entry.ref);
        setActiveEditorTool('bead');
    };

    const setClampedPreviewZoom = (nextZoom: number) => {
        setPreviewZoom(
            clampNumber(
                Math.round(nextZoom * 100) / 100,
                PREVIEW_MIN_ZOOM,
                PREVIEW_MAX_ZOOM
            )
        );
    };

    const adjustPreviewZoom = (delta: number) => {
        setPreviewZoom((previousZoom) =>
            clampNumber(
                Math.round((previousZoom + delta) * 100) / 100,
                PREVIEW_MIN_ZOOM,
                PREVIEW_MAX_ZOOM
            )
        );
    };

    const syncEditedPattern = (
        nextData: Uint8ClampedArray,
        saveHistory = true,
        changedPoints: EditorPoint[] = []
    ) => {
        const project = currentProjectRef.current;
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');

        if (!project || !canvas || !context || !selectedBoard) {
            return;
        }

        const canPatchEditedPixels =
            changedPoints.length > 0 &&
            nextData.length === canvas.width * canvas.height * 4;

        if (saveHistory && reducedColorRef.current) {
            patternUndoStackRef.current.push(
                new Uint8ClampedArray(reducedColorRef.current)
            );
            patternRedoStackRef.current = [];
            setManualPatternRevision((previous) => previous + 1);
            setHistoryRevision((previous) => previous + 1);
        }

        reducedColorRef.current = nextData;

        if (canPatchEditedPixels) {
            const editedPixel = context.createImageData(1, 1);

            for (const point of changedPoints) {
                const index = (point.y * canvas.width + point.x) * 4;
                editedPixel.data[0] = nextData[index];
                editedPixel.data[1] = nextData[index + 1];
                editedPixel.data[2] = nextData[index + 2];
                editedPixel.data[3] = nextData[index + 3];
                context.putImageData(editedPixel, point.x, point.y);
            }
        } else {
            const editedImageData = context.createImageData(
                canvas.width,
                canvas.height
            );
            editedImageData.data.set(nextData);
            context.putImageData(editedImageData, 0, 0);
        }

        setBeadsUsage(
            computeUsage(nextData, project.paletteConfiguration.palettes)
        );
        if (isEditorPage) {
            const beadSizePx = getPreviewBeadRenderSize(
                canvas.width,
                canvas.height
            );
            const previewCanvas = editorPreviewCanvasRef.current;
            const previewContext = previewCanvas?.getContext('2d');
            const canPatchPreview =
                canPatchEditedPixels &&
                previewCanvas &&
                previewContext &&
                previewCanvas.width === canvas.width * beadSizePx &&
                previewCanvas.height === canvas.height * beadSizePx;

            if (canPatchPreview) {
                for (const point of changedPoints) {
                    drawPatternPreviewBeadToCanvas(
                        previewContext,
                        nextData,
                        canvas.width,
                        point,
                        beadSizePx,
                        selectedBoard.beadsPerRow,
                        rendererSettings.showGrid
                    );
                }
            } else {
                renderEditorCanvasPreview(
                    nextData,
                    canvas.width,
                    canvas.height,
                    selectedBoard.beadsPerRow,
                    rendererSettings.showGrid
                );
            }
        } else {
            setPreviewDataUrl(
                createPatternPreviewDataUrl(
                    nextData,
                    canvas.width,
                    canvas.height,
                    selectedBoard.beadsPerRow,
                    rendererSettings.showGrid
                )
            );
        }
    };

    const handleUndoPatternEdit = () => {
        const currentPattern = reducedColorRef.current;
        const previousPattern = patternUndoStackRef.current.pop();

        if (!currentPattern || !previousPattern) {
            return;
        }

        patternRedoStackRef.current.push(new Uint8ClampedArray(currentPattern));
        syncEditedPattern(new Uint8ClampedArray(previousPattern), false);
        setHistoryRevision((previous) => previous + 1);
    };

    const handleRedoPatternEdit = () => {
        const currentPattern = reducedColorRef.current;
        const nextPattern = patternRedoStackRef.current.pop();

        if (!currentPattern || !nextPattern) {
            return;
        }

        patternUndoStackRef.current.push(new Uint8ClampedArray(currentPattern));
        syncEditedPattern(new Uint8ClampedArray(nextPattern), false);
        setHistoryRevision((previous) => previous + 1);
    };

    const getEditorPointFromEvent = (
        event: React.PointerEvent<HTMLCanvasElement>
    ): EditorPoint | null => {
        const rect = event.currentTarget.getBoundingClientRect();

        if (rect.width <= 0 || rect.height <= 0) {
            return null;
        }

        const x = Math.floor(
            ((event.clientX - rect.left) / rect.width) * previewSize.width
        );
        const y = Math.floor(
            ((event.clientY - rect.top) / rect.height) * previewSize.height
        );

        if (x < 0 || y < 0 || x >= previewSize.width || y >= previewSize.height) {
            return null;
        }

        return { x, y };
    };

    const applyEditorToolAtPoint = (point: EditorPoint) => {
        const currentData = reducedColorRef.current;

        if (!currentData || !previewDataUrl) {
            return;
        }

        const width = previewSize.width;
        const index = getPatternDataIndex(width, point);

        if (activeEditorTool === 'pick') {
            const pickedEntry = allPaletteEntries.find((entry) => {
                return (
                    entry.enabled &&
                    paletteEntryMatchesPatternPixel(entry, currentData, index)
                );
            });

            if (pickedEntry) {
                setManualEditorColorRef(pickedEntry.ref);
            }
            return;
        }

        if (activeEditorTool === 'pan') {
            return;
        }

        const nextData = new Uint8ClampedArray(currentData);

        if (activeEditorTool === 'erase') {
            if (nextData[index + 3] === 0) {
                return;
            }

            setPatternPixelToEntry(nextData, width, point, null);
            syncEditedPattern(nextData, true, [point]);
            return;
        }

        if (!activeEditorColorEntry) {
            return;
        }

        if (activeEditorTool === 'fill') {
            if (
                fillMatchingPatternRegion(
                    nextData,
                    width,
                    previewSize.height,
                    point,
                    activeEditorColorEntry
                )
            ) {
                syncEditedPattern(nextData);
            }
            return;
        }

        if (
            paletteEntryMatchesPatternPixel(
                activeEditorColorEntry,
                nextData,
                index
            )
        ) {
            return;
        }

        setPatternPixelToEntry(nextData, width, point, activeEditorColorEntry);
        syncEditedPattern(nextData, true, [point]);
    };

    const handleEditorImagePointerDown = (
        event: React.PointerEvent<HTMLCanvasElement>
    ) => {
        if (activeEditorTool === 'pan') {
            return;
        }

        const point = getEditorPointFromEvent(event);

        if (!point) {
            return;
        }

        event.preventDefault();
        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // Programmatic PointerEvents do not always create an active pointer.
        }
        applyEditorToolAtPoint(point);
    };

    const handleEditorImagePointerMove = (
        event: React.PointerEvent<HTMLCanvasElement>
    ) => {
        if (
            event.buttons !== 1 ||
            (activeEditorTool !== 'bead' && activeEditorTool !== 'erase')
        ) {
            return;
        }

        const point = getEditorPointFromEvent(event);

        if (!point) {
            return;
        }

        event.preventDefault();
        applyEditorToolAtPoint(point);
    };

    const handlePreviewPanPointerDown = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (activeEditorTool !== 'pan') {
            return;
        }

        const viewportElement = previewViewportRef.current;

        if (!viewportElement) {
            return;
        }

        panStateRef.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            scrollLeft: viewportElement.scrollLeft,
            scrollTop: viewportElement.scrollTop,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
    };

    const handlePreviewPanPointerMove = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        const panState = panStateRef.current;
        const viewportElement = previewViewportRef.current;

        if (
            activeEditorTool !== 'pan' ||
            !panState ||
            !viewportElement ||
            panState.pointerId !== event.pointerId
        ) {
            return;
        }

        viewportElement.scrollLeft =
            panState.scrollLeft - (event.clientX - panState.x);
        viewportElement.scrollTop =
            panState.scrollTop - (event.clientY - panState.y);
        event.preventDefault();
    };

    const handlePreviewPanPointerUp = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (panStateRef.current?.pointerId === event.pointerId) {
            panStateRef.current = null;
        }
    };

    const handleOpenEditorPage = () => {
        persistEditorDraft();
        router.push('/editor');
    };

    const handleGridExport = () => {
        if (!canvasRef.current) {
            return;
        }

        const sourceCanvas = canvasRef.current;
        const cellSize = 20;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = sourceCanvas.width * cellSize;
        exportCanvas.height = sourceCanvas.height * cellSize;

        const sourceContext = sourceCanvas.getContext('2d', {
            willReadFrequently: true,
        });
        const exportContext = exportCanvas.getContext('2d');

        if (!sourceContext || !exportContext) {
            return;
        }

        const sourceImageData = sourceContext.getImageData(
            0,
            0,
            sourceCanvas.width,
            sourceCanvas.height
        );
        const beadsPerBoard =
            currentProjectRef.current?.boardConfiguration.board.nbBeadPerRow ?? 29;

        drawGridExportPattern(
            exportContext,
            sourceImageData.data,
            sourceCanvas.width,
            sourceCanvas.height,
            {
                cellSize,
                beadsPerBoard,
            }
        );

        const link = document.createElement('a');
        link.download = `${fileName}_grid.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    };

    const handleExport = async (exportId: string) => {
        if (
            !currentProjectRef.current ||
            !reducedColorRef.current ||
            beadsUsage.size === 0
        ) {
            return;
        }

        currentProjectRef.current.exportConfiguration.useSymbols = useSymbols;
        currentProjectRef.current.image.name = fileName;

        setExportingId(exportId);

        try {
            await exportEditorPattern({
                exportId,
                reducedColor: reducedColorRef.current,
                beadsUsage,
                project: currentProjectRef.current,
                fileName,
                exportGridPng: handleGridExport,
            });
        } catch (error) {
            const nextMessage =
                error instanceof Error
                    ? error.message
                    : 'Unexpected export error.';
            setErrorMessage(nextMessage);
        } finally {
            setExportingId(null);
        }
    };

    const handleEditorShortcuts = React.useEffectEvent(
        (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTypingTarget =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                Boolean(target?.isContentEditable);

            if (isTypingTarget) {
                return;
            }

            const action = getEditorShortcutAction(event, {
                hasPreview: Boolean(previewDataUrl),
                isColorPickerOpen,
            });

            if (!action) {
                return;
            }

            event.preventDefault();

            switch (action.type) {
                case 'undo':
                    handleUndoPatternEdit();
                    break;
                case 'redo':
                    handleRedoPatternEdit();
                    break;
                case 'set-tool':
                    setActiveEditorTool(action.tool);
                    break;
                case 'adjust-preview-zoom':
                    adjustPreviewZoom(
                        action.direction * PREVIEW_ZOOM_STEP
                    );
                    break;
                case 'close-color-picker':
                    setIsColorPickerOpen(false);
                    break;
            }
        }
    );

    useEffect(() => {
        if (!isEditorPage) {
            return;
        }

        const handleWindowShortcuts = (event: KeyboardEvent) => {
            handleEditorShortcuts(event);
        };

        document.addEventListener('keydown', handleWindowShortcuts);

        return () => {
            document.removeEventListener('keydown', handleWindowShortcuts);
        };
    }, [isEditorPage]);

    return (
        <div
            ref={editorRootRef}
            className={
                isEditorPage
                    ? 'h-screen w-full overflow-hidden bg-brutal-bg'
                    : 'w-full space-y-6'
            }
        >
            {isEditorPage && !isEditorDraftReady ? (
                <div className="flex h-full min-h-screen items-center justify-center border-4 border-brutal-black bg-brutal-bg font-vt323 text-3xl uppercase tracking-[0.08em] text-brutal-black">
                    Loading Editor...
                </div>
            ) : null}

            {errorMessage && (
                <div className="border-4 border-brutal-black bg-brand-magenta px-4 py-3 font-bold text-white shadow-brutal">
                    {errorMessage}
                </div>
            )}

            {isEditorPage ? (
                isEditorDraftReady ? (
                <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[52px_minmax(0,1fr)] overflow-hidden border-4 border-brutal-black bg-brutal-bg text-brutal-black xl:grid-cols-[232px_minmax(0,1fr)_312px]">
                    <div className="col-span-full flex min-w-0 items-stretch justify-between border-b-4 border-brutal-black bg-brand-cyan">
                        <div className="flex min-w-0 flex-1 items-center gap-2 px-3 sm:gap-3">
                            <Link
                                href="/"
                                aria-label="Back to generator"
                                className="flex h-8 w-8 shrink-0 items-center justify-center border-4 border-brutal-black bg-white font-vt323 text-3xl leading-none text-brutal-black shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-yellow"
                                title="Back to generator"
                            >
                                &lt;
                            </Link>
                            <div className="pointer-events-none flex min-w-0 items-center gap-3 truncate">
                                <span className="max-w-[130px] truncate border-4 border-brutal-black bg-brand-yellow px-3 py-1 font-vt323 text-2xl uppercase leading-none shadow-[2px_2px_0_0_#1a1a1a] sm:max-w-none sm:text-3xl">
                                    Bead Pattern Editor
                                </span>
                                <span className="hidden text-[10px] font-black uppercase tracking-[0.16em] text-brutal-black/70 2xl:inline">
                                    Manual cleanup workspace
                                </span>
                            </div>
                        </div>
                        <div className="flex h-full shrink-0 items-center">
                            {hasEditablePattern ? (
                                <>
                                    <div className="hidden h-full items-center gap-1 border-l-4 border-brutal-black bg-white px-3 sm:flex">
                                        <span className="mr-1 hidden text-[10px] font-black uppercase tracking-[0.12em] text-brutal-black/65 2xl:inline">
                                            Zoom
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                adjustPreviewZoom(-PREVIEW_ZOOM_STEP)
                                            }
                                            disabled={
                                                previewZoom <= PREVIEW_MIN_ZOOM
                                            }
                                            className="flex h-7 min-w-7 items-center justify-center border-2 border-brutal-black bg-white px-2 text-sm font-black shadow-[1px_1px_0_0_#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-300 disabled:shadow-none"
                                            aria-label="Zoom out"
                                        >
                                            -
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setClampedPreviewZoom(1)}
                                            className="h-7 min-w-12 border-2 border-brutal-black bg-white px-2 text-[11px] font-black shadow-[1px_1px_0_0_#1a1a1a] hover:bg-brand-yellow"
                                            aria-label="Reset zoom"
                                        >
                                            {Math.round(previewZoom * 100)}%
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                adjustPreviewZoom(PREVIEW_ZOOM_STEP)
                                            }
                                            disabled={
                                                previewZoom >= PREVIEW_MAX_ZOOM
                                            }
                                            className="flex h-7 min-w-7 items-center justify-center border-2 border-brutal-black bg-white px-2 text-sm font-black shadow-[1px_1px_0_0_#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-300 disabled:shadow-none"
                                            aria-label="Zoom in"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleUndoPatternEdit}
                                        disabled={!canUndoPattern}
                                        className="h-full border-l-4 border-brutal-black bg-white px-3 text-xs font-black uppercase tracking-[0.12em] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white sm:px-4"
                                    >
                                        Undo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRedoPatternEdit}
                                        disabled={!canRedoPattern}
                                        className="h-full border-l-4 border-brutal-black bg-white px-3 text-xs font-black uppercase tracking-[0.12em] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white sm:px-4"
                                    >
                                        Redo
                                    </button>
                                </>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => setIsExportDialogOpen(true)}
                                disabled={!canExportPattern}
                                title={
                                    canExportPattern
                                        ? 'Export pattern'
                                        : 'Create or import a pattern before exporting'
                                }
                                className="h-full border-l-4 border-brutal-black bg-brand-purple px-4 text-xs font-black uppercase tracking-[0.12em] text-brutal-black hover:bg-brand-yellow disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                            >
                                <span className="hidden sm:inline">
                                    Export Pattern
                                </span>
                                <span className="sm:hidden">Export</span>
                            </button>
                        </div>
                    </div>

                    <aside className="hidden min-h-0 overflow-y-auto border-r-4 border-brutal-black bg-white xl:block">
                        <div className="space-y-5 p-3">
                            <div>
                                <div className="mb-2 inline-flex border-2 border-brutal-black bg-brand-yellow px-2 py-0.5 font-vt323 text-xl uppercase leading-none shadow-[2px_2px_0_0_#1a1a1a]">
                                    Tools
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {EDITOR_TOOLS.map((tool) => (
                                        <button
                                            key={tool.id}
                                            type="button"
                                            aria-label={tool.label}
                                            aria-pressed={
                                                activeEditorTool === tool.id
                                            }
                                            title={`${tool.label} (${tool.shortcut}) • ${tool.description}`}
                                            onClick={() =>
                                                setActiveEditorTool(tool.id)
                                            }
                                            className={`flex h-9 w-9 items-center justify-center justify-self-center border-2 transition-colors ${
                                                activeEditorTool === tool.id
                                                    ? 'border-brutal-black bg-brand-yellow text-brutal-black shadow-[2px_2px_0_0_#1a1a1a]'
                                                    : 'border-brutal-black/15 bg-white text-gray-500 hover:border-brutal-black hover:bg-brand-cyan hover:text-brutal-black'
                                            }`}
                                        >
                                            <tool.icon
                                                className="h-[18px] w-[18px]"
                                                strokeWidth={2.1}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 inline-flex border-2 border-brutal-black bg-brand-cyan px-2 py-0.5 font-vt323 text-xl uppercase leading-none shadow-[2px_2px_0_0_#1a1a1a]">
                                    Bead Color
                                </div>
                                {activeEditorColorEntry && (
                                    <button
                                        type="button"
                                        onClick={openColorPicker}
                                        className="mb-3 block w-full border-2 border-brutal-black bg-brutal-bg p-2 text-left shadow-[2px_2px_0_0_#1a1a1a] transition-colors hover:bg-brand-yellow"
                                        title="Select bead color"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="h-9 w-9 shrink-0 rounded-full border-2 border-brutal-black"
                                                style={{
                                                    backgroundColor: `rgb(${activeEditorColorEntry.color.r} ${activeEditorColorEntry.color.g} ${activeEditorColorEntry.color.b})`,
                                                }}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block break-words text-[13px] font-bold leading-4 text-brutal-black">
                                                    {activeEditorColorEntry.name}
                                                </span>
                                                <span className="mt-0.5 block text-[11px] font-semibold uppercase leading-4 text-brutal-black/60">
                                                    {activeEditorColorEntry.ref}
                                                </span>
                                            </span>
                                        </div>
                                    </button>
                                )}

                                <div className="mb-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-brutal-black/65">
                                        Quick Colors
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {topUsageEntries.length > 0 ? (
                                        topUsageEntries.map(
                                            ({ ref, entry }) => (
                                                <button
                                                    key={ref}
                                                    type="button"
                                                    title={entry?.name ?? ref}
                                                    aria-pressed={
                                                        activeEditorColorRef ===
                                                        ref
                                                    }
                                                    onClick={() => {
                                                        setManualEditorColorRef(ref);
                                                        setActiveEditorTool('bead');
                                                    }}
                                                    className={`flex min-h-11 items-center gap-3 border-2 px-2.5 py-2 text-left transition-colors ${
                                                        activeEditorColorRef === ref
                                                            ? 'border-brutal-black bg-brand-cyan shadow-[2px_2px_0_0_#1a1a1a]'
                                                            : 'border-brutal-black/15 bg-white hover:border-brutal-black hover:bg-brand-yellow'
                                                    }`}
                                                >
                                                    <span
                                                        className="h-5 w-5 shrink-0 rounded-full border-2 border-brutal-black"
                                                        style={{
                                                            backgroundColor: entry
                                                                ? `rgb(${entry.color.r} ${entry.color.g} ${entry.color.b})`
                                                                : '#d1d5db',
                                                        }}
                                                    />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block whitespace-normal text-[13px] font-bold leading-4 text-brutal-black">
                                                            {entry?.name ?? ref}
                                                        </span>
                                                        <span className="mt-0.5 block text-[11px] font-semibold uppercase leading-4 text-brutal-black/55">
                                                            {entry?.ref ?? ref}
                                                        </span>
                                                    </span>
                                                </button>
                                            )
                                        )
                                    ) : (
                                        <div className="border-2 border-dashed border-brutal-black/25 bg-brutal-bg p-2 text-[10px] font-black uppercase tracking-[0.12em] text-brutal-black/45">
                                            No colors yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="relative min-h-0 overflow-hidden bg-brutal-bg xl:col-start-2">
                        {processing && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                                <span className="animate-pulse border-4 border-brutal-black bg-brand-yellow p-4 font-vt323 text-3xl text-black shadow-brutal">
                                    PROCESSING...
                                </span>
                            </div>
                        )}

                        <div
                            ref={previewViewportRef}
                            onPointerDown={handlePreviewPanPointerDown}
                            onPointerMove={handlePreviewPanPointerMove}
                            onPointerUp={handlePreviewPanPointerUp}
                            onPointerCancel={handlePreviewPanPointerUp}
                            className={`absolute inset-0 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                                activeEditorTool === 'pan'
                                    ? 'cursor-grab active:cursor-grabbing'
                                    : ''
                            }`}
                        >
                            {!hasEditablePattern && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center text-brutal-black/55">
                                    <div
                                        className="grid h-20 w-20 grid-cols-3 grid-rows-3 gap-1"
                                        aria-hidden="true"
                                    >
                                        {Array.from({ length: 9 }).map(
                                            (_, index) => (
                                                <span
                                                    key={index}
                                                    className="border-2 border-dashed border-brutal-black/35 bg-white"
                                                />
                                            )
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-brutal-black/65">
                                            Choose a start point
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            <label
                                                htmlFor={
                                                    EDITOR_EMPTY_UPLOAD_INPUT_ID
                                                }
                                                className="cursor-pointer border-4 border-brutal-black bg-brand-yellow px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-brutal-black shadow-brutal-sm hover:bg-white"
                                            >
                                                Convert Image
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleCreateBlankPattern}
                                                className="border-4 border-brutal-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-brutal-black shadow-brutal-sm hover:bg-brand-cyan"
                                            >
                                                Blank Pattern
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        id={EDITOR_EMPTY_UPLOAD_INPUT_ID}
                                        name="editorEmptyImage"
                                        aria-label="Convert an image in the editor"
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                            )}

                            <div
                                className="grid min-h-full min-w-full place-items-center"
                                style={{
                                    minWidth: `${previewStageWidth}px`,
                                    minHeight: `${previewStageHeight}px`,
                                }}
                            >
                                {hasEditablePattern && previewDataUrl && (
                                    <div
                                        className="relative"
                                        style={{
                                            width: `${previewStageWidth}px`,
                                            height: `${previewStageHeight}px`,
                                        }}
                                    >
                                        {showPreviewRulers && (
                                            <>
                                                <div
                                                    className="pointer-events-none absolute"
                                                    style={{
                                                        left: '0px',
                                                        top: '0px',
                                                        width: `${previewStageWidth}px`,
                                                        height: `${PREVIEW_RULER_SIZE.top}px`,
                                                    }}
                                                    aria-hidden="true"
                                                >
                                                    {xRulerTicks.map((tick) => (
                                                        <div
                                                            key={`x-${tick.value}`}
                                                            className="absolute bottom-0 -translate-x-1/2"
                                                            style={{
                                                                left: `${previewImageOffsetLeft + tick.ratio * displayPreviewSize.width}px`,
                                                            }}
                                                        >
                                                            {tick.showLabel && (
                                                                <span className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap bg-brutal-bg px-0.5 text-[10px] leading-none text-gray-600">
                                                                    {tick.value}
                                                                </span>
                                                            )}
                                                            <span
                                                                className={`block w-px ${
                                                                    tick.showLabel
                                                                        ? 'h-3 bg-gray-500'
                                                                        : 'h-2 bg-gray-300'
                                                                }`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div
                                                    className="pointer-events-none absolute"
                                                    style={{
                                                        left: '0px',
                                                        top: '0px',
                                                        width: `${PREVIEW_RULER_SIZE.left}px`,
                                                        height: `${previewStageHeight}px`,
                                                    }}
                                                    aria-hidden="true"
                                                >
                                                    {yRulerTicks.map((tick) => (
                                                        <div
                                                            key={`y-${tick.value}`}
                                                            className="absolute right-0 -translate-y-1/2"
                                                            style={{
                                                                top: `${previewImageOffsetTop + tick.ratio * displayPreviewSize.height}px`,
                                                            }}
                                                        >
                                                            {tick.showLabel && (
                                                                <span className="absolute right-4 top-1/2 z-10 -translate-y-1/2 whitespace-nowrap bg-brutal-bg px-0.5 text-[10px] leading-none text-gray-600">
                                                                    {tick.value}
                                                                </span>
                                                            )}
                                                            <span
                                                                className={`block h-px ${
                                                                    tick.showLabel
                                                                        ? 'w-3 bg-gray-500'
                                                                        : 'w-2 bg-gray-300'
                                                                }`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        <canvas
                                            ref={editorPreviewCanvasRef}
                                            aria-label="Bead pattern preview"
                                            onPointerDown={
                                                handleEditorImagePointerDown
                                            }
                                            onPointerMove={
                                                handleEditorImagePointerMove
                                            }
                                            className={`absolute block max-w-none select-none bg-white ${
                                                activeEditorTool === 'pan'
                                                    ? 'cursor-grab'
                                                    : activeEditorTool === 'pick'
                                                      ? 'cursor-crosshair'
                                                      : 'cursor-cell'
                                            }`}
                                            style={{
                                                left: `${previewImageOffsetLeft}px`,
                                                top: `${previewImageOffsetTop}px`,
                                                width: `${displayPreviewSize.width}px`,
                                                height: `${displayPreviewSize.height}px`,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>

                    <aside className="hidden min-h-0 overflow-y-auto border-l-4 border-brutal-black bg-white xl:col-start-3 xl:block">
                        <div className="border-b-4 border-brutal-black p-4">
                            <div className="mb-3 inline-flex border-2 border-brutal-black bg-brand-yellow px-2 py-0.5 font-vt323 text-xl uppercase leading-none shadow-[2px_2px_0_0_#1a1a1a]">
                                Project
                            </div>
                            <dl className="space-y-2 text-sm font-semibold">
                                <div className="flex justify-between gap-3 border-b border-brutal-black/10 pb-1">
                                    <dt className="text-brutal-black/60">
                                        Pattern Size
                                    </dt>
                                    <dd className="text-right font-black">
                                        {patternSize}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3 border-b border-brutal-black/10 pb-1">
                                    <dt className="text-brutal-black/60">
                                        Total Beads
                                    </dt>
                                    <dd className="text-right font-black">
                                        {totalBeads}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt className="text-brutal-black/60">Colors</dt>
                                    <dd className="text-right font-black">
                                        {colorsUsed}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {imageSrc && (
                            <div className="border-b-4 border-brutal-black p-4">
                                <div className="mb-3 inline-flex border-2 border-brutal-black bg-brand-cyan px-2 py-0.5 font-vt323 text-xl uppercase leading-none shadow-[2px_2px_0_0_#1a1a1a]">
                                    Source Image
                                </div>
                                <label
                                    htmlFor={IMAGE_UPLOAD_INPUT_ID}
                                    className="group relative block h-24 cursor-pointer overflow-hidden border-2 border-brutal-black bg-brutal-bg"
                                    title="Change source image"
                                >
                                    <NextImage
                                        src={imageSrc}
                                        alt="Source image"
                                        fill
                                        unoptimized
                                        className="object-contain"
                                        style={{
                                            opacity: showReference
                                                ? referenceOpacity / 100
                                                : 0.28,
                                        }}
                                    />
                                    <span className="absolute inset-x-0 bottom-0 translate-y-full bg-brutal-black px-2 py-1 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white transition-transform group-hover:translate-y-0 group-focus-within:translate-y-0">
                                        Change Source
                                    </span>
                                    <input
                                        id={IMAGE_UPLOAD_INPUT_ID}
                                        name="editorSourceImage"
                                        aria-label="Change editor source image"
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                                <div className="mt-3 space-y-3">
                                    <label
                                        htmlFor={EDITOR_SOURCE_VISIBLE_ID}
                                        className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.08em] text-brutal-black"
                                    >
                                        <span>Show Source</span>
                                        <input
                                            id={EDITOR_SOURCE_VISIBLE_ID}
                                            name="editorSourceVisible"
                                            type="checkbox"
                                            checked={showReference}
                                            onChange={(event) =>
                                                setShowReference(
                                                    event.target.checked
                                                )
                                            }
                                            className="h-4 w-4 accent-black"
                                        />
                                    </label>
                                    <label
                                        htmlFor={EDITOR_SOURCE_OPACITY_ID}
                                        className="block"
                                    >
                                        <span className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-[0.08em] text-brutal-black">
                                            <span>Source Opacity</span>
                                            <span>{referenceOpacity}%</span>
                                        </span>
                                        <input
                                            id={EDITOR_SOURCE_OPACITY_ID}
                                            name="editorSourceOpacity"
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={referenceOpacity}
                                            disabled={!showReference}
                                            onChange={(event) =>
                                                setReferenceOpacity(
                                                    clampNumber(
                                                        Number(
                                                            event.target.value
                                                        ),
                                                        0,
                                                        100
                                                    )
                                                )
                                            }
                                            className="w-full accent-black disabled:opacity-40"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 p-4">
                            <div className="inline-flex border-2 border-brutal-black bg-brand-yellow px-2 py-0.5 font-vt323 text-xl uppercase leading-none shadow-[2px_2px_0_0_#1a1a1a]">
                                Pattern Setup
                            </div>
                            <label className="block">
                                <span className="mb-1 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.08em] text-brutal-black/65">
                                    <span>Color Brand</span>
                                    <span className="truncate text-[11px] text-brutal-black">
                                        {fullscreenPaletteSummary}
                                    </span>
                                </span>
                                <select
                                    id={EDITOR_PRIMARY_PALETTE_ID}
                                    name="editorPrimaryPalette"
                                    value={pendingPrimaryPaletteId}
                                    onChange={(event) =>
                                        setPendingPrimaryPaletteId(event.target.value)
                                    }
                                    className="w-full rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                >
                                    {PALETTE_OPTIONS.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.08em] text-brutal-black/65">
                                    <span>Pegboard</span>
                                    <span className="truncate text-[11px] text-brutal-black">
                                        {selectedBoard?.label ?? 'Not selected'}
                                    </span>
                                </span>
                                <select
                                    id={EDITOR_BOARD_ID}
                                    name="editorBoard"
                                    value={pendingBoardId}
                                    onChange={(event) =>
                                        setPendingBoardId(
                                            event.target.value as BoardOptionId
                                        )
                                    }
                                    className="w-full rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                >
                                    {BOARD_OPTIONS.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="mb-1 flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.08em] text-brutal-black/65">
                                        <span>Boards Wide</span>
                                        <span className="text-[11px] text-brutal-black">
                                            {boardWidth}
                                        </span>
                                    </span>
                                    <input
                                        id={EDITOR_BOARD_WIDTH_ID}
                                        name="editorBoardWidth"
                                        type="number"
                                        min="1"
                                        max={MAX_BOARD_COUNT}
                                        value={pendingBoardWidth}
                                        onChange={(event) =>
                                            setPendingBoardWidth(
                                                parseBoardCount(
                                                    event.target.value
                                                )
                                            )
                                        }
                                        className="w-full rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.08em] text-brutal-black/65">
                                        <span>Boards Tall</span>
                                        <span className="text-[11px] text-brutal-black">
                                            {boardHeight}
                                        </span>
                                    </span>
                                    <input
                                        id={EDITOR_BOARD_HEIGHT_ID}
                                        name="editorBoardHeight"
                                        type="number"
                                        min="1"
                                        max={MAX_BOARD_COUNT}
                                        value={pendingBoardHeight}
                                        onChange={(event) =>
                                            setPendingBoardHeight(
                                                parseBoardCount(
                                                    event.target.value
                                                )
                                            )
                                        }
                                        className="w-full rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                    />
                                </label>
                            </div>
                            {hasPendingPatternSettings ? (
                                <div className="border-2 border-brutal-black bg-brutal-bg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-brutal-black/70">
                                    {pendingPaletteLabel} · {pendingPatternSize}{' '}
                                    · {pendingBoardCountStatus}
                                </div>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => void handleApplyPatternSettings()}
                                disabled={
                                    !hasPendingPatternSettings || processing
                                }
                                className="w-full border-4 border-brutal-black bg-brand-purple px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-brutal-black shadow-brutal-sm hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </aside>

                </div>
                ) : null
            ) : (
            <div className="grid items-stretch gap-6 xl:h-[calc(100svh-330px)] xl:min-h-[560px] xl:max-h-[640px] xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
                <div className="min-h-0 xl:h-full">
                    <Card className="h-full overflow-y-auto bg-brand-cyan p-2.5">
                        <div className="space-y-2">
                            <EditorSection title="Image">
                                <label
                                    htmlFor={IMAGE_UPLOAD_INPUT_ID}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        setDraggingUpload(true);
                                    }}
                                    onDragLeave={() => setDraggingUpload(false)}
                                    onDrop={handleImageDrop}
                                    className={`group relative block w-full cursor-pointer text-center transition-colors ${
                                        imageSrc
                                            ? 'mx-auto max-w-[340px] overflow-hidden rounded-md border border-[#cfd6dc] bg-[#eef1f4] p-0 hover:border-[#9aa7b0]'
                                            : `border-4 border-dashed border-brutal-black p-3 ${
                                                  draggingUpload
                                                      ? 'bg-brand-yellow'
                                                      : 'bg-white hover:bg-gray-50'
                                              }`
                                    }`}
                                >
                                    {imageSrc ? (
                                        <span className="relative block overflow-hidden rounded-md">
                                            <span className="relative block h-[118px] bg-[#f4f6f7] sm:h-[132px]">
                                                <NextImage
                                                    src={imageSrc}
                                                    alt="Uploaded source image"
                                                    fill
                                                    unoptimized
                                                    className="object-contain"
                                                />
                                            </span>
                                            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-[#54595d] px-3 py-2 text-center text-[11px] font-bold uppercase leading-none tracking-[0.18em] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                                Change Source
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="font-bold text-base uppercase tracking-[0.12em]">
                                            Upload Image
                                        </span>
                                    )}
                                    <input
                                        id={IMAGE_UPLOAD_INPUT_ID}
                                        name="homeSourceImage"
                                        aria-label="Upload or replace source image"
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            </EditorSection>

                            <EditorSection title="Color Brand">
                                <select
                                    id={HOME_PRIMARY_PALETTE_ID}
                                    name="homePrimaryPalette"
                                    aria-label="Color brand"
                                    value={primaryPaletteId}
                                    onChange={(event) =>
                                        handlePrimaryPaletteChange(
                                            event.target.value
                                        )
                                    }
                                    className="w-full appearance-none rounded-none border-4 border-brutal-black bg-white p-1.5 font-vt323 text-xl focus:outline-none"
                                >
                                    {PALETTE_OPTIONS.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                <div className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brutal-black/70">
                                    {compactColorBrandStatus}
                                </div>
                            </EditorSection>

                            <EditorSection title="Pegboard">
                                <select
                                    id={HOME_BOARD_ID}
                                    name="homeBoard"
                                    aria-label="Pegboard"
                                    value={boardId}
                                    onChange={(event) =>
                                        setBoardId(
                                            event.target.value as BoardOptionId
                                        )
                                    }
                                    className="w-full appearance-none rounded-none border-4 border-brutal-black bg-white p-1.5 font-vt323 text-xl focus:outline-none"
                                >
                                    {BOARD_OPTIONS.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-brutal-black/70">
                                            Boards Wide
                                        </label>
                                        <input
                                            id={HOME_BOARD_WIDTH_ID}
                                            name="homeBoardWidth"
                                            aria-label="Boards wide"
                                            type="number"
                                            min="1"
                                            max={MAX_BOARD_COUNT}
                                            value={boardWidth}
                                            onChange={(event) =>
                                                setBoardWidth(
                                                    parseBoardCount(
                                                        event.target.value
                                                    )
                                                )
                                            }
                                            className="w-full rounded-none border-4 border-brutal-black bg-white p-1.5 font-vt323 text-xl font-bold focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-brutal-black/70">
                                            Boards Tall
                                        </label>
                                        <input
                                            id={HOME_BOARD_HEIGHT_ID}
                                            name="homeBoardHeight"
                                            aria-label="Boards tall"
                                            type="number"
                                            min="1"
                                            max={MAX_BOARD_COUNT}
                                            value={boardHeight}
                                            onChange={(event) =>
                                                setBoardHeight(
                                                    parseBoardCount(
                                                        event.target.value
                                                    )
                                                )
                                            }
                                            className="w-full rounded-none border-4 border-brutal-black bg-white p-1.5 font-vt323 text-xl font-bold focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brutal-black/70">
                                    {compactPatternStatus}
                                </div>
                            </EditorSection>

                            <div className="grid grid-cols-3 gap-2 border-t-4 border-brutal-black/15 pt-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full px-2 py-1 text-base"
                                    onClick={() => setIsPaletteManagerOpen(true)}
                                >
                                    Colors
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full px-2 py-1 text-base"
                                    onClick={() => setIsAdvancedOpen(true)}
                                >
                                    Advanced
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="w-full px-2 py-1 text-base disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={() => setIsExportDialogOpen(true)}
                                    disabled={!canExportPattern}
                                >
                                    Export
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {isAdvancedOpen && (
                        <EditorDialog
                            title="Advanced"
                            summary="Matching, dithering, image filters, renderer"
                            onClose={() => setIsAdvancedOpen(false)}
                        >
                            <div className="space-y-5 text-black">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor={EDITOR_MATCHING_ID}
                                        className="mb-1 block font-bold"
                                    >
                                        Matching
                                    </label>
                                    <select
                                        id={EDITOR_MATCHING_ID}
                                        name="editorMatching"
                                        value={matchingId}
                                        onChange={(event) =>
                                            setMatchingId(event.target.value)
                                        }
                                        className="w-full appearance-none rounded-none border-4 border-brutal-black bg-white p-2 font-vt323 text-xl text-black focus:outline-none"
                                    >
                                        {MATCHING_OPTIONS.map((option) => (
                                            <option
                                                key={option.id}
                                                value={option.id}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor={EDITOR_DITHERING_ID}
                                        className="mb-1 block font-bold"
                                    >
                                        Dithering
                                    </label>
                                    <select
                                        id={EDITOR_DITHERING_ID}
                                        name="editorDithering"
                                        value={ditheringId}
                                        onChange={(event) =>
                                            setDitheringId(event.target.value)
                                        }
                                        className="w-full appearance-none rounded-none border-4 border-brutal-black bg-white p-2 font-vt323 text-xl text-black focus:outline-none"
                                    >
                                        {DITHERING_OPTIONS.map((option) => (
                                            <option
                                                key={option.id}
                                                value={option.id}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                                {(
                                    [
                                        ['brightness', 'Brightness', 0, 200],
                                        ['contrast', 'Contrast', 0, 200],
                                        ['saturation', 'Saturation', 0, 200],
                                        ['grayscale', 'Grayscale', 0, 100],
                                    ] as const
                                ).map(([key, label, min, max]) => {
                                    const numberId = `editor-image-${key}-number`;
                                    const rangeId = `editor-image-${key}-range`;

                                    return (
                                        <div
                                            key={key}
                                            className="space-y-2 border-4 border-brutal-black bg-white p-3 text-black"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <label
                                                    htmlFor={numberId}
                                                    className="font-bold uppercase"
                                                >
                                                    {label}
                                                </label>
                                                <input
                                                    id={numberId}
                                                    name={numberId}
                                                    type="number"
                                                    min={min}
                                                    max={max}
                                                    value={imageAdjustments[key]}
                                                    onChange={(event) =>
                                                        setImageAdjustments(
                                                            (previous) => ({
                                                                ...previous,
                                                                [key]: clampNumber(
                                                                    Number.parseInt(
                                                                        event.target
                                                                            .value,
                                                                        10
                                                                    ) || min,
                                                                    min,
                                                                    max
                                                                ),
                                                            })
                                                        )
                                                    }
                                                    className="w-24 rounded-none border-4 border-brutal-black bg-white p-1 font-vt323 text-xl text-black"
                                                />
                                            </div>
                                            <input
                                                id={rangeId}
                                                name={rangeId}
                                                aria-label={`${label} slider`}
                                                type="range"
                                                min={min}
                                                max={max}
                                                value={imageAdjustments[key]}
                                                onChange={(event) =>
                                                    setImageAdjustments(
                                                        (previous) => ({
                                                            ...previous,
                                                            [key]: Number.parseInt(
                                                                event.target.value,
                                                                10
                                                            ),
                                                        })
                                                    )
                                                }
                                                className="w-full accent-black"
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                                <label
                                    htmlFor={EDITOR_RENDER_CENTER_ID}
                                    className="flex items-center gap-3 border-4 border-brutal-black bg-white px-3 py-2 font-bold uppercase text-black"
                                >
                                    <input
                                        id={EDITOR_RENDER_CENTER_ID}
                                        name="editorRenderCenter"
                                        type="checkbox"
                                        checked={rendererSettings.center}
                                        onChange={(event) =>
                                            setRendererSettings(
                                                (previous) => ({
                                                    ...previous,
                                                    center:
                                                        event.target.checked,
                                                })
                                            )
                                        }
                                        className="h-5 w-5 accent-black"
                                    />
                                    Center
                                </label>
                                <label
                                    htmlFor={EDITOR_RENDER_FIT_ID}
                                    className="flex items-center gap-3 border-4 border-brutal-black bg-white px-3 py-2 font-bold uppercase text-black"
                                >
                                    <input
                                        id={EDITOR_RENDER_FIT_ID}
                                        name="editorRenderFit"
                                        type="checkbox"
                                        checked={rendererSettings.fit}
                                        onChange={(event) =>
                                            setRendererSettings(
                                                (previous) => ({
                                                    ...previous,
                                                    fit: event.target.checked,
                                                })
                                            )
                                        }
                                        className="h-5 w-5 accent-black"
                                    />
                                    Fit To Boards
                                </label>
                                <label
                                    htmlFor={EDITOR_RENDER_GRID_ID}
                                    className="flex items-center gap-3 border-4 border-brutal-black bg-white px-3 py-2 font-bold uppercase text-black md:col-span-2 xl:col-span-1"
                                >
                                    <input
                                        id={EDITOR_RENDER_GRID_ID}
                                        name="editorRenderGrid"
                                        type="checkbox"
                                        checked={
                                            rendererSettings.showGrid
                                        }
                                        onChange={(event) =>
                                            setRendererSettings(
                                                (previous) => ({
                                                    ...previous,
                                                    showGrid:
                                                        event.target.checked,
                                                })
                                            )
                                        }
                                        className="h-5 w-5 accent-black"
                                    />
                                    Show Board Grid In Preview
                                </label>
                            </div>

                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => {
                                    setImageAdjustments(
                                        DEFAULT_IMAGE_ADJUSTMENTS
                                    );
                                    setRendererSettings(
                                        DEFAULT_RENDERER_SETTINGS
                                    );
                                }}
                            >
                                Reset Advanced
                            </Button>
                        </div>
                        </EditorDialog>
                    )}

                    {isPaletteManagerOpen && (
                        <EditorDialog
                            title="Colors"
                            summary={`${selectedPaletteIds.length} palettes selected • ${enabledColorCount} enabled colors`}
                            onClose={() => setIsPaletteManagerOpen(false)}
                        >
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {PALETTE_OPTIONS.map((option) => {
                                    const selected =
                                        selectedPaletteIds.includes(option.id);
                                    const optionInputId = `palette-option-${getControlToken(option.id)}`;

                                    return (
                                        <label
                                            key={option.id}
                                            htmlFor={optionInputId}
                                            className={`flex cursor-pointer items-center gap-3 border-4 border-brutal-black px-3 py-2 font-bold ${
                                                selected
                                                    ? 'bg-brand-yellow'
                                                    : 'bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                id={optionInputId}
                                                name={optionInputId}
                                                type="checkbox"
                                                checked={selected}
                                                onChange={() =>
                                                    handlePaletteSelection(
                                                        option.id
                                                    )
                                                }
                                                className="h-5 w-5 accent-black"
                                            />
                                            <span className="text-sm uppercase">
                                                {option.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            <div className="space-y-3">
                                {activePalettes.map((palette) => {
                                    const enabledEntries =
                                        palette.entries.filter(
                                            (entry) => entry.enabled
                                        ).length;
                                    const allEnabled =
                                        enabledEntries ===
                                        palette.entries.length;
                                    const enableAllInputId = `palette-enable-all-${getControlToken(palette.name)}`;

                                    return (
                                        <div
                                            key={palette.name}
                                            className="border-4 border-brutal-black bg-gray-50"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-brutal-black bg-brand-cyan px-3 py-2">
                                                <div>
                                                    <div className="font-vt323 text-2xl uppercase">
                                                        {palette.name}
                                                    </div>
                                                    <div className="text-xs font-bold uppercase tracking-wide">
                                                        {enabledEntries} /{' '}
                                                        {
                                                            palette.entries
                                                                .length
                                                        }{' '}
                                                        enabled
                                                    </div>
                                                </div>
                                                <label
                                                    htmlFor={enableAllInputId}
                                                    className="flex items-center gap-2 border-4 border-brutal-black bg-white px-3 py-2 text-xs font-bold uppercase"
                                                >
                                                    <input
                                                        id={enableAllInputId}
                                                        name={enableAllInputId}
                                                        type="checkbox"
                                                        checked={allEnabled}
                                                        onChange={(event) =>
                                                            updatePalettes(
                                                                (palettes) =>
                                                                    togglePaletteGroup(
                                                                        palettes,
                                                                        palette.name,
                                                                        event
                                                                            .target
                                                                            .checked
                                                                    ),
                                                                true
                                                            )
                                                        }
                                                        className="h-4 w-4 accent-black"
                                                    />
                                                    Enable All
                                                </label>
                                            </div>
                                            <div className="grid max-h-48 grid-cols-1 gap-2 overflow-auto p-3 sm:grid-cols-2">
                                                {palette.entries.map(
                                                    (entry) => (
                                                        <button
                                                            key={`${palette.name}-${entry.ref}`}
                                                            type="button"
                                                            onClick={() =>
                                                                updatePalettes(
                                                                    (
                                                                        palettes
                                                                    ) =>
                                                                        togglePaletteEntry(
                                                                            palettes,
                                                                            palette.name,
                                                                            entry.ref,
                                                                            !entry.enabled
                                                                        ),
                                                                    true
                                                                )
                                                            }
                                                            className={`flex items-center gap-3 border-4 border-brutal-black px-3 py-2 text-left transition-colors ${
                                                                entry.enabled
                                                                    ? 'bg-white hover:bg-brand-yellow'
                                                                    : 'bg-gray-200 text-gray-500'
                                                            }`}
                                                        >
                                                            <span
                                                                className="h-6 w-6 shrink-0 rounded-full border-4 border-brutal-black"
                                                                style={{
                                                                    backgroundColor: `rgb(${entry.color.r} ${entry.color.g} ${entry.color.b})`,
                                                                }}
                                                            />
                                                            <span className="min-w-0">
                                                                <span className="block font-vt323 text-xl uppercase leading-none">
                                                                    {entry.ref}
                                                                </span>
                                                                <span className="block truncate text-xs font-bold uppercase">
                                                                    {
                                                                        entry.name
                                                                    }
                                                                </span>
                                                            </span>
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        </EditorDialog>
                    )}

                </div>

                <div className="min-h-0 xl:h-full">
                    <Card
                        className="z-10 flex min-h-[560px] flex-1 flex-col border-brutal-black bg-white p-0 xl:h-full xl:min-h-0"
                    >
                        <div className="relative min-h-[280px] flex-1 overflow-hidden bg-white">
                            {processing && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                                    <span className="animate-pulse border-4 border-brutal-black bg-brand-yellow p-4 font-vt323 text-3xl text-black shadow-brutal">
                                        PROCESSING...
                                    </span>
                                </div>
                            )}

                            <div className="absolute right-[10px] top-[10px] z-30 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        adjustPreviewZoom(-PREVIEW_ZOOM_STEP)
                                    }
                                    disabled={
                                        !previewDataUrl ||
                                        previewZoom <= PREVIEW_MIN_ZOOM
                                    }
                                    className="flex h-6 min-w-6 items-center justify-center border-2 border-brutal-black bg-white px-1 font-vt323 text-base leading-none text-black shadow-[1px_1px_0_0_#1f2937] transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none disabled:hover:translate-y-0"
                                    aria-label="Zoom out preview"
                                >
                                    -
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClampedPreviewZoom(1)}
                                    disabled={!previewDataUrl}
                                    className="min-w-[48px] border-2 border-brutal-black bg-white px-1.5 py-0.5 font-vt323 text-sm font-bold uppercase leading-none text-black shadow-[1px_1px_0_0_#1f2937] transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none disabled:hover:translate-y-0"
                                >
                                    {Math.round(previewZoom * 100)}%
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        adjustPreviewZoom(PREVIEW_ZOOM_STEP)
                                    }
                                    disabled={
                                        !previewDataUrl ||
                                        previewZoom >= PREVIEW_MAX_ZOOM
                                    }
                                    className="flex h-6 min-w-6 items-center justify-center border-2 border-brutal-black bg-white px-1 font-vt323 text-base leading-none text-black shadow-[1px_1px_0_0_#1f2937] transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none disabled:hover:translate-y-0"
                                    aria-label="Zoom in preview"
                                >
                                    +
                                </button>
                                <button
                                    type="button"
                                    onClick={handleOpenEditorPage}
                                    disabled={!previewDataUrl}
                                    className="border-2 border-brutal-black bg-white px-1.5 py-0.5 font-vt323 text-xs font-bold uppercase leading-none text-black shadow-[1px_1px_0_0_#1f2937] transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none disabled:hover:translate-y-0"
                                >
                                    Edit Pattern
                                </button>
                            </div>

                            <div
                                ref={previewViewportRef}
                                className="absolute inset-x-0 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                                style={{
                                    top: `${PREVIEW_TOOLBAR_HEIGHT}px`,
                                    bottom: `${PREVIEW_INFO_BAR_HEIGHT}px`,
                                }}
                            >
                                {!imageSrc && (
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-gray-400">
                                        <div
                                            className="grid h-24 w-24 grid-cols-3 grid-rows-3 gap-1 opacity-45"
                                            aria-hidden="true"
                                        >
                                            {Array.from({ length: 9 }).map((_, index) => (
                                                <span
                                                    key={index}
                                                    className="border-2 border-dashed border-gray-300 bg-gray-50"
                                                />
                                            ))}
                                        </div>
                                        <p className="max-w-xs text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                                            Upload an image to generate a centered board preview
                                        </p>
                                    </div>
                                )}

                                <div
                                    className="grid min-h-full min-w-full place-items-center"
                                    style={{
                                        minWidth: `${previewStageWidth}px`,
                                        minHeight: `${previewStageHeight}px`,
                                    }}
                                >
                                    {previewDataUrl && imageSrc && (
                                        <div
                                            className="relative"
                                            style={{
                                                width: `${previewStageWidth}px`,
                                                height: `${previewStageHeight}px`,
                                            }}
                                        >
                                            {showPreviewRulers && (
                                                <>
                                                    <div
                                                        className="pointer-events-none absolute"
                                                        style={{
                                                            left: '0px',
                                                            top: '0px',
                                                            width: `${previewStageWidth}px`,
                                                            height: `${PREVIEW_RULER_SIZE.top}px`,
                                                        }}
                                                        aria-hidden="true"
                                                    >
                                                        {xRulerTicks.map((tick) => (
                                                            <div
                                                                key={`x-${tick.value}`}
                                                                className="absolute bottom-0 -translate-x-1/2"
                                                                style={{
                                                                    left: `${previewImageOffsetLeft + tick.ratio * displayPreviewSize.width}px`,
                                                                }}
                                                            >
                                                                {tick.showLabel && (
                                                                    <span className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap bg-white px-0.5 text-[10px] leading-none text-gray-600">
                                                                        {tick.value}
                                                                    </span>
                                                                )}
                                                                <span
                                                                    className={`block w-px ${
                                                                        tick.showLabel
                                                                            ? 'h-3 bg-gray-500'
                                                                            : 'h-2 bg-gray-300'
                                                                    }`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div
                                                        className="pointer-events-none absolute"
                                                        style={{
                                                            left: '0px',
                                                            top: '0px',
                                                            width: `${PREVIEW_RULER_SIZE.left}px`,
                                                            height: `${previewStageHeight}px`,
                                                        }}
                                                        aria-hidden="true"
                                                    >
                                                        {yRulerTicks.map((tick) => (
                                                            <div
                                                                key={`y-${tick.value}`}
                                                                className="absolute right-0 -translate-y-1/2"
                                                                style={{
                                                                    top: `${previewImageOffsetTop + tick.ratio * displayPreviewSize.height}px`,
                                                                }}
                                                            >
                                                                {tick.showLabel && (
                                                                    <span className="absolute right-4 top-1/2 z-10 -translate-y-1/2 whitespace-nowrap bg-white px-0.5 text-[10px] leading-none text-gray-600">
                                                                        {tick.value}
                                                                    </span>
                                                                )}
                                                                <span
                                                                    className={`block h-px ${
                                                                        tick.showLabel
                                                                            ? 'w-3 bg-gray-500'
                                                                            : 'w-2 bg-gray-300'
                                                                    }`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            <NextImage
                                                src={previewDataUrl}
                                                alt="Bead pattern preview"
                                                width={displayPreviewSize.width}
                                                height={displayPreviewSize.height}
                                                unoptimized
                                                className="absolute block h-auto w-auto max-w-none bg-white"
                                                style={{
                                                    left: `${previewImageOffsetLeft}px`,
                                                    top: `${previewImageOffsetTop}px`,
                                                    width: `${displayPreviewSize.width}px`,
                                                    height: `${displayPreviewSize.height}px`,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pointer-events-none absolute inset-x-3 bottom-1.5 z-30 flex justify-center">
                                <div className="flex max-w-full items-center justify-center gap-4 overflow-hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-brutal-black/80">
                                    <span>Pattern Size: {patternSize}</span>
                                    <span>Total Beads: {totalBeads}</span>
                                    <span>Colors: {colorsUsed}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            )}

            {isColorPickerOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Select Color"
                >
                    <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden border-4 border-brutal-black bg-white shadow-brutal">
                        <div className="flex items-center justify-between gap-4 border-b-4 border-brutal-black bg-brand-yellow px-5 py-4">
                            <div>
                                <div className="font-vt323 text-4xl uppercase leading-none text-brutal-black">
                                    Select Color
                                </div>
                                <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-brutal-black/70">
                                    Pick a bead color from the loaded palettes
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsColorPickerOpen(false)}
                                className="border-4 border-brutal-black bg-white px-3 py-1 font-vt323 text-3xl leading-none text-brutal-black shadow-brutal hover:bg-brand-cyan"
                                aria-label="Close color picker"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid min-h-0 flex-1 md:grid-cols-[260px_minmax(0,1fr)]">
                            <aside className="overflow-auto border-r-4 border-brutal-black bg-brutal-bg p-4">
                                <div className="space-y-2.5">
                                    {PALETTE_OPTIONS.map((option) => {
                                        const palette =
                                            allBrandPalettes[option.id];
                                        const isActive =
                                            colorPickerPaletteId === option.id;

                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                aria-pressed={isActive}
                                                onClick={() =>
                                                    setColorPickerPaletteId(
                                                        option.id
                                                    )
                                                }
                                                className={`flex w-full items-center justify-between border-2 px-3 py-2 text-left transition-colors ${
                                                    isActive
                                                        ? 'border-brutal-black bg-brand-yellow text-brutal-black shadow-[2px_2px_0_0_#1a1a1a]'
                                                        : 'border-brutal-black/20 bg-white text-brutal-black hover:border-brutal-black hover:bg-brand-cyan'
                                                }`}
                                            >
                                                <span className="font-bold">
                                                    {option.label}
                                                </span>
                                                <span className="text-sm font-bold text-brutal-black/55">
                                                    {palette?.entries.length ??
                                                        '...'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </aside>

                            <div className="overflow-auto p-6">
                                {!currentColorPickerPalette ? (
                                    <div className="flex h-full min-h-[320px] items-center justify-center font-vt323 text-3xl uppercase text-brutal-black/45">
                                        Loading colors...
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {currentColorPickerPalette.entries.map(
                                            (entry) => {
                                                const isActive =
                                                    activeEditorColorRef ===
                                                    entry.ref;

                                                return (
                                                    <button
                                                        key={`${colorPickerPaletteId}-${entry.ref}`}
                                                        type="button"
                                                        aria-pressed={isActive}
                                                        onClick={() =>
                                                            handleEditorColorSelection(
                                                                colorPickerPaletteId,
                                                                entry
                                                            )
                                                        }
                                                        className={`flex items-center gap-4 border-2 px-4 py-3 text-left transition-colors ${
                                                            isActive
                                                                ? 'border-brutal-black bg-brand-cyan shadow-[2px_2px_0_0_#1a1a1a]'
                                                                : 'border-brutal-black/15 bg-white hover:border-brutal-black hover:bg-brand-yellow'
                                                        }`}
                                                    >
                                                        <span
                                                            className="h-10 w-10 shrink-0 rounded-full border-2 border-brutal-black"
                                                            style={{
                                                                backgroundColor: `rgb(${entry.color.r} ${entry.color.g} ${entry.color.b})`,
                                                            }}
                                                        />
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-lg font-bold text-brutal-black">
                                                                {entry.name}
                                                            </span>
                                                            <span className="block text-sm font-semibold uppercase text-brutal-black/55">
                                                                {entry.ref}
                                                            </span>
                                                        </span>
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isExportDialogOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Export"
                >
                    <div className="w-full max-w-xl border-4 border-brutal-black bg-brand-yellow shadow-brutal">
                        <div className="flex items-center justify-between gap-4 border-b-4 border-brutal-black bg-white px-5 py-4">
                            <div>
                                <div className="font-vt323 text-4xl uppercase leading-none">
                                    Export
                                </div>
                                <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-gray-600">
                                    Choose file name, format and printable options
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsExportDialogOpen(false)}
                                className="border-4 border-brutal-black bg-white px-3 py-1 font-vt323 text-3xl leading-none shadow-brutal"
                                aria-label="Close export dialog"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <div>
                                <label
                                    htmlFor={EXPORT_FILE_NAME_ID}
                                    className="mb-1 block font-bold"
                                >
                                    Export File Name
                                </label>
                                <input
                                    id={EXPORT_FILE_NAME_ID}
                                    name="exportFileName"
                                    type="text"
                                    value={fileName}
                                    onChange={(event) =>
                                        setFileName(event.target.value)
                                    }
                                    className="w-full rounded-none border-4 border-brutal-black bg-white p-2 font-vt323 text-xl font-bold focus:outline-none"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor={EXPORT_FORMAT_ID}
                                    className="mb-1 block font-bold"
                                >
                                    Export Format
                                </label>
                                <select
                                    id={EXPORT_FORMAT_ID}
                                    name="exportFormat"
                                    value={exportFormatId}
                                    onChange={(event) =>
                                        setExportFormatId(event.target.value)
                                    }
                                    className="w-full appearance-none rounded-none border-4 border-brutal-black bg-white p-2 font-vt323 text-xl focus:outline-none"
                                >
                                    {EXPORT_OPTIONS.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <label
                                htmlFor={EXPORT_SYMBOLS_ID}
                                className="flex items-center gap-3 border-4 border-brutal-black bg-white px-3 py-2 font-bold uppercase"
                            >
                                <input
                                    id={EXPORT_SYMBOLS_ID}
                                    name="exportSymbols"
                                    type="checkbox"
                                    checked={useSymbols}
                                    onChange={(event) =>
                                        setUseSymbols(event.target.checked)
                                    }
                                    className="h-5 w-5 accent-black"
                                />
                                Use Symbols In Printable Exports
                            </label>

                            <Button
                                variant="primary"
                                className="w-full disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => void handleExport(exportFormatId)}
                                disabled={!canExportPattern}
                            >
                                {exportingId === exportFormatId
                                    ? 'Exporting...'
                                    : `Export ${EXPORT_OPTIONS.find((option) => option.id === exportFormatId)?.label ?? ''}`}
                            </Button>

                            <div className="grid grid-cols-2 gap-3">
                                {EXPORT_OPTIONS.map((option) => (
                                    <Button
                                        key={option.id}
                                        variant={
                                            option.id === exportFormatId
                                                ? 'warning'
                                                : 'secondary'
                                        }
                                        className="w-full disabled:cursor-not-allowed disabled:opacity-50"
                                        onClick={() => {
                                            setExportFormatId(option.id);
                                            void handleExport(option.id);
                                        }}
                                        disabled={!canExportPattern}
                                    >
                                        {exportingId === option.id
                                            ? 'Exporting...'
                                            : option.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <canvas
                ref={canvasRef}
                className="hidden"
                style={{
                    imageRendering: 'pixelated',
                    backgroundColor: 'white',
                }}
            />
        </div>
    );
}
