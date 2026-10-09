import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { SITE_LOCALES } from '../i18n/locales';
import { BOARD_OPTIONS, DITHERING_OPTIONS, EXPORT_OPTIONS, MATCHING_OPTIONS, PALETTE_OPTIONS } from './config';
import { EDITOR_MESSAGE_ROWS, formatEditorNumber, getEditorErrorMessage, getEditorTranslator } from './messages';

const messages = new Map(EDITOR_MESSAGE_ROWS.map(row => [row[0], row]));

describe('full editor translations', () => {
    it('provides complete translations with matching interpolation values for every locale', () => {
        expect(messages.size).toBe(EDITOR_MESSAGE_ROWS.length);
        expect(messages.size).toBeGreaterThan(170);
        for (const [english, ...translations] of EDITOR_MESSAGE_ROWS) {
            const placeholders = (english.match(/\{\w+\}/g) ?? []).sort();
            for (const translated of translations) {
                expect(translated.trim(), english).not.toBe('');
                expect((translated.match(/\{\w+\}/g) ?? []).sort(), english).toEqual(placeholders);
            }
        }
    });

    it('keeps every brand and official board size available without renaming the data', () => {
        expect(PALETTE_OPTIONS).toHaveLength(15);
        expect(BOARD_OPTIONS.map(option => option.beadsPerRow)).toEqual([29, 57, 50]);
        for (const locale of SITE_LOCALES) {
            const t = getEditorTranslator(locale);
            for (const option of [...PALETTE_OPTIONS, ...BOARD_OPTIONS]) {
                expect(t(option.label)).toBe(option.label);
            }
            for (const option of [...DITHERING_OPTIONS, ...MATCHING_OPTIONS, ...EXPORT_OPTIONS]) {
                expect(t(option.label)).not.toBe('');
            }
        }
    });

    it('formats dynamic counts and language-specific warnings', () => {
        expect(formatEditorNumber(12345, 'de')).toBe('12.345');
        expect(formatEditorNumber(12345, 'ja')).toBe('12,345');
        expect(getEditorTranslator('fr')('{count} colors', { count: 8 })).toBe('8 couleurs');
        expect(getEditorTranslator('ja')('{width} x {height} boards', { width: 2, height: 3 })).toBe('2 × 3 枚のプレート');
        expect(getEditorTranslator('de')('Export {format}', { format: 'PDF' })).toBe('PDF exportieren');
    });

    it('localizes known errors and recovery advice without exposing raw browser exception English', () => {
        const advice = ' Try a smaller board count, choose another export format, or disable symbols for printable exports.';
        expect(getEditorErrorMessage('The PDF could not be generated.' + advice, 'ja')).toContain('PDF を作成できませんでした。');
        expect(getEditorErrorMessage('The PDF could not be generated.' + advice, 'ja')).toContain('プレートを減らす');
        expect(getEditorErrorMessage('Failed to load palette file: hama.csv', 'fr')).toBe('Impossible de charger la palette de couleurs.');
        expect(getEditorErrorMessage('SecurityError: DOM Exception', 'de')).not.toContain('SecurityError');
        expect(getEditorErrorMessage('SecurityError: DOM Exception', 'en')).toBe('SecurityError: DOM Exception');
    });

    it('has no untranslated JSX interface text and resolves every static message key', () => {
        const violations: string[] = [];
        for (const filename of ['Editor.tsx', 'EditorDialog.tsx', 'PdfScaleField.tsx']) {
            const source = ts.createSourceFile(filename, readFileSync(`src/components/editor/${filename}`, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
            function containsTranslation(node: ts.Node): boolean {
                if (ts.isCallExpression(node) && node.expression.getText(source) === 't') return true;
                return ts.forEachChild(node, containsTranslation) ?? false;
            }
            function visit(node: ts.Node): void {
                const line = source.getLineAndCharacterOfPosition(node.pos).line + 1;
                if (ts.isJsxText(node)) {
                    const text = node.text.replace(/&\w+;/g, '').trim();
                    if (/[A-Za-z]/.test(text)) violations.push(`${filename}:${line}: ${text}`);
                }
                if (ts.isJsxAttribute(node) && ['title', 'summary', 'aria-label', 'placeholder', 'alt'].includes(node.name.getText(source)) && node.initializer && ts.isStringLiteral(node.initializer)) {
                    violations.push(`${filename}:${line}: ${node.initializer.text}`);
                }
                if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && !messages.has(node.arguments[0].text)) {
                    violations.push(`${filename}:${line}: missing key ${node.arguments[0].text}`);
                }
                if (ts.isBinaryExpression(node) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(node.operatorToken.kind) && [node.left, node.right].some(side => ts.isCallExpression(side) && side.expression.getText(source) === 't')) {
                    violations.push(`${filename}:${line}: translated text used as a state identifier`);
                }
                if (ts.isJsxAttribute(node) && !['title', 'summary', 'aria-label', 'placeholder', 'alt'].includes(node.name.getText(source)) && node.initializer && containsTranslation(node.initializer)) {
                    violations.push(`${filename}:${line}: translation used in technical JSX attribute ${node.name.getText(source)}`);
                }
                if (ts.isPropertyAssignment(node) && ['id', 'key', 'value', 'type', 'action'].includes(node.name.getText(source)) && containsTranslation(node.initializer)) {
                    violations.push(`${filename}:${line}: translation used in state property ${node.name.getText(source)}`);
                }
                if (ts.isCallExpression(node) && /^(set[A-Z]|dispatch)/.test(node.expression.getText(source)) && node.arguments.some(containsTranslation)) {
                    violations.push(`${filename}:${line}: translation passed to state setter or dispatch`);
                }
                ts.forEachChild(node, visit);
            }
            visit(source);
        }
        expect(violations).toEqual([]);
    });
});
