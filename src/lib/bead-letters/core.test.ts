import { describe, expect, it } from 'vitest';
import { buildLetterPattern, LETTER_LIMITS, LetterPatternError, type LetterPatternInput } from './core';
import { LETTER_GLYPHS } from './font';

const defaults: LetterPatternInput = { text: 'A', letterSpacing: 1, lineSpacing: 1, padding: 0, align: 'left' };
const build = (options: Partial<LetterPatternInput> = {}) => buildLetterPattern({ ...defaults, ...options });

function rows(pattern: ReturnType<typeof build>): string[] {
    return Array.from({ length: pattern.height }, (_, y) => [...pattern.mask.slice(y * pattern.width, (y + 1) * pattern.width)].join(''));
}

function errorFor(options: Partial<LetterPatternInput>): LetterPatternError {
    try {
        build(options);
    } catch (error) {
        expect(error).toBeInstanceOf(LetterPatternError);
        return error as LetterPatternError;
    }
    throw new Error('Expected a letter-pattern error.');
}

describe('original block lettering', () => {
    it('draws a hand-specified A and counts its 18 actual beads', () => {
        const result = build();
        expect(result.width).toBe(5);
        expect(result.height).toBe(7);
        expect(rows(result)).toEqual(['01110', '10001', '10001', '11111', '10001', '10001', '10001']);
        expect(result.textBeads).toBe(18);
    });

    it('keeps the digit zero distinct from the letter O', () => {
        expect(rows(build({ text: '0' }))).toEqual(['01110', '10001', '10011', '10101', '11001', '10001', '01110']);
        expect(rows(build({ text: 'O' }))).toEqual(['01110', '10001', '10001', '10001', '10001', '10001', '01110']);
    });

    it('positions punctuation on the shared seven-row baseline', () => {
        expect(rows(build({ text: '.' }))).toEqual(['00000', '00000', '00000', '00000', '00000', '00000', '00100']);
        expect(rows(build({ text: "'" }))).toEqual(['00100', '00100', '00000', '00000', '00000', '00000', '00000']);
        expect(rows(build({ text: '+' }))).toEqual(['00000', '00100', '00100', '11111', '00100', '00100', '00000']);
    });

    it('contains exactly the advertised alphabet, digits and punctuation', () => {
        const expected = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!?-+&\''];
        expect(Object.keys(LETTER_GLYPHS).sort()).toEqual(expected.sort());
        for (const glyph of Object.values(LETTER_GLYPHS)) {
            expect(glyph).toHaveLength(7);
            expect(glyph.every(row => /^[01]{5}$/.test(row))).toBe(true);
            expect(glyph.join('')).toContain('1');
            expect(Object.isFrozen(glyph)).toBe(true);
        }
        expect(Object.isFrozen(LETTER_GLYPHS)).toBe(true);
    });

    it('normalizes lowercase but never drops leading or trailing spaces', () => {
        const result = build({ text: ' a ' });
        expect(result.normalizedText).toBe(' A ');
        expect(result.width).toBe(13);
        expect(rows(result)[0]).toBe('0000011100000');
        expect(result.textBeads).toBe(18);
    });

    it('returns fresh masks and line metadata on every call', () => {
        const first = build();
        first.mask.fill(0);
        first.lines[0].x = 99;
        expect(build().textBeads).toBe(18);
        expect(rows(build())[0]).toBe('01110');
        expect(build().lines[0].x).toBe(0);
    });
});

describe('layout without wrapping or trimming', () => {
    it('uses a three-cell space and spacing only between characters', () => {
        const result = build({ text: '. .', letterSpacing: 2 });
        expect(result.width).toBe(17);
        expect(result.textBeads).toBe(2);
        expect(rows(result)[6]).toBe('00100000000000100');
        expect(build({ text: 'AA', letterSpacing: 0 }).width).toBe(10);
        expect(build({ text: 'AA', letterSpacing: 4 }).width).toBe(14);
        expect(build({ text: 'A', letterSpacing: 4 }).width).toBe(5);
    });

    it('keeps empty first, middle and last lines', () => {
        const result = build({ text: '\nA\n\n', lineSpacing: 2 });
        expect(result.normalizedText).toBe('\nA\n\n');
        expect(result.height).toBe(34);
        expect(result.lines).toEqual([
            { text: '', width: 0, x: 0, y: 0 },
            { text: 'A', width: 5, x: 0, y: 9 },
            { text: '', width: 0, x: 0, y: 18 },
            { text: '', width: 0, x: 0, y: 27 },
        ]);
        expect(rows(result).slice(0, 9)).toEqual(Array(9).fill('00000'));
        expect(rows(result)[9]).toBe('01110');
        expect(rows(result).slice(16)).toEqual(Array(18).fill('00000'));
    });

    it('normalizes CRLF and bare CR to explicit line breaks', () => {
        const result = build({ text: 'a\r\nb\rc' });
        expect(result.normalizedText).toBe('A\nB\nC');
        expect(result.lines.map(line => line.y)).toEqual([0, 8, 16]);
        expect(result.height).toBe(23);
    });

    it.each([
        ['left', 1],
        ['center', 4],
        ['right', 7],
    ] as const)('aligns a shorter line %s inside the widest line', (align, secondX) => {
        const result = build({ text: 'AA\n.', align, padding: 1 });
        expect(result.width).toBe(13);
        expect(result.height).toBe(17);
        expect(result.lines[1]).toEqual({ text: '.', width: 5, x: secondX, y: 9 });
        expect(result.mask[15 * 13 + secondX + 2]).toBe(1);
        expect(rows(result)[0]).toBe('0'.repeat(13));
        expect(rows(result)[16]).toBe('0'.repeat(13));
        expect([...result.mask].reduce((sum, cell) => sum + cell, 0)).toBe(37);
    });

    it('puts an odd center remainder on the right instead of changing the grid', () => {
        const result = build({ text: 'A \nA', letterSpacing: 0, align: 'center' });
        expect(result.width).toBe(8);
        expect(result.lines[1].x).toBe(1);
        expect(rows(result)[8]).toBe('00111000');
    });

    it('supports zero interline spacing and maximum padding without extra rows', () => {
        const result = build({ text: '.\n.', lineSpacing: 0, padding: 4 });
        expect(result.width).toBe(13);
        expect(result.height).toBe(22);
        expect(result.lines.map(line => line.y)).toEqual([4, 11]);
        expect(result.mask[10 * 13 + 6]).toBe(1);
        expect(result.mask[17 * 13 + 6]).toBe(1);
        expect(result.textBeads).toBe(2);
    });
});

describe('explicit input limits and errors', () => {
    it.each(['', ' ', '  \n ', '\r\n'])('rejects empty or whitespace-only input %j', text => {
        expect(errorFor({ text }).code).toBe('EMPTY');
    });

    it('reports unsupported characters in order, once each, without transliteration', () => {
        const error = errorFor({ text: 'aé猫é🙂ß\t猫' });
        expect(error.code).toBe('UNSUPPORTED');
        expect(error.unsupported).toEqual(['é', '猫', '🙂', 'ß', '\t']);
    });

    it('reports unsupported combining marks and non-breaking spaces instead of discarding them', () => {
        expect(errorFor({ text: 'e\u0301\u00a0A' }).unsupported).toEqual(['\u0301', '\u00a0']);
    });

    it.each(['😀', '\uD800', '\u0000', '’', '–'])('rejects unsupported %j instead of generating a partial grid', text => {
        expect(errorFor({ text: 'A' + text + 'B' }).code).toBe('UNSUPPORTED');
    });

    it('accepts an exact 128-cell width and refuses 129 without wrapping', () => {
        const exact = build({ text: 'A'.repeat(24) + ' A', letterSpacing: 0 });
        expect(exact.width).toBe(128);
        expect(exact.height).toBe(7);
        expect(exact.normalizedText).toBe('A'.repeat(24) + ' A');
        expect(errorFor({ text: 'A'.repeat(24) + '   ', letterSpacing: 0 }).code).toBe('TOO_LARGE');
        expect(errorFor({ text: 'A'.repeat(24) + ' A', letterSpacing: 0, padding: 1 }).code).toBe('TOO_LARGE');
        expect(errorFor({ text: 'A'.repeat(26), letterSpacing: 0 }).code).toBe('TOO_LARGE');
    });

    it('allows 200 original code points when the full grid fits', () => {
        const text = ['A'.repeat(25), ...Array(7).fill('A'.repeat(24))].join('\n');
        expect([...text]).toHaveLength(200);
        const result = build({ text, letterSpacing: 0, lineSpacing: 0 });
        expect(result.width).toBe(125);
        expect(result.height).toBe(56);
        expect(result.normalizedText).toBe(text);
        expect(errorFor({ text: text + ' ', letterSpacing: 0, lineSpacing: 0 }).code).toBe('TOO_LARGE');
    });

    it('counts CRLF as two original input code points for the input limit', () => {
        const text = ['A'.repeat(25), ...Array(7).fill('A'.repeat(24))].join('\r\n');
        expect([...text]).toHaveLength(207);
        expect(errorFor({ text, letterSpacing: 0 }).code).toBe('TOO_LARGE');
    });

    it('keeps all eight lines but rejects a ninth even if blank', () => {
        const result = build({ text: Array(8).fill('A').join('\n'), padding: 4, lineSpacing: 6 });
        expect(result.height).toBe(106);
        expect(result.lines).toHaveLength(8);
        expect(errorFor({ text: Array(8).fill('A').join('\n') + '\n' }).code).toBe('TOO_LARGE');
    });

    it.each([
        { letterSpacing: -1 }, { letterSpacing: 5 }, { letterSpacing: 0.5 },
        { lineSpacing: -1 }, { lineSpacing: 7 }, { lineSpacing: Number.NaN },
        { padding: -1 }, { padding: 5 }, { padding: Infinity },
        { align: 'justify' }, { text: 123 }, { letterSpacing: '1' },
    ])('rejects invalid options %j', options => {
        expect(errorFor(options as Partial<LetterPatternInput>).code).toBe('INVALID_OPTIONS');
    });

    it('rejects a missing options object predictably', () => {
        expect(() => buildLetterPattern(null as unknown as LetterPatternInput)).toThrow(LetterPatternError);
        expect(() => buildLetterPattern(undefined as unknown as LetterPatternInput)).toThrow(LetterPatternError);
    });

    it('publishes immutable limits matching the supported contract', () => {
        expect(LETTER_LIMITS.maxWidth).toBe(128);
        expect(LETTER_LIMITS.maxHeight).toBe(128);
        expect(LETTER_LIMITS.maxCodePoints).toBe(200);
        expect(LETTER_LIMITS.maxLines).toBe(8);
        expect(Object.isFrozen(LETTER_LIMITS)).toBe(true);
    });
});
