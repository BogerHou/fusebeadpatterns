/** Narrow declaration for the MIT-licensed omggif 1.0.10 API used by this tool. */
declare module 'omggif' {
    export class GifWriter {
        constructor(buffer: Uint8Array, width: number, height: number, options: { palette: number[]; loop: number });
        addFrame(x: number, y: number, width: number, height: number, indices: Uint8Array,
            options: { delay: number; disposal: number; transparent: number }): number;
        end(): number;
    }
}
