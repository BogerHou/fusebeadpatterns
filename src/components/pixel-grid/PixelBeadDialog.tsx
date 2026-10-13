'use client';

import { useId, useState } from 'react';
import { EditorDialog } from '../editor/EditorDialog';
import { getBoardOption, getPaletteDisplayLabel, getPaletteOption, PALETTE_OPTIONS } from '@/lib/editor/config';
import type { SiteLocale } from '@/lib/i18n/locales';
import { getPixelBeadCopy } from '@/lib/pixel-grid/bead-copy';

export type PixelBeadDialogProps = {
    locale: SiteLocale;
    width: number;
    height: number;
    busy: boolean;
    error: string | null;
    onPrepare: (paletteId: string) => void;
    onClose: () => void;
};

export default function PixelBeadDialog({ locale, width, height, busy, error, onPrepare, onClose }: PixelBeadDialogProps) {
    const [paletteId, setPaletteId] = useState('perler');
    const id = useId();
    const copy = getPixelBeadCopy(locale);
    const palette = getPaletteOption(paletteId)!;
    const boardSize = getBoardOption(palette.boardId)!.beadsPerRow;
    const boardWidth = Math.ceil(width / boardSize);
    const boardHeight = Math.ceil(height / boardSize);

    return (
        <EditorDialog locale={locale} title={copy.title} summary={copy.intro} onClose={onClose}>
            <form
                className="space-y-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!busy) onPrepare(paletteId);
                }}
            >
                <div className="space-y-2">
                    <label htmlFor={`${id}-brand`} className="block text-sm font-semibold text-[#243e36]">
                        {copy.brandLabel}
                    </label>
                    <select
                        id={`${id}-brand`}
                        value={paletteId}
                        onChange={(event) => setPaletteId(event.target.value)}
                        disabled={busy}
                        aria-describedby={`${id}-layout`}
                        className="min-h-11 w-full rounded-lg border border-[#b9c5ba] bg-white px-3 py-2 text-base text-[#243e36] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f4a] disabled:cursor-wait disabled:opacity-60"
                    >
                        {PALETTE_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>{getPaletteDisplayLabel(option)}</option>
                        ))}
                    </select>
                    <p id={`${id}-layout`} aria-live="polite" className="text-sm font-medium leading-6 text-[#243e36]">
                        {copy.preview(width, height, boardWidth, boardHeight, boardSize)}
                    </p>
                </div>

                <div className="space-y-3 text-sm leading-6 text-[#536359]">
                    <p>{copy.alphaNote}</p>
                    <p>{copy.returnSaved}</p>
                    <p>{copy.privacyNote}</p>
                </div>

                {error && <p role="alert" className="rounded-lg border border-[#d6aaa3] bg-[#fff5f2] px-3 py-2 text-sm leading-6 text-[#8a3124]">{error}</p>}
                {busy && <p role="status" className="text-sm leading-6 text-[#315f4a]">{copy.preparing}</p>}

                <div className="flex flex-col-reverse gap-3 border-t border-[#d9ded5] pt-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-11 rounded-lg border border-[#b9c5ba] bg-white px-5 py-2.5 text-sm font-semibold text-[#243e36] transition-colors hover:bg-[#f7f6f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f4a]"
                    >
                        {copy.cancel}
                    </button>
                    <button
                        type="submit"
                        disabled={busy}
                        className="min-h-11 rounded-lg bg-[#315f4a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#243e36] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f4a] disabled:cursor-wait disabled:opacity-60"
                    >
                        {busy ? copy.preparing : copy.prepare}
                    </button>
                </div>
            </form>
        </EditorDialog>
    );
}
