'use client';

import { useEffect, useRef, useState } from 'react';
import type { SiteLocale } from '../../lib/i18n/locales';
import type { PaletteEntry } from '../../lib/core/model/palette/palette.model';
import type { BoardMaterials, BoardSelection } from '../../lib/editor/board-materials';
import { getBoardMaterialsCopy } from '../../lib/editor/board-materials-copy';
import { exportMessages } from '../../lib/core/printer/messages';

export type BoardMaterialsView = {
    boards: Array<BoardSelection & { beadCount: number; colorCount: number }>;
    total: number;
    selected: BoardMaterials | null;
    entries: Map<string, PaletteEntry>;
    multiplePalettes: boolean;
};

type Props = {
    locale: SiteLocale;
    id: string;
    selection: BoardSelection | null;
    onSelect: (selection: BoardSelection | null) => void;
    readSnapshot: (selection: BoardSelection | null) => BoardMaterialsView | null;
    revision: object;
    ready: boolean;
    canDownload: boolean;
    exporting: boolean;
    boardExporting: boolean;
    symbols: boolean;
    onDownload: (selection: BoardSelection) => void;
};

function BoardPreview({ materials, label }: { materials: BoardMaterials; label: string }) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = ref.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;
        const cell = 8;
        canvas.width = canvas.height = materials.boardSize * cell;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < materials.boardSize; y++) {
            for (let x = 0; x < materials.boardSize; x++) {
                const offset = (y * materials.boardSize + x) * 4;
                const [r, g, b, a] = materials.pixels.subarray(offset, offset + 4);
                if (a) {
                    context.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
                    context.fillRect(x * cell, y * cell, cell, cell);
                }
            }
        }
        context.strokeStyle = '#33433d50';
        context.lineWidth = 0.5;
        context.beginPath();
        for (let i = 0; i <= materials.boardSize; i++) {
            context.moveTo(i * cell, 0); context.lineTo(i * cell, canvas.height);
            context.moveTo(0, i * cell); context.lineTo(canvas.width, i * cell);
        }
        context.stroke();
    }, [materials]);
    return <canvas ref={ref} role="img" aria-label={label} className="mx-auto aspect-square w-full max-w-64 border border-[#d9ded5]" />;
}

function Materials({ locale, id, selection, onSelect, readSnapshot, revision, ready, canDownload, exporting, boardExporting, symbols, onDownload }: Props) {
    const copy = getBoardMaterialsCopy(locale);
    const labels = exportMessages(locale);
    const [snapshot, setSnapshot] = useState<{
        revision: object; reader: Props['readSnapshot']; selection: BoardSelection | null;
        value: BoardMaterialsView | null;
    } | null>(null);
    useEffect(() => {
        if (!ready) return;
        // The editor owns a mutable canvas. Read it after its published revision,
        // and hide the previous revision until this immutable view is ready.
        const frame = window.requestAnimationFrame(() => {
            let value: BoardMaterialsView | null = null;
            try { value = readSnapshot(selection); } catch { /* Keep the pattern intact; show a recoverable view error. */ }
            setSnapshot({ revision, reader: readSnapshot, selection, value });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [readSnapshot, revision, selection, ready]);
    const current = ready && snapshot?.revision === revision && snapshot.reader === readSnapshot && snapshot.selection === selection;
    const data = current ? snapshot.value : null;
    if (!current) return <p role="status" className="text-sm text-[#627168]">{copy.reading}</p>;
    if (!data) return <p role="alert" className="text-sm">{copy.readError}</p>;
    const selected = data.selected;
    const number = (value: number) => value.toLocaleString(locale);
    return <div className="space-y-3">
        <label htmlFor={id} className="block text-sm font-semibold">{copy.selectionLabel}</label>
        <select id={id} name="materialsBoard" value={selected ? `${selected.selection.row},${selected.selection.column}` : 'all'}
            disabled={exporting}
            onChange={event => {
                const board = data.boards.find(item => `${item.row},${item.column}` === event.target.value);
                onSelect(board ? { row: board.row, column: board.column } : null);
            }}
            className="min-h-11 w-full rounded-lg border border-[#d9ded5] bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#28614e]/35">
            <option value="all">{copy.allBoards}</option>
            {data.boards.map(board => <option key={`${board.row},${board.column}`} value={`${board.row},${board.column}`}>{copy.boardPosition(board.row, board.column)}</option>)}
        </select>
        <p className="text-sm text-[#627168]">{copy.wholeTotal}: {number(data.total)} {copy.beads}</p>
        {selected ? <>
            <p className="text-sm font-semibold">{copy.boardPosition(selected.selection.row, selected.selection.column)} · {number(selected.beadCount)} {copy.beads} · {number(selected.usage.size)} {copy.colors}</p>
            <p className="text-xs text-[#627168]">{copy.globalRows(selected.globalRows.from, selected.globalRows.to)} · {copy.globalColumns(selected.globalColumns.from, selected.globalColumns.to)}</p>
            <BoardPreview materials={selected} label={copy.previewLabel(selected.selection.row, selected.selection.column)} />
            {selected.beadCount === 0 ? <p className="text-sm">{copy.empty}</p> : <div className="max-h-64 overflow-auto rounded-lg border border-[#d9ded5]">
                <table className="w-full text-left text-xs">
                    <caption className="sr-only">{copy.title} — {copy.boardPosition(selected.selection.row, selected.selection.column)}</caption>
                    <thead className="sticky top-0 bg-[#f5f7f3]"><tr><th className="p-2">{labels.reference}</th>{symbols && <th className="p-2">{labels.symbol}</th>}<th className="p-2 text-right">{labels.count}</th></tr></thead>
                    <tbody>{Array.from(selected.usage).sort((a, b) => b[1] - a[1]).map(([ref, count]) => {
                        const entry = data.entries.get(ref);
                        return <tr key={ref} className="border-t border-[#d9ded5]"><td className="p-2"><span className="mr-2 inline-block h-3 w-3 border border-black/20 align-middle" style={entry ? { backgroundColor: `rgb(${entry.color.r},${entry.color.g},${entry.color.b})` } : {}} />{ref}</td>{symbols && <td className="p-2">{entry ? `${data.multiplePalettes ? entry.prefix : ''}${entry.symbol}` : ''}</td>}<td className="p-2 text-right tabular-nums">{number(count)}</td></tr>;
                    })}</tbody>
                </table>
            </div>}
            <button type="button" disabled={!canDownload || exporting} onClick={() => onDownload(selected.selection)} className="min-h-11 w-full rounded-lg border border-[#28614e] bg-white px-3 py-2 text-sm font-semibold text-[#28614e] hover:bg-[#edf3ed] disabled:cursor-not-allowed disabled:text-gray-400">
                {boardExporting ? copy.busy : copy.downloadSelectedBoardPdf}
            </button>
        </> : <ul className="max-h-60 divide-y divide-[#d9ded5] overflow-auto rounded-lg border border-[#d9ded5] text-sm">
            {data.boards.map(board => <li key={`${board.row},${board.column}`}><button type="button" disabled={exporting} onClick={() => onSelect({ row: board.row, column: board.column })} className="flex min-h-11 w-full flex-wrap items-center justify-between gap-x-3 px-3 py-2 text-left hover:bg-[#edf3ed] focus-visible:outline-2 focus-visible:outline-[#28614e]"><span>{copy.boardPosition(board.row, board.column)}</span><span className="text-xs text-[#627168]">{number(board.beadCount)} {copy.beads} · {number(board.colorCount)} {copy.colors}</span></button></li>)}
        </ul>}
    </div>;
}

export function BoardMaterialsPanel(props: Props) {
    const copy = getBoardMaterialsCopy(props.locale);
    const [open, setOpen] = useState(false);
    return <details onToggle={event => setOpen(event.currentTarget.open)} className="rounded-lg border border-[#d9ded5] bg-[#f9faf7] p-3">
        <summary className="min-h-8 cursor-pointer text-sm font-semibold">{copy.title}</summary>
        {open && <div className="mt-3"><Materials {...props} /></div>}
    </details>;
}
