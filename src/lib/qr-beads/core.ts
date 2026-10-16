import { qrcodegen } from './vendor/qrcodegen';
import type { QrEcc, QrPattern, QrState } from './types';

export const QR_MAX_UTF8_BYTES = 1024;
export const QR_MAX_BEADS = 232;

export type QrPatternErrorCode = 'EMPTY' | 'TOO_LONG' | 'TOO_LARGE' | 'INVALID_OPTIONS' | 'INVALID_TEXT';

const errorMessages: Record<QrPatternErrorCode, string> = {
    EMPTY: 'Enter text or a URL to encode.',
    TOO_LONG: 'The text exceeds the 1024-byte UTF-8 limit.',
    TOO_LARGE: 'This QR pattern exceeds 232 beads per side. Shorten the text or use fewer beads per module.',
    INVALID_OPTIONS: 'Choose a supported correction level and 1, 2 or 3 beads per module.',
    INVALID_TEXT: 'The text contains an incomplete Unicode character. Re-enter that character.',
};

export class QrPatternError extends Error {
    readonly code: QrPatternErrorCode;

    constructor(code: QrPatternErrorCode) {
        super(errorMessages[code]);
        this.name = 'QrPatternError';
        this.code = code;
    }
}

const levels: Record<QrEcc, qrcodegen.QrCode.Ecc> = {
    L: qrcodegen.QrCode.Ecc.LOW,
    M: qrcodegen.QrCode.Ecc.MEDIUM,
    Q: qrcodegen.QrCode.Ecc.QUARTILE,
    H: qrcodegen.QrCode.Ecc.HIGH,
};

/** Reject lone UTF-16 surrogates rather than silently encoding replacement characters. */
function hasWellFormedUnicode(text: string): boolean {
    for (let index = 0; index < text.length; index++) {
        const unit = text.charCodeAt(index);
        if (unit >= 0xD800 && unit <= 0xDBFF) {
            const next = text.charCodeAt(++index);
            if (!(next >= 0xDC00 && next <= 0xDFFF)) return false;
        } else if (unit >= 0xDC00 && unit <= 0xDFFF) return false;
    }
    return true;
}

/** One square QR module expands to whole beads; its four-module quiet zone stays intact. */
export function buildQrPattern(input: Pick<QrState, 'text' | 'errorCorrection' | 'beadsPerModule'>): QrPattern {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new QrPatternError('INVALID_OPTIONS');
    for (const key of ['text', 'errorCorrection', 'beadsPerModule']) {
        const descriptor = Object.getOwnPropertyDescriptor(input, key);
        if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) throw new QrPatternError('INVALID_OPTIONS');
    }
    if (typeof input.text !== 'string' || typeof input.errorCorrection !== 'string'
        || !Object.hasOwn(levels, input.errorCorrection)
        || !Number.isInteger(input.beadsPerModule) || ![1, 2, 3].includes(input.beadsPerModule)) {
        throw new QrPatternError('INVALID_OPTIONS');
    }
    if (!input.text.length) throw new QrPatternError('EMPTY');
    // UTF-8 never has fewer bytes than UTF-16 code units. Bound work before encoding pasted text.
    if (input.text.length > QR_MAX_UTF8_BYTES) throw new QrPatternError('TOO_LONG');
    if (!hasWellFormedUnicode(input.text)) throw new QrPatternError('INVALID_TEXT');
    const bytes = new TextEncoder().encode(input.text);
    if (bytes.byteLength > QR_MAX_UTF8_BYTES) throw new QrPatternError('TOO_LONG');

    // ECI 26 explicitly declares UTF-8, including Japanese and emoji. Disable
    // automatic ECC boosting so the selected level is the level actually encoded.
    const qr = qrcodegen.QrCode.encodeSegments([
        qrcodegen.QrSegment.makeEci(26),
        qrcodegen.QrSegment.makeBytes(Array.from(bytes)),
    ], levels[input.errorCorrection], 1, 40, -1, false);
    const quietModules = 4;
    const width = (qr.size + quietModules * 2) * input.beadsPerModule;
    if (width > QR_MAX_BEADS) throw new QrPatternError('TOO_LARGE');

    const mask = new Uint8Array(width * width);
    let darkBeads = 0;
    for (let row = 0; row < qr.size; row++) for (let column = 0; column < qr.size; column++) {
        if (!qr.getModule(column, row)) continue;
        const left = (column + quietModules) * input.beadsPerModule;
        const top = (row + quietModules) * input.beadsPerModule;
        for (let dy = 0; dy < input.beadsPerModule; dy++) {
            const offset = (top + dy) * width + left;
            mask.fill(1, offset, offset + input.beadsPerModule);
        }
        darkBeads += input.beadsPerModule ** 2;
    }
    return { version: qr.version, modules: qr.size, quietModules, beadsPerModule: input.beadsPerModule,
        width, height: width, mask, darkBeads };
}
