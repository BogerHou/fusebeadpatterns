'use client';

import NextImage from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

import {
    BOARD_OPTIONS,
    DITHERING_OPTIONS,
    EXPORT_OPTIONS,
    MATCHING_OPTIONS,
    PALETTE_OPTIONS,
    getBoardOption,
    getDitheringOption,
    getMatchingOption,
    getPaletteOption,
    parsePaletteCsv,
} from '@/lib/editor/config';
import {
    getPreviewRenderSize,
    svgMarkupToDataUrl,
} from '@/lib/editor/preview';
import { getFirstImageFile } from '@/lib/editor/upload';
import { Project } from '@/lib/core/model/project/project.model';
import { Palette } from '@/lib/core/model/palette/palette.model';
import { BoardConfiguration } from '@/lib/core/model/configuration/board-configuration.model';
import { DitheringConfiguration } from '@/lib/core/model/configuration/dithering-configuration.model';
import { ExportConfiguration } from '@/lib/core/model/configuration/export-configuration.model';
import { ImageConfiguration } from '@/lib/core/model/configuration/image-configuration.model';
import { MatchingConfiguration } from '@/lib/core/model/configuration/matching-configuration.model';
import { PaletteConfiguration } from '@/lib/core/model/configuration/palette-configuration.model';
import { RendererConfiguration } from '@/lib/core/model/configuration/renderer-configuration.model';
import { LoadImage } from '@/lib/core/model/image/load-image.model';
import {
    computeUsage,
    drawImageInsideCanvas,
    reduceColor,
} from '@/lib/core/utils/utils';

const DEFAULT_PALETTE_ID = 'perler';
const DEFAULT_BOARD_ID = getPaletteOption(DEFAULT_PALETTE_ID)?.boardId ?? 'midi';
const DEFAULT_MATCHING_ID = 'delta_e_cie2000';
const DEFAULT_DITHERING_ID = 'none';
const PREVIEW_FALLBACK_BOUNDS = {
    maxWidth: 1200,
    maxHeight: 900,
};
const PREVIEW_VIEWPORT_PADDING = {
    horizontal: 56,
    vertical: 56,
};
const PREVIEW_ZOOM_OPTIONS = [
    { label: 'Fit', value: 1 },
    { label: '125%', value: 1.25 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2 },
];
const IMAGE_UPLOAD_INPUT_ID = 'image-upload-input';

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

function rgbToHsl(r: number, g: number, b: number): string {
    const normalizedR = r / 255;
    const normalizedG = g / 255;
    const normalizedB = b / 255;

    const max = Math.max(normalizedR, normalizedG, normalizedB);
    const min = Math.min(normalizedR, normalizedG, normalizedB);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const delta = max - min;
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

        switch (max) {
            case normalizedR:
                h = (normalizedG - normalizedB) / delta + (normalizedG < normalizedB ? 6 : 0);
                break;
            case normalizedG:
                h = (normalizedB - normalizedR) / delta + 2;
                break;
            default:
                h = (normalizedR - normalizedG) / delta + 4;
                break;
        }

        h /= 6;
    }

    return `hsl(${h * 360}, ${s * 100}%, ${l * 100}%)`;
}

export default function Editor() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [fileName, setFileName] = useState('bead-pattern');
    const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE_ID);
    const [boardId, setBoardId] = useState(DEFAULT_BOARD_ID);
    const [boardWidth, setBoardWidth] = useState(1);
    const [boardHeight, setBoardHeight] = useState(1);
    const [matchingId, setMatchingId] = useState(DEFAULT_MATCHING_ID);
    const [ditheringId, setDitheringId] = useState(DEFAULT_DITHERING_ID);
    const [useSymbols, setUseSymbols] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [beadsUsage, setBeadsUsage] = useState<Map<string, number>>(new Map());
    const [activePalette, setActivePalette] = useState<Palette | null>(null);
    const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
    const [previewSize, setPreviewSize] = useState({ width: 1, height: 1 });
    const [previewZoom, setPreviewZoom] = useState(1);
    const [previewViewportSize, setPreviewViewportSize] = useState(
        PREVIEW_FALLBACK_BOUNDS
    );
    const [draggingUpload, setDraggingUpload] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewViewportRef = useRef<HTMLDivElement>(null);
    const currentProjectRef = useRef<Project | null>(null);
    const reducedColorRef = useRef<Uint8ClampedArray | null>(null);

    const selectedPalette = getPaletteOption(paletteId);
    const selectedBoard = getBoardOption(boardId);
    const totalBeads = Array.from(beadsUsage.values()).reduce(
        (sum, value) => sum + value,
        0
    );
    const sortedUsage = Array.from(beadsUsage.entries()).sort(
        (left, right) => right[1] - left[1]
    );
    const displayPreviewSize = getPreviewRenderSize(
        previewSize,
        previewViewportSize,
        previewZoom
    );

    const loadSelectedFile = (file: File | null) => {
        if (!file) {
            return;
        }

        setFileName(file.name.replace(/\.[^.]+$/, ''));
        setErrorMessage(null);
        setPreviewDataUrl(null);
        setPreviewSize({ width: 1, height: 1 });
        setPreviewZoom(1);

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

    useEffect(() => {
        if (!imageSrc || !selectedBoard) {
            return;
        }

        let isCancelled = false;

        async function processImage(): Promise<void> {
            setProcessing(true);
            setErrorMessage(null);

            try {
                const palette = await loadPalette(paletteId);

                if (isCancelled) {
                    return;
                }

                setActivePalette(palette);

                const paletteConfig = new PaletteConfiguration([palette]);
                const boardConfig = new BoardConfiguration();
                boardConfig.board = selectedBoard.value;
                boardConfig.nbBoardWidth = boardWidth;
                boardConfig.nbBoardHeight = boardHeight;

                const matchingOption = getMatchingOption(matchingId);
                const matchingConfig = new MatchingConfiguration();
                matchingConfig.matching =
                    matchingOption?.value ?? matchingConfig.matching;

                const imageConfig = new ImageConfiguration();
                const ditheringConfig = new DitheringConfiguration();
                const ditheringOption = getDitheringOption(ditheringId);
                ditheringConfig.enable = ditheringId !== 'none';
                ditheringConfig.hardness = ditheringOption?.hardness ?? 0;

                const rendererConfig = new RendererConfiguration();
                const exportConfig = new ExportConfiguration();
                exportConfig.useSymbols = useSymbols;

                const project = new Project(
                    paletteConfig,
                    boardConfig,
                    matchingConfig,
                    imageConfig,
                    ditheringConfig,
                    rendererConfig,
                    exportConfig
                );

                const image = new window.Image();
                image.src = imageSrc;

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
                currentProjectRef.current = project;

                const canvas = canvasRef.current;

                if (!canvas) {
                    return;
                }

                canvas.width = boardWidth * selectedBoard.beadsPerRow;
                canvas.height = boardHeight * selectedBoard.beadsPerRow;

                const context = canvas.getContext('2d');

                if (!context) {
                    throw new Error('Canvas 2D context is unavailable.');
                }

                context.clearRect(0, 0, canvas.width, canvas.height);

                const imagePosition = drawImageInsideCanvas(
                    canvas,
                    image,
                    rendererConfig
                );
                const resultImageData = reduceColor(canvas, project, imagePosition);

                context.putImageData(resultImageData, 0, 0);
                reducedColorRef.current = resultImageData.data;
                const nextUsage = computeUsage(resultImageData.data, [palette]);
                setBeadsUsage(nextUsage);

                const { SvgPrinter } = await import(
                    '@/lib/core/printer/svg/svg.printer'
                );
                const previewSvg = new SvgPrinter().drawSVG(
                    resultImageData.data,
                    nextUsage,
                    project
                );
                setPreviewSize({
                    width: Number(previewSvg.getAttribute('width') ?? 1),
                    height: Number(previewSvg.getAttribute('height') ?? 1),
                });
                const previewMarkup = new XMLSerializer().serializeToString(
                    previewSvg
                );
                setPreviewDataUrl(svgMarkupToDataUrl(previewMarkup));
            } catch (error) {
                const nextMessage =
                    error instanceof Error
                        ? error.message
                        : 'Unexpected editor error.';
                setErrorMessage(nextMessage);
                setBeadsUsage(new Map());
                setPreviewDataUrl(null);
                setPreviewSize({ width: 1, height: 1 });
            } finally {
                setProcessing(false);
            }
        }

        void processImage();

        return () => {
            isCancelled = true;
        };
    }, [
        boardHeight,
        boardWidth,
        boardId,
        ditheringId,
        fileName,
        imageSrc,
        matchingId,
        paletteId,
        selectedBoard,
        useSymbols,
    ]);

    useEffect(() => {
        const viewportElement = previewViewportRef.current;

        if (!viewportElement) {
            return;
        }

        const updateViewportSize = () => {
            setPreviewViewportSize({
                maxWidth: Math.max(
                    1,
                    viewportElement.clientWidth -
                        PREVIEW_VIEWPORT_PADDING.horizontal
                ),
                maxHeight: Math.max(
                    1,
                    viewportElement.clientHeight -
                        PREVIEW_VIEWPORT_PADDING.vertical
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
    }, []);

    const handleGridExport = () => {
        if (!canvasRef.current) {
            return;
        }

        const sourceCanvas = canvasRef.current;
        const cellSize = 20;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = sourceCanvas.width * cellSize;
        exportCanvas.height = sourceCanvas.height * cellSize;

        const sourceContext = sourceCanvas.getContext('2d');
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

        for (let y = 0; y < sourceCanvas.height; y++) {
            for (let x = 0; x < sourceCanvas.width; x++) {
                const index = (y * sourceCanvas.width + x) * 4;
                const [r, g, b, a] = sourceImageData.data.slice(index, index + 4);

                if (a === 0) {
                    continue;
                }

                exportContext.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
                exportContext.fillRect(
                    x * cellSize,
                    y * cellSize,
                    cellSize,
                    cellSize
                );
            }
        }

        exportContext.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        exportContext.lineWidth = 1;

        for (let x = 0; x <= sourceCanvas.width; x++) {
            exportContext.beginPath();
            exportContext.moveTo(x * cellSize, 0);
            exportContext.lineTo(x * cellSize, exportCanvas.height);
            exportContext.stroke();
        }

        for (let y = 0; y <= sourceCanvas.height; y++) {
            exportContext.beginPath();
            exportContext.moveTo(0, y * cellSize);
            exportContext.lineTo(exportCanvas.width, y * cellSize);
            exportContext.stroke();
        }

        const beadsPerBoard =
            currentProjectRef.current?.boardConfiguration.board.nbBeadPerRow ?? 29;
        exportContext.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        exportContext.lineWidth = 3;

        for (let x = 0; x <= sourceCanvas.width; x += beadsPerBoard) {
            exportContext.beginPath();
            exportContext.moveTo(x * cellSize, 0);
            exportContext.lineTo(x * cellSize, exportCanvas.height);
            exportContext.stroke();
        }

        for (let y = 0; y <= sourceCanvas.height; y += beadsPerBoard) {
            exportContext.beginPath();
            exportContext.moveTo(0, y * cellSize);
            exportContext.lineTo(exportCanvas.width, y * cellSize);
            exportContext.stroke();
        }

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

        setExportingId(exportId);

        try {
            switch (exportId) {
                case 'pdf': {
                    const { PdfPrinter } = await import(
                        '@/lib/core/printer/pdf/pdf.printer'
                    );
                    new PdfPrinter().print(
                        reducedColorRef.current,
                        beadsUsage,
                        currentProjectRef.current,
                        fileName
                    );
                    break;
                }
                case 'svg': {
                    const { SvgPrinter } = await import(
                        '@/lib/core/printer/svg/svg.printer'
                    );
                    new SvgPrinter().print(
                        reducedColorRef.current,
                        beadsUsage,
                        currentProjectRef.current,
                        fileName
                    );
                    break;
                }
                case 'png': {
                    const { PngPrinter } = await import(
                        '@/lib/core/printer/png/png.printer'
                    );
                    new PngPrinter().print(
                        reducedColorRef.current,
                        beadsUsage,
                        currentProjectRef.current,
                        fileName
                    );
                    break;
                }
                case 'jpg': {
                    const { JpgPrinter } = await import(
                        '@/lib/core/printer/jpg/jpg.printer'
                    );
                    new JpgPrinter().print(
                        reducedColorRef.current,
                        beadsUsage,
                        currentProjectRef.current,
                        fileName
                    );
                    break;
                }
                case 'xlsx': {
                    const { XlsxPrinter } = await import(
                        '@/lib/core/printer/xlsx/xlsx.printer'
                    );
                    new XlsxPrinter().print(
                        reducedColorRef.current,
                        beadsUsage,
                        currentProjectRef.current,
                        fileName
                    );
                    break;
                }
                case 'grid_png':
                    handleGridExport();
                    break;
                default:
                    throw new Error(`Unsupported export format: ${exportId}`);
            }
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

    return (
        <div className="w-full grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-1">
                <Card title="1. Upload Image" className="bg-brand-cyan">
                    <label
                        htmlFor={IMAGE_UPLOAD_INPUT_ID}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setDraggingUpload(true);
                        }}
                        onDragLeave={() => setDraggingUpload(false)}
                        onDrop={handleImageDrop}
                        className={`relative block w-full cursor-pointer border-4 border-dashed border-brutal-black p-6 text-center transition-colors ${
                            draggingUpload
                                ? 'bg-brand-yellow'
                                : 'bg-white hover:bg-gray-50'
                        }`}
                    >
                        <span className="font-bold text-lg">
                            Click or Drag Image Here
                        </span>
                        <input
                            id={IMAGE_UPLOAD_INPUT_ID}
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            onChange={handleImageUpload}
                        />
                    </label>
                    <p className="mt-3 text-sm font-semibold uppercase tracking-wide">
                        Current file: {fileName}
                    </p>
                </Card>

                <Card title="2. Settings" className="bg-brand-purple">
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block font-bold">
                                Bead Type / Board
                            </label>
                            <select
                                value={boardId}
                                onChange={(event) =>
                                    setBoardId(event.target.value as typeof boardId)
                                }
                                className="w-full appearance-none rounded-none border-4 border-brutal-black bg-white p-2 font-vt323 text-xl focus:outline-none"
                            >
                                {BOARD_OPTIONS.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block font-bold">Palette</label>
                            <select
                                value={paletteId}
                                onChange={(event) => {
                                    const nextPaletteId = event.target.value;
                                    const paletteOption =
                                        getPaletteOption(nextPaletteId);
                                    setPaletteId(nextPaletteId);
                                    if (paletteOption) {
                                        setBoardId(paletteOption.boardId);
                                    }
                                }}
                                className="w-full appearance-none rounded-none border-4 border-brutal-black bg-white p-2 font-vt323 text-xl focus:outline-none"
                            >
                                {PALETTE_OPTIONS.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block font-bold">
                                    Boards (W)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={boardWidth}
                                    onChange={(event) =>
                                        setBoardWidth(
                                            Number.parseInt(event.target.value, 10) || 1
                                        )
                                    }
                                    className="w-full rounded-none border-4 border-brutal-black bg-white p-2 font-vt323 text-xl font-bold focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block font-bold">
                                    Boards (H)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={boardHeight}
                                    onChange={(event) =>
                                        setBoardHeight(
                                            Number.parseInt(event.target.value, 10) || 1
                                        )
                                    }
                                    className="w-full rounded-none border-4 border-brutal-black bg-white p-2 font-vt323 text-xl font-bold focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block font-bold">Matching</label>
                            <select
                                value={matchingId}
                                onChange={(event) =>
                                    setMatchingId(event.target.value)
                                }
                                className="w-full appearance-none rounded-none border-4 border-brutal-black bg-white p-2 font-vt323 text-xl focus:outline-none"
                            >
                                {MATCHING_OPTIONS.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block font-bold">
                                Dithering
                            </label>
                            <select
                                value={ditheringId}
                                onChange={(event) =>
                                    setDitheringId(event.target.value)
                                }
                                className="w-full appearance-none rounded-none border-4 border-brutal-black bg-white p-2 font-vt323 text-xl focus:outline-none"
                            >
                                {DITHERING_OPTIONS.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <label className="flex items-center gap-3 border-4 border-brutal-black bg-white px-3 py-2 font-bold uppercase">
                            <input
                                type="checkbox"
                                checked={useSymbols}
                                onChange={(event) =>
                                    setUseSymbols(event.target.checked)
                                }
                                className="h-5 w-5 accent-black"
                            />
                            Use symbols in printable exports
                        </label>
                    </div>
                </Card>

                <Card title="3. Export" className="bg-brand-yellow">
                    <div className="grid grid-cols-2 gap-3">
                        {EXPORT_OPTIONS.map((option) => (
                            <Button
                                key={option.id}
                                variant={
                                    option.id === 'pdf' ? 'primary' : 'secondary'
                                }
                                className="w-full disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => void handleExport(option.id)}
                                disabled={!imageSrc || processing || exportingId !== null}
                            >
                                {exportingId === option.id
                                    ? 'Exporting...'
                                    : option.label}
                            </Button>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-2">
                <Card
                    title="Preview"
                    className="z-10 flex min-h-[500px] flex-1 flex-col border-brutal-black bg-white p-0"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-brutal-black bg-brand-yellow px-4 py-3">
                        <div className="text-sm font-bold uppercase tracking-wide">
                            {previewDataUrl
                                ? `Zoom ${Math.round(previewZoom * 100)}%`
                                : 'Upload an image to preview'}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {PREVIEW_ZOOM_OPTIONS.map((option) => (
                                <Button
                                    key={option.label}
                                    size="sm"
                                    variant={
                                        previewZoom === option.value
                                            ? 'warning'
                                            : 'secondary'
                                    }
                                    onClick={() => setPreviewZoom(option.value)}
                                    disabled={!previewDataUrl || processing}
                                    className="min-w-[88px]"
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div
                        ref={previewViewportRef}
                        className={`relative flex h-[70vh] min-h-[560px] max-h-[900px] flex-1 border-b-4 border-brutal-black bg-white p-4 ${
                            previewZoom === 1
                                ? 'items-center justify-center overflow-hidden'
                                : 'items-start justify-start overflow-auto'
                        }`}
                    >
                        {processing && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                                <span className="animate-pulse border-4 border-brutal-black bg-brand-yellow p-4 font-vt323 text-3xl text-black shadow-brutal">
                                    PROCESSING...
                                </span>
                            </div>
                        )}

                        {!imageSrc && (
                            <p className="border-4 border-brutal-black bg-white px-4 font-bold uppercase tracking-wider text-gray-500">
                                No Image Uploaded
                            </p>
                        )}

                        <div
                            className={
                                previewZoom === 1
                                    ? 'grid h-full w-full place-items-center p-2'
                                    : 'grid min-h-full w-max min-w-full place-items-start p-2'
                            }
                        >
                            {previewDataUrl && imageSrc && (
                                <NextImage
                                    src={previewDataUrl}
                                    alt="Printable bead pattern preview"
                                    width={displayPreviewSize.width}
                                    height={displayPreviewSize.height}
                                    unoptimized
                                    className="block h-auto w-auto max-w-full border-4 border-brutal-black bg-white shadow-brutal"
                                    style={{
                                        width: `${displayPreviewSize.width}px`,
                                        height: `${displayPreviewSize.height}px`,
                                    }}
                                />
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
                    </div>
                    <div className="flex flex-wrap gap-3 p-4 text-sm font-semibold uppercase tracking-wide">
                        <span>
                            Palette: {selectedPalette?.label ?? 'Unknown'}
                        </span>
                        <span>
                            Board: {selectedBoard?.label ?? 'Unknown'}
                        </span>
                        <span>
                            Matching:{' '}
                            {getMatchingOption(matchingId)?.label ?? 'Unknown'}
                        </span>
                        <span>
                            Dithering:{' '}
                            {getDitheringOption(ditheringId)?.label ?? 'Unknown'}
                        </span>
                    </div>
                </Card>

                <Card title="Statistics">
                    {errorMessage && (
                        <div className="mb-4 border-4 border-brutal-black bg-brand-magenta px-4 py-2 font-bold text-white">
                            {errorMessage}
                        </div>
                    )}

                    <div className="mb-4 inline-block border-4 border-brutal-black bg-brand-cyan px-4 py-1 font-vt323 text-xl">
                        Total Beads: {totalBeads}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                        {sortedUsage.length > 0 ? (
                            sortedUsage.map(([ref, count]) => {
                                const entry = activePalette?.entries.find(
                                    (paletteEntry) => paletteEntry.ref === ref
                                );
                                const name = entry?.name ?? ref;
                                const swatch = entry
                                    ? rgbToHsl(
                                          entry.color.r,
                                          entry.color.g,
                                          entry.color.b
                                      )
                                    : '#ccc';

                                return (
                                    <div
                                        key={ref}
                                        className="flex flex-col items-center gap-1 border-4 border-brutal-black bg-white p-2 transition-colors hover:bg-gray-100"
                                    >
                                        <div
                                            className="h-8 w-8 rounded-full border-4 border-brutal-black"
                                            style={{ backgroundColor: swatch }}
                                        />
                                        <div
                                            className="h-8 overflow-hidden text-center text-[10px] font-bold uppercase"
                                            title={name}
                                        >
                                            {name}
                                        </div>
                                        <div className="w-full border-t-2 border-brutal-black bg-brand-yellow pt-1 text-center font-vt323 text-xl leading-none">
                                            {count}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-4 text-center font-bold text-gray-500">
                                Upload an image to see color usage.
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
