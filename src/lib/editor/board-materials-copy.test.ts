import { describe, expect, it } from 'vitest';
import { getBoardMaterialsCopy } from './board-materials-copy';

const examples = [
    {
        locale: 'en',
        first: 'Row 1, column 1',
        selected: 'Row 2, column 3',
        preview: 'Board preview: row 2, column 3',
        rows: 'Whole pattern rows 30–58',
        columns: 'Whole pattern columns 1–29',
    },
    {
        locale: 'de',
        first: 'Reihe 1, Spalte 1',
        selected: 'Reihe 2, Spalte 3',
        preview: 'Plattenvorschau: Reihe 2, Spalte 3',
        rows: 'Reihen 30–58 in der gesamten Vorlage',
        columns: 'Spalten 1–29 in der gesamten Vorlage',
    },
    {
        locale: 'fr',
        first: 'Ligne 1, colonne 1',
        selected: 'Ligne 2, colonne 3',
        preview: 'Aperçu de la plaque : ligne 2, colonne 3',
        rows: 'Lignes 30–58 du modèle complet',
        columns: 'Colonnes 1–29 du modèle complet',
    },
    {
        locale: 'ja',
        first: '行1・列1',
        selected: '行2・列3',
        preview: 'プレートのプレビュー：行2・列3',
        rows: '図案全体の30～58行',
        columns: '図案全体の1～29列',
    },
] as const;

describe('board-material labels use original pattern coordinates', () => {
    it.each(examples)('$locale converts board indices once and preserves global ranges', ({ locale, first, selected, preview, rows, columns }) => {
        const copy = getBoardMaterialsCopy(locale);
        expect(copy.boardPosition(0, 0)).toBe(first);
        expect(copy.boardPosition(1, 2)).toBe(selected);
        expect(copy.previewLabel(1, 2)).toBe(preview);
        expect(copy.globalRows(30, 58)).toBe(rows);
        expect(copy.globalColumns(1, 29)).toBe(columns);
    });
});
