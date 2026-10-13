const HISTORY_MAX_BYTES = 8 * 1024 * 1024;
const HISTORY_MAX_STEPS = 50;

function pack(marks: Uint8Array): Uint8Array {
    const bytes = new Uint8Array(Math.ceil(marks.length / 8));
    for (let i = 0; i < marks.length; i++) {
        if (marks[i] !== 0 && marks[i] !== 1) throw new Error('Invalid progress mark');
        if (marks[i]) bytes[i >> 3] |= 1 << (i & 7);
    }
    return bytes;
}
function unpack(bytes: Uint8Array, length: number): Uint8Array {
    const marks = new Uint8Array(length);
    for (let i = 0; i < length; i++) marks[i] = (bytes[i >> 3] >> (i & 7)) & 1;
    return marks;
}

/** Separate from bead history. Store packed progress only, never image data. */
export class CraftProgressHistory {
    private past: Uint8Array[] = [];
    private future: Uint8Array[] = [];
    constructor(private readonly length: number) {
        if (!Number.isSafeInteger(length) || length < 1 || length > 1140 * 1140) throw new Error('Invalid progress history size');
    }
    get canUndo(): boolean { return this.past.length > 0; }
    get canRedo(): boolean { return this.future.length > 0; }
    get bytes(): number { return (this.past.length + this.future.length) * Math.ceil(this.length / 8); }
    private check(value: Uint8Array): void {
        if (!(value instanceof Uint8Array) || value.length !== this.length) throw new Error('Invalid progress history snapshot');
    }
    private trim(): void {
        while (this.past.length + this.future.length > HISTORY_MAX_STEPS || this.bytes > HISTORY_MAX_BYTES) {
            if (this.past.length) this.past.shift(); else this.future.shift();
        }
    }
    push(before: Uint8Array, after: Uint8Array): boolean {
        this.check(before); this.check(after);
        const snapshot = pack(before);
        // Validate the next immutable document before changing either branch.
        const next = pack(after);
        if (snapshot.every((value, i) => value === next[i])) return false;
        this.past.push(snapshot); this.future = []; this.trim(); return true;
    }
    undo(current: Uint8Array): Uint8Array | null {
        this.check(current);
        if (!this.past.length) return null;
        const next = pack(current), previous = this.past.pop()!;
        this.future.push(next); this.trim(); return unpack(previous, this.length);
    }
    redo(current: Uint8Array): Uint8Array | null {
        this.check(current);
        if (!this.future.length) return null;
        const next = pack(current), future = this.future.pop()!;
        this.past.push(next); this.trim(); return unpack(future, this.length);
    }
}

export type CraftSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** One write at a time. A newer requested snapshot always follows an older
 * in-flight write, preventing asynchronous IndexedDB completion from reverting it. */
export class CraftProgressSaveQueue {
    private requested = 0;
    private saved = 0;
    private pending: { revision: number; raw: string } | null = null;
    private failed: { revision: number; raw: string } | null = null;
    private running: Promise<void> | null = null;
    private currentStatus: CraftSaveStatus;
    constructor(private readonly write: (raw: string) => Promise<void>, private readonly notify: (status: CraftSaveStatus) => void, initialStatus: CraftSaveStatus = 'idle') {
        this.currentStatus = initialStatus;
    }
    get dirty(): boolean { return this.saved < this.requested; }
    get status(): CraftSaveStatus { return this.currentStatus; }
    private report(status: CraftSaveStatus): void { this.currentStatus = status; this.notify(status); }
    request(raw: string): void {
        this.pending = { revision: ++this.requested, raw };
        this.failed = null;
        this.report('saving'); this.start();
    }
    private start(): void {
        if (this.running) return;
        const run = Promise.resolve().then(async () => {
            while (this.pending) {
                const next = this.pending; this.pending = null;
                try {
                    await this.write(next.raw);
                    this.saved = next.revision;
                    if (!this.pending) this.report(this.dirty ? 'saving' : 'saved');
                } catch {
                    if (!this.pending) { this.failed = next; this.report('error'); }
                }
            }
        });
        this.running = run;
        void run.then(() => {
            if (this.running === run) this.running = null;
            if (this.pending) this.start();
        });
    }
    retry(): void {
        if (!this.failed) return;
        this.pending = this.failed; this.failed = null;
        this.report('saving'); this.start();
    }
    async flush(): Promise<boolean> {
        while (this.running) await this.running;
        return !this.dirty;
    }
}

export type CraftPoint = { x: number; y: number };
function validPoint(point: CraftPoint): void {
    if (![point.x, point.y].every(value => Number.isInteger(value) && value >= 0 && value < 57)) throw new Error('Invalid board point');
}
export function craftLine(from: CraftPoint, to: CraftPoint): CraftPoint[] {
    validPoint(from); validPoint(to);
    const result: CraftPoint[] = [], dx = Math.abs(to.x - from.x), dy = -Math.abs(to.y - from.y);
    const sx = from.x < to.x ? 1 : -1, sy = from.y < to.y ? 1 : -1;
    let x = from.x, y = from.y, error = dx + dy;
    for (;;) {
        result.push({ x, y }); if (x === to.x && y === to.y) return result;
        const twice = 2 * error;
        if (twice >= dy) { error += dy; x += sx; }
        if (twice <= dx) { error += dx; y += sy; }
    }
}
export function craftRectangle(from: CraftPoint, to: CraftPoint): CraftPoint[] {
    validPoint(from); validPoint(to);
    const result: CraftPoint[] = [];
    for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) {
        for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) result.push({ x, y });
    }
    return result;
}
