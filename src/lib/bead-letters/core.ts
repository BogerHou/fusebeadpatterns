import { LETTER_GLYPHS, LETTER_GLYPH_HEIGHT, LETTER_GLYPH_WIDTH, LETTER_SPACE_WIDTH } from './font';

export const LETTER_LIMITS = Object.freeze({
    maxWidth: 128,
    maxHeight: 128,
    maxCodePoints: 200,
    maxLines: 8,
    minLetterSpacing: 0,
    maxLetterSpacing: 4,
    minLineSpacing: 0,
    maxLineSpacing: 6,
    minPadding: 0,
    maxPadding: 4,
    glyphWidth: LETTER_GLYPH_WIDTH,
    glyphHeight: LETTER_GLYPH_HEIGHT,
    spaceWidth: LETTER_SPACE_WIDTH,
});

export type LetterPatternInput = {
    text: string;
    letterSpacing: number;
    lineSpacing: number;
    padding: number;
    align: 'left' | 'center' | 'right';
};

export type LetterPatternLine = {
    text: string;
    width: number;
    x: number;
    y: number;
};

export type LetterPattern = {
    width: number;
    height: number;
    mask: Uint8Array;
    normalizedText: string;
    textBeads: number;
    lines: LetterPatternLine[];
};

export type LetterPatternErrorCode = 'EMPTY' | 'UNSUPPORTED' | 'TOO_LARGE' | 'INVALID_OPTIONS';

const errorMessages: Record<LetterPatternErrorCode, string> = {
    EMPTY: 'Enter at least one supported letter, number or punctuation mark.',
    UNSUPPORTED: 'Some characters are not supported. Use A–Z, 0–9 and the listed punctuation.',
    TOO_LARGE: 'The text or resulting grid is too large. Shorten it or reduce the spacing.',
    INVALID_OPTIONS: 'Use whole-number spacing and padding within the supported ranges, and a valid alignment.',
};

export class LetterPatternError extends Error {
    readonly code: LetterPatternErrorCode;
    readonly unsupported?: string[];

    constructor(code: LetterPatternErrorCode, unsupported?: string[]) {
        super(errorMessages[code]);
        this.name = 'LetterPatternError';
        this.code = code;
        if (unsupported) this.unsupported = [...unsupported];
    }
}

function wholeNumberInRange(value: unknown, min: number, max: number): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

export function buildLetterPattern(input: LetterPatternInput): LetterPattern {
    if (!input || typeof input !== 'object' || typeof input.text !== 'string'
        || !wholeNumberInRange(input.letterSpacing, LETTER_LIMITS.minLetterSpacing, LETTER_LIMITS.maxLetterSpacing)
        || !wholeNumberInRange(input.lineSpacing, LETTER_LIMITS.minLineSpacing, LETTER_LIMITS.maxLineSpacing)
        || !wholeNumberInRange(input.padding, LETTER_LIMITS.minPadding, LETTER_LIMITS.maxPadding)
        || !['left', 'center', 'right'].includes(input.align)) {
        throw new LetterPatternError('INVALID_OPTIONS');
    }

    // Count the original input, including both characters in CRLF, without
    // allocating an unbounded code-point array for a pasted large document.
    let codePoints = 0;
    for (const character of input.text) {
        void character;
        if (++codePoints > LETTER_LIMITS.maxCodePoints) throw new LetterPatternError('TOO_LARGE');
    }

    // Only ASCII lowercase is normalized. Accents, ligatures and other scripts
    // are reported rather than silently transliterated or dropped.
    const normalizedText = input.text.replace(/\r\n?/g, '\n').replace(/[a-z]/g, character => character.toUpperCase());
    const textLines = normalizedText.split('\n');
    if (textLines.length > LETTER_LIMITS.maxLines) throw new LetterPatternError('TOO_LARGE');

    const unsupported = new Set<string>();
    let hasInk = false;
    for (const character of normalizedText) {
        if (character === ' ' || character === '\n') continue;
        if (!Object.hasOwn(LETTER_GLYPHS, character)) unsupported.add(character);
        else hasInk = true;
    }
    if (unsupported.size) throw new LetterPatternError('UNSUPPORTED', [...unsupported]);
    if (!hasInk) throw new LetterPatternError('EMPTY');

    const lineWidths = textLines.map(line => {
        let width = 0;
        let characters = 0;
        for (const character of line) {
            if (characters++) width += input.letterSpacing;
            width += character === ' ' ? LETTER_SPACE_WIDTH : LETTER_GLYPH_WIDTH;
        }
        return width;
    });
    const contentWidth = Math.max(...lineWidths);
    const width = contentWidth + input.padding * 2;
    const height = textLines.length * LETTER_GLYPH_HEIGHT
        + (textLines.length - 1) * input.lineSpacing + input.padding * 2;
    if (width > LETTER_LIMITS.maxWidth || height > LETTER_LIMITS.maxHeight) {
        throw new LetterPatternError('TOO_LARGE');
    }

    const mask = new Uint8Array(width * height);
    let textBeads = 0;
    const lines = textLines.map((text, lineIndex): LetterPatternLine => {
        const remainingWidth = contentWidth - lineWidths[lineIndex];
        const offset = input.align === 'right' ? remainingWidth : input.align === 'center' ? Math.floor(remainingWidth / 2) : 0;
        const x = input.padding + offset;
        const y = input.padding + lineIndex * (LETTER_GLYPH_HEIGHT + input.lineSpacing);
        let cursor = x;
        for (const character of text) {
            if (character === ' ') {
                cursor += LETTER_SPACE_WIDTH + input.letterSpacing;
                continue;
            }
            const glyph = LETTER_GLYPHS[character];
            for (let row = 0; row < LETTER_GLYPH_HEIGHT; row++) {
                for (let column = 0; column < LETTER_GLYPH_WIDTH; column++) {
                    if (glyph[row][column] === '1') {
                        mask[(y + row) * width + cursor + column] = 1;
                        textBeads++;
                    }
                }
            }
            cursor += LETTER_GLYPH_WIDTH + input.letterSpacing;
        }
        return { text, width: lineWidths[lineIndex], x, y };
    });

    return { width, height, mask, normalizedText, textBeads, lines };
}
