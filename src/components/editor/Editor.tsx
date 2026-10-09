'use client';

import NextImage from 'next/image';
import Link from 'next/link';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { PdfScaleField } from './PdfScaleField';
import { useDialogFocus } from './useDialogFocus';
import './editor-studio.css';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import type { SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes, LOCALE_NAVIGATION_EVENT, type LocaleNavigationDetail } from '@/lib/i18n/routes';
import { formatEditorNumber, getEditorErrorMessage, getEditorTranslator } from '@/lib/editor/messages';
import { clearRestoredPatternQuery, consumeEditorLocaleDraft, getEditorLocaleRestoreHref, saveEditorLocaleDraft, type EditorLocaleRecovery } from '@/lib/editor/locale-navigation';
import { getInitialPdfScaleMode, isMidiActualSizeSupported, resolvePdfScaleMode, type PdfScaleMode } from '@/lib/editor/pdf-scale';
import { isEditorPatternSnapshotReady } from '@/lib/editor/draft-readiness';

import {
    BOARD_OPTIONS,
    DITHERING_OPTIONS,
    EXPORT_OPTIONS,
    MATCHING_OPTIONS,
    PALETTE_OPTIONS,
    BoardOptionId,
    getBoardOption,
    getPaletteOption,
    getPaletteDisplayLabel,
    getPaletteNameDisplayLabel,
    parsePaletteCsv,
} from '@/lib/editor/config';
import {
    createEditorDraft,
    decodeEditorPatternDraft,
    encodeEditorPatternDraft,
    encodeEditorProjectPattern,
    EDITOR_DRAFT_PATTERN_MAX_BYTES,
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
    type PatternPoint as EditorPoint,
} from '@/lib/editor/pattern-edit';
import {
    createPatternPatch,
    getPatternLinePoints,
    PatternHistory,
    PatternStroke,
    updatePatternUsage,
    type PatternPatch,
} from '@/lib/editor/pattern-history';
import { drawGridExportPattern } from '@/lib/editor/grid-export';
import { exportEditorPattern } from '@/lib/editor/pattern-export';
import { quantizePattern } from '@/lib/editor/pattern-quantization';
import { remapPatternPalette } from '@/lib/editor/pattern-palette';
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
import { loadLibraryEditorProject } from '@/lib/editor/library-project';
import { getLibraryProject } from '@/lib/patterns/project-links';
import { trackPatternEvent } from '@/lib/analytics';
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
    locale?: SiteLocale;
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

async function loadPalette(paletteId: string, signal?: AbortSignal): Promise<Palette> {
    const paletteOption = getPaletteOption(paletteId);

    if (!paletteOption) {
        throw new Error(`Unknown palette preset: ${paletteId}`);
    }

    const response = await fetch(`/palettes/${paletteOption.file}`, { signal });

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

function formatBeadCount(beadCount: number, locale: SiteLocale): string {
    return formatEditorNumber(beadCount, locale);
}

function getLargePatternWarning(beadCount: number, locale: SiteLocale): string | null {
    if (beadCount < LARGE_PATTERN_WARNING_BEAD_COUNT) {
        return null;
    }

    return getEditorTranslator(locale)('{count} bead positions. Large patterns can process slowly; reduce boards or turn off dithering if it feels stuck.', { count: formatBeadCount(beadCount, locale) });
}

function confirmLargePatternAction(beadCount: number, locale: SiteLocale): boolean {
    if (beadCount < LARGE_PATTERN_CONFIRM_BEAD_COUNT) {
        return true;
    }

    return window.confirm(
        getEditorTranslator(locale)('This setup creates {count} bead positions and may make the browser slow or temporarily unresponsive.\n\nContinue? For faster results, reduce boards or turn off dithering.', { count: formatBeadCount(beadCount, locale) })
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

type LibraryPatternEntryProps = {
    locale: SiteLocale;
    hasCurrentPattern: boolean;
    canSaveCurrentPattern: boolean;
    busy: boolean;
    onOpen: (draft: EditorDraft, patternId: string) => void;
    onSave: () => void;
    onLoadingChange: (loading: boolean) => void;
};

function LibraryPatternEntry({
    patternId,
    locale,
    hasCurrentPattern,
    canSaveCurrentPattern,
    busy,
    onOpen,
    onSave,
    onLoadingChange,
}: LibraryPatternEntryProps & { patternId: string }) {
    const t = getEditorTranslator(locale);
    const project = getLibraryProject(patternId, locale);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestRef = useRef<AbortController | null>(null);

    useEffect(() => () => {
        requestRef.current?.abort();
        onLoadingChange(false);
    }, [onLoadingChange]);

    const clearLibraryRequest = () => {
        // This is client-only state on the same static route. Next's native
        // History integration updates useSearchParams without a cached route
        // navigation restoring the old query string in production.
        window.history.replaceState(null, '', clearRestoredPatternQuery(window.location.href));
    };

    const dismiss = () => {
        requestRef.current?.abort();
        onLoadingChange(false);
        clearLibraryRequest();
    };

    const openPattern = async () => {
        if (!project || loading || busy) return;
        const controller = new AbortController();
        requestRef.current = controller;
        setLoading(true);
        onLoadingChange(true);
        setError(null);

        try {
            const draft = await loadLibraryEditorProject(project.id, controller.signal);
            if (controller.signal.aborted) return;
            onOpen(draft, project.id);
            clearLibraryRequest();
        } catch (error) {
            if (!controller.signal.aborted) {
                setError(error instanceof Error ? error.message : 'The pattern could not be loaded. Please try again.');
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
                onLoadingChange(false);
            }
        }
    };

    return (
        <section
            aria-label={t("Open library pattern")}
            data-testid="library-pattern-entry"
            className="shrink-0 rounded-lg border border-[#d9ded5] bg-brand-yellow px-3 py-3 text-sm text-brutal-black sm:px-4"
        >
            <p className="font-semibold">
                {project ? t('Open {title}?', { title: project.title }) : t("This pattern is not in the library.")}
            </p>
            <p className="mt-1">
                {project
                    ? hasCurrentPattern
                        ? t("Your current pattern is still open. Save a project copy before replacing it.")
                        : t("Open this ready-made pattern to edit its beads and colors.")
                    : t("Your current project has not changed. You can continue editing or choose another pattern.")}
            </p>
            {error && <p role="alert" className="mt-2 font-semibold">{getEditorErrorMessage(error, locale)}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
                {project && (
                    <button
                        type="button"
                        data-testid="open-library-pattern"
                        onClick={() => void openPattern()}
                        disabled={loading || busy}
                        className="rounded-lg border border-[#d9ded5] bg-brutal-black px-3 py-2 font-semibold text-white disabled:opacity-50"
                    >
                        {loading ? t("Opening pattern...") : hasCurrentPattern ? t("Replace current pattern") : t("Open pattern")}
                    </button>
                )}
                {project && hasCurrentPattern && (
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={!canSaveCurrentPattern || loading || busy}
                        className="rounded-lg border border-[#d9ded5] bg-white px-3 py-2 font-semibold disabled:opacity-50"
                    >
                        {t("Save current project")}
                    </button>
                )}
                <button
                    type="button"
                    data-testid="dismiss-library-pattern"
                    onClick={dismiss}
                    className="rounded-lg border border-[#d9ded5] bg-white px-3 py-2 font-semibold"
                >
                    {hasCurrentPattern ? t("Keep current pattern") : t("Continue without opening")}
                </button>
                {!project && <Link href={localeRoutes[locale].patterns} className="px-2 py-2 font-semibold underline">{t("Browse patterns")}</Link>}
            </div>
        </section>
    );
}

function LibraryPatternRequest(props: LibraryPatternEntryProps) {
    const patternId = useSearchParams().get('pattern');
    return patternId === null ? null : <LibraryPatternEntry key={patternId} patternId={patternId} {...props} />;
}

export default function Editor({ mode = 'home', locale = 'en' }: EditorProps) {
    const t = getEditorTranslator(locale);
    const localHome = localeRoutes[locale].home;
    const localEditor = localeRoutes[locale].editor;
    const number = (value: number) => formatEditorNumber(value, locale);
    const confirmImageGeneration = React.useEffectEvent((beadCount: number) => confirmLargePatternAction(beadCount, locale));
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
    const initialLocaleRef = useRef(locale);
    const [pdfScaleMode, setPdfScaleMode] = useState<PdfScaleMode>(() => getInitialPdfScaleMode(locale));
    const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments>(
        DEFAULT_IMAGE_ADJUSTMENTS
    );
    const [rendererSettings, setRendererSettings] = useState<RendererSettings>(
        DEFAULT_RENDERER_SETTINGS
    );
    const [processing, setProcessing] = useState(false);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [draftWarning, setDraftWarning] = useState<string | null>(null);
    const [isLibraryPatternLoading, setIsLibraryPatternLoading] = useState(false);
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
    const [isEditorDraftReady, setIsEditorDraftReady] = useState(false);
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

    const mobileColorButtonRef = useRef<HTMLButtonElement>(null);
    const mobileColorsNavButtonRef = useRef<HTMLButtonElement>(null);
    const colorPickerDialogRef = useDialogFocus(isColorPickerOpen, () => {
        setColorPickerQuery('');
        setIsColorPickerOpen(false);
    }, mobileColorButtonRef);
    const exportDialogRef = useDialogFocus(isExportDialogOpen, () => {
        setIsExportDialogOpen(false);
    });

    const editorRootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const editorPreviewCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewViewportRef = useRef<HTMLDivElement>(null);
    const editorImageFileInputRef = useRef<HTMLInputElement>(null);
    const projectFileInputRef = useRef<HTMLInputElement>(null);
    const currentProjectRef = useRef<Project | null>(null);
    const libraryPatternIdRef = useRef<string | null>(null);
    const reducedColorRef = useRef<Uint8ClampedArray | null>(null);
    const imageGenerationRef = useRef<AbortController | null>(null);
    const settingsUpdateRef = useRef<AbortController | null>(null);
    const paletteHistoryRef = useRef<Palette[][]>([]);
    const patternHistoryRef = useRef(new PatternHistory());
    const activeStrokeRef = useRef<{
        pointerId: number;
        data: Uint8ClampedArray;
        stroke: PatternStroke;
        lastPoint: EditorPoint;
        color: [number, number, number, number];
    } | null>(null);
    const exportInProgressRef = useRef(false);
    const pendingColorSelectionRef = useRef<ColorPickerSelection | null>(null);
    const pendingEditedPatternRef = useRef<EditorPatternDraft | null>(null);
    const restoredPaletteIdsRef = useRef<string[] | null>(null);
    const paletteSyncAbortRef = useRef<AbortController | null>(null);
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
    const supportsMidiActualSize = isMidiActualSizeSupported(selectedPaletteIds, boardId);
    const isPdfScaleSupported = pdfScaleMode === 'fit-page' || supportsMidiActualSize;
    const canExportSelectedFormat = canExportPattern && (exportFormatId !== 'pdf' || isPdfScaleSupported);
    const hasPendingPatternSettings =
        pendingPrimaryPaletteId !== primaryPaletteId ||
        pendingBoardId !== boardId ||
        pendingBoardWidth !== boardWidth ||
        pendingBoardHeight !== boardHeight;
    const canUndoPattern = !processing && historyRevision >= 0 && patternHistoryRef.current.canUndo;
    const canRedoPattern = !processing && historyRevision >= 0 && patternHistoryRef.current.canRedo;
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
        : t('Unknown');
    const boardCountStatus = t(boardWidth * boardHeight > 1 ? '{width} x {height} boards' : '{width} x {height} board', { width: number(boardWidth), height: number(boardHeight) });
    const pendingSelectedBoard = getBoardOption(pendingBoardId);
    const pendingPatternSize = pendingSelectedBoard
        ? `${pendingBoardWidth * pendingSelectedBoard.beadsPerRow} x ${pendingBoardHeight * pendingSelectedBoard.beadsPerRow}`
        : t('Unknown');
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
        currentPatternBeadCount, locale
    );
    const pendingLargePatternWarning = getLargePatternWarning(
        pendingPatternBeadCount, locale
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
        ? t('Preparing {format}. Loading export tools can take a moment the first time.', { format: t(activeExportLabel) })
        : null;
    const pendingBoardCountStatus = t(pendingBoardWidth * pendingBoardHeight > 1 ? '{width} x {height} boards' : '{width} x {height} board', { width: number(pendingBoardWidth), height: number(pendingBoardHeight) });
    const pendingPaletteLabel =
        getPaletteDisplayLabel(getPaletteOption(pendingPrimaryPaletteId));
    const primaryPaletteLabel =
        getPaletteDisplayLabel(getPaletteOption(primaryPaletteId));
    const compactColorBrandStatus =
        selectedPaletteIds.length > 1
            ? t('{palettes} palettes • {colors} colors', { palettes: number(selectedPaletteIds.length), colors: number(enabledColorCount) })
            : t('{count} colors', { count: number(enabledColorCount) });
    const compactPatternStatus = t('{size} pattern • {boards}', { size: patternSize, boards: boardCountStatus });
    const fullscreenPaletteSummary =
        selectedPaletteIds.length > 1
            ? t('{brand} + {count} more', { brand: primaryPaletteLabel, count: number(selectedPaletteIds.length - 1) })
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

    const getCurrentEditedPatternDraft = useCallback((forProject = false) => {
        if (forProject && reducedColorRef.current) {
            return encodeEditorProjectPattern(
                reducedColorRef.current,
                previewSize.width,
                previewSize.height
            );
        }

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

    const createCurrentEditorDraft = useCallback((forProject = false) => {
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
            pdfScaleMode,
            imageAdjustments,
            rendererSettings,
            showReference,
            referenceOpacity,
            previewZoom,
            editedPattern: getCurrentEditedPatternDraft(forProject),
        });
    }, [
        activePalettes,
        boardHeight,
        boardId,
        boardWidth,
        ditheringId,
        exportFormatId,
        pdfScaleMode,
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

    const persistEditorDraft = useCallback((draft: EditorDraft) => {
        if (reducedColorRef.current && !draft.editedPattern) {
            if (reducedColorRef.current.byteLength > EDITOR_DRAFT_PATTERN_MAX_BYTES) {
                setDraftWarning(
                    'This pattern is too large for automatic recovery. Save a project file to keep all bead edits.'
                );
            }
            return false;
        }

        const saved = saveEditorDraft(draft);
        setDraftWarning(saved ? null :
            'Automatic recovery is unavailable. Save a project file before leaving this page.'
        );
        return saved;
    }, []);

    const cancelSettingsUpdate = useCallback(() => {
        settingsUpdateRef.current?.abort();
        settingsUpdateRef.current = null;
        setProcessing(false);
    }, []);

    useEffect(() => () => {
        settingsUpdateRef.current?.abort();
    }, []);

    const restoreEditorDraft = useCallback(
        (draft: EditorDraft) => {
            libraryPatternIdRef.current = null;
            cancelSettingsUpdate();
            imageGenerationRef.current?.abort();
            // Invalidate immediately: the old palette request can finish before
            // React runs the previous effect's cleanup after a project restore.
            paletteSyncAbortRef.current?.abort();
            const nextSourceMode =
                draft.sourceMode ?? (draft.imageSrc ? 'image' : 'image');

            editorColorSelectionModeRef.current = 'auto';
            activeEditorColorValueRef.current = null;
            builtBlankPatternRevisionRef.current = -1;
            currentProjectRef.current = null;
            reducedColorRef.current = null;
            paletteHistoryRef.current = [];
            patternHistoryRef.current.clear();
            activeStrokeRef.current = null;
            skipNextPaletteRebuildRef.current = false;
            lastProcessedImageSrcRef.current = null;
            lastProcessedImageSettingsKeyRef.current = null;

            setSourceMode(nextSourceMode);
            setImageSrc(draft.imageSrc);
            setFileName(draft.fileName);
            // The saved palettes are the project's color snapshot. Reloading
            // them could regenerate the image after its edited pixels restore.
            restoredPaletteIdsRef.current = draft.activePalettes.length > 0
                ? draft.selectedPaletteIds
                : null;
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
            setPdfScaleMode(resolvePdfScaleMode(draft.pdfScaleMode, initialLocaleRef.current));
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
        [cancelSettingsUpdate, setAutomaticEditorColorRef]
    );

    useEffect(() => {
        let languageRecovery: EditorLocaleRecovery | null = null;
        try {
            languageRecovery = consumeEditorLocaleDraft(window.location.href, window.sessionStorage);
        } catch {
            // Storage can be blocked before getItem is called. Normal startup still works.
        }
        const draft = languageRecovery?.draft ?? (isEditorPage ? loadEditorDraft() : null);
        if (draft) restoreEditorDraft(draft);
        if (languageRecovery) {
            libraryPatternIdRef.current = languageRecovery.acceptedPatternId;
            window.history.replaceState(null, '', getEditorLocaleRestoreHref(window.location.href, languageRecovery));
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

        const controller = new AbortController();
        paletteSyncAbortRef.current = controller;

        async function syncSelectedPalettes() {
            try {
                const loadedPalettes = await Promise.all(
                    selectedPaletteIds.map((paletteId) => loadPalette(paletteId, controller.signal))
                );

                if (controller.signal.aborted) {
                    return;
                }

                paletteHistoryRef.current = [];
                setActivePalettes((previousPalettes) =>
                    controller.signal.aborted
                        ? previousPalettes
                        : mergePaletteEnabledState(loadedPalettes, previousPalettes)
                );
                setErrorMessage(null);
            } catch (error) {
                if (controller.signal.aborted) return;
                const nextMessage =
                    error instanceof Error
                        ? error.message
                        : 'Unexpected palette loading error.';
                setErrorMessage(nextMessage);
            }
        }

        if (restoredPaletteIdsRef.current === selectedPaletteIds) {
            return;
        }

        restoredPaletteIdsRef.current = null;
        void syncSelectedPalettes();

        return () => {
            controller.abort();
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

    // Read presentation settings without making them image-generation triggers.
    const getImageOutputSettings = React.useEffectEvent(() => ({
        fileName,
        useSymbols,
        showGrid: rendererSettings.showGrid,
    }));

    useEffect(() => {
        const project = currentProjectRef.current;

        if (project) {
            project.image.name = fileName;
            project.exportConfiguration.useSymbols = useSymbols;
        }
    }, [fileName, useSymbols]);

    useEffect(() => {
        const project = currentProjectRef.current;
        const pattern = reducedColorRef.current;
        const canvas = canvasRef.current;

        if (!project || !pattern || !canvas) {
            return;
        }

        project.rendererConfiguration.showGrid = rendererSettings.showGrid;

        if (!isEditorPage) {
            setPreviewDataUrl(createPatternPreviewDataUrl(
                pattern,
                canvas.width,
                canvas.height,
                project.boardConfiguration.board.nbBeadPerRow,
                rendererSettings.showGrid
            ));
        }
    }, [isEditorPage, rendererSettings.showGrid]);

    useEffect(() => {
        if (settingsUpdateRef.current) {
            return;
        }

        if (!isEditorDraftReady) {
            setProcessing(false);
            return;
        }

        if (!imageSrc || !selectedBoard || activePalettes.length === 0) {
            setProcessing(false);
            return;
        }

        const imageProcessingSettingsKey = JSON.stringify({
            boardId,
            boardWidth,
            boardHeight,
            matchingId,
            ditheringId,
            imageAdjustments,
            center: rendererSettings.center,
            fit: rendererSettings.fit,
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
            setProcessing(false);
            return;
        }

        const controller = new AbortController();

        async function processImage(): Promise<void> {
            const outputSettings = getImageOutputSettings();
            const plannedBeadCount = getPatternBeadCount(
                selectedBoard,
                boardWidth,
                boardHeight
            );
            const largeGenerationKey = getLargePatternGenerationKey(
                outputSettings.fileName,
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
                if (!confirmImageGeneration(plannedBeadCount)) {
                    setErrorMessage(
                        'Large pattern generation cancelled. Reduce boards or turn off dithering for a faster build.'
                    );
                    setBeadsUsage(new Map());
                    setPreviewDataUrl(null);
                    setPreviewSize({ width: 1, height: 1 });
                    currentProjectRef.current = null;
                    reducedColorRef.current = null;
                    patternHistoryRef.current.clear();
                    activeStrokeRef.current = null;
                    setProcessing(false);
                    return;
                }

                confirmedLargeGenerationKeyRef.current = largeGenerationKey;
            }

            imageGenerationRef.current = controller;
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
                    rendererSettings: {
                        center: rendererSettings.center,
                        fit: rendererSettings.fit,
                        showGrid: outputSettings.showGrid,
                    },
                    useSymbols: outputSettings.useSymbols,
                });

                const image = new window.Image();
                image.style.filter = project.imageConfiguration.css();

                await new Promise<void>((resolve, reject) => {
                    image.onload = () => resolve();
                    image.onerror = () =>
                        reject(new Error('Unable to load selected image.'));
                    image.src = imageSrc;
                });

                if (controller.signal.aborted) {
                    return;
                }

                project.srcWidth = image.width;
                project.srcHeight = image.height;

                // Keep the current pattern intact until this generation finishes.
                const sourceCanvas = document.createElement('canvas');
                sourceCanvas.width = boardWidth * selectedBoard.beadsPerRow;
                sourceCanvas.height = boardHeight * selectedBoard.beadsPerRow;
                const sourceContext = sourceCanvas.getContext('2d', {
                    willReadFrequently: true,
                });

                if (!sourceContext) {
                    throw new Error('Canvas 2D context is unavailable.');
                }

                const imagePosition = drawImageInsideCanvas(
                    sourceCanvas,
                    image,
                    project.rendererConfiguration
                );
                const resultImageData = sourceContext.getImageData(
                    0, 0, sourceCanvas.width, sourceCanvas.height
                );
                const restoredPatternData = takePendingEditedPattern(
                    sourceCanvas.width,
                    sourceCanvas.height
                );

                if (restoredPatternData) {
                    resultImageData.data.set(restoredPatternData);
                } else {
                    const pixels = await quantizePattern({
                        pixels: resultImageData.data,
                        width: sourceCanvas.width,
                        height: sourceCanvas.height,
                        palettes: project.paletteConfiguration.palettes,
                        matchingId,
                        dithering: {
                            enable: project.ditheringConfiguration.enable,
                            hardness: project.ditheringConfiguration.hardness,
                        },
                        drawingPosition: {
                            x: imagePosition.xStart,
                            y: imagePosition.yStart,
                            width: imagePosition.width,
                            height: imagePosition.height,
                        },
                    }, { signal: controller.signal });
                    if (controller.signal.aborted) {
                        return;
                    }
                    resultImageData.data.set(pixels);
                }

                const latestOutputSettings = getImageOutputSettings();
                project.image = { name: latestOutputSettings.fileName, src: image } as LoadImage;
                project.exportConfiguration.useSymbols = latestOutputSettings.useSymbols;
                project.rendererConfiguration.showGrid = latestOutputSettings.showGrid;

                const canvas = canvasRef.current;
                if (!canvas) {
                    return;
                }
                canvas.width = sourceCanvas.width;
                canvas.height = sourceCanvas.height;
                const context = canvas.getContext('2d', { willReadFrequently: true });
                if (!context) {
                    throw new Error('Canvas 2D context is unavailable.');
                }
                context.putImageData(resultImageData, 0, 0);

                currentProjectRef.current = project;
                reducedColorRef.current = resultImageData.data;
                patternHistoryRef.current.clear();
                activeStrokeRef.current = null;
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
                if (controller.signal.aborted) {
                    return;
                }
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
                patternHistoryRef.current.clear();
                activeStrokeRef.current = null;
                pendingEditedPatternRef.current = null;
                setManualPatternRevision(0);
                setHistoryRevision((previous) => previous + 1);
            } finally {
                if (!controller.signal.aborted) {
                    if (imageGenerationRef.current === controller) {
                        imageGenerationRef.current = null;
                    }
                    setProcessing(false);
                }
            }
        }

        void processImage();

        return () => {
            controller.abort();
            if (imageGenerationRef.current === controller) {
                imageGenerationRef.current = null;
            }
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
        rendererSettings.center,
        rendererSettings.fit,
        selectedBoard,
        setAutomaticEditorColorRef,
        syncEditorColorAfterPatternBuild,
        takePendingEditedPattern,
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
        patternHistoryRef.current.clear();
        activeStrokeRef.current = null;

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

    // Run after image/blank generation effects so a new request cannot save
    // its settings alongside pixels from the previous completed pattern.
    useEffect(() => {
        if (!isEditorDraftReady || processing || imageGenerationRef.current ||
            settingsUpdateRef.current ||
            pendingEditedPatternRef.current || activeStrokeRef.current ||
            (sourceMode === 'image' && !currentProjectRef.current)) {
            return;
        }

        // Blank initialization updates the canvas/ref before React commits its
        // new preview dimensions. Keep the previous draft until both agree;
        // equal areas alone are insufficient when a rectangle changes orientation.
        const canvas = canvasRef.current;
        if (!isEditorPatternSnapshotReady(reducedColorRef.current, canvas, previewSize)) {
            return;
        }

        persistEditorDraft(createCurrentEditorDraft());
    }, [
        createCurrentEditorDraft,
        historyRevision,
        isEditorDraftReady,
        manualPatternRevision,
        persistEditorDraft,
        processing,
        previewSize,
        sourceMode,
    ]);

    const loadSelectedFile = (file: File | null) => {
        if (!file) {
            return;
        }

        libraryPatternIdRef.current = null;
        cancelSettingsUpdate();
        imageGenerationRef.current?.abort();
        editorColorSelectionModeRef.current = 'auto';
        setSourceMode('image');
        setImageSrc(null);
        builtBlankPatternRevisionRef.current = -1;
        currentProjectRef.current = null;
        reducedColorRef.current = null;
        pendingEditedPatternRef.current = null;
        skipNextPaletteRebuildRef.current = false;
        lastProcessedImageSrcRef.current = null;
        lastProcessedImageSettingsKeyRef.current = null;
        patternHistoryRef.current.clear();
        activeStrokeRef.current = null;
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
        if (!confirmLargePatternAction(currentPatternBeadCount, locale)) {
            setErrorMessage(
                'Large blank pattern creation cancelled. Reduce boards for a faster setup.'
            );
            return;
        }

        libraryPatternIdRef.current = null;
        cancelSettingsUpdate();
        imageGenerationRef.current?.abort();
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
        patternHistoryRef.current.clear();
        activeStrokeRef.current = null;
        setManualPatternRevision(0);
        builtBlankPatternRevisionRef.current = -1;
        setBlankPatternRevision((previous) => previous + 1);
    };

    const handleApplyPatternSettings = async () => {
        if (processing || settingsUpdateRef.current || imageGenerationRef.current) {
            return;
        }

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

        if (!confirmLargePatternAction(nextPatternBeadCount, locale)) {
            setErrorMessage(
                'Large pattern update cancelled. Reduce boards or turn off dithering for a faster build.'
            );
            return;
        }

        const currentProject = currentProjectRef.current;
        const currentPattern = reducedColorRef.current;
        const canvas = canvasRef.current;
        const preservePattern = Boolean(
            currentProject && currentPattern && canvas &&
            pendingBoardId === boardId &&
            pendingBoardWidth === boardWidth &&
            pendingBoardHeight === boardHeight
        );

        if (
            !preservePattern && hasManualPatternChanges &&
            !window.confirm(
                t('Changing pattern setup will rebuild the pattern and discard manual bead edits. Continue?')
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

        finishActiveStroke();
        const controller = new AbortController();
        settingsUpdateRef.current = controller;
        paletteSyncAbortRef.current?.abort();
        setProcessing(true);
        setErrorMessage(null);

        try {
            const nextPalette = await loadPalette(
                pendingPrimaryPaletteId, controller.signal
            );
            const nextPalettes = mergePaletteEnabledState(
                [nextPalette],
                activePalettes
            );

            if (preservePattern && currentPattern && currentProject && canvas) {
                const nextData = await remapPatternPalette(
                    currentPattern,
                    canvas.width,
                    canvas.height,
                    nextPalettes,
                    matchingId,
                    {
                        signal: controller.signal,
                        sourcePalettes: currentProject.paletteConfiguration.palettes,
                    }
                );

                if (controller.signal.aborted || currentProjectRef.current !== currentProject ||
                    reducedColorRef.current !== currentPattern) {
                    return;
                }

                const context = canvas.getContext('2d');
                if (!context) {
                    throw new Error('Canvas 2D context is unavailable.');
                }
                const nextImageData = context.createImageData(canvas.width, canvas.height);
                nextImageData.data.set(nextData);
                const nextPreview = createPatternPreviewDataUrl(
                    nextData, canvas.width, canvas.height,
                    boardOption.beadsPerRow, rendererSettings.showGrid
                );
                const nextUsage = computeUsage(nextData, nextPalettes);

                // Commit the grid and its palette together, only after conversion succeeds.
                context.putImageData(nextImageData, 0, 0);
                reducedColorRef.current = nextData;
                currentProject.paletteConfiguration.palettes = clonePalettes(nextPalettes);
                skipNextPaletteRebuildRef.current = sourceMode === 'image';
                setBeadsUsage(nextUsage);
                setPreviewDataUrl(nextPreview);
                syncEditorColorAfterPatternBuild(nextUsage, nextPalettes);
                setManualPatternRevision((previous) => previous + 1);
            } else {
                if (controller.signal.aborted) {
                    return;
                }
                setManualPatternRevision(0);
                if (sourceMode === 'blank') {
                    // Let the blank effect initialize once, with the new settings.
                    builtBlankPatternRevisionRef.current = -1;
                    setBlankPatternRevision((previous) => previous + 1);
                }
            }

            const nextPaletteIds = [pendingPrimaryPaletteId];
            // This palette was already loaded above. A second fetch could rebuild
            // the image and replace the grid that was just converted.
            restoredPaletteIdsRef.current = nextPaletteIds;
            setSelectedPaletteIds(nextPaletteIds);
            setActivePalettes(nextPalettes);
            setColorPickerPaletteId(pendingPrimaryPaletteId);
            setBoardId(pendingBoardId);
            setBoardWidth(pendingBoardWidth);
            setBoardHeight(pendingBoardHeight);
            // Pixel-only undo patches contain the old brand's colors. Keep the
            // current edits, but start history again with the converted palette.
            paletteHistoryRef.current = [];
            patternHistoryRef.current.clear();
            activeStrokeRef.current = null;
            pendingEditedPatternRef.current = null;
            setHistoryRevision((previous) => previous + 1);
        } catch (error) {
            if (controller.signal.aborted) {
                return;
            }
            const nextMessage =
                error instanceof Error
                    ? error.message
                    : 'Unexpected settings update error.';
            setErrorMessage(nextMessage);
        } finally {
            if (settingsUpdateRef.current === controller) {
                settingsUpdateRef.current = null;
                setProcessing(false);
            }
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

        finishActiveStroke();
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

    const publishPatternChange = (patch: PatternPatch, direction: 'undo' | 'redo') => {
        const palettes = currentProjectRef.current?.paletteConfiguration.palettes;

        if (palettes) {
            setBeadsUsage((usage) => updatePatternUsage(usage, palettes, patch, direction));
        }

        setManualPatternRevision((previous) => previous + 1);
        setHistoryRevision((previous) => previous + 1);
    };

    const commitPatternChange = (patch: PatternPatch | null) => {
        if (!patch) {
            return;
        }

        patternHistoryRef.current.push(patch);
        publishPatternChange(patch, 'redo');
    };

    const finishActiveStroke = () => {
        const activeStroke = activeStrokeRef.current;
        activeStrokeRef.current = null;

        if (activeStroke && activeStroke.data === reducedColorRef.current) {
            commitPatternChange(activeStroke.stroke.finish());
        }
    };

    const restoreHistory = (direction: 'undo' | 'redo') => {
        if (processing || imageGenerationRef.current || settingsUpdateRef.current) {
            return;
        }
        finishActiveStroke();
        const currentPattern = reducedColorRef.current;

        if (!currentPattern) {
            return;
        }

        const patch = patternHistoryRef.current[direction](currentPattern);

        if (!patch) {
            return;
        }

        // Large fills are cheaper to redraw as a whole than one canvas call per cell.
        const points = patch.indices.length <= 512
            ? Array.from(patch.indices, (index) => ({
                x: (index / 4) % previewSize.width,
                y: Math.floor(index / 4 / previewSize.width),
            }))
            : [];
        syncEditedPattern(currentPattern, points);
        publishPatternChange(patch, direction);
    };

    const handleUndoPatternEdit = () => restoreHistory('undo');
    const handleRedoPatternEdit = () => restoreHistory('redo');

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

        if (!activeEditorColorEntry) {
            return;
        }

        if (activeEditorTool === 'fill') {
            const nextData = new Uint8ClampedArray(currentData);
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
                commitPatternChange(createPatternPatch(currentData, nextData));
            }
        }
    };

    const paintStrokeAtPoint = (point: EditorPoint) => {
        const activeStroke = activeStrokeRef.current;

        if (!activeStroke || activeStroke.data !== reducedColorRef.current) {
            return;
        }

        const changedPoints: EditorPoint[] = [];

        for (const nextPoint of getPatternLinePoints(activeStroke.lastPoint, point)) {
            const index = getPatternDataIndex(previewSize.width, nextPoint);
            if (activeStroke.color[3] === 0 && activeStroke.data[index + 3] === 0) {
                continue;
            }
            if (activeStroke.stroke.setPixel(index, activeStroke.color)) {
                changedPoints.push(nextPoint);
            }
        }

        activeStroke.lastPoint = point;
        if (changedPoints.length > 0) {
            syncEditedPattern(activeStroke.data, changedPoints);
        }
    };

    const handleEditorImagePointerDown = (
        event: React.PointerEvent<HTMLCanvasElement>
    ) => {
        if (!event.isPrimary || event.button !== 0 || processing || settingsUpdateRef.current ||
            activeEditorTool === 'pan' || pinchZoomStateRef.current) {
            return;
        }

        const point = getEditorPointFromEvent(event);

        if (!point) {
            return;
        }

        event.preventDefault();
        finishActiveStroke();

        if (activeEditorTool === 'pick' || activeEditorTool === 'fill') {
            applyEditorToolAtPoint(point);
            return;
        }

        const data = reducedColorRef.current;
        if (!data || (activeEditorTool === 'bead' && !activeEditorColorEntry)) {
            return;
        }

        const color = activeEditorColorEntry?.color;
        activeStrokeRef.current = {
            pointerId: event.pointerId,
            data,
            stroke: new PatternStroke(data),
            lastPoint: point,
            color: activeEditorTool === 'erase'
                ? [0, 0, 0, 0]
                : [color.r, color.g, color.b, color.a ?? 255],
        };
        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // Programmatic PointerEvents do not always create an active pointer.
        }
        paintStrokeAtPoint(point);
    };

    const handleEditorImagePointerMove = (
        event: React.PointerEvent<HTMLCanvasElement>
    ) => {
        if (activeStrokeRef.current?.pointerId !== event.pointerId) {
            return;
        }

        if ((event.buttons & 1) === 0 || pinchZoomStateRef.current) {
            finishActiveStroke();
            return;
        }

        const point = getEditorPointFromEvent(event);

        if (!point) {
            return;
        }

        event.preventDefault();
        paintStrokeAtPoint(point);
    };

    const handleEditorImagePointerEnd = (
        event: React.PointerEvent<HTMLCanvasElement>
    ) => {
        if (activeStrokeRef.current?.pointerId !== event.pointerId) {
            return;
        }

        if (event.type === 'pointerup') {
            const point = getEditorPointFromEvent(event);
            if (point) {
                paintStrokeAtPoint(point);
            }
        }
        finishActiveStroke();
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
        if (processing || imageGenerationRef.current || settingsUpdateRef.current) {
            return;
        }
        try {
            if (!persistEditorDraft(createCurrentEditorDraft(true))) {
                setErrorMessage(
                    'Could not open the editor because browser storage is unavailable or full. Allow browser storage or try a smaller image.'
                );
                return;
            }

            router.push(localEditor);
        } catch {
            setErrorMessage('Could not prepare the pattern for editing. Try generating it again.');
        }
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
        if (processing || imageGenerationRef.current || settingsUpdateRef.current) {
            return;
        }
        finishActiveStroke();
        try {
            const draft = createCurrentEditorDraft(true);
            const projectJson = serializeEditorProject(draft);
            const projectBlob = new Blob([projectJson], {
                type: 'application/json',
            });
            const projectUrl = URL.createObjectURL(projectBlob);
            const link = document.createElement('a');

            try {
                link.href = projectUrl;
                link.download = getProjectDownloadFileName(fileName);
                document.body.appendChild(link);
                link.click();
            } finally {
                link.remove();
                URL.revokeObjectURL(projectUrl);
            }

            persistEditorDraft(draft);
            setErrorMessage(null);
        } catch {
            setErrorMessage('Could not save the complete project. Your pattern is still open; try saving again.');
        }
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
            persistEditorDraft(draft);
        } catch {
            setErrorMessage('Could not read project file.');
        }
    };

    const handleGridExport = (
        pattern: Uint8ClampedArray,
        width: number,
        height: number,
        beadsPerBoard: number,
        exportFileName: string
    ) => {
        const cellSize = 20;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width * cellSize;
        exportCanvas.height = height * cellSize;

        const exportContext = exportCanvas.getContext('2d');

        if (!exportContext) {
            throw new Error('Could not create the grid export canvas.');
        }

        drawGridExportPattern(
            exportContext,
            pattern,
            width,
            height,
            {
                cellSize,
                beadsPerBoard,
            }
        );

        const link = document.createElement('a');
        link.download = `${exportFileName}_grid.png`;
        link.href = exportCanvas.toDataURL('image/png');
        if (!link.href.startsWith('data:image/png')) {
            throw new Error('The grid is too large to export as a PNG.');
        }
        link.click();
    };

    const handleExport = async (exportId: string) => {
        if (exportInProgressRef.current) {
            return;
        }
        if (exportId === 'pdf' && !isPdfScaleSupported) {
            setErrorMessage('5 mm actual-size PDF requires a 29 × 29 Midi board and only Perler Midi, Hama Midi or Artkal S palettes. Choose a page-fit chart or change the setup.');
            return;
        }

        finishActiveStroke();
        if (
            !currentProjectRef.current ||
            !reducedColorRef.current ||
            !selectedBoard
        ) {
            return;
        }

        const pattern = new Uint8ClampedArray(reducedColorRef.current);
        const exportedLibraryPatternId = libraryPatternIdRef.current;
        const project = createProjectForCurrentSettings(
            currentProjectRef.current.paletteConfiguration.palettes,
            selectedBoard,
            boardWidth,
            boardHeight
        );
        project.image = { ...currentProjectRef.current.image, name: fileName };
        project.srcWidth = currentProjectRef.current.srcWidth;
        project.srcHeight = currentProjectRef.current.srcHeight;
        const usage = computeUsage(pattern, project.paletteConfiguration.palettes);

        if (usage.size === 0) {
            return;
        }

        exportInProgressRef.current = true;
        setErrorMessage(null);
        setExportingId(exportId);

        try {
            await waitForNextPaint();
            await exportEditorPattern({
                exportId,
                locale,
                pdfScaleMode,
                reducedColor: pattern,
                beadsUsage: usage,
                project,
                fileName,
                exportGridPng: () => handleGridExport(
                    pattern,
                    previewSize.width,
                    previewSize.height,
                    selectedBoard.beadsPerRow,
                    fileName
                ),
            });
            trackPatternEvent({
                name: 'pattern_export',
                patternId: exportedLibraryPatternId,
                paletteId: primaryPaletteId,
                format: exportId,
                entryPoint: isEditorPage ? 'editor' : 'home',
            });
        } catch (error) {
            const nextMessage =
                error instanceof Error
                    ? error.message
                    : 'Unexpected export error.';
            setErrorMessage(`${nextMessage}${EXPORT_ERROR_RECOVERY_ADVICE}`);
        } finally {
            exportInProgressRef.current = false;
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
            finishActiveStroke();

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


    const handleLocaleNavigation = React.useEffectEvent((event: Event) => {
        const detail = (event as CustomEvent<LocaleNavigationDetail>).detail;
        if (!detail?.href) return;
        if (!isEditorDraftReady || processing || imageGenerationRef.current || settingsUpdateRef.current || isLibraryPatternLoading || exportInProgressRef.current) {
            event.preventDefault();
            setErrorMessage('Please wait for the current operation to finish before changing language.');
            return;
        }
        // An empty generator must not overwrite an earlier recoverable project
        // or consume a library request that has not been accepted yet.
        if (sourceMode !== 'blank' && !imageSrc && !hasEditablePattern) return;
        finishActiveStroke();
        try {
            const draft = createCurrentEditorDraft(true);
            if (saveEditorLocaleDraft(draft, detail.href, window.sessionStorage, Date.now(), libraryPatternIdRef.current)) return;
        } catch {
            // A blocked/full storage area must never navigate away from unsaved edits.
        }
        event.preventDefault();
        setErrorMessage('Could not preserve your pattern for the language change. Save a project file, then try again.');
    });

    useEffect(() => {
        const listener = (event: Event) => handleLocaleNavigation(event);
        window.addEventListener(LOCALE_NAVIGATION_EVENT, listener);
        return () => window.removeEventListener(LOCALE_NAVIGATION_EVENT, listener);
    }, []);

    const finishStrokeOnBlur = React.useEffectEvent(() => finishActiveStroke());

    useEffect(() => {
        if (!isEditorPage) {
            return;
        }

        const handleWindowShortcuts = (event: KeyboardEvent) => {
            handleEditorShortcuts(event);
        };
        const handleBlur = () => finishStrokeOnBlur();

        document.addEventListener('keydown', handleWindowShortcuts);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('keydown', handleWindowShortcuts);
            window.removeEventListener('blur', handleBlur);
        };
    }, [isEditorPage]);

    return (
        <div
            ref={editorRootRef}
            lang={locale}
            className={
                isEditorPage
                    ? 'editor-studio editor-workspace flex h-[100svh] w-full flex-col overflow-hidden bg-brutal-bg'
                    : 'editor-studio editor-workspace w-full space-y-6'
            }
        >
            {isEditorPage && !isEditorDraftReady ? (
                <div className="flex h-full min-h-[100svh] items-center justify-center rounded-lg border border-[#d9ded5] bg-brutal-bg font-sans text-lg text-brutal-black sm:border sm:text-xl">
                    {t("Loading Editor...")}
                </div>
            ) : null}

            {errorMessage && (
                <div className="rounded-lg border border-[#d9ded5] bg-brand-magenta px-3 py-2 text-sm font-semibold text-white shadow-sm sm:border sm:px-4 sm:py-3 sm:text-base sm:shadow-brutal">
                    {getEditorErrorMessage(errorMessage, locale)}
                </div>
            )}

            {draftWarning && (
                <div role="status" className="rounded-lg border border-[#d9ded5] bg-brand-yellow px-3 py-2 text-sm font-semibold text-brutal-black">
                    {getEditorErrorMessage(draftWarning, locale)}
                </div>
            )}

            {isEditorDraftReady && (
                <Suspense fallback={null}>
                    <LibraryPatternRequest
                        locale={locale}
                        hasCurrentPattern={sourceMode === 'blank' || Boolean(imageSrc) || hasEditablePattern}
                        canSaveCurrentPattern={canSaveProject}
                        busy={processing || exportingId !== null}
                        onOpen={(draft, patternId) => {
                            restoreEditorDraft(draft);
                            libraryPatternIdRef.current = patternId;
                            persistEditorDraft(draft);
                        }}
                        onSave={handleSaveProject}
                        onLoadingChange={setIsLibraryPatternLoading}
                    />
                </Suspense>
            )}

            {isEditorPage ? (
                isEditorDraftReady ? (
                <div inert={isLibraryPatternLoading} className="relative grid min-h-0 flex-1 grid-cols-1 grid-rows-[92px_minmax(0,1fr)] overflow-hidden rounded-lg border border-[#d9ded5] bg-brutal-bg text-brutal-black sm:border sm:grid-rows-[94px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)_312px] xl:grid-rows-[48px_minmax(0,1fr)]">
                    <div className="col-span-full min-w-0 border-b border-[#d9ded5] bg-white sm:border-b">
                        <div className="flex h-12 min-w-0 items-center justify-between xl:grid xl:grid-cols-[232px_minmax(0,1fr)_312px]">
                        <div className="flex min-w-0 flex-1 items-center gap-2 px-2 sm:gap-3 sm:px-3 xl:col-span-2">
                            <Link
                                href={localHome}
                                aria-label={t("Back to generator")}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d9ded5] bg-brand-cyan font-sans text-xl leading-none text-brutal-black hover:bg-brand-yellow sm:h-9 sm:w-9"
                                title={t("Back to generator")}
                            >
                                &lt;
                            </Link>
                            <h1 className="truncate font-sans text-lg font-semibold leading-none sm:text-xl">
                                {t("Editor")}
                            </h1>
                            <LanguageSwitcher locale={locale} className="editor-language-switcher" />
                        </div>
                        <div className="flex h-full shrink-0 items-center xl:col-start-3 xl:min-w-0 xl:justify-end xl:border-l xl:border-[#d9ded5]">
                            {hasEditablePattern ? (
                                <>
                                    <div className="hidden h-full items-center gap-1 border-l border-brutal-black/20 px-2 md:flex">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                adjustPreviewZoom(-PREVIEW_ZOOM_STEP)
                                            }
                                            disabled={
                                                previewZoom <= PREVIEW_MIN_ZOOM
                                            }
                                            className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-[#d9ded5] bg-white px-2 text-sm font-semibold hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-300"
                                            aria-label={t("Zoom out")}
                                        >
                                            -
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setClampedPreviewZoom(1)}
                                            className="h-7 min-w-12 rounded-lg border border-[#d9ded5] bg-white px-2 text-[11px] font-semibold hover:bg-brand-yellow"
                                            aria-label={t("Reset zoom")}
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
                                            className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-[#d9ded5] bg-white px-2 text-sm font-semibold hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-300"
                                            aria-label={t("Zoom in")}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleUndoPatternEdit}
                                        disabled={!canUndoPattern}
                                        className="hidden h-full border-l border-brutal-black/20 bg-white px-3 text-xs font-semibold hover:bg-brand-yellow disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white sm:block"
                                    >
                                        {t("Undo")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRedoPatternEdit}
                                        disabled={!canRedoPattern}
                                        className="hidden h-full border-l border-brutal-black/20 bg-white px-3 text-xs font-semibold hover:bg-brand-yellow disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white sm:block"
                                    >
                                        {t("Redo")}
                                    </button>
                                </>
                            ) : null}
                            <button
                                type="button"
                                onClick={handleOpenProjectPicker}
                                className="hidden h-full border-l border-brutal-black/20 bg-white px-3 text-xs font-semibold hover:bg-brand-cyan sm:block"
                            >
                                {t("Open")}
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveProject}
                                disabled={!canSaveProject}
                                title={
                                    canSaveProject
                                        ? t("Save project JSON")
                                        : t("Create or open a pattern before saving")
                                }
                                className="hidden h-full border-l border-brutal-black/20 bg-white px-3 text-xs font-semibold hover:bg-brand-yellow disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white sm:block"
                            >
                                {t("Save")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsExportDialogOpen(true)}
                                disabled={!canExportPattern}
                                title={
                                    canExportPattern
                                        ? t("Export pattern")
                                        : t("Create or import a pattern before exporting")
                                }
                                className="h-full border-l border-[#28614e] bg-[#28614e] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#214f40] disabled:cursor-not-allowed disabled:border-[#d9ded5] disabled:bg-gray-200 disabled:text-gray-500 sm:px-4 sm:text-xs"
                            >
                                {t("Export")}
                            </button>
                        </div>
                        </div>
                        <div className="grid h-11 grid-cols-4 border-t border-brutal-black/15 text-[10px] font-semibold xl:hidden">
                            {[
                                {
                                    id: 'file' as const,
                                    label: t("File"),
                                    icon: FileText,
                                },
                                {
                                    id: 'edit' as const,
                                    label: t("Edit"),
                                    icon: Pencil,
                                },
                                {
                                    id: 'colors' as const,
                                    label: t("Colors"),
                                    icon: PaletteIcon,
                                },
                                {
                                    id: 'setup' as const,
                                    label: t("Setup"),
                                    icon: Settings2,
                                },
                            ].map((item) => {
                                const Icon = item.icon;
                                const isActive = editorMobilePanel === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        ref={item.id === 'colors' ? mobileColorsNavButtonRef : undefined}
                                        type="button"
                                        onClick={() =>
                                            toggleEditorMobilePanel(item.id)
                                        }
                                        aria-expanded={isActive}
                                        className={`flex min-w-0 items-center justify-center gap-1 border-l border-brutal-black/15 first:border-l-0 ${
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
                                            {t(item.label)}
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

                    <aside className="hidden min-h-0 overflow-y-auto border-r border-[#d9ded5] bg-white xl:block">
                        <div className="space-y-5 p-3">
                            <div>
                                <div className="mb-2 block text-xs font-semibold leading-5 text-[#627168]">
                                    {t("Tools")}
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {EDITOR_TOOLS.map((tool) => (
                                        <button
                                            key={tool.id}
                                            type="button"
                                            aria-label={t(tool.label)}
                                            aria-pressed={
                                                activeEditorTool === tool.id
                                            }
                                            title={`${t(tool.label)} (${tool.shortcut}) • ${t(tool.description)}`}
                                            onClick={() =>
                                                setActiveEditorTool(tool.id)
                                            }
                                            className={`flex h-9 w-9 items-center justify-center justify-self-center rounded-lg border transition-colors ${
                                                activeEditorTool === tool.id
                                                    ? 'border-[#d9ded5] bg-brand-yellow text-brutal-black shadow-sm'
                                                    : 'border-brutal-black/15 bg-white text-gray-500 hover:border-[#d9ded5] hover:bg-brand-cyan hover:text-brutal-black'
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
                                <div className="mb-2 block text-xs font-semibold leading-5 text-[#627168]">
                                    {t("Bead Color")}
                                </div>
                                {activeEditorColorEntry && (
                                    <button
                                        type="button"
                                        onClick={openColorPicker}
                                        className="mb-3 block w-full rounded-lg border border-[#d9ded5] bg-brutal-bg p-2 text-left shadow-sm transition-colors hover:bg-brand-yellow"
                                        title={t("Select bead color")}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="h-9 w-9 shrink-0 rounded-full border border-[#d9ded5]"
                                                style={{
                                                    backgroundColor: `rgb(${activeEditorColorEntry.color.r} ${activeEditorColorEntry.color.g} ${activeEditorColorEntry.color.b})`,
                                                }}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block break-words text-[13px] font-semibold leading-4 text-brutal-black">
                                                    {activeEditorColorEntry.name}
                                                </span>
                                                <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-brutal-black/60">
                                                    {activeEditorColorEntry.ref}
                                                </span>
                                            </span>
                                        </div>
                                    </button>
                                )}

                                <div className="mb-2">
                                    <div className="text-[10px] font-semibold text-brutal-black/65">
                                        {t("Quick Colors")}
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
                                                    className={`flex min-h-11 items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                                                        activeEditorColorRef === ref
                                                            ? 'border-[#d9ded5] bg-brand-cyan shadow-sm'
                                                            : 'border-brutal-black/15 bg-white hover:border-[#d9ded5] hover:bg-brand-yellow'
                                                    }`}
                                                >
                                                    <span
                                                        className="h-5 w-5 shrink-0 rounded-full border border-[#d9ded5]"
                                                        style={{
                                                            backgroundColor: entry
                                                                ? `rgb(${entry.color.r} ${entry.color.g} ${entry.color.b})`
                                                                : '#d1d5db',
                                                        }}
                                                    />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block whitespace-normal text-[13px] font-semibold leading-4 text-brutal-black">
                                                            {entry?.name ?? ref}
                                                        </span>
                                                        <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-brutal-black/55">
                                                            {entry?.ref ?? ref}
                                                        </span>
                                                    </span>
                                                </button>
                                            )
                                        )
                                    ) : (
                                        <div className="rounded-lg border border-dashed border-brutal-black/25 bg-brutal-bg p-2 text-[10px] font-semibold text-brutal-black/45">
                                            {t("No colors yet")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="relative min-h-0 overflow-hidden bg-brutal-bg xl:col-start-2">
                        {processing && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                                <span className="max-w-[280px] animate-pulse rounded-lg border border-[#d9ded5] bg-brand-yellow p-4 text-center font-sans text-xl leading-none text-black shadow-brutal">
                                    <span className="block">{t("PROCESSING...")}</span>
                                    <span className="mt-2 block font-sans text-[11px] font-semibold leading-4">
                                        {t(processingHint)}
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
                                                    className="rounded-lg border border-dashed border-brutal-black/35 bg-white"
                                                />
                                            )
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-brutal-black/65">
                                            {t("Choose a start point")}
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            <label
                                                htmlFor={
                                                    EDITOR_EMPTY_UPLOAD_INPUT_ID
                                                }
                                                className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-[#d9ded5] bg-brand-yellow px-4 py-2 text-xs font-semibold text-brutal-black shadow-sm hover:bg-white sm:border sm:px-4 sm:shadow-brutal-sm"
                                            >
                                                {t("Convert Image")}
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleCreateBlankPattern}
                                                className="min-h-11 rounded-lg border border-[#d9ded5] bg-white px-4 py-2 text-xs font-semibold text-brutal-black shadow-sm hover:bg-brand-cyan sm:border sm:px-4 sm:shadow-brutal-sm"
                                            >
                                                {t("Blank Pattern")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleOpenProjectPicker}
                                                className="min-h-11 rounded-lg border border-[#d9ded5] bg-white px-4 py-2 text-xs font-semibold text-brutal-black shadow-sm hover:bg-brand-purple sm:border sm:px-4 sm:shadow-brutal-sm"
                                            >
                                                {t("Open Project")}
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        id={EDITOR_EMPTY_UPLOAD_INPUT_ID}
                                        name="editorEmptyImage"
                                        aria-label={t("Convert an image in the editor")}
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
                                            aria-label={t("Bead pattern preview")}
                                            onPointerDown={
                                                handleEditorImagePointerDown
                                            }
                                            onPointerMove={
                                                handleEditorImagePointerMove
                                            }
                                            onPointerUp={handleEditorImagePointerEnd}
                                            onPointerCancel={handleEditorImagePointerEnd}
                                            onLostPointerCapture={handleEditorImagePointerEnd}
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
                        <div className="absolute inset-x-2 top-[100px] z-30 max-h-[calc(100svh-174px)] overflow-y-auto rounded-lg border border-[#d9ded5] bg-white p-3 shadow-sm sm:top-[102px] sm:max-h-[calc(100svh-184px)] sm:border sm:shadow-brutal xl:hidden">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="font-sans text-lg leading-none">
                                    {editorMobilePanel === 'file'
                                        ? t("File")
                                        : editorMobilePanel === 'edit'
                                          ? t("Edit")
                                          : editorMobilePanel === 'colors'
                                            ? t("Colors")
                                            : t("Setup")}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditorMobilePanel(null)}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#d9ded5] bg-white font-sans text-xl leading-none hover:bg-brand-yellow"
                                    aria-label={t("Close mobile editor panel")}
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
                                        className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#d9ded5] bg-brand-yellow px-3 py-2 text-[11px] font-semibold shadow-sm"
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                        {t("Convert Image")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleCreateBlankPattern();
                                            setEditorMobilePanel(null);
                                        }}
                                        className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-[11px] font-semibold shadow-sm hover:bg-brand-cyan"
                                    >
                                        {t("Blank Pattern")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleOpenProjectPicker();
                                            setEditorMobilePanel(null);
                                        }}
                                        className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-[11px] font-semibold shadow-sm hover:bg-brand-cyan"
                                    >
                                        <FileText className="h-4 w-4" />
                                        {t("Open Project")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSaveProject();
                                            setEditorMobilePanel(null);
                                        }}
                                        disabled={!canSaveProject}
                                        className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-[11px] font-semibold shadow-sm hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none"
                                    >
                                        <Save className="h-4 w-4" />
                                        {t("Save Project")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsExportDialogOpen(true);
                                            setEditorMobilePanel(null);
                                        }}
                                        disabled={!canExportPattern}
                                        className="col-span-2 flex min-h-12 items-center justify-center rounded-lg border border-[#d9ded5] bg-brand-purple px-3 py-2 text-[11px] font-semibold shadow-sm hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none"
                                    >
                                        {t("Export Pattern")}
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
                                                aria-label={t(tool.label)}
                                                aria-pressed={
                                                    activeEditorTool === tool.id
                                                }
                                                onClick={() => {
                                                    setActiveEditorTool(tool.id);
                                                    setEditorMobilePanel(null);
                                                }}
                                                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border text-[10px] font-semibold ${
                                                    activeEditorTool === tool.id
                                                        ? 'border-[#d9ded5] bg-brand-yellow shadow-sm'
                                                        : 'border-brutal-black/25 bg-white text-brutal-black/70 hover:border-[#d9ded5] hover:bg-brand-cyan'
                                                }`}
                                            >
                                                <tool.icon
                                                    className="h-5 w-5"
                                                    strokeWidth={2.1}
                                                />
                                                {t(tool.label)}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button
                                            type="button"
                                            onClick={handleUndoPatternEdit}
                                            disabled={!canUndoPattern}
                                            className="min-h-11 rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-[11px] font-semibold hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400"
                                        >
                                            {t("Undo")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRedoPatternEdit}
                                            disabled={!canRedoPattern}
                                            className="min-h-11 rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-[11px] font-semibold hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400"
                                        >
                                            {t("Redo")}
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
                                            className="min-h-11 rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-[11px] font-semibold hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400"
                                        >
                                            {t("Zoom -")}
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
                                            className="min-h-11 rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-[11px] font-semibold hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400"
                                        >
                                            {t("Zoom +")}
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
                                        aria-label={t("Select bead color")}
                                        title={t("Select bead color")}
                                        className="flex w-full items-center gap-3 rounded-lg border border-[#d9ded5] bg-brutal-bg p-3 text-left shadow-sm hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none"
                                    >
                                        <span
                                            className="h-8 w-8 shrink-0 rounded-full border border-[#d9ded5]"
                                            style={{
                                                backgroundColor:
                                                    activeEditorColorEntry
                                                        ? `rgb(${activeEditorColorEntry.color.r} ${activeEditorColorEntry.color.g} ${activeEditorColorEntry.color.b})`
                                                        : '#ffffff',
                                            }}
                                        />
                                        <span className="min-w-0">
                                            <span className="block text-[11px] font-semibold text-brutal-black/60">
                                                {t("Active Color")}
                                            </span>
                                            <span className="block truncate text-sm font-semibold">
                                                {activeEditorColorEntry?.name ??
                                                    t("Choose a color")}
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
                                                        className={`flex min-h-10 items-center gap-2 rounded-lg border px-2 py-1.5 text-left ${
                                                            activeEditorColorRef ===
                                                            ref
                                                                ? 'border-[#d9ded5] bg-brand-cyan shadow-sm'
                                                                : 'border-brutal-black/20 bg-white hover:border-[#d9ded5] hover:bg-brand-yellow'
                                                        }`}
                                                    >
                                                        <span
                                                            className="h-4 w-4 shrink-0 rounded-full border border-[#d9ded5]"
                                                            style={{
                                                                backgroundColor:
                                                                    entry
                                                                        ? `rgb(${entry.color.r} ${entry.color.g} ${entry.color.b})`
                                                                        : '#d1d5db',
                                                            }}
                                                        />
                                                        <span className="truncate text-[11px] font-semibold">
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
                                        className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-[11px] font-semibold shadow-sm hover:bg-brand-cyan"
                                    >
                                        {t("Manage Palettes")}
                                    </button>
                                </div>
                            ) : null}

                            {editorMobilePanel === 'setup' ? (
                                <div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-semibold text-brutal-black/65">
                                                {t("Color Brand")}
                                            </span>
                                            <select
                                                value={pendingPrimaryPaletteId}
                                                onChange={(event) =>
                                                    setPendingPrimaryPaletteId(
                                                        event.target.value
                                                    )
                                                }
                                                className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                            >
                                                {PALETTE_OPTIONS.map(
                                                    (option) => (
                                                        <option
                                                            key={option.id}
                                                            value={option.id}
                                                        >
                                                            {getPaletteDisplayLabel(option)}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-semibold text-brutal-black/65">
                                                {t("Pegboard")}
                                            </span>
                                            <select
                                                value={pendingBoardId}
                                                onChange={(event) =>
                                                    setPendingBoardId(
                                                        event.target
                                                            .value as BoardOptionId
                                                    )
                                                }
                                                className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                            >
                                                {BOARD_OPTIONS.map((option) => (
                                                    <option
                                                        key={option.id}
                                                        value={option.id}
                                                    >
                                                        {t(option.label)}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-semibold text-brutal-black/65">
                                                {t("Boards Wide")}
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
                                                className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-semibold text-brutal-black/65">
                                                {t("Boards Tall")}
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
                                                className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                            />
                                        </label>
                                    </div>
                                    {imageSrc ? (
                                        <div className="mt-3 space-y-3 border-t border-brutal-black/10 pt-3">
                                            <label className="flex items-center justify-between gap-3 text-xs font-semibold text-brutal-black">
                                                <span>{t("Show Reference")}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={showReference}
                                                    onChange={(event) =>
                                                        setShowReference(
                                                            event.target.checked
                                                        )
                                                    }
                                                    className="h-4 w-4 accent-[#28614e]"
                                                />
                                            </label>
                                            <label className="block">
                                                <span className="mb-1 flex items-center justify-between text-xs font-semibold text-brutal-black">
                                                    <span>{t("Source Opacity")}</span>
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
                                                    className="w-full accent-[#28614e] disabled:opacity-40"
                                                />
                                            </label>
                                        </div>
                                    ) : null}
                                    {hasPendingPatternSettings ? (
                                        <div className="mt-3 rounded-lg border border-[#d9ded5] bg-brutal-bg px-3 py-2 text-[11px] font-semibold text-brutal-black/70">
                                            {pendingPaletteLabel} ·{' '}
                                            {pendingPatternSize} ·{' '}
                                            {pendingBoardCountStatus}
                                        </div>
                                    ) : null}
                                    {pendingLargePatternWarning ? (
                                        <div className="mt-3 rounded-lg border border-[#d9ded5] bg-brand-yellow px-3 py-2 text-[11px] font-semibold leading-4 text-brutal-black">
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
                                        className="mt-3 min-h-11 w-full rounded-lg border border-[#d9ded5] bg-brand-purple px-3 py-2 text-xs font-semibold text-brutal-black shadow-sm hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                                    >
                                        {t("Apply Changes")}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 z-30 border-t border-[#d9ded5] bg-white p-1.5 shadow-sm sm:border-t sm:p-2 sm:shadow-lg xl:hidden">
                        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden">
                            {EDITOR_TOOLS.map((tool) => (
                                <button
                                    key={tool.id}
                                    type="button"
                                    aria-label={t(tool.label)}
                                    aria-pressed={activeEditorTool === tool.id}
                                    title={`${t(tool.label)} (${tool.shortcut}) • ${t(tool.description)}`}
                                    onClick={() => {
                                        setActiveEditorTool(tool.id);
                                        setEditorMobilePanel(null);
                                    }}
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                        activeEditorTool === tool.id
                                            ? 'border-[#d9ded5] bg-brand-yellow text-brutal-black shadow-sm'
                                            : 'border-brutal-black/25 bg-white text-gray-600 hover:border-[#d9ded5] hover:bg-brand-cyan hover:text-brutal-black'
                                    }`}
                                >
                                    <tool.icon
                                        className="h-[18px] w-[18px]"
                                        strokeWidth={2.1}
                                    />
                                </button>
                            ))}
                            <button
                                ref={mobileColorButtonRef}
                                type="button"
                                onClick={openColorPicker}
                                disabled={enabledColorCount === 0}
                                aria-label={t("Select bead color")}
                                title={t("Select bead color")}
                                className="flex h-10 min-w-[82px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[#d9ded5] bg-white px-2 text-[11px] font-semibold hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400"
                            >
                                <span
                                    className="h-4 w-4 shrink-0 rounded-full border border-[#d9ded5]"
                                    style={{
                                        backgroundColor: activeEditorColorEntry
                                            ? `rgb(${activeEditorColorEntry.color.r} ${activeEditorColorEntry.color.g} ${activeEditorColorEntry.color.b})`
                                            : '#ffffff',
                                    }}
                                />
                                {t("Color")}
                            </button>
                        </div>
                    </div>

                    <aside className="hidden min-h-0 overflow-y-auto border-l border-[#d9ded5] bg-white xl:col-start-3 xl:block">
                        <div className="border-b border-[#d9ded5] p-4">
                            <div className="mb-3 block text-xs font-semibold leading-5 text-[#627168]">
                                {t("Project")}
                            </div>
                            <dl className="space-y-2 text-sm font-semibold">
                                <div className="flex justify-between gap-3 border-b border-brutal-black/10 pb-1">
                                    <dt className="text-brutal-black/60">
                                        {t("Pattern Size")}
                                    </dt>
                                    <dd className="text-right font-semibold">
                                        {patternSize}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3 border-b border-brutal-black/10 pb-1">
                                    <dt className="text-brutal-black/60">
                                        {t("Total Beads")}
                                    </dt>
                                    <dd className="text-right font-semibold">
                                        {number(totalBeads)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt className="text-brutal-black/60">{t("Colors")}</dt>
                                    <dd className="text-right font-semibold">
                                        {number(colorsUsed)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {imageSrc && (
                            <div className="border-b border-[#d9ded5] p-4">
                                <div className="mb-3 block text-xs font-semibold leading-5 text-[#627168]">
                                    {t("Source Image")}
                                </div>
                                <label
                                    htmlFor={IMAGE_UPLOAD_INPUT_ID}
                                    className="group relative block h-24 cursor-pointer overflow-hidden rounded-lg border border-[#d9ded5] bg-brutal-bg"
                                    title={t("Change source image")}
                                >
                                    <NextImage
                                        src={imageSrc}
                                        alt={t("Source image")}
                                        fill
                                        unoptimized
                                        className="object-contain"
                                        style={{
                                            opacity: showReference
                                                ? referenceOpacity / 100
                                                : 0.28,
                                        }}
                                    />
                                    <span className="absolute inset-x-0 bottom-0 translate-y-full bg-brutal-black px-2 py-1 text-center text-[10px] font-semibold text-white transition-transform group-hover:translate-y-0 group-focus-within:translate-y-0">
                                        {t("Change Source")}
                                    </span>
                                    <input
                                        id={IMAGE_UPLOAD_INPUT_ID}
                                        name="editorSourceImage"
                                        aria-label={t("Change editor source image")}
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                                <div className="mt-3 space-y-3">
                                    <label
                                        htmlFor={EDITOR_SOURCE_VISIBLE_ID}
                                        className="flex items-center justify-between gap-3 text-xs font-semibold text-brutal-black"
                                    >
                                        <span>{t("Show Source")}</span>
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
                                            className="h-4 w-4 accent-[#28614e]"
                                        />
                                    </label>
                                    <label
                                        htmlFor={EDITOR_SOURCE_OPACITY_ID}
                                        className="block"
                                    >
                                        <span className="mb-1 flex items-center justify-between text-xs font-semibold text-brutal-black">
                                            <span>{t("Source Opacity")}</span>
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
                                            className="w-full accent-[#28614e] disabled:opacity-40"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 p-4">
                            <div className="block text-xs font-semibold leading-5 text-[#627168]">
                                {t("Pattern Setup")}
                            </div>
                            <label className="block">
                                <span className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-brutal-black/65">
                                    <span>{t("Color Brand")}</span>
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
                                    className="w-full rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                >
                                    {PALETTE_OPTIONS.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {getPaletteDisplayLabel(option)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-brutal-black/65">
                                    <span>{t("Pegboard")}</span>
                                    <span className="truncate text-[11px] text-brutal-black">
                                        {selectedBoard?.label ?? t("Not selected")}
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
                                    className="w-full rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                >
                                    {BOARD_OPTIONS.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {t(option.label)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-brutal-black/65">
                                        <span>{t("Boards Wide")}</span>
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
                                        className="w-full rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-brutal-black/65">
                                        <span>{t("Boards Tall")}</span>
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
                                        className="w-full rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                    />
                                </label>
                            </div>
                            {hasPendingPatternSettings ? (
                                <div className="rounded-lg border border-[#d9ded5] bg-brutal-bg px-3 py-2 text-[11px] font-semibold text-brutal-black/70">
                                    {pendingPaletteLabel} · {pendingPatternSize}{' '}
                                    · {pendingBoardCountStatus}
                                </div>
                            ) : null}
                            {pendingLargePatternWarning ? (
                                <div className="rounded-lg border border-[#d9ded5] bg-brand-yellow px-3 py-2 text-[11px] font-semibold leading-4 text-brutal-black">
                                    {pendingLargePatternWarning}
                                </div>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => void handleApplyPatternSettings()}
                                disabled={
                                    !hasPendingPatternSettings || processing
                                }
                                className="w-full rounded-lg border border-[#d9ded5] bg-brand-purple px-3 py-2 text-xs font-semibold text-brutal-black shadow-brutal-sm hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                            >
                                {t("Apply Changes")}
                            </button>
                        </div>
                    </aside>

                </div>
                ) : null
            ) : (
                <>
                    <div className="relative flex h-[calc(100svh-215px)] min-h-[430px] flex-col sm:hidden">
                        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#d9ded5] bg-white shadow-sm">
                            <div className="flex min-h-11 items-center justify-between gap-2 border-b border-[#d9ded5] bg-brand-cyan px-2.5 py-2">
                                <div className="min-w-0">
                                    <div className="font-sans text-lg leading-none text-brutal-black">
                                        {t("Pattern Preview")}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleHomeMobilePanel('image')
                                    }
                                    className="min-h-9 shrink-0 rounded-lg border border-[#d9ded5] bg-brand-yellow px-3 py-1.5 text-[11px] font-semibold text-brutal-black"
                                >
                                    {imageSrc ? t("Change") : t("Upload")}
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
                                            alt={t("Bead pattern preview")}
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
                                        alt={t("Uploaded source image")}
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
                                        className={`absolute inset-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#d9ded5] px-5 text-center ${
                                            draggingUpload
                                                ? 'bg-brand-yellow'
                                                : 'bg-white'
                                        }`}
                                    >
                                        <span className="grid h-20 w-20 grid-cols-3 grid-rows-3 gap-2 rounded-2xl bg-[#f0f3ed] p-3">
                                            {Array.from({ length: 9 }).map(
                                                (_, index) => (
                                                    <span
                                                        key={index}
                                                        className="rounded-full border border-[#c8d6ca] bg-white"
                                                    />
                                                )
                                            )}
                                        </span>
                                        <span className="font-sans text-xl leading-none text-brutal-black">
                                            {t("Upload Image")}
                                        </span>
                                        <span className="max-w-[260px] text-[11px] font-semibold leading-4 text-brutal-black/55">
                                            {t("Choose a photo and preview the bead pattern here.")}
                                        </span>
                                        <input
                                            name="homeMobileSourceImage"
                                            aria-label={t("Upload image")}
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
                                            className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-[#d9ded5] bg-white px-2 font-sans text-sm leading-none text-brutal-black shadow-sm hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none"
                                            aria-label={t("Zoom out preview")}
                                        >
                                            -
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setClampedPreviewZoom(1)
                                            }
                                            className="h-8 min-w-[52px] rounded-lg border border-[#d9ded5] bg-white px-2 font-sans text-base font-semibold leading-none text-brutal-black shadow-sm hover:bg-brand-yellow"
                                            aria-label={t("Reset preview zoom")}
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
                                            className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-[#d9ded5] bg-white px-2 font-sans text-sm leading-none text-brutal-black shadow-sm hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none"
                                            aria-label={t("Zoom in preview")}
                                        >
                                            +
                                        </button>
                                    </div>
                                ) : null}

                                {processing ? (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                                        <span className="max-w-[260px] animate-pulse rounded-lg border border-[#d9ded5] bg-brand-yellow p-3 text-center font-sans text-lg leading-none text-black shadow-sm">
                                            <span className="block">
                                                {t("Processing...")}
                                            </span>
                                            <span className="mt-2 block font-sans text-[10px] font-semibold leading-4">
                                                {t(processingHint)}
                                            </span>
                                        </span>
                                    </div>
                                ) : null}
                            </div>

                            <div className="grid grid-cols-[1fr_1fr_1fr_1.2fr] border-t border-[#d9ded5] bg-white text-center">
                                <div className="border-r border-[#d9ded5] px-2 py-2">
                                    <div className="text-[9px] font-semibold text-brutal-black/50">
                                        {t("Size")}
                                    </div>
                                    <div className="truncate text-xs font-semibold text-brutal-black">
                                        {patternSize}
                                    </div>
                                </div>
                                <div className="border-r border-[#d9ded5] px-2 py-2">
                                    <div className="text-[9px] font-semibold text-brutal-black/50">
                                        {t("Beads")}
                                    </div>
                                    <div className="truncate text-xs font-semibold text-brutal-black">
                                        {number(totalBeads)}
                                    </div>
                                </div>
                                <div className="border-r border-[#d9ded5] px-2 py-2">
                                    <div className="text-[9px] font-semibold text-brutal-black/50">
                                        {t("Colors")}
                                    </div>
                                    <div className="truncate text-xs font-semibold text-brutal-black">
                                        {number(colorsUsed)}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleOpenEditorPage}
                                    disabled={!previewDataUrl || processing}
                                    className="flex min-h-[50px] min-w-0 flex-col items-center justify-center bg-brand-purple px-1.5 py-1.5 text-brutal-black hover:bg-brand-cyan disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                    aria-label={t("Open editor")}
                                >
                                    <span className="flex items-center justify-center gap-1 text-[9px] font-semibold">
                                        <Pencil className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                            {t("Editor")}
                                        </span>
                                    </span>
                                    <span className="truncate text-xs font-semibold">
                                        {previewDataUrl ? t("Open") : t("Upload")}
                                    </span>
                                </button>
                            </div>
                        </section>

                        {homeMobilePanel ? (
                            <div className="absolute inset-x-2 bottom-[74px] z-40 max-h-[64svh] overflow-y-auto rounded-lg border border-[#d9ded5] bg-white p-3 shadow-sm">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div className="font-sans text-lg leading-none">
                                        {homeMobilePanel === 'image'
                                            ? t("Image")
                                            : homeMobilePanel === 'brand'
                                              ? t("Color Brand")
                                              : homeMobilePanel === 'pegboard'
                                                ? t("Pegboard")
                                                : homeMobilePanel === 'advanced'
                                                  ? t("Advanced")
                                                  : t("Export")}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setHomeMobilePanel(null)
                                        }
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d9ded5] bg-white font-sans text-xl leading-none hover:bg-brand-yellow"
                                        aria-label={t("Close mobile generator panel")}
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
                                            className={`relative flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#d9ded5] px-3 py-2 text-[11px] font-semibold shadow-sm ${
                                                draggingUpload
                                                    ? 'bg-brand-yellow'
                                                    : 'bg-brand-yellow hover:bg-white'
                                            }`}
                                        >
                                            <ImageIcon className="h-4 w-4" />
                                            {imageSrc
                                                ? t("Change Image")
                                                : t("Upload Image")}
                                            <input
                                                name="homeMobileSheetImage"
                                                aria-label={t("Upload or replace source image")}
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
                                                className="min-h-11 rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-[11px] font-semibold shadow-sm hover:bg-brand-cyan"
                                            >
                                                {t("Open Project")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleSaveProject();
                                                    setHomeMobilePanel(null);
                                                }}
                                                disabled={!canSaveProject}
                                                className="min-h-11 rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-[11px] font-semibold shadow-sm hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none"
                                            >
                                                {t("Save Project")}
                                            </button>
                                        </div>
                                    </div>
                                ) : null}

                                {homeMobilePanel === 'pegboard' ? (
                                    <div className="space-y-3">
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-semibold text-brutal-black/65">
                                                {t("Pegboard")}
                                            </span>
                                            <select
                                                name="homeMobileBoard"
                                                aria-label={t("Pegboard")}
                                                value={boardId}
                                                onChange={(event) =>
                                                    setBoardId(
                                                        event.target
                                                            .value as BoardOptionId
                                                    )
                                                }
                                                className="min-h-11 w-full appearance-auto rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                            >
                                                {BOARD_OPTIONS.map(
                                                    (option) => (
                                                        <option
                                                            key={option.id}
                                                            value={option.id}
                                                        >
                                                            {t(option.label)}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="block">
                                                <span className="mb-1 block text-[11px] font-semibold text-brutal-black/65">
                                                    {t("Boards Wide")}
                                                </span>
                                                <input
                                                    name="homeMobileBoardWidth"
                                                    aria-label={t("Boards wide")}
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
                                                    className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                                />
                                            </label>
                                            <label className="block">
                                                <span className="mb-1 block text-[11px] font-semibold text-brutal-black/65">
                                                    {t("Boards Tall")}
                                                </span>
                                                <input
                                                    name="homeMobileBoardHeight"
                                                    aria-label={t("Boards tall")}
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
                                                    className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                                />
                                            </label>
                                        </div>
                                        <div className="rounded-lg border border-[#d9ded5] bg-brutal-bg px-3 py-2 text-[11px] font-semibold text-brutal-black/70">
                                            {compactPatternStatus}
                                        </div>
                                        {currentLargePatternWarning ? (
                                            <div className="rounded-lg border border-[#d9ded5] bg-brand-yellow px-3 py-2 text-[11px] font-semibold leading-4 text-brutal-black">
                                                {currentLargePatternWarning}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {homeMobilePanel === 'brand' ? (
                                    <div className="space-y-3">
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-semibold text-brutal-black/65">
                                                {t("Color Brand")}
                                            </span>
                                            <select
                                                name="homeMobilePrimaryPalette"
                                                aria-label={t("Color brand")}
                                                value={primaryPaletteId}
                                                onChange={(event) =>
                                                    handlePrimaryPaletteChange(
                                                        event.target.value
                                                    )
                                                }
                                                className="min-h-11 w-full appearance-auto rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                            >
                                                {PALETTE_OPTIONS.map(
                                                    (option) => (
                                                        <option
                                                            key={option.id}
                                                            value={option.id}
                                                        >
                                                            {getPaletteDisplayLabel(option)}
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
                                                        className={`flex min-h-11 items-center gap-2 rounded-lg border border-[#d9ded5] px-2 py-2 text-[11px] font-semibold ${
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
                                                            className="h-4 w-4 shrink-0 accent-[#28614e]"
                                                        />
                                                        <span className="truncate">
                                                            {getPaletteDisplayLabel(option)}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <div className="rounded-lg border border-[#d9ded5] bg-brutal-bg px-3 py-2 text-[11px] font-semibold text-brutal-black/70">
                                            {compactColorBrandStatus}
                                        </div>
                                    </div>
                                ) : null}

                                {homeMobilePanel === 'advanced' ? (
                                    <div className="space-y-3">
                                        <div className="grid gap-3">
                                            <label className="block">
                                                <span className="mb-1 block text-[11px] font-semibold text-brutal-black/65">
                                                    {t("Matching")}
                                                </span>
                                                <select
                                                    name="homeMobileMatching"
                                                    value={matchingId}
                                                    onChange={(event) =>
                                                        setMatchingId(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="min-h-11 w-full appearance-auto rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                                >
                                                    {MATCHING_OPTIONS.map(
                                                        (option) => (
                                                            <option
                                                                key={option.id}
                                                                value={
                                                                    option.id
                                                                }
                                                            >
                                                                {t(option.label)}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </label>
                                            <label className="block">
                                                <span className="mb-1 block text-[11px] font-semibold text-brutal-black/65">
                                                    {t("Dithering")}
                                                </span>
                                                <select
                                                    name="homeMobileDithering"
                                                    value={ditheringId}
                                                    onChange={(event) =>
                                                        setDitheringId(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="min-h-11 w-full appearance-auto rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                                >
                                                    {DITHERING_OPTIONS.map(
                                                        (option) => (
                                                            <option
                                                                key={option.id}
                                                                value={
                                                                    option.id
                                                                }
                                                            >
                                                                {t(option.label)}
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
                                                    t("Brightness"),
                                                    0,
                                                    200,
                                                ],
                                                ['contrast', t("Contrast"), 0, 200],
                                                [
                                                    'saturation',
                                                    t("Saturation"),
                                                    0,
                                                    200,
                                                ],
                                                [
                                                    'grayscale',
                                                    t("Grayscale"),
                                                    0,
                                                    100,
                                                ],
                                            ] as const
                                        ).map(([key, label, min, max]) => (
                                            <label
                                                key={key}
                                                className="block rounded-lg border border-[#d9ded5] bg-white p-2"
                                            >
                                                <span className="mb-1 flex items-center justify-between text-[11px] font-semibold text-brutal-black/65">
                                                    <span>{t(label)}</span>
                                                    <span>
                                                        {imageAdjustments[key]}
                                                    </span>
                                                </span>
                                                <input
                                                    name={`homeMobileImage-${key}`}
                                                    aria-label={t('{label} slider', { label: t(label) })}
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
                                                    className="w-full accent-[#28614e]"
                                                />
                                            </label>
                                        ))}

                                        <div className="grid gap-2">
                                            {(
                                                [
                                                    ['center', t("Center")],
                                                    ['fit', t("Fit To Boards")],
                                                    [
                                                        'showGrid',
                                                        t("Show Board Grid"),
                                                    ],
                                                ] as const
                                            ).map(([key, label]) => (
                                                <label
                                                    key={key}
                                                    className="flex min-h-11 items-center gap-3 rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-[11px] font-semibold"
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
                                                        className="h-4 w-4 accent-[#28614e]"
                                                    />
                                                    {t(label)}
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
                                            className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-[11px] font-semibold shadow-sm hover:bg-brand-yellow"
                                        >
                                            {t("Reset Adjustments")}
                                        </button>
                                    </div>
                                ) : null}

                                {homeMobilePanel === 'export' ? (
                                    <div className="space-y-3">
                                        {errorMessage && (
                                            <p role="alert" className="rounded-lg border border-[#d9ded5] bg-brand-magenta p-3 text-sm font-semibold text-white">
                                                {getEditorErrorMessage(errorMessage, locale)}
                                            </p>
                                        )}
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-semibold text-brutal-black/65">
                                                {t("File Name")}
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
                                                className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-[11px] font-semibold text-brutal-black/65">
                                                {t("Export Format")}
                                            </span>
                                            <select
                                                name="homeMobileExportFormat"
                                                value={exportFormatId}
                                                onChange={(event) =>
                                                    setExportFormatId(
                                                        event.target.value
                                                    )
                                                }
                                                className="min-h-11 w-full appearance-auto rounded-lg border border-[#d9ded5] bg-white px-2 py-2 text-sm font-semibold text-brutal-black focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                            >
                                                {EXPORT_OPTIONS.map(
                                                    (option) => (
                                                        <option
                                                            key={option.id}
                                                            value={option.id}
                                                        >
                                                            {t(option.label)}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </label>
                                        <PdfScaleField locale={locale} id="home-pdf-scale" value={pdfScaleMode} supportsActualSize={supportsMidiActualSize} onChange={setPdfScaleMode} />
                                        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[#d9ded5] bg-brutal-bg px-3 py-2 text-[11px] font-semibold">
                                            <input
                                                name="homeMobileExportSymbols"
                                                type="checkbox"
                                                checked={useSymbols}
                                                onChange={(event) =>
                                                    setUseSymbols(
                                                        event.target.checked
                                                    )
                                                }
                                                className="h-4 w-4 accent-[#28614e]"
                                            />
                                            {t("Use Symbols In Printable Exports")}
                                        </label>
                                        {exportStatusText ? (
                                            <div
                                                role="status"
                                                aria-live="polite"
                                                className="rounded-lg border border-[#d9ded5] bg-brand-yellow px-3 py-2 text-[11px] font-semibold leading-4 text-brutal-black"
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
                                            disabled={!canExportSelectedFormat}
                                            className="min-h-12 w-full rounded-lg border border-[#28614e] bg-[#28614e] px-3 py-2 font-sans text-sm font-semibold text-white shadow-sm hover:bg-[#214f40] disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none"
                                        >
                                            {exportingId === exportFormatId
                                                ? t("Exporting...")
                                                : t('Export {format}', { format: t(selectedExportLabel) })}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveProject}
                                            disabled={!canSaveProject}
                                            className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-[11px] font-semibold shadow-sm hover:bg-brand-yellow disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none"
                                        >
                                            {t("Save Project")}
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="z-40 border-t border-[#d9ded5] bg-white px-1.5 pb-[env(safe-area-inset-bottom)] shadow-sm">
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
                                            className={`flex min-w-0 flex-col items-center justify-center gap-1 border-l border-brutal-black/15 px-1 text-[10px] font-semibold first:border-l-0 ${
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
                                                {t(item.label)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

            <div className="hidden items-stretch gap-4 sm:grid sm:gap-6 xl:h-[calc(100svh-330px)] xl:min-h-[560px] xl:max-h-[640px] xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
                <div className="min-h-0 xl:h-full">
                    <Card className="h-full overflow-y-auto bg-white p-3 sm:p-4">
                        <div className="space-y-3">
                            <EditorSection title={t("Image")}>
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
                                            : `rounded-lg border border-dashed border-[#a8b8aa] p-3 sm:p-4 ${
                                                  draggingUpload
                                                      ? 'bg-brand-yellow'
                                                      : 'bg-[#f0f4ed] hover:bg-brand-cyan'
                                              }`
                                    }`}
                                >
                                    {imageSrc ? (
                                        <span className="relative block overflow-hidden rounded-md">
                                            <span className="relative block h-[118px] bg-[#f4f6f7] sm:h-[132px]">
                                                <NextImage
                                                    src={imageSrc}
                                                    alt={t("Uploaded source image")}
                                                    fill
                                                    unoptimized
                                                    className="object-contain"
                                                />
                                            </span>
                                            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-[#54595d] px-3 py-2 text-center text-[11px] font-semibold leading-none text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                                {t("Change Source")}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-base">
                                            {t("Upload Image")}
                                        </span>
                                    )}
                                    <input
                                        id={IMAGE_UPLOAD_INPUT_ID}
                                        name="homeSourceImage"
                                        aria-label={t("Upload or replace source image")}
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            </EditorSection>

                            <EditorSection title={t("Color Brand")}>
                                <select
                                    id={HOME_PRIMARY_PALETTE_ID}
                                    name="homePrimaryPalette"
                                    aria-label={t("Color brand")}
                                    value={primaryPaletteId}
                                    onChange={(event) =>
                                        handlePrimaryPaletteChange(
                                            event.target.value
                                        )
                                    }
                                    className="w-full appearance-auto rounded-lg border border-[#d9ded5] bg-white p-1.5 font-sans text-base focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1 sm:border sm:text-sm"
                                >
                                    {PALETTE_OPTIONS.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {getPaletteDisplayLabel(option)}
                                        </option>
                                    ))}
                                </select>

                                <div className="px-1 text-[10px] font-semibold text-brutal-black/70">
                                    {compactColorBrandStatus}
                                </div>
                            </EditorSection>

                            <EditorSection title={t("Pegboard")}>
                                <select
                                    id={HOME_BOARD_ID}
                                    name="homeBoard"
                                    aria-label={t("Pegboard")}
                                    value={boardId}
                                    onChange={(event) =>
                                        setBoardId(
                                            event.target.value as BoardOptionId
                                        )
                                    }
                                    className="w-full appearance-auto rounded-lg border border-[#d9ded5] bg-white p-1.5 font-sans text-base focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1 sm:border sm:text-sm"
                                >
                                    {BOARD_OPTIONS.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {t(option.label)}
                                        </option>
                                    ))}
                                </select>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold tracking-wide text-brutal-black/70">
                                            {t("Boards Wide")}
                                        </label>
                                        <input
                                            id={HOME_BOARD_WIDTH_ID}
                                            name="homeBoardWidth"
                                            aria-label={t("Boards wide")}
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
                                            className="w-full rounded-lg border border-[#d9ded5] bg-white p-1.5 font-sans text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1 sm:border sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold tracking-wide text-brutal-black/70">
                                            {t("Boards Tall")}
                                        </label>
                                        <input
                                            id={HOME_BOARD_HEIGHT_ID}
                                            name="homeBoardHeight"
                                            aria-label={t("Boards tall")}
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
                                            className="w-full rounded-lg border border-[#d9ded5] bg-white p-1.5 font-sans text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1 sm:border sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="px-1 text-[10px] font-semibold text-brutal-black/70">
                                    {compactPatternStatus}
                                </div>
                                {currentLargePatternWarning ? (
                                    <div className="rounded-lg border border-[#d9ded5] bg-brand-yellow px-2 py-1 text-[10px] font-semibold leading-4 text-brutal-black">
                                        {currentLargePatternWarning}
                                    </div>
                                ) : null}
                            </EditorSection>

                            <div className="grid grid-cols-3 gap-1.5 border-t border-brutal-black/15 pt-2 sm:gap-2 sm:border-t">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="min-h-10 w-full px-2 py-1 text-sm [border-width:1px] shadow-sm sm:text-base sm:[border-width:1px] sm:shadow-brutal"
                                    onClick={() => setIsPaletteManagerOpen(true)}
                                >
                                    {t("Colors")}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="min-h-10 w-full px-2 py-1 text-sm [border-width:1px] shadow-sm sm:text-base sm:[border-width:1px] sm:shadow-brutal"
                                    onClick={() => setIsAdvancedOpen(true)}
                                >
                                    {t("Advanced")}
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="min-h-10 w-full px-2 py-1 text-sm [border-width:1px] shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:text-base sm:[border-width:1px] sm:shadow-brutal"
                                    onClick={() => setIsExportDialogOpen(true)}
                                    disabled={!canExportPattern}
                                >
                                    {t("Export")}
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="min-h-10 w-full px-2 py-1 text-sm [border-width:1px] shadow-sm sm:text-base sm:[border-width:1px] sm:shadow-brutal"
                                    onClick={handleOpenProjectPicker}
                                >
                                    {t("Open Project")}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="min-h-10 w-full px-2 py-1 text-sm [border-width:1px] shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:text-base sm:[border-width:1px] sm:shadow-brutal"
                                    onClick={handleSaveProject}
                                    disabled={!canSaveProject}
                                >
                                    {t("Save Project")}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {isAdvancedOpen && (
                        <EditorDialog
                            locale={locale}
                            title={t("Advanced")}
                            summary={t("Matching, dithering, image filters, renderer")}
                            onClose={() => setIsAdvancedOpen(false)}
                        >
                            <div className="space-y-5 text-black">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor={EDITOR_MATCHING_ID}
                                        className="mb-1 block font-semibold"
                                    >
                                        {t("Matching")}
                                    </label>
                                    <select
                                        id={EDITOR_MATCHING_ID}
                                        name="editorMatching"
                                        value={matchingId}
                                        onChange={(event) =>
                                            setMatchingId(event.target.value)
                                        }
                                        className="w-full appearance-auto rounded-lg border border-[#d9ded5] bg-white p-2 font-sans text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                    >
                                        {MATCHING_OPTIONS.map((option) => (
                                            <option
                                                key={option.id}
                                                value={option.id}
                                            >
                                                {t(option.label)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor={EDITOR_DITHERING_ID}
                                        className="mb-1 block font-semibold"
                                    >
                                        {t("Dithering")}
                                    </label>
                                    <select
                                        id={EDITOR_DITHERING_ID}
                                        name="editorDithering"
                                        value={ditheringId}
                                        onChange={(event) =>
                                            setDitheringId(event.target.value)
                                        }
                                        className="w-full appearance-auto rounded-lg border border-[#d9ded5] bg-white p-2 font-sans text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1"
                                    >
                                        {DITHERING_OPTIONS.map((option) => (
                                            <option
                                                key={option.id}
                                                value={option.id}
                                            >
                                                {t(option.label)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                                {(
                                    [
                                        ['brightness', t("Brightness"), 0, 200],
                                        ['contrast', t("Contrast"), 0, 200],
                                        ['saturation', t("Saturation"), 0, 200],
                                        ['grayscale', t("Grayscale"), 0, 100],
                                    ] as const
                                ).map(([key, label, min, max]) => {
                                    const numberId = `editor-image-${key}-number`;
                                    const rangeId = `editor-image-${key}-range`;

                                    return (
                                        <div
                                            key={key}
                                            className="space-y-2 rounded-lg border border-[#d9ded5] bg-white p-3 text-black"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <label
                                                    htmlFor={numberId}
                                                    className="font-semibold"
                                                >
                                                    {t(label)}
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
                                                    className="w-24 rounded-lg border border-[#d9ded5] bg-white p-1 font-sans text-sm text-black"
                                                />
                                            </div>
                                            <input
                                                id={rangeId}
                                                name={rangeId}
                                                aria-label={t('{label} slider', { label: t(label) })}
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
                                                className="w-full accent-[#28614e]"
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                                <label
                                    htmlFor={EDITOR_RENDER_CENTER_ID}
                                    className="flex items-center gap-3 rounded-lg border border-[#d9ded5] bg-white px-3 py-2 font-semibold text-black"
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
                                        className="h-5 w-5 accent-[#28614e]"
                                    />
                                    {t("Center")}
                                </label>
                                <label
                                    htmlFor={EDITOR_RENDER_FIT_ID}
                                    className="flex items-center gap-3 rounded-lg border border-[#d9ded5] bg-white px-3 py-2 font-semibold text-black"
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
                                        className="h-5 w-5 accent-[#28614e]"
                                    />
                                    {t("Fit To Boards")}
                                </label>
                                <label
                                    htmlFor={EDITOR_RENDER_GRID_ID}
                                    className="flex items-center gap-3 rounded-lg border border-[#d9ded5] bg-white px-3 py-2 font-semibold text-black md:col-span-2 xl:col-span-1"
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
                                        className="h-5 w-5 accent-[#28614e]"
                                    />
                                    {t("Show Board Grid In Preview")}
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
                                {t("Reset Advanced")}
                            </Button>
                        </div>
                        </EditorDialog>
                    )}

                </div>

                <div className="min-h-0 xl:h-full">
                    <Card
                        className="z-10 flex min-h-[320px] flex-1 flex-col border-[#d9ded5] bg-white p-0 [border-width:1px] shadow-sm sm:min-h-[480px] sm:[border-width:1px] sm:shadow-brutal xl:h-full xl:min-h-0"
                    >
                        <div className="relative min-h-[240px] flex-1 overflow-hidden bg-white sm:min-h-[280px]">
                            {processing && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                                    <span className="max-w-[260px] animate-pulse rounded-lg border border-[#d9ded5] bg-brand-yellow p-3 text-center font-sans text-lg leading-none text-black shadow-sm sm:max-w-[280px] sm:border sm:p-4 sm:text-xl sm:shadow-brutal">
                                        <span className="block">
                                            {t("PROCESSING...")}
                                        </span>
                                        <span className="mt-2 block font-sans text-[11px] font-semibold leading-4">
                                            {t(processingHint)}
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
                                    className="flex h-6 min-w-6 items-center justify-center rounded-lg border border-[#d9ded5] bg-white px-1 font-sans text-base leading-none text-black shadow-sm transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none disabled:hover:translate-y-0"
                                    aria-label={t("Zoom out preview")}
                                >
                                    -
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClampedPreviewZoom(1)}
                                    disabled={!previewDataUrl}
                                    className="min-w-[48px] rounded-lg border border-[#d9ded5] bg-white px-1.5 py-0.5 font-sans text-sm font-semibold leading-none text-black shadow-sm transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none disabled:hover:translate-y-0"
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
                                    className="flex h-6 min-w-6 items-center justify-center rounded-lg border border-[#d9ded5] bg-white px-1 font-sans text-base leading-none text-black shadow-sm transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none disabled:hover:translate-y-0"
                                    aria-label={t("Zoom in preview")}
                                >
                                    +
                                </button>
                                <button
                                    type="button"
                                    onClick={handleOpenEditorPage}
                                    disabled={!previewDataUrl || processing}
                                    className="hidden rounded-lg border border-[#d9ded5] bg-white px-1.5 py-0.5 font-sans text-xs font-semibold leading-none text-black shadow-sm transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:text-gray-400 disabled:shadow-none disabled:hover:translate-y-0 sm:block"
                                >
                                    {t("Edit Pattern")}
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
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-[#627168]">
                                        <div
                                            className="grid h-24 w-24 grid-cols-3 grid-rows-3 gap-2.5 rounded-2xl border border-[#d9ded5] bg-[#f3f5ef] p-4"
                                            aria-hidden="true"
                                        >
                                            {Array.from({ length: 9 }).map((_, index) => (
                                                <span
                                                    key={index}
                                                    className="rounded-full border border-[#cad7cb] bg-white"
                                                />
                                            ))}
                                        </div>
                                        <p className="max-w-[260px] text-sm leading-6 text-[#627168]">
                                            {t("Upload an image to generate a centered board preview")}
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
                                                alt={t("Bead pattern preview")}
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
                                <div className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[9px] font-semibold text-brutal-black/80 sm:gap-x-4 sm:text-[10px] sm:tracking-normal">
                                    <span>{t("Pattern Size:")} {patternSize}</span>
                                    <span>{t("Total Beads:")} {number(totalBeads)}</span>
                                    <span>{t("Colors:")} {number(colorsUsed)}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
                </>
            )}

            {isPaletteManagerOpen && (
                <EditorDialog
                    locale={locale}
                    title={t("Colors")}
                    summary={t('{palettes} palettes selected • {colors} enabled colors', { palettes: number(selectedPaletteIds.length), colors: number(enabledColorCount) })}
                    onClose={() => setIsPaletteManagerOpen(false)}
                    restoreFocusFallback={isEditorPage ? mobileColorsNavButtonRef : undefined}
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
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border border-[#d9ded5] px-3 py-2 font-semibold ${
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
                                        className="h-5 w-5 accent-[#28614e]"
                                    />
                                    <span className="text-sm">
                                        {getPaletteDisplayLabel(option)}
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
                                    className="rounded-lg border border-[#d9ded5] bg-gray-50"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d9ded5] bg-brand-cyan px-3 py-2">
                                        <div>
                                            <div className="font-sans text-lg">
                                                {getPaletteNameDisplayLabel(palette.name)}
                                            </div>
                                            <div className="text-xs font-semibold tracking-wide">
                                                {t('{enabled} / {total} enabled', { enabled: number(enabledEntries), total: number(palette.entries.length) })}
                                            </div>
                                        </div>
                                        <label
                                            htmlFor={enableAllInputId}
                                            className="flex items-center gap-2 rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-xs font-semibold"
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
                                                className="h-4 w-4 accent-[#28614e]"
                                            />
                                            {t("Enable All")}
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
                                                    className={`flex items-center gap-3 rounded-lg border border-[#d9ded5] px-3 py-2 text-left transition-colors ${
                                                        entry.enabled
                                                            ? 'bg-white hover:bg-brand-yellow'
                                                            : 'bg-gray-200 text-gray-500'
                                                    }`}
                                                >
                                                    <span
                                                        className="h-6 w-6 shrink-0 rounded-full border border-[#d9ded5]"
                                                        style={{
                                                            backgroundColor: `rgb(${entry.color.r} ${entry.color.g} ${entry.color.b})`,
                                                        }}
                                                    />
                                                    <span className="min-w-0">
                                                        <span className="block font-sans text-sm leading-none">
                                                            {entry.ref}
                                                        </span>
                                                        <span className="block truncate text-xs font-semibold">
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

            {isColorPickerOpen && (
                <div
                    ref={colorPickerDialogRef}
                    tabIndex={-1}
                    className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-[#243e36]/35 backdrop-blur-sm p-0 sm:items-center sm:justify-center sm:p-3"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("Select Color")}
                >
                    <div className="flex h-[100svh] w-full max-w-none flex-col overflow-hidden bg-white shadow-none sm:h-auto sm:max-h-[86vh] sm:max-w-4xl sm:rounded-xl sm:border sm:border-[#d9ded5] sm:shadow-lg">
                        <div className="flex items-center justify-between gap-3 border-b border-[#d9ded5] bg-white px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
                            <div>
                                <div className="font-sans text-lg leading-none text-brutal-black sm:text-xl">
                                    {t("Select Color")}
                                </div>
                                <div className="mt-1 text-[10px] font-semibold text-brutal-black/60 sm:text-[11px]">
                                    {t("Pick a bead color from the loaded palettes")}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setColorPickerQuery('');
                                    setIsColorPickerOpen(false);
                                }}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#d9ded5] bg-white font-sans text-xl leading-none text-brutal-black hover:bg-brand-cyan sm:h-9 sm:w-9 sm:text-lg"
                                aria-label={t("Close color picker")}
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid min-h-0 flex-1 md:grid-cols-[220px_minmax(0,1fr)]">
                            <aside className="max-h-32 overflow-auto border-b border-[#d9ded5] bg-brutal-bg p-2.5 sm:max-h-40 sm:p-3 md:max-h-none md:border-b-0 md:border-r">
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
                                                className={`flex min-h-11 w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
                                                    isActive
                                                        ? 'border-[#d9ded5] bg-brand-yellow text-brutal-black'
                                                        : 'border-brutal-black/20 bg-white text-brutal-black hover:border-[#d9ded5] hover:bg-brand-cyan'
                                                }`}
                                            >
                                                <span className="text-sm font-semibold">
                                                    {getPaletteDisplayLabel(option)}
                                                </span>
                                                <span className="text-xs font-semibold text-brutal-black/55">
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
                                    <div className="flex h-full min-h-[260px] items-center justify-center font-sans text-xl text-brutal-black/45">
                                        {t("Loading colors...")}
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
                                                aria-label={t("Search bead colors")}
                                                placeholder={t("Search color or code")}
                                                className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-sm font-semibold focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1 sm:max-w-xs"
                                            />
                                            <div className="text-[11px] font-semibold text-brutal-black/55">
                                                {t('{count} colors', { count: number(currentColorPickerEntries.length) })}
                                            </div>
                                        </div>
                                        {currentColorPickerEntries.length ===
                                        0 ? (
                                            <div className="rounded-lg border border-dashed border-brutal-black/25 bg-brutal-bg p-4 text-sm font-semibold text-brutal-black/45">
                                                {t("No matching colors")}
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
                                                        className={`flex min-h-11 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors sm:gap-3 sm:px-3 ${
                                                            isActive
                                                                ? 'border-[#d9ded5] bg-brand-cyan'
                                                                : 'border-brutal-black/15 bg-white hover:border-[#d9ded5] hover:bg-brand-yellow'
                                                        }`}
                                                    >
                                                        <span
                                                            className="h-7 w-7 shrink-0 rounded-full border border-[#d9ded5] sm:h-8 sm:w-8"
                                                            style={{
                                                                backgroundColor: `rgb(${entry.color.r} ${entry.color.g} ${entry.color.b})`,
                                                            }}
                                                        />
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-semibold text-brutal-black">
                                                                {entry.name}
                                                            </span>
                                                            <span className="block text-xs font-semibold text-brutal-black/55">
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
                    ref={exportDialogRef}
                    tabIndex={-1}
                    className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-[#243e36]/35 backdrop-blur-sm p-0 sm:items-center sm:justify-center sm:p-3"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("Export")}
                    aria-busy={exportingId !== null}
                >
                    <div className="flex h-[100svh] w-full max-w-none flex-col overflow-hidden bg-white shadow-none sm:h-auto sm:max-h-[90svh] sm:max-w-lg sm:rounded-xl sm:border sm:border-[#d9ded5] sm:shadow-lg">
                        <div className="flex items-center justify-between gap-3 border-b border-[#d9ded5] bg-white px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
                            <div>
                                <div className="font-sans text-lg leading-none sm:text-xl">
                                    {t("Export")}
                                </div>
                                <div className="mt-1 text-[10px] font-semibold text-gray-600 sm:text-[11px]">
                                    {t("Choose file name, format and printable options")}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsExportDialogOpen(false)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#d9ded5] bg-white font-sans text-xl leading-none hover:bg-brand-yellow sm:h-9 sm:w-9 sm:text-lg"
                                aria-label={t("Close export dialog")}
                            >
                                ×
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3 sm:p-4">
                            {errorMessage && (
                                <p role="alert" className="rounded-lg border border-[#d9ded5] bg-brand-magenta p-3 text-sm font-semibold text-white">
                                    {getEditorErrorMessage(errorMessage, locale)}
                                </p>
                            )}
                            <div>
                                <label
                                    htmlFor={EXPORT_FILE_NAME_ID}
                                    className="mb-1 block text-sm font-semibold"
                                >
                                    {t("Export File Name")}
                                </label>
                                <input
                                    id={EXPORT_FILE_NAME_ID}
                                    name="exportFileName"
                                    type="text"
                                    value={fileName}
                                    onChange={(event) =>
                                        setFileName(event.target.value)
                                    }
                                    className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-3 py-2 font-sans text-base font-semibold focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1 sm:text-lg"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor={EXPORT_FORMAT_ID}
                                    className="mb-1 block text-sm font-semibold"
                                >
                                    {t("Export Format")}
                                </label>
                                <select
                                    id={EXPORT_FORMAT_ID}
                                    name="exportFormat"
                                    value={exportFormatId}
                                    onChange={(event) =>
                                        setExportFormatId(event.target.value)
                                    }
                                    className="min-h-11 w-full appearance-auto rounded-lg border border-[#d9ded5] bg-white px-3 py-2 font-sans text-base focus:bg-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#28614e]/35 focus:ring-offset-1 sm:text-lg"
                                >
                                    {EXPORT_OPTIONS.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {t(option.label)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <PdfScaleField locale={locale} id="export-pdf-scale" value={pdfScaleMode} supportsActualSize={supportsMidiActualSize} onChange={setPdfScaleMode} />

                            <label
                                htmlFor={EXPORT_SYMBOLS_ID}
                                className="flex min-h-11 items-center gap-3 rounded-lg border border-[#d9ded5] bg-brutal-bg px-3 py-2 text-xs font-semibold sm:text-sm"
                            >
                                <input
                                    id={EXPORT_SYMBOLS_ID}
                                    name="exportSymbols"
                                    type="checkbox"
                                    checked={useSymbols}
                                    onChange={(event) =>
                                        setUseSymbols(event.target.checked)
                                    }
                                    className="h-4 w-4 accent-[#28614e]"
                                />
                                {t("Use Symbols In Printable Exports")}
                            </label>

                            {exportStatusText ? (
                                <div
                                    role="status"
                                    aria-live="polite"
                                    className="rounded-lg border border-[#d9ded5] bg-brand-yellow px-3 py-2 text-xs font-semibold leading-5 text-brutal-black"
                                >
                                    {exportStatusText}
                                </div>
                            ) : null}

                            <button
                                type="button"
                                className="min-h-11 w-full rounded-lg border border-[#28614e] bg-[#28614e] px-4 py-2 font-sans text-base font-semibold text-white hover:bg-[#214f40] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 sm:text-sm"
                                onClick={() => void handleExport(exportFormatId)}
                                disabled={!canExportSelectedFormat}
                            >
                                {exportingId === exportFormatId
                                    ? t("Exporting...")
                                    : t('Export {format}', { format: t(selectedExportLabel) })}
                            </button>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {EXPORT_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        className={`min-h-11 rounded-lg border border-[#d9ded5] px-2 py-1 font-sans text-sm font-semibold leading-none disabled:cursor-not-allowed disabled:border-brutal-black/20 disabled:bg-gray-100 disabled:text-gray-400 sm:text-base ${
                                            option.id === exportFormatId
                                                ? 'bg-brand-yellow'
                                                : 'bg-white hover:bg-brand-cyan'
                                        }`}
                                        onClick={() => {
                                            setExportFormatId(option.id);
                                            void handleExport(option.id);
                                        }}
                                        disabled={!canExportPattern || (option.id === 'pdf' && !isPdfScaleSupported)}
                                    >
                                        {exportingId === option.id
                                            ? t("Exporting...")
                                            : t(option.label)}
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
                    aria-label={t("Convert image in the editor")}
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
                aria-label={t("Open bead pattern project")}
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
