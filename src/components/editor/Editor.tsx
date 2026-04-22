'use client';

import NextImage from 'next/image';
import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronDown,
    Eraser,
    FileText,
    Hand,
    Image as ImageIcon,
    PaintBucket,
    Palette as PaletteIcon,
    Pencil,
    Pipette,
    Save,
    Settings2,
    SlidersHorizontal,
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
    EDITOR_PROJECT_FILE_EXTENSION,
    EditorDraft,
    EditorPatternDraft,
    loadEditorDraft,
    parseEditorProject,
    saveEditorDraft,
    serializeEditorProject,
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
const LARGE_PATTERN_WARNING_BEAD_COUNT = 50_000;
const LARGE_PATTERN_CONFIRM_BEAD_COUNT = 120_000;
const EXPORT_ERROR_RECOVERY_ADVICE =
    ' Try a smaller board count, choose another export format, or disable symbols for printable exports.';
const IMAGE_UPLOAD_INPUT_ID = 'image-upload-input';
const EDITOR_EMPTY_UPLOAD_INPUT_ID = 'editor-empty-upload-input';
const PROJECT_UPLOAD_INPUT_ID = 'project-upload-input';
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

function waitForNextPaint(): Promise<void> {
    if (typeof window === 'undefined' || !window.requestAnimationFrame) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        window.requestAnimationFrame(() => resolve());
    });
}

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
type EditorMobilePanel = 'file' | 'edit' | 'colors' | 'setup' | null;
type HomeMobilePanel =
    | 'image'
    | 'brand'
    | 'pegboard'
    | 'advanced'
    | 'export'
    | null;
type ColorPickerSelection = {
    paletteId: string;
    entryRef: string;
};
type PinchZoomState = {
    distance: number;
    zoom: number;
};
type TouchListLike = {
    item(index: number): { clientX: number; clientY: number } | null;
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

const HOME_MOBILE_PANELS: {
    id: Exclude<HomeMobilePanel, null>;
    label: string;
    icon: LucideIcon;
}[] = [
    {
        id: 'image',
        label: 'Image',
        icon: ImageIcon,
    },
    {
        id: 'brand',
        label: 'Brand',
        icon: PaletteIcon,
    },
    {
        id: 'pegboard',
        label: 'Pegboard',
        icon: Settings2,
    },
    {
        id: 'advanced',
        label: 'Advanced',
        icon: SlidersHorizontal,
    },
    {
        id: 'export',
        label: 'Export',
        icon: Save,
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

function getPatternBeadCount(
    boardOption: ReturnType<typeof getBoardOption> | null | undefined,
    boardWidth: number,
    boardHeight: number
): number {
    if (!boardOption) {
        return 0;
    }

    return (
        boardWidth *
        boardOption.beadsPerRow *
        boardHeight *
        boardOption.beadsPerRow
    );
}

function formatBeadCount(beadCount: number): string {
    return new Intl.NumberFormat('en-US').format(beadCount);
}

function getLargePatternWarning(beadCount: number): string | null {
    if (beadCount < LARGE_PATTERN_WARNING_BEAD_COUNT) {
        return null;
    }

    return `${formatBeadCount(beadCount)} bead positions. Large patterns can process slowly; reduce boards or turn off dithering if it feels stuck.`;
}

function confirmLargePatternAction(beadCount: number): boolean {
    if (beadCount < LARGE_PATTERN_CONFIRM_BEAD_COUNT) {
        return true;
    }

    return window.confirm(
        `This setup creates ${formatBeadCount(beadCount)} bead positions and may make the browser slow or temporarily unresponsive.\n\nContinue? For faster results, reduce boards or turn off dithering.`
    );
}

function getLargePatternGenerationKey(
    fileName: string,
    imageSrc: string,
    boardId: string,
    boardWidth: number,
    boardHeight: number,
    ditheringId: string
): string {
    return `${fileName}:${imageSrc.length}:${boardId}:${boardWidth}:${boardHeight}:${ditheringId}`;
}

function getControlToken(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getTouchDistance(touches: TouchListLike): number | null {
    const firstTouch = touches.item(0);
    const secondTouch = touches.item(1);

    if (!firstTouch || !secondTouch) {
        return null;
    }

    return Math.hypot(
        secondTouch.clientX - firstTouch.clientX,
        secondTouch.clientY - firstTouch.clientY
    );
}

function getProjectDownloadFileName(fileName: string): string {
    const safeBaseName =
        fileName
            .trim()
            .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '-')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'bead-pattern';

    return `${safeBaseName}${EDITOR_PROJECT_FILE_EXTENSION}`;
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
    const [editorMobilePanel, setEditorMobilePanel] =
        useState<EditorMobilePanel>(null);
    const [homeMobilePanel, setHomeMobilePanel] =
        useState<HomeMobilePanel>(null);
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
    const [colorPickerQuery, setColorPickerQuery] = useState('');
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
    const editorImageFileInputRef = useRef<HTMLInputElement>(null);
    const projectFileInputRef = useRef<HTMLInputElement>(null);
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
    const lastProcessedImageSrcRef = useRef<string | null>(null);
    const lastProcessedImageSettingsKeyRef = useRef<string | null>(null);
    const confirmedLargeGenerationKeyRef = useRef<string | null>(null);
    const pinchZoomStateRef = useRef<PinchZoomState | null>(null);
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
    const canSaveProject = hasEditablePattern && !processing;
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
    const currentPatternBeadCount = getPatternBeadCount(
        selectedBoard,
        boardWidth,
        boardHeight
    );
    const pendingPatternBeadCount = getPatternBeadCount(
        pendingSelectedBoard,
        pendingBoardWidth,
        pendingBoardHeight
    );
    const currentLargePatternWarning = getLargePatternWarning(
        currentPatternBeadCount
    );
    const pendingLargePatternWarning = getLargePatternWarning(
        pendingPatternBeadCount
    );
    const processingHint =
        currentPatternBeadCount >= LARGE_PATTERN_WARNING_BEAD_COUNT
            ? 'Large pattern in progress. Reducing boards or turning off dithering can help.'
            : 'Building preview and bead counts.';
    const selectedExportLabel =
        EXPORT_OPTIONS.find((option) => option.id === exportFormatId)?.label ??
        'Pattern';
    const activeExportLabel = exportingId
        ? (EXPORT_OPTIONS.find((option) => option.id === exportingId)?.label ??
          'export')
        : null;
    const exportStatusText = activeExportLabel
        ? `Preparing ${activeExportLabel}. Loading export tools can take a moment the first time.`
        : null;
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
    const normalizedColorPickerQuery = colorPickerQuery.trim().toLowerCase();
    const currentColorPickerEntries = currentColorPickerPalette
        ? currentColorPickerPalette.entries.filter((entry) => {
              if (!normalizedColorPickerQuery) {
                  return true;
              }

              return `${entry.name} ${entry.ref}`
                  .toLowerCase()
                  .includes(normalizedColorPickerQuery);
          })
        : [];
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
    const previewVerticalSlack = Math.max(
        0,
        previewUsableHeight - displayPreviewSize.height
    );
    const previewImageOffsetLeft =
        activeRulerSize.left +
        Math.max(
            0,
            (previewUsableWidth - displayPreviewSize.width) / 2
        );
    const previewImageOffsetTop =
        activeRulerSize.top +
        (isEditorPage
            ? Math.min(56, previewVerticalSlack / 4)
            : previewVerticalSlack / 2);

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

    const createCurrentEditorDraft = useCallback(() => {
        return createEditorDraft({
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
        });
    }, [
        activePalettes,
        boardHeight,
        boardId,
        boardWidth,
        ditheringId,
        exportFormatId,
        fileName,
        getCurrentEditedPatternDraft,
        imageAdjustments,
        imageSrc,
        matchingId,
        previewZoom,
        referenceOpacity,
        rendererSettings,
        selectedPaletteIds,
        showReference,
        sourceMode,
        useSymbols,
    ]);

    const persistEditorDraft = () => {
        saveEditorDraft(createCurrentEditorDraft());
    };

    const restoreEditorDraft = useCallback(
        (draft: EditorDraft) => {
            const nextSourceMode =
                draft.sourceMode ?? (draft.imageSrc ? 'image' : 'image');

            editorColorSelectionModeRef.current = 'auto';
            activeEditorColorValueRef.current = null;
            builtBlankPatternRevisionRef.current = -1;
            currentProjectRef.current = null;
            reducedColorRef.current = null;
            paletteHistoryRef.current = [];
            patternUndoStackRef.current = [];
            patternRedoStackRef.current = [];
            skipNextPaletteRebuildRef.current = false;
            lastProcessedImageSrcRef.current = null;
            lastProcessedImageSettingsKeyRef.current = null;

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
            setErrorMessage(null);
            setBeadsUsage(new Map());
            setPreviewDataUrl(null);
            setPreviewSize({ width: 1, height: 1 });
            setAutomaticEditorColorRef(null);
            setActiveEditorTool('bead');
            setIsAdvancedOpen(false);
            setIsPaletteManagerOpen(false);
            setIsColorPickerOpen(false);
            setIsExportDialogOpen(false);
            setEditorMobilePanel(null);
            setHomeMobilePanel(null);
            pendingEditedPatternRef.current = draft.editedPattern ?? null;
            setManualPatternRevision(0);
            setHistoryRevision((previous) => previous + 1);

            if (nextSourceMode === 'blank') {
                setBlankPatternRevision((previous) => previous + 1);
            }
        },
        [setAutomaticEditorColorRef]
    );

    useEffect(() => {
        if (!isEditorPage) {
            return;
        }

        const draft = loadEditorDraft();

        if (draft) {
            restoreEditorDraft(draft);
        }

        setIsEditorDraftReady(true);
    }, [isEditorPage, restoreEditorDraft]);

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

        saveEditorDraft(createCurrentEditorDraft());
    }, [
        createCurrentEditorDraft,
        historyRevision,
        isEditorDraftReady,
        manualPatternRevision,
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

        if (!imageSrc || !selectedBoard || activePalettes.length === 0) {
            return;
        }

        const imageProcessingSettingsKey = JSON.stringify({
            boardId,
            boardWidth,
            boardHeight,
            matchingId,
            ditheringId,
            imageAdjustments,
            rendererSettings,
        });
        const shouldSkipPaletteOnlyRebuild =
            skipNextPaletteRebuildRef.current &&
            lastProcessedImageSrcRef.current === imageSrc &&
            lastProcessedImageSettingsKeyRef.current ===
                imageProcessingSettingsKey;

        if (skipNextPaletteRebuildRef.current) {
            skipNextPaletteRebuildRef.current = false;
        }

        if (shouldSkipPaletteOnlyRebuild) {
            return;
        }

        let isCancelled = false;

        async function processImage(): Promise<void> {
            const plannedBeadCount = getPatternBeadCount(
                selectedBoard,
                boardWidth,
                boardHeight
            );
            const largeGenerationKey = getLargePatternGenerationKey(
                fileName,
                imageSrc,
                boardId,
                boardWidth,
                boardHeight,
                ditheringId
            );

            if (
                plannedBeadCount >= LARGE_PATTERN_CONFIRM_BEAD_COUNT &&
                confirmedLargeGenerationKeyRef.current !== largeGenerationKey
            ) {
                if (!confirmLargePatternAction(plannedBeadCount)) {
                    setErrorMessage(
                        'Large pattern generation cancelled. Reduce boards or turn off dithering for a faster build.'
                    );
                    setBeadsUsage(new Map());
                    setPreviewDataUrl(null);
                    setPreviewSize({ width: 1, height: 1 });
                    currentProjectRef.current = null;
                    reducedColorRef.current = null;
                    patternUndoStackRef.current = [];
                    patternRedoStackRef.current = [];
                    return;
                }

                confirmedLargeGenerationKeyRef.current = largeGenerationKey;
            }

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
                lastProcessedImageSrcRef.current = imageSrc;
                lastProcessedImageSettingsKeyRef.current =
                    imageProcessingSettingsKey;
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
        skipNextPaletteRebuildRef.current = false;
        lastProcessedImageSrcRef.current = null;
        lastProcessedImageSettingsKeyRef.current = null;
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
        setHomeMobilePanel(null);

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
        if (!confirmLargePatternAction(currentPatternBeadCount)) {
            setErrorMessage(
                'Large blank pattern creation cancelled. Reduce boards for a faster setup.'
            );
            return;
        }

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
        skipNextPaletteRebuildRef.current = false;
        lastProcessedImageSrcRef.current = null;
        lastProcessedImageSettingsKeyRef.current = null;
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

        const nextPatternBeadCount = getPatternBeadCount(
            boardOption,
            pendingBoardWidth,
            pendingBoardHeight
        );

        if (!confirmLargePatternAction(nextPatternBeadCount)) {
            setErrorMessage(
                'Large pattern update cancelled. Reduce boards or turn off dithering for a faster build.'
            );
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

        if (
            imageSrc &&
            nextPatternBeadCount >= LARGE_PATTERN_CONFIRM_BEAD_COUNT
        ) {
            confirmedLargeGenerationKeyRef.current = getLargePatternGenerationKey(
                fileName,
                imageSrc,
                pendingBoardId,
                pendingBoardWidth,
                pendingBoardHeight,
                ditheringId
            );
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
        setEditorMobilePanel(null);
        setColorPickerPaletteId(activeEditorColorPaletteId);
        setColorPickerQuery('');
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
        setColorPickerQuery('');
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

    const handlePreviewPinchStart = (
        event: React.TouchEvent<HTMLDivElement>
    ) => {
        if (!previewDataUrl || event.touches.length !== 2) {
            return;
        }

        const distance = getTouchDistance(event.touches);

        if (!distance) {
            return;
        }

        pinchZoomStateRef.current = {
            distance,
            zoom: previewZoom,
        };
        event.preventDefault();
    };

    const handlePreviewPinchMove = (
        event: React.TouchEvent<HTMLDivElement>
    ) => {
        const pinchState = pinchZoomStateRef.current;

        if (!previewDataUrl || !pinchState || event.touches.length !== 2) {
            return;
        }

        const distance = getTouchDistance(event.touches);

        if (!distance) {
            return;
        }

        setClampedPreviewZoom(pinchState.zoom * (distance / pinchState.distance));
        event.preventDefault();
    };

    const handlePreviewPinchEnd = () => {
        pinchZoomStateRef.current = null;
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

    const toggleEditorMobilePanel = (panel: Exclude<EditorMobilePanel, null>) => {
        setEditorMobilePanel((currentPanel) =>
            currentPanel === panel ? null : panel
        );
    };

    const toggleHomeMobilePanel = (panel: Exclude<HomeMobilePanel, null>) => {
        setHomeMobilePanel((currentPanel) =>
            currentPanel === panel ? null : panel
        );
    };

    const handleOpenEditorImagePicker = () => {
        editorImageFileInputRef.current?.click();
    };

    const handleSaveProject = () => {
        const draft = createCurrentEditorDraft();
        const projectJson = serializeEditorProject(draft);
        const projectBlob = new Blob([projectJson], {
            type: 'application/json',
        });
        const projectUrl = URL.createObjectURL(projectBlob);
        const link = document.createElement('a');

        link.href = projectUrl;
        link.download = getProjectDownloadFileName(fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(projectUrl);

        saveEditorDraft(draft);
        setErrorMessage(null);
    };

    const handleOpenProjectPicker = () => {
        projectFileInputRef.current?.click();
    };

    const handleProjectFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.currentTarget.files?.[0] ?? null;
        event.currentTarget.value = '';

        if (!file) {
            return;
        }

        try {
            const draft = parseEditorProject(await file.text());

            if (!draft) {
                setErrorMessage(
                    'Could not open project file. Choose a bead-pattern project JSON file.'
                );
                return;
            }

            restoreEditorDraft(draft);
            saveEditorDraft(draft);
        } catch {
            setErrorMessage('Could not read project file.');
        }
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

        if (exportingId !== null) {
            return;
        }

        currentProjectRef.current.exportConfiguration.useSymbols = useSymbols;
        currentProjectRef.current.image.name = fileName;

        setErrorMessage(null);
        setExportingId(exportId);

        try {
            await waitForNextPaint();
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
            setErrorMessage(`${nextMessage}${EXPORT_ERROR_RECOVERY_ADVICE}`);
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
                    ? 'h-[100svh] w-full overflow-hidden bg-brutal-bg'
                    : 'w-full space-y-6'
            }
        >
            {isEditorPage && !isEditorDraftReady ? (
                <div className="flex h-full min-h-[100svh] items-center justify-center border-2 border-brutal-black bg-brutal-bg font-vt323 text-2xl uppercase tracking-[0.08em] text-brutal-black sm:border-4 sm:text-3xl">
                    Loading Editor...
                </div>
            ) : null}

            {errorMessage && (
                <div className="border-2 border-brutal-black bg-brand-magenta px-3 py-2 text-sm font-bold text-white shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:px-4 sm:py-3 sm:text-base sm:shadow-brutal">
                    {errorMessage}
                </div>
            )}

            {isEditorPage ? (
                isEditorDraftReady ? (
                <div className="relative grid h-full min-h-0 grid-cols-1 grid-rows-[92px_minmax(0,1fr)] overflow-hidden border-2 border-brutal-black bg-brutal-bg text-brutal-black sm:border-4 sm:grid-rows-[94px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)_312px] xl:grid-rows-[48px_minmax(0,1fr)]">
                    <div className="col-span-full min-w-0 border-b-2 border-brutal-black bg-white sm:border-b-4">
                        <div className="flex h-12 min-w-0 items-center justify-between">
                        <div className="flex min-w-0 flex-1 items-center gap-2 px-2 sm:gap-3 sm:px-3">
                            <Link
                                href="/"
                                aria-label="Back to generator"
                                className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-brutal-black bg-brand-cyan font-vt323 text-3xl leading-none text-brutal-black hover:bg-brand-yellow sm:h-9 sm:w-9"
                                title="Back to generator"
                            >
                                &lt;
                            </Link>
                            <h1 className="truncate font-vt323 text-2xl uppercase leading-none sm:text-3xl">
                                Editor
                            </h1>
                        </div>
                        <div className="flex h-full shrink-0 items-center">
                            {hasEditablePattern ? (
                                <>
                                    <div className="hidden h-full items-center gap-1 border-l-2 border-brutal-black/20 px-2 md:flex">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                adjustPreviewZoom(-PREVIEW_ZOOM_STEP)
                                            }
                                            disabled={
                                                previewZoom <= PREVIEW_MIN_ZOOM
                                            }
                                            className="flex h-7 min-w-7 items-center justify-center border-2 border-brutal-black bg-white px-2 text-sm font-black hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-300"
                                            aria-label="Zoom out"
                                        >
                                            -
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setClampedPreviewZoom(1)}
                                            className="h-7 min-w-12 border-2 border-brutal-black bg-white px-2 text-[11px] font-black hover:bg-brand-yellow"
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
                                            className="flex h-7 min-w-7 items-center justify-center border-2 border-brutal-black bg-white px-2 text-sm font-black hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-300"
                                            aria-label="Zoom in"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleUndoPatternEdit}
                                        disabled={!canUndoPattern}
                                        className="hidden h-full border-l-2 border-brutal-black/20 bg-white px-3 text-xs font-black uppercase tracking-[0.08em] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white sm:block"
                                    >
                                        Undo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRedoPatternEdit}
                                        disabled={!canRedoPattern}
                                        className="hidden h-full border-l-2 border-brutal-black/20 bg-white px-3 text-xs font-black uppercase tracking-[0.08em] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white sm:block"
                                    >
                                        Redo
                                    </button>
                                </>
                            ) : null}
                            <button
                                type="button"
                                onClick={handleOpenProjectPicker}
                                className="hidden h-full border-l-2 border-brutal-black/20 bg-white px-3 text-xs font-black uppercase tracking-[0.08em] hover:bg-brand-cyan sm:block"
                            >
                                Open
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveProject}
                                disabled={!canSaveProject}
                                title={
                                    canSaveProject
                                        ? 'Save project JSON'
                                        : 'Create or open a pattern before saving'
                                }
                                className="hidden h-full border-l-2 border-brutal-black/20 bg-white px-3 text-xs font-black uppercase tracking-[0.08em] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white sm:block"
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsExportDialogOpen(true)}
                                disabled={!canExportPattern}
                                title={
                                    canExportPattern
                                        ? 'Export pattern'
                                        : 'Create or import a pattern before exporting'
                                }
                                className="h-full border-l-2 border-brutal-black bg-brand-purple px-3 text-[11px] font-black uppercase tracking-[0.1em] text-brutal-black hover:bg-brand-yellow disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 sm:border-l-4 sm:px-4 sm:text-xs"
                            >
                                Export
                            </button>
                        </div>
                        </div>
                        <div className="grid h-11 grid-cols-4 border-t-2 border-brutal-black/15 text-[10px] font-black uppercase tracking-[0.08em] xl:hidden">
                            {[
                                {
                                    id: 'file' as const,
                                    label: 'File',
                                    icon: FileText,
                                },
                                {
                                    id: 'edit' as const,
                                    label: 'Edit',
                                    icon: Pencil,
                                },
                                {
                                    id: 'colors' as const,
                                    label: 'Colors',
                                    icon: PaletteIcon,
                                },
                                {
                                    id: 'setup' as const,
                                    label: 'Setup',
                                    icon: Settings2,
                                },
                            ].map((item) => {
                                const Icon = item.icon;
                                const isActive = editorMobilePanel === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            toggleEditorMobilePanel(item.id)
                                        }
                                        aria-expanded={isActive}
                                        className={`flex min-w-0 items-center justify-center gap-1 border-l-2 border-brutal-black/15 first:border-l-0 ${
                                            isActive
                                                ? 'bg-brand-yellow text-brutal-black'
                                                : 'bg-white text-brutal-black/75 hover:bg-brand-cyan'
                                        }`}
                                    >
                                        <Icon
                                            className="h-4 w-4 shrink-0"
                                            strokeWidth={2.2}
                                        />
                                        <span className="truncate">
                                            {item.label}
                                        </span>
                                        <ChevronDown
                                            className={`h-3 w-3 shrink-0 transition-transform ${
                                                isActive ? 'rotate-180' : ''
                                            }`}
                                            strokeWidth={2.4}
                                        />
                                    </button>
                                );
                            })}
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
                                <span className="max-w-[280px] animate-pulse border-4 border-brutal-black bg-brand-yellow p-4 text-center font-vt323 text-3xl leading-none text-black shadow-brutal">
                                    <span className="block">PROCESSING...</span>
                                    <span className="mt-2 block font-sans text-[11px] font-black uppercase leading-4 tracking-[0.08em]">
                                        {processingHint}
                                    </span>
                                </span>
                            </div>
                        )}

                        <div
                            ref={previewViewportRef}
                            onPointerDown={handlePreviewPanPointerDown}
                            onPointerMove={handlePreviewPanPointerMove}
                            onPointerUp={handlePreviewPanPointerUp}
                            onPointerCancel={handlePreviewPanPointerUp}
                            onTouchStart={handlePreviewPinchStart}
                            onTouchMove={handlePreviewPinchMove}
                            onTouchEnd={handlePreviewPinchEnd}
                            onTouchCancel={handlePreviewPinchEnd}
                            className={`absolute inset-x-0 top-0 bottom-[54px] overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] sm:bottom-[58px] xl:bottom-0 [&::-webkit-scrollbar]:hidden ${
                                activeEditorTool === 'pan'
                                    ? 'cursor-grab active:cursor-grabbing'
                                    : ''
                            }`}
                            style={{ touchAction: 'none' }}
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
                                                className="flex min-h-11 cursor-pointer items-center justify-center border-2 border-brutal-black bg-brand-yellow px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-brutal-black shadow-[2px_2px_0_0_#1a1a1a] hover:bg-white sm:border-4 sm:px-4 sm:shadow-brutal-sm"
                                            >
                                                Convert Image
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleCreateBlankPattern}
                                                className="min-h-11 border-2 border-brutal-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-brutal-black shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-cyan sm:border-4 sm:px-4 sm:shadow-brutal-sm"
                                            >
                                                Blank Pattern
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleOpenProjectPicker}
                                                className="min-h-11 border-2 border-brutal-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-brutal-black shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-purple sm:border-4 sm:px-4 sm:shadow-brutal-sm"
                                            >
                                                Open Project
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

                    {editorMobilePanel && (
                        <div className="absolute inset-x-2 top-[100px] z-30 max-h-[calc(100svh-174px)] overflow-y-auto border-2 border-brutal-black bg-white p-3 shadow-[2px_2px_0_0_#1a1a1a] sm:top-[102px] sm:max-h-[calc(100svh-184px)] sm:border-4 sm:shadow-brutal xl:hidden">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="font-vt323 text-2xl uppercase leading-none">
                                    {editorMobilePanel === 'file'
                                        ? 'File'
                                        : editorMobilePanel === 'edit'
                                          ? 'Edit'
                                          : editorMobilePanel === 'colors'
                                            ? 'Colors'
                                            : 'Setup'}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditorMobilePanel(null)}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-brutal-black bg-white font-vt323 text-3xl leading-none hover:bg-brand-yellow"
                                    aria-label="Close mobile editor panel"
                                >
                                    ×
                                </button>
                            </div>
                            {editorMobilePanel === 'file' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleOpenEditorImagePicker();
                                            setEditorMobilePanel(null);
                                        }}
                                        className="flex min-h-12 items-center justify-center gap-2 border-2 border-brutal-black bg-brand-yellow px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_0_#1a1a1a]"
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                        Convert Image
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleCreateBlankPattern();
                                            setEditorMobilePanel(null);
                                        }}
                                        className="flex min-h-12 items-center justify-center gap-2 border-2 border-brutal-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-cyan"
                                    >
                                        Blank Pattern
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleOpenProjectPicker();
                                            setEditorMobilePanel(null);
                                        }}
                                        className="flex min-h-12 items-center justify-center gap-2 border-2 border-brutal-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-cyan"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Open Project
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSaveProject();
                                            setEditorMobilePanel(null);
                                        }}
                                        disabled={!canSaveProject}
                                        className="flex min-h-12 items-center justify-center gap-2 border-2 border-brutal-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none"
                                    >
                                        <Save className="h-4 w-4" />
                                        Save Project
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsExportDialogOpen(true);
                                            setEditorMobilePanel(null);
                                        }}
                                        disabled={!canExportPattern}
                                        className="col-span-2 flex min-h-12 items-center justify-center border-2 border-brutal-black bg-brand-purple px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none"
                                    >
                                        Export Pattern
                                    </button>
                                </div>
                            ) : null}

                            {editorMobilePanel === 'edit' ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {EDITOR_TOOLS.map((tool) => (
                                            <button
                                                key={tool.id}
                                                type="button"
                                                aria-label={tool.label}
                                                aria-pressed={
                                                    activeEditorTool === tool.id
                                                }
                                                onClick={() => {
                                                    setActiveEditorTool(tool.id);
                                                    setEditorMobilePanel(null);
                                                }}
                                                className={`flex min-h-14 flex-col items-center justify-center gap-1 border-2 text-[10px] font-black uppercase tracking-[0.06em] ${
                                                    activeEditorTool === tool.id
                                                        ? 'border-brutal-black bg-brand-yellow shadow-[2px_2px_0_0_#1a1a1a]'
                                                        : 'border-brutal-black/25 bg-white text-brutal-black/70 hover:border-brutal-black hover:bg-brand-cyan'
                                                }`}
                                            >
                                                <tool.icon
                                                    className="h-5 w-5"
                                                    strokeWidth={2.1}
                                                />
                                                {tool.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button
                                            type="button"
                                            onClick={handleUndoPatternEdit}
                                            disabled={!canUndoPattern}
                                            className="min-h-11 border-2 border-brutal-black bg-white px-2 py-2 text-[11px] font-black uppercase tracking-[0.08em] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400"
                                        >
                                            Undo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRedoPatternEdit}
                                            disabled={!canRedoPattern}
                                            className="min-h-11 border-2 border-brutal-black bg-white px-2 py-2 text-[11px] font-black uppercase tracking-[0.08em] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400"
                                        >
                                            Redo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                adjustPreviewZoom(
                                                    -PREVIEW_ZOOM_STEP
                                                )
                                            }
                                            disabled={
                                                !hasEditablePattern ||
                                                previewZoom <= PREVIEW_MIN_ZOOM
                                            }
                                            className="min-h-11 border-2 border-brutal-black bg-white px-2 py-2 text-[11px] font-black uppercase tracking-[0.08em] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400"
                                        >
                                            Zoom -
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                adjustPreviewZoom(
                                                    PREVIEW_ZOOM_STEP
                                                )
                                            }
                                            disabled={
                                                !hasEditablePattern ||
                                                previewZoom >= PREVIEW_MAX_ZOOM
                                            }
                                            className="min-h-11 border-2 border-brutal-black bg-white px-2 py-2 text-[11px] font-black uppercase tracking-[0.08em] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400"
                                        >
                                            Zoom +
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {editorMobilePanel === 'colors' ? (
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={openColorPicker}
                                        disabled={enabledColorCount === 0}
                                        aria-label="Select bead color"
                                        title="Select bead color"
                                        className="flex w-full items-center gap-3 border-2 border-brutal-black bg-brutal-bg p-3 text-left shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none"
                                    >
                                        <span
                                            className="h-8 w-8 shrink-0 rounded-full border-2 border-brutal-black"
                                            style={{
                                                backgroundColor:
                                                    activeEditorColorEntry
                                                        ? `rgb(${activeEditorColorEntry.color.r} ${activeEditorColorEntry.color.g} ${activeEditorColorEntry.color.b})`
                                                        : '#ffffff',
                                            }}
                                        />
                                        <span className="min-w-0">
                                            <span className="block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/60">
                                                Active Color
                                            </span>
                                            <span className="block truncate text-sm font-bold">
                                                {activeEditorColorEntry?.name ??
                                                    'Choose a color'}
                                            </span>
                                        </span>
                                    </button>
                                    {topUsageEntries.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {topUsageEntries
                                                .slice(0, 6)
                                                .map(({ ref, entry }) => (
                                                    <button
                                                        key={ref}
                                                        type="button"
                                                        onClick={() => {
                                                            setManualEditorColorRef(
                                                                ref
                                                            );
                                                            setActiveEditorTool(
                                                                'bead'
                                                            );
                                                            setEditorMobilePanel(
                                                                null
                                                            );
                                                        }}
                                                        className={`flex min-h-10 items-center gap-2 border-2 px-2 py-1.5 text-left ${
                                                            activeEditorColorRef ===
                                                            ref
                                                                ? 'border-brutal-black bg-brand-cyan shadow-[2px_2px_0_0_#1a1a1a]'
                                                                : 'border-brutal-black/20 bg-white hover:border-brutal-black hover:bg-brand-yellow'
                                                        }`}
                                                    >
                                                        <span
                                                            className="h-4 w-4 shrink-0 rounded-full border-2 border-brutal-black"
                                                            style={{
                                                                backgroundColor:
                                                                    entry
                                                                        ? `rgb(${entry.color.r} ${entry.color.g} ${entry.color.b})`
                                                                        : '#d1d5db',
                                                            }}
                                                        />
                                                        <span className="truncate text-[11px] font-bold">
                                                            {entry?.ref ?? ref}
                                                        </span>
                                                    </button>
                                                ))}
                                        </div>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsPaletteManagerOpen(true);
                                            setEditorMobilePanel(null);
                                        }}
                                        className="min-h-11 w-full border-2 border-brutal-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-cyan"
                                    >
                                        Manage Palettes
                                    </button>
                                </div>
                            ) : null}

                            {editorMobilePanel === 'setup' ? (
                                <div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                Color Brand
                                            </span>
                                            <select
                                                value={pendingPrimaryPaletteId}
                                                onChange={(event) =>
                                                    setPendingPrimaryPaletteId(
                                                        event.target.value
                                                    )
                                                }
                                                className="min-h-11 w-full rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                            >
                                                {PALETTE_OPTIONS.map(
                                                    (option) => (
                                                        <option
                                                            key={option.id}
                                                            value={option.id}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                Pegboard
                                            </span>
                                            <select
                                                value={pendingBoardId}
                                                onChange={(event) =>
                                                    setPendingBoardId(
                                                        event.target
                                                            .value as BoardOptionId
                                                    )
                                                }
                                                className="min-h-11 w-full rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
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
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                Boards Wide
                                            </span>
                                            <input
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
                                                className="min-h-11 w-full rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                Boards Tall
                                            </span>
                                            <input
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
                                                className="min-h-11 w-full rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                            />
                                        </label>
                                    </div>
                                    {imageSrc ? (
                                        <div className="mt-3 space-y-3 border-t-2 border-brutal-black/10 pt-3">
                                            <label className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.08em] text-brutal-black">
                                                <span>Show Reference</span>
                                                <input
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
                                            <label className="block">
                                                <span className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-[0.08em] text-brutal-black">
                                                    <span>Source Opacity</span>
                                                    <span>
                                                        {referenceOpacity}%
                                                    </span>
                                                </span>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={referenceOpacity}
                                                    disabled={!showReference}
                                                    onChange={(event) =>
                                                        setReferenceOpacity(
                                                            clampNumber(
                                                                Number(
                                                                    event.target
                                                                        .value
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
                                    ) : null}
                                    {hasPendingPatternSettings ? (
                                        <div className="mt-3 border-2 border-brutal-black bg-brutal-bg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-brutal-black/70">
                                            {pendingPaletteLabel} ·{' '}
                                            {pendingPatternSize} ·{' '}
                                            {pendingBoardCountStatus}
                                        </div>
                                    ) : null}
                                    {pendingLargePatternWarning ? (
                                        <div className="mt-3 border-2 border-brutal-black bg-brand-yellow px-3 py-2 text-[11px] font-bold uppercase leading-4 tracking-[0.08em] text-brutal-black">
                                            {pendingLargePatternWarning}
                                        </div>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void handleApplyPatternSettings()
                                        }
                                        disabled={
                                            !hasPendingPatternSettings ||
                                            processing
                                        }
                                        className="mt-3 min-h-11 w-full border-2 border-brutal-black bg-brand-purple px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-brutal-black shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                                    >
                                        Apply Changes
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 z-30 border-t-2 border-brutal-black bg-white p-1.5 shadow-[0_-2px_0_0_#1a1a1a] sm:border-t-4 sm:p-2 sm:shadow-[0_-3px_0_0_#1a1a1a] xl:hidden">
                        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden">
                            {EDITOR_TOOLS.map((tool) => (
                                <button
                                    key={tool.id}
                                    type="button"
                                    aria-label={tool.label}
                                    aria-pressed={activeEditorTool === tool.id}
                                    title={`${tool.label} (${tool.shortcut}) • ${tool.description}`}
                                    onClick={() => {
                                        setActiveEditorTool(tool.id);
                                        setEditorMobilePanel(null);
                                    }}
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 transition-colors ${
                                        activeEditorTool === tool.id
                                            ? 'border-brutal-black bg-brand-yellow text-brutal-black shadow-[2px_2px_0_0_#1a1a1a]'
                                            : 'border-brutal-black/25 bg-white text-gray-600 hover:border-brutal-black hover:bg-brand-cyan hover:text-brutal-black'
                                    }`}
                                >
                                    <tool.icon
                                        className="h-[18px] w-[18px]"
                                        strokeWidth={2.1}
                                    />
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={openColorPicker}
                                disabled={enabledColorCount === 0}
                                aria-label="Select bead color"
                                title="Select bead color"
                                className="flex h-10 min-w-[82px] shrink-0 items-center justify-center gap-2 border-2 border-brutal-black bg-white px-2 text-[11px] font-black uppercase tracking-[0.08em] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400"
                            >
                                <span
                                    className="h-4 w-4 shrink-0 rounded-full border-2 border-brutal-black"
                                    style={{
                                        backgroundColor: activeEditorColorEntry
                                            ? `rgb(${activeEditorColorEntry.color.r} ${activeEditorColorEntry.color.g} ${activeEditorColorEntry.color.b})`
                                            : '#ffffff',
                                    }}
                                />
                                Color
                            </button>
                        </div>
                    </div>

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
                            {pendingLargePatternWarning ? (
                                <div className="border-2 border-brutal-black bg-brand-yellow px-3 py-2 text-[11px] font-bold uppercase leading-4 tracking-[0.08em] text-brutal-black">
                                    {pendingLargePatternWarning}
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
                <>
                    <div className="relative flex h-[calc(100svh-215px)] min-h-[430px] flex-col sm:hidden">
                        <section className="flex min-h-0 flex-1 flex-col overflow-hidden border-2 border-brutal-black bg-white shadow-[2px_2px_0_0_#1a1a1a]">
                            <div className="flex min-h-11 items-center justify-between gap-2 border-b-2 border-brutal-black bg-brand-cyan px-2.5 py-2">
                                <div className="min-w-0">
                                    <div className="font-vt323 text-2xl uppercase leading-none text-brutal-black">
                                        Pattern Preview
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleHomeMobilePanel('image')
                                    }
                                    className="min-h-9 shrink-0 border-2 border-brutal-black bg-brand-yellow px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-brutal-black"
                                >
                                    {imageSrc ? 'Change' : 'Upload'}
                                </button>
                            </div>

                            <div
                                className="relative min-h-0 flex-1 overflow-hidden bg-brutal-bg"
                                onTouchStart={handlePreviewPinchStart}
                                onTouchMove={handlePreviewPinchMove}
                                onTouchEnd={handlePreviewPinchEnd}
                                onTouchCancel={handlePreviewPinchEnd}
                                style={{ touchAction: 'none' }}
                            >
                                {previewDataUrl ? (
                                    <div
                                        className="absolute inset-3 transition-transform duration-150 ease-out"
                                        style={{
                                            transform: `scale(${previewZoom})`,
                                            transformOrigin: 'center',
                                        }}
                                    >
                                        <NextImage
                                            src={previewDataUrl}
                                            alt="Bead pattern preview"
                                            fill
                                            unoptimized
                                            sizes="100vw"
                                            className="object-contain"
                                            style={{
                                                imageRendering: 'pixelated',
                                            }}
                                        />
                                    </div>
                                ) : imageSrc ? (
                                    <NextImage
                                        src={imageSrc}
                                        alt="Uploaded source image"
                                        fill
                                        unoptimized
                                        sizes="100vw"
                                        className="object-contain p-4 opacity-80"
                                    />
                                ) : (
                                    <label
                                        onDragOver={(event) => {
                                            event.preventDefault();
                                            setDraggingUpload(true);
                                        }}
                                        onDragLeave={() =>
                                            setDraggingUpload(false)
                                        }
                                        onDrop={(event) => {
                                            handleImageDrop(event);
                                            setHomeMobilePanel(null);
                                        }}
                                        className={`absolute inset-3 flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed border-brutal-black px-5 text-center ${
                                            draggingUpload
                                                ? 'bg-brand-yellow'
                                                : 'bg-white'
                                        }`}
                                    >
                                        <span className="grid h-20 w-20 grid-cols-3 grid-rows-3 gap-1 opacity-60">
                                            {Array.from({ length: 9 }).map(
                                                (_, index) => (
                                                    <span
                                                        key={index}
                                                        className="border-2 border-dashed border-brutal-black/30 bg-brutal-bg"
                                                    />
                                                )
                                            )}
                                        </span>
                                        <span className="font-vt323 text-3xl uppercase leading-none text-brutal-black">
                                            Upload Image
                                        </span>
                                        <span className="max-w-[260px] text-[11px] font-bold uppercase leading-4 tracking-[0.12em] text-brutal-black/55">
                                            Choose a photo and preview the bead
                                            pattern here.
                                        </span>
                                        <input
                                            name="homeMobileSourceImage"
                                            aria-label="Upload image"
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                            onChange={(event) => {
                                                handleImageUpload(event);
                                                setHomeMobilePanel(null);
                                            }}
                                        />
                                    </label>
                                )}

                                {previewDataUrl ? (
                                    <div className="absolute left-2 top-2 z-10 flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                adjustPreviewZoom(
                                                    -PREVIEW_ZOOM_STEP
                                                )
                                            }
                                            disabled={
                                                previewZoom <= PREVIEW_MIN_ZOOM
                                            }
                                            className="flex h-8 min-w-8 items-center justify-center border-2 border-brutal-black bg-white px-2 font-vt323 text-xl leading-none text-brutal-black shadow-[1px_1px_0_0_#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none"
                                            aria-label="Zoom out preview"
                                        >
                                            -
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setClampedPreviewZoom(1)
                                            }
                                            className="h-8 min-w-[52px] border-2 border-brutal-black bg-white px-2 font-vt323 text-base font-bold uppercase leading-none text-brutal-black shadow-[1px_1px_0_0_#1a1a1a] hover:bg-brand-yellow"
                                            aria-label="Reset preview zoom"
                                        >
                                            {Math.round(previewZoom * 100)}%
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                adjustPreviewZoom(
                                                    PREVIEW_ZOOM_STEP
                                                )
                                            }
                                            disabled={
                                                previewZoom >= PREVIEW_MAX_ZOOM
                                            }
                                            className="flex h-8 min-w-8 items-center justify-center border-2 border-brutal-black bg-white px-2 font-vt323 text-xl leading-none text-brutal-black shadow-[1px_1px_0_0_#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none"
                                            aria-label="Zoom in preview"
                                        >
                                            +
                                        </button>
                                    </div>
                                ) : null}

                                {processing ? (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                                        <span className="max-w-[260px] animate-pulse border-2 border-brutal-black bg-brand-yellow p-3 text-center font-vt323 text-2xl uppercase leading-none text-black shadow-[2px_2px_0_0_#1a1a1a]">
                                            <span className="block">
                                                Processing...
                                            </span>
                                            <span className="mt-2 block font-sans text-[10px] font-black uppercase leading-4 tracking-[0.08em]">
                                                {processingHint}
                                            </span>
                                        </span>
                                    </div>
                                ) : null}
                            </div>

                            <div className="grid grid-cols-[1fr_1fr_1fr_1.2fr] border-t-2 border-brutal-black bg-white text-center">
                                <div className="border-r-2 border-brutal-black px-2 py-2">
                                    <div className="text-[9px] font-black uppercase tracking-[0.12em] text-brutal-black/50">
                                        Size
                                    </div>
                                    <div className="truncate text-xs font-black text-brutal-black">
                                        {patternSize}
                                    </div>
                                </div>
                                <div className="border-r-2 border-brutal-black px-2 py-2">
                                    <div className="text-[9px] font-black uppercase tracking-[0.12em] text-brutal-black/50">
                                        Beads
                                    </div>
                                    <div className="truncate text-xs font-black text-brutal-black">
                                        {totalBeads}
                                    </div>
                                </div>
                                <div className="border-r-2 border-brutal-black px-2 py-2">
                                    <div className="text-[9px] font-black uppercase tracking-[0.12em] text-brutal-black/50">
                                        Colors
                                    </div>
                                    <div className="truncate text-xs font-black text-brutal-black">
                                        {colorsUsed}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleOpenEditorPage}
                                    disabled={!previewDataUrl}
                                    className="flex min-h-[50px] min-w-0 flex-col items-center justify-center bg-brand-purple px-1.5 py-1.5 text-brutal-black hover:bg-brand-cyan disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                    aria-label="Open editor"
                                >
                                    <span className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-[0.08em]">
                                        <Pencil className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                            Editor
                                        </span>
                                    </span>
                                    <span className="truncate text-xs font-black uppercase">
                                        {previewDataUrl ? 'Open' : 'Upload'}
                                    </span>
                                </button>
                            </div>
                        </section>

                        {homeMobilePanel ? (
                            <div className="absolute inset-x-2 bottom-[74px] z-40 max-h-[64svh] overflow-y-auto border-2 border-brutal-black bg-white p-3 shadow-[2px_2px_0_0_#1a1a1a]">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div className="font-vt323 text-2xl uppercase leading-none">
                                        {homeMobilePanel === 'image'
                                            ? 'Image'
                                            : homeMobilePanel === 'brand'
                                              ? 'Color Brand'
                                              : homeMobilePanel === 'pegboard'
                                                ? 'Pegboard'
                                                : homeMobilePanel === 'advanced'
                                                  ? 'Advanced'
                                                  : 'Export'}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setHomeMobilePanel(null)
                                        }
                                        className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-brutal-black bg-white font-vt323 text-3xl leading-none hover:bg-brand-yellow"
                                        aria-label="Close mobile generator panel"
                                    >
                                        ×
                                    </button>
                                </div>

                                {homeMobilePanel === 'image' ? (
                                    <div className="space-y-2">
                                        <label
                                            onDragOver={(event) => {
                                                event.preventDefault();
                                                setDraggingUpload(true);
                                            }}
                                            onDragLeave={() =>
                                                setDraggingUpload(false)
                                            }
                                            onDrop={(event) => {
                                                handleImageDrop(event);
                                                setHomeMobilePanel(null);
                                            }}
                                            className={`relative flex min-h-12 cursor-pointer items-center justify-center gap-2 border-2 border-brutal-black px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_0_#1a1a1a] ${
                                                draggingUpload
                                                    ? 'bg-brand-yellow'
                                                    : 'bg-brand-yellow hover:bg-white'
                                            }`}
                                        >
                                            <ImageIcon className="h-4 w-4" />
                                            {imageSrc
                                                ? 'Change Image'
                                                : 'Upload Image'}
                                            <input
                                                name="homeMobileSheetImage"
                                                aria-label="Upload or replace source image"
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                onChange={(event) => {
                                                    handleImageUpload(event);
                                                    setHomeMobilePanel(null);
                                                }}
                                            />
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleOpenProjectPicker();
                                                    setHomeMobilePanel(null);
                                                }}
                                                className="min-h-11 border-2 border-brutal-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-cyan"
                                            >
                                                Open Project
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleSaveProject();
                                                    setHomeMobilePanel(null);
                                                }}
                                                disabled={!canSaveProject}
                                                className="min-h-11 border-2 border-brutal-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none"
                                            >
                                                Save Project
                                            </button>
                                        </div>
                                    </div>
                                ) : null}

                                {homeMobilePanel === 'pegboard' ? (
                                    <div className="space-y-3">
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                Pegboard
                                            </span>
                                            <select
                                                name="homeMobileBoard"
                                                aria-label="Pegboard"
                                                value={boardId}
                                                onChange={(event) =>
                                                    setBoardId(
                                                        event.target
                                                            .value as BoardOptionId
                                                    )
                                                }
                                                className="min-h-11 w-full appearance-none rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                            >
                                                {BOARD_OPTIONS.map(
                                                    (option) => (
                                                        <option
                                                            key={option.id}
                                                            value={option.id}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="block">
                                                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                    Boards Wide
                                                </span>
                                                <input
                                                    name="homeMobileBoardWidth"
                                                    aria-label="Boards wide"
                                                    type="number"
                                                    min="1"
                                                    max={MAX_BOARD_COUNT}
                                                    value={boardWidth}
                                                    onChange={(event) =>
                                                        setBoardWidth(
                                                            parseBoardCount(
                                                                event.target
                                                                    .value
                                                            )
                                                        )
                                                    }
                                                    className="min-h-11 w-full rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                                />
                                            </label>
                                            <label className="block">
                                                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                    Boards Tall
                                                </span>
                                                <input
                                                    name="homeMobileBoardHeight"
                                                    aria-label="Boards tall"
                                                    type="number"
                                                    min="1"
                                                    max={MAX_BOARD_COUNT}
                                                    value={boardHeight}
                                                    onChange={(event) =>
                                                        setBoardHeight(
                                                            parseBoardCount(
                                                                event.target
                                                                    .value
                                                            )
                                                        )
                                                    }
                                                    className="min-h-11 w-full rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                                />
                                            </label>
                                        </div>
                                        <div className="border-2 border-brutal-black bg-brutal-bg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-brutal-black/70">
                                            {compactPatternStatus}
                                        </div>
                                        {currentLargePatternWarning ? (
                                            <div className="border-2 border-brutal-black bg-brand-yellow px-3 py-2 text-[11px] font-bold uppercase leading-4 tracking-[0.08em] text-brutal-black">
                                                {currentLargePatternWarning}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {homeMobilePanel === 'brand' ? (
                                    <div className="space-y-3">
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                Color Brand
                                            </span>
                                            <select
                                                name="homeMobilePrimaryPalette"
                                                aria-label="Color brand"
                                                value={primaryPaletteId}
                                                onChange={(event) =>
                                                    handlePrimaryPaletteChange(
                                                        event.target.value
                                                    )
                                                }
                                                className="min-h-11 w-full appearance-none rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                            >
                                                {PALETTE_OPTIONS.map(
                                                    (option) => (
                                                        <option
                                                            key={option.id}
                                                            value={option.id}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {PALETTE_OPTIONS.map((option) => {
                                                const selected =
                                                    selectedPaletteIds.includes(
                                                        option.id
                                                    );
                                                const isOnlySelected =
                                                    selected &&
                                                    selectedPaletteIds.length ===
                                                        1;

                                                return (
                                                    <label
                                                        key={option.id}
                                                        className={`flex min-h-11 items-center gap-2 border-2 border-brutal-black px-2 py-2 text-[11px] font-black uppercase tracking-[0.06em] ${
                                                            selected
                                                                ? 'bg-brand-yellow'
                                                                : 'bg-white'
                                                        } ${
                                                            isOnlySelected
                                                                ? 'text-brutal-black/65'
                                                                : 'hover:bg-brand-cyan'
                                                        }`}
                                                    >
                                                        <input
                                                            name={`homeMobilePalette-${option.id}`}
                                                            type="checkbox"
                                                            checked={selected}
                                                            disabled={
                                                                isOnlySelected
                                                            }
                                                            onChange={() =>
                                                                handlePaletteSelection(
                                                                    option.id
                                                                )
                                                            }
                                                            className="h-4 w-4 shrink-0 accent-black"
                                                        />
                                                        <span className="truncate">
                                                            {option.label}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <div className="border-2 border-brutal-black bg-brutal-bg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-brutal-black/70">
                                            {compactColorBrandStatus}
                                        </div>
                                    </div>
                                ) : null}

                                {homeMobilePanel === 'advanced' ? (
                                    <div className="space-y-3">
                                        <div className="grid gap-3">
                                            <label className="block">
                                                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                    Matching
                                                </span>
                                                <select
                                                    name="homeMobileMatching"
                                                    value={matchingId}
                                                    onChange={(event) =>
                                                        setMatchingId(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="min-h-11 w-full appearance-none rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                                >
                                                    {MATCHING_OPTIONS.map(
                                                        (option) => (
                                                            <option
                                                                key={option.id}
                                                                value={
                                                                    option.id
                                                                }
                                                            >
                                                                {option.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </label>
                                            <label className="block">
                                                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                    Dithering
                                                </span>
                                                <select
                                                    name="homeMobileDithering"
                                                    value={ditheringId}
                                                    onChange={(event) =>
                                                        setDitheringId(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="min-h-11 w-full appearance-none rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                                >
                                                    {DITHERING_OPTIONS.map(
                                                        (option) => (
                                                            <option
                                                                key={option.id}
                                                                value={
                                                                    option.id
                                                                }
                                                            >
                                                                {option.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </label>
                                        </div>

                                        {(
                                            [
                                                [
                                                    'brightness',
                                                    'Brightness',
                                                    0,
                                                    200,
                                                ],
                                                ['contrast', 'Contrast', 0, 200],
                                                [
                                                    'saturation',
                                                    'Saturation',
                                                    0,
                                                    200,
                                                ],
                                                [
                                                    'grayscale',
                                                    'Grayscale',
                                                    0,
                                                    100,
                                                ],
                                            ] as const
                                        ).map(([key, label, min, max]) => (
                                            <label
                                                key={key}
                                                className="block border-2 border-brutal-black bg-white p-2"
                                            >
                                                <span className="mb-1 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                    <span>{label}</span>
                                                    <span>
                                                        {imageAdjustments[key]}
                                                    </span>
                                                </span>
                                                <input
                                                    name={`homeMobileImage-${key}`}
                                                    aria-label={`${label} slider`}
                                                    type="range"
                                                    min={min}
                                                    max={max}
                                                    value={
                                                        imageAdjustments[key]
                                                    }
                                                    onChange={(event) =>
                                                        setImageAdjustments(
                                                            (previous) => ({
                                                                ...previous,
                                                                [key]: Number.parseInt(
                                                                    event.target
                                                                        .value,
                                                                    10
                                                                ),
                                                            })
                                                        )
                                                    }
                                                    className="w-full accent-black"
                                                />
                                            </label>
                                        ))}

                                        <div className="grid gap-2">
                                            {(
                                                [
                                                    ['center', 'Center'],
                                                    ['fit', 'Fit To Boards'],
                                                    [
                                                        'showGrid',
                                                        'Show Board Grid',
                                                    ],
                                                ] as const
                                            ).map(([key, label]) => (
                                                <label
                                                    key={key}
                                                    className="flex min-h-11 items-center gap-3 border-2 border-brutal-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em]"
                                                >
                                                    <input
                                                        name={`homeMobileRenderer-${key}`}
                                                        type="checkbox"
                                                        checked={
                                                            rendererSettings[
                                                                key
                                                            ]
                                                        }
                                                        onChange={(event) =>
                                                            setRendererSettings(
                                                                (previous) => ({
                                                                    ...previous,
                                                                    [key]:
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                })
                                                            )
                                                        }
                                                        className="h-4 w-4 accent-black"
                                                    />
                                                    {label}
                                                </label>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageAdjustments(
                                                    DEFAULT_IMAGE_ADJUSTMENTS
                                                );
                                                setRendererSettings(
                                                    DEFAULT_RENDERER_SETTINGS
                                                );
                                            }}
                                            className="min-h-11 w-full border-2 border-brutal-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-yellow"
                                        >
                                            Reset Adjustments
                                        </button>
                                    </div>
                                ) : null}

                                {homeMobilePanel === 'export' ? (
                                    <div className="space-y-3">
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                File Name
                                            </span>
                                            <input
                                                name="homeMobileExportFileName"
                                                type="text"
                                                value={fileName}
                                                onChange={(event) =>
                                                    setFileName(
                                                        event.target.value
                                                    )
                                                }
                                                className="min-h-11 w-full rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-brutal-black/65">
                                                Export Format
                                            </span>
                                            <select
                                                name="homeMobileExportFormat"
                                                value={exportFormatId}
                                                onChange={(event) =>
                                                    setExportFormatId(
                                                        event.target.value
                                                    )
                                                }
                                                className="min-h-11 w-full appearance-none rounded-none border-2 border-brutal-black bg-white px-2 py-2 text-sm font-bold text-brutal-black focus:bg-brand-yellow focus:outline-none"
                                            >
                                                {EXPORT_OPTIONS.map(
                                                    (option) => (
                                                        <option
                                                            key={option.id}
                                                            value={option.id}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </label>
                                        <label className="flex min-h-11 items-center gap-3 border-2 border-brutal-black bg-brutal-bg px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em]">
                                            <input
                                                name="homeMobileExportSymbols"
                                                type="checkbox"
                                                checked={useSymbols}
                                                onChange={(event) =>
                                                    setUseSymbols(
                                                        event.target.checked
                                                    )
                                                }
                                                className="h-4 w-4 accent-black"
                                            />
                                            Use Symbols In Printable Exports
                                        </label>
                                        {exportStatusText ? (
                                            <div
                                                role="status"
                                                aria-live="polite"
                                                className="border-2 border-brutal-black bg-brand-yellow px-3 py-2 text-[11px] font-black uppercase leading-4 tracking-[0.08em] text-brutal-black"
                                            >
                                                {exportStatusText}
                                            </div>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleExport(
                                                    exportFormatId
                                                )
                                            }
                                            disabled={!canExportPattern}
                                            className="min-h-12 w-full border-2 border-brutal-black bg-brand-purple px-3 py-2 font-vt323 text-xl font-bold uppercase tracking-[0.08em] text-brutal-black shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-cyan disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none"
                                        >
                                            {exportingId === exportFormatId
                                                ? 'Exporting...'
                                                : `Export ${selectedExportLabel}`}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveProject}
                                            disabled={!canSaveProject}
                                            className="min-h-11 w-full border-2 border-brutal-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none"
                                        >
                                            Save Project
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="z-40 border-t-2 border-brutal-black bg-white px-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_0_0_#1a1a1a]">
                            <div className="grid h-16 grid-cols-5">
                                {HOME_MOBILE_PANELS.map((item) => {
                                    const Icon = item.icon;
                                    const isActive =
                                        homeMobilePanel === item.id;

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() =>
                                                toggleHomeMobilePanel(item.id)
                                            }
                                            aria-expanded={isActive}
                                            className={`flex min-w-0 flex-col items-center justify-center gap-1 border-l-2 border-brutal-black/15 px-1 text-[10px] font-black uppercase tracking-[0.06em] first:border-l-0 ${
                                                isActive
                                                    ? 'bg-brand-yellow text-brutal-black'
                                                    : 'bg-white text-brutal-black/75 hover:bg-brand-cyan'
                                            }`}
                                        >
                                            <Icon
                                                className="h-5 w-5 shrink-0"
                                                strokeWidth={2.2}
                                            />
                                            <span className="truncate">
                                                {item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

            <div className="hidden items-stretch gap-4 sm:grid sm:gap-6 xl:h-[calc(100svh-330px)] xl:min-h-[560px] xl:max-h-[640px] xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
                <div className="min-h-0 xl:h-full">
                    <Card className="h-full overflow-y-auto bg-brand-cyan p-1.5 [border-width:2px] [box-shadow:2px_2px_0_0_#1a1a1a] sm:p-2.5 sm:[border-width:4px] sm:shadow-brutal">
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
                                            : `border-2 border-dashed border-brutal-black p-2.5 sm:border-4 sm:p-3 ${
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
                                    className="w-full appearance-none rounded-none border-2 border-brutal-black bg-white p-1.5 font-vt323 text-base focus:outline-none sm:border-4 sm:text-xl"
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
                                    className="w-full appearance-none rounded-none border-2 border-brutal-black bg-white p-1.5 font-vt323 text-base focus:outline-none sm:border-4 sm:text-xl"
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
                                            className="w-full rounded-none border-2 border-brutal-black bg-white p-1.5 font-vt323 text-base font-bold focus:outline-none sm:border-4 sm:text-xl"
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
                                            className="w-full rounded-none border-2 border-brutal-black bg-white p-1.5 font-vt323 text-base font-bold focus:outline-none sm:border-4 sm:text-xl"
                                        />
                                    </div>
                                </div>

                                <div className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brutal-black/70">
                                    {compactPatternStatus}
                                </div>
                                {currentLargePatternWarning ? (
                                    <div className="border-2 border-brutal-black bg-brand-yellow px-2 py-1 text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-brutal-black">
                                        {currentLargePatternWarning}
                                    </div>
                                ) : null}
                            </EditorSection>

                            <div className="grid grid-cols-3 gap-1.5 border-t-2 border-brutal-black/15 pt-2 sm:gap-2 sm:border-t-4">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="min-h-10 w-full px-2 py-1 text-sm [border-width:2px] [box-shadow:2px_2px_0_0_#1a1a1a] sm:text-base sm:[border-width:4px] sm:shadow-brutal"
                                    onClick={() => setIsPaletteManagerOpen(true)}
                                >
                                    Colors
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="min-h-10 w-full px-2 py-1 text-sm [border-width:2px] [box-shadow:2px_2px_0_0_#1a1a1a] sm:text-base sm:[border-width:4px] sm:shadow-brutal"
                                    onClick={() => setIsAdvancedOpen(true)}
                                >
                                    Advanced
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="min-h-10 w-full px-2 py-1 text-sm [border-width:2px] [box-shadow:2px_2px_0_0_#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50 sm:text-base sm:[border-width:4px] sm:shadow-brutal"
                                    onClick={() => setIsExportDialogOpen(true)}
                                    disabled={!canExportPattern}
                                >
                                    Export
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="min-h-10 w-full px-2 py-1 text-sm [border-width:2px] [box-shadow:2px_2px_0_0_#1a1a1a] sm:text-base sm:[border-width:4px] sm:shadow-brutal"
                                    onClick={handleOpenProjectPicker}
                                >
                                    Open Project
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="min-h-10 w-full px-2 py-1 text-sm [border-width:2px] [box-shadow:2px_2px_0_0_#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50 sm:text-base sm:[border-width:4px] sm:shadow-brutal"
                                    onClick={handleSaveProject}
                                    disabled={!canSaveProject}
                                >
                                    Save Project
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
                        className="z-10 flex min-h-[320px] flex-1 flex-col border-brutal-black bg-white p-0 [border-width:2px] [box-shadow:2px_2px_0_0_#1a1a1a] sm:min-h-[480px] sm:[border-width:4px] sm:shadow-brutal xl:h-full xl:min-h-0"
                    >
                        <div className="relative min-h-[240px] flex-1 overflow-hidden bg-white sm:min-h-[280px]">
                            {processing && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                                    <span className="max-w-[260px] animate-pulse border-2 border-brutal-black bg-brand-yellow p-3 text-center font-vt323 text-2xl leading-none text-black shadow-[2px_2px_0_0_#1a1a1a] sm:max-w-[280px] sm:border-4 sm:p-4 sm:text-3xl sm:shadow-brutal">
                                        <span className="block">
                                            PROCESSING...
                                        </span>
                                        <span className="mt-2 block font-sans text-[11px] font-black uppercase leading-4 tracking-[0.08em]">
                                            {processingHint}
                                        </span>
                                    </span>
                                </div>
                            )}

                            <div className="absolute right-2 top-2 z-30 flex items-center gap-1 sm:right-[10px] sm:top-[10px]">
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
                                    className="hidden border-2 border-brutal-black bg-white px-1.5 py-0.5 font-vt323 text-xs font-bold uppercase leading-none text-black shadow-[1px_1px_0_0_#1f2937] transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none disabled:hover:translate-y-0 sm:block"
                                >
                                    Edit Pattern
                                </button>
                            </div>

                            <div
                                ref={previewViewportRef}
                                onTouchStart={handlePreviewPinchStart}
                                onTouchMove={handlePreviewPinchMove}
                                onTouchEnd={handlePreviewPinchEnd}
                                onTouchCancel={handlePreviewPinchEnd}
                                className="absolute inset-x-0 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                                style={{
                                    top: `${PREVIEW_TOOLBAR_HEIGHT}px`,
                                    bottom: `${PREVIEW_INFO_BAR_HEIGHT}px`,
                                    touchAction: 'none',
                                }}
                            >
                                {!previewDataUrl && (
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
                                    {previewDataUrl && (
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

                            <div className="pointer-events-none absolute inset-x-2 bottom-1.5 z-30 flex justify-center sm:inset-x-3">
                                <div className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-brutal-black/80 sm:gap-x-4 sm:text-[10px] sm:tracking-[0.14em]">
                                    <span>Pattern Size: {patternSize}</span>
                                    <span>Total Beads: {totalBeads}</span>
                                    <span>Colors: {colorsUsed}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
                </>
            )}

            {isColorPickerOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-black/35 p-0 sm:items-center sm:justify-center sm:p-3"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Select Color"
                >
                    <div className="flex h-[100svh] w-full max-w-none flex-col overflow-hidden bg-white shadow-none sm:h-auto sm:max-h-[86vh] sm:max-w-4xl sm:border-2 sm:border-brutal-black sm:shadow-[3px_3px_0_0_#1a1a1a]">
                        <div className="flex items-center justify-between gap-3 border-b-2 border-brutal-black bg-white px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
                            <div>
                                <div className="font-vt323 text-2xl uppercase leading-none text-brutal-black sm:text-3xl">
                                    Select Color
                                </div>
                                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brutal-black/60 sm:text-[11px]">
                                    Pick a bead color from the loaded palettes
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setColorPickerQuery('');
                                    setIsColorPickerOpen(false);
                                }}
                                className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-brutal-black bg-white font-vt323 text-3xl leading-none text-brutal-black hover:bg-brand-cyan sm:h-9 sm:w-9 sm:text-2xl"
                                aria-label="Close color picker"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid min-h-0 flex-1 md:grid-cols-[220px_minmax(0,1fr)]">
                            <aside className="max-h-32 overflow-auto border-b-2 border-brutal-black bg-brutal-bg p-2.5 sm:max-h-40 sm:p-3 md:max-h-none md:border-b-0 md:border-r-2">
                                <div className="space-y-1.5 sm:space-y-2">
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
                                                className={`flex min-h-11 w-full items-center justify-between border-2 px-2.5 py-1.5 text-left transition-colors ${
                                                    isActive
                                                        ? 'border-brutal-black bg-brand-yellow text-brutal-black'
                                                        : 'border-brutal-black/20 bg-white text-brutal-black hover:border-brutal-black hover:bg-brand-cyan'
                                                }`}
                                            >
                                                <span className="text-sm font-bold">
                                                    {option.label}
                                                </span>
                                                <span className="text-xs font-bold text-brutal-black/55">
                                                    {palette?.entries.length ??
                                                        '...'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </aside>

                            <div className="min-h-0 overflow-auto p-3 sm:p-4">
                                {!currentColorPickerPalette ? (
                                    <div className="flex h-full min-h-[260px] items-center justify-center font-vt323 text-3xl uppercase text-brutal-black/45">
                                        Loading colors...
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <input
                                                type="search"
                                                value={colorPickerQuery}
                                                onChange={(event) =>
                                                    setColorPickerQuery(
                                                        event.target.value
                                                    )
                                                }
                                                aria-label="Search bead colors"
                                                placeholder="Search color or code"
                                                className="min-h-11 w-full rounded-none border-2 border-brutal-black bg-white px-3 py-2 text-sm font-bold focus:bg-brand-yellow focus:outline-none sm:max-w-xs"
                                            />
                                            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-brutal-black/55">
                                                {currentColorPickerEntries.length}{' '}
                                                colors
                                            </div>
                                        </div>
                                        {currentColorPickerEntries.length ===
                                        0 ? (
                                            <div className="border-2 border-dashed border-brutal-black/25 bg-brutal-bg p-4 text-sm font-bold uppercase tracking-[0.1em] text-brutal-black/45">
                                                No matching colors
                                            </div>
                                        ) : (
                                            <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3">
                                                {currentColorPickerEntries.map(
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
                                                        className={`flex min-h-11 items-center gap-2 border-2 px-2.5 py-2 text-left transition-colors sm:gap-3 sm:px-3 ${
                                                            isActive
                                                                ? 'border-brutal-black bg-brand-cyan'
                                                                : 'border-brutal-black/15 bg-white hover:border-brutal-black hover:bg-brand-yellow'
                                                        }`}
                                                    >
                                                        <span
                                                            className="h-7 w-7 shrink-0 rounded-full border-2 border-brutal-black sm:h-8 sm:w-8"
                                                            style={{
                                                                backgroundColor: `rgb(${entry.color.r} ${entry.color.g} ${entry.color.b})`,
                                                            }}
                                                        />
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-bold text-brutal-black">
                                                                {entry.name}
                                                            </span>
                                                            <span className="block text-xs font-semibold uppercase text-brutal-black/55">
                                                                {entry.ref}
                                                            </span>
                                                        </span>
                                                    </button>
                                                );
                                            }
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isExportDialogOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-black/35 p-0 sm:items-center sm:justify-center sm:p-3"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Export"
                    aria-busy={exportingId !== null}
                >
                    <div className="flex h-[100svh] w-full max-w-none flex-col overflow-hidden bg-white shadow-none sm:h-auto sm:max-h-[90svh] sm:max-w-lg sm:border-2 sm:border-brutal-black sm:shadow-[3px_3px_0_0_#1a1a1a]">
                        <div className="flex items-center justify-between gap-3 border-b-2 border-brutal-black bg-white px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
                            <div>
                                <div className="font-vt323 text-2xl uppercase leading-none sm:text-3xl">
                                    Export
                                </div>
                                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600 sm:text-[11px]">
                                    Choose file name, format and printable options
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsExportDialogOpen(false)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-brutal-black bg-white font-vt323 text-3xl leading-none hover:bg-brand-yellow sm:h-9 sm:w-9 sm:text-2xl"
                                aria-label="Close export dialog"
                            >
                                ×
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3 sm:p-4">
                            <div>
                                <label
                                    htmlFor={EXPORT_FILE_NAME_ID}
                                    className="mb-1 block text-sm font-bold"
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
                                    className="min-h-11 w-full rounded-none border-2 border-brutal-black bg-white px-3 py-2 font-vt323 text-base font-bold focus:bg-brand-yellow focus:outline-none sm:text-lg"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor={EXPORT_FORMAT_ID}
                                    className="mb-1 block text-sm font-bold"
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
                                    className="min-h-11 w-full appearance-none rounded-none border-2 border-brutal-black bg-white px-3 py-2 font-vt323 text-base focus:bg-brand-yellow focus:outline-none sm:text-lg"
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
                                className="flex min-h-11 items-center gap-3 border-2 border-brutal-black bg-brutal-bg px-3 py-2 text-xs font-bold uppercase sm:text-sm"
                            >
                                <input
                                    id={EXPORT_SYMBOLS_ID}
                                    name="exportSymbols"
                                    type="checkbox"
                                    checked={useSymbols}
                                    onChange={(event) =>
                                        setUseSymbols(event.target.checked)
                                    }
                                    className="h-4 w-4 accent-black"
                                />
                                Use Symbols In Printable Exports
                            </label>

                            {exportStatusText ? (
                                <div
                                    role="status"
                                    aria-live="polite"
                                    className="border-2 border-brutal-black bg-brand-yellow px-3 py-2 text-xs font-black uppercase leading-5 tracking-[0.08em] text-brutal-black"
                                >
                                    {exportStatusText}
                                </div>
                            ) : null}

                            <button
                                type="button"
                                className="min-h-11 w-full border-2 border-brutal-black bg-brand-purple px-4 py-2 font-vt323 text-lg font-bold uppercase tracking-[0.08em] text-brutal-black hover:bg-brand-cyan disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 sm:text-xl"
                                onClick={() => void handleExport(exportFormatId)}
                                disabled={!canExportPattern}
                            >
                                {exportingId === exportFormatId
                                    ? 'Exporting...'
                                    : `Export ${selectedExportLabel}`}
                            </button>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {EXPORT_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        className={`min-h-11 border-2 border-brutal-black px-2 py-1 font-vt323 text-sm font-bold uppercase leading-none tracking-[0.06em] disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:bg-gray-100 disabled:text-gray-400 sm:text-base ${
                                            option.id === exportFormatId
                                                ? 'bg-brand-yellow'
                                                : 'bg-white hover:bg-brand-cyan'
                                        }`}
                                        onClick={() => {
                                            setExportFormatId(option.id);
                                            void handleExport(option.id);
                                        }}
                                        disabled={!canExportPattern}
                                    >
                                        {exportingId === option.id
                                            ? 'Exporting...'
                                            : option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isEditorPage ? (
                <input
                    ref={editorImageFileInputRef}
                    name="editorMobileImage"
                    aria-label="Convert image in the editor"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageUpload}
                />
            ) : null}

            <input
                id={PROJECT_UPLOAD_INPUT_ID}
                ref={projectFileInputRef}
                name="projectUpload"
                aria-label="Open bead pattern project"
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(event) => void handleProjectFileUpload(event)}
            />

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
