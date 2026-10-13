import { describe, expect, it, vi } from 'vitest';
import { CraftProgressHistory, CraftProgressSaveQueue, craftLine, craftRectangle } from './craft-progress-ui-state';

function deferred() {
    let resolve!: () => void, reject!: (error: Error) => void;
    const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}
describe('separate packed placement history', () => {
    it('undoes and redoes odd-length marks, clears redo on a new edit and detaches retained snapshots', () => {
        const history = new CraftProgressHistory(9), zero = new Uint8Array(9), first = zero.slice(); first[8] = 1;
        expect(history.push(zero, first)).toBe(true); zero[0] = 1;
        const before = history.undo(first)!; expect([...before]).toEqual(Array(9).fill(0));
        expect(history.redo(before)).toEqual(first);
        history.undo(first); const branch = before.slice(); branch[3] = 1; history.push(before, branch);
        expect(history.canRedo).toBe(false); expect(history.undo(branch)).toEqual(before);
    });
    it('keeps 50 meaningful maximum-grid steps within eight MiB instead of storing source RGBA', () => {
        const history = new CraftProgressHistory(1140 ** 2); let marks: Uint8Array = new Uint8Array(1140 ** 2);
        for (let i = 0; i < 60; i++) { const next = marks.slice(); next[i] = 1; history.push(marks, next); marks = next; }
        expect(history.bytes).toBe(50 * Math.ceil(1140 ** 2 / 8)); expect(history.bytes).toBeLessThanOrEqual(8 * 1024 * 1024);
        let undone = 0;
        while (history.canUndo) { marks = history.undo(marks)!; undone++; }
        expect(undone).toBe(50); expect(marks.reduce((a, b) => a + b, 0)).toBe(10);
        expect(history.redo(marks)!.reduce((a, b) => a + b, 0)).toBe(11);
    });
    it('retains the existing undo branch when an invalid or unchanged next state is rejected', () => {
        const history = new CraftProgressHistory(8), before = new Uint8Array(8), after = before.slice(); after[7] = 1; history.push(before, after);
        expect(history.push(after, after.slice())).toBe(false);
        const invalid = after.slice(); invalid[2] = 2;
        expect(() => history.push(after, invalid)).toThrow(); expect(() => history.push(after, new Uint8Array(9))).toThrow();
        expect(history.undo(after)).toEqual(before);
    });
});

describe('serial local placement saves', () => {
    it('finishes an old write before the newest queued state and never reports the old state as saved', async () => {
        const first = deferred(), second = deferred(), notify = vi.fn();
        const writer = vi.fn((raw: string) => raw === 'old' ? first.promise : second.promise);
        const queue = new CraftProgressSaveQueue(writer, notify);
        queue.request('old'); await Promise.resolve(); queue.request('middle'); queue.request('new');
        expect(writer.mock.calls).toEqual([['old']]);
        const flush = queue.flush(); first.resolve(); await Promise.resolve(); await Promise.resolve();
        expect(writer.mock.calls).toEqual([['old'], ['new']]); expect(queue.dirty).toBe(true);
        expect(notify.mock.calls.some(([status]) => status === 'saved')).toBe(false);
        second.resolve(); expect(await flush).toBe(true); expect(queue.dirty).toBe(false); expect(notify).toHaveBeenLastCalledWith('saved');
    });
    it('preserves a failed latest state for an explicit retry without an infinite write loop', async () => {
        let fail = true; const writer = vi.fn(async () => { if (fail) throw new Error('Blocked storage'); });
        const queue = new CraftProgressSaveQueue(writer, vi.fn()); queue.request('current');
        expect(await queue.flush()).toBe(false); expect(writer).toHaveBeenCalledOnce(); expect(queue.dirty).toBe(true);
        fail = false; queue.retry(); expect(await queue.flush()).toBe(true); expect(writer).toHaveBeenCalledTimes(2);
    });
    it('saves a newer valid state after an older in-flight write fails', async () => {
        const old = deferred(), writer = vi.fn((raw: string) => raw === 'old' ? old.promise : Promise.resolve());
        const notify = vi.fn(), queue = new CraftProgressSaveQueue(writer, notify);
        queue.request('old'); await Promise.resolve(); queue.request('new'); old.reject(new Error('Old failure'));
        expect(await queue.flush()).toBe(true); expect(writer.mock.calls).toEqual([['old'], ['new']]);
        expect(notify).toHaveBeenLastCalledWith('saved');
    });
});

describe('board-local gestures', () => {
    it('covers every traversed cell including both ends of a reverse diagonal line', () => {
        expect(craftLine({ x: 4, y: 4 }, { x: 0, y: 0 })).toEqual([4, 3, 2, 1, 0].map(n => ({ x: n, y: n })));
        expect(craftLine({ x: 0, y: 2 }, { x: 4, y: 2 })).toEqual([0, 1, 2, 3, 4].map(x => ({ x, y: 2 })));
    });
    it('uses an inclusive Shift rectangle and refuses non-finite or off-board endpoints', () => {
        expect(craftRectangle({ x: 2, y: 2 }, { x: 1, y: 0 })).toHaveLength(6);
        expect(craftRectangle({ x: 56, y: 56 }, { x: 0, y: 0 })).toHaveLength(57 ** 2);
        expect(() => craftLine({ x: NaN, y: 1 }, { x: 1, y: 1 })).toThrow();
        expect(() => craftRectangle({ x: 0, y: 0 }, { x: 57, y: 1 })).toThrow();
    });
});
