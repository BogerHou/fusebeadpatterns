import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { getPixelBeadCopy } from '../../lib/pixel-grid/bead-copy';
import { clearPixelBeadQuery } from '../../lib/pixel-grid/bead-transfer';

const source = ts.createSourceFile('PixelBeadEntry.tsx', readFileSync(new URL('./PixelBeadEntry.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const functions = new Map<string, ts.FunctionDeclaration>();
let initialRead: ts.Expression | undefined;
function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name) functions.set(node.name.text, node);
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect') initialRead = node.arguments[0];
    ts.forEachChild(node, visit);
}
visit(source);
const compiled = ts.transpileModule(['clearQuery', 'keepCurrent', 'open'].map(name => functions.get(name)!.getText(source)).join('\n') +
    `\nmodule.exports={open,keep:keepCurrent,read:(${initialRead!.getText(source)})};`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;

function harness() {
    let resolve!: () => void, reject!: (error: Error) => void;
    const gate = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
    const state = { loading: false, error: false, incoming: null as unknown }, taskRef = { current: null as AbortController | null };
    const copy = getPixelBeadCopy('ja');
    const onOpen = vi.fn((draft: unknown, signal: AbortSignal) => {
        void draft;
        void signal;
        return gate;
    });
    const props = { busy: false, onOpen, onLoadingChange: vi.fn(), onReturnChange: vi.fn(), onNotice: vi.fn() };
    const window = { location: { href: 'https://fusebeadpatterns.art/ja/editor?pixel-project=pending&other=keep#focus' }, sessionStorage: {}, history: { replaceState: vi.fn() } };
    const ack = vi.fn(), dismiss = vi.fn(), peek = vi.fn(() => null as unknown), loaded = { exports: {} };
    new Script(compiled).runInNewContext({ module: loaded, AbortController, props, latest: { current: props }, copy,
        taskRef, incoming: { key: 'pending', draft: { identity: 'incoming' } }, loading: false,
        query: 'pending', peekPixelBeadTransfer: peek,
        window, clearPixelBeadQuery, ackPixelBeadTransfer: ack, dismissPixelBeadTransfer: dismiss,
        setLoading: (value: boolean) => { state.loading = value; }, setError: (value: boolean) => { state.error = value; },
        setIncoming: (value: unknown) => { state.incoming = value; },
    });
    return { controls: loaded.exports as { open(): Promise<void>; keep(): void; read(): () => void }, props, state, taskRef, window, ack, dismiss, peek, copy,
        resolve: () => resolve(), reject: () => reject(new Error('Canvas write failed')) };
}

describe('incoming pixel bead acknowledgement and cancellation', () => {
    it('shows a retryable error for a missing incoming transfer, then rereads it without installing or dismissing a project', () => {
        const h = harness();
        const cleanup = h.controls.read();
        expect(h.state.incoming).toBeNull(); expect(h.state.error).toBe(true);
        expect(h.props.onOpen).not.toHaveBeenCalled(); expect(h.ack).not.toHaveBeenCalled(); expect(h.dismiss).not.toHaveBeenCalled();
        expect(h.window.history.replaceState).not.toHaveBeenCalled();
        cleanup();
        const recovered = { key: 'pending', draft: { identity: 'incoming' } };
        h.peek.mockReturnValue(recovered); h.controls.read();
        expect(h.state.incoming).toBe(recovered); expect(h.state.error).toBe(false); expect(h.props.onOpen).not.toHaveBeenCalled();
    });
    it('acknowledges and removes only the incoming query after the awaited installation succeeds', async () => {
        const h = harness(), run = h.controls.open();
        expect(h.state.loading).toBe(true); expect(h.ack).not.toHaveBeenCalled(); expect(h.window.history.replaceState).not.toHaveBeenCalled();
        h.resolve(); await run;
        expect(h.ack).toHaveBeenCalledWith('pending', h.window.sessionStorage);
        expect(h.window.history.replaceState).toHaveBeenCalledWith(null, '', '/ja/editor?other=keep#focus');
        expect(h.state.error).toBe(false); expect(h.state.loading).toBe(false); expect(h.props.onReturnChange).toHaveBeenCalledOnce();
    });
    it('keeps the pending request retryable after a preparation/installation failure', async () => {
        const h = harness(), run = h.controls.open(); h.reject(); await run;
        expect(h.state.error).toBe(true); expect(h.ack).not.toHaveBeenCalled(); expect(h.dismiss).not.toHaveBeenCalled();
        expect(h.window.history.replaceState).not.toHaveBeenCalled(); expect(h.state.loading).toBe(false);
    });
    it('cancels an outstanding installation and ignores its late result while keeping the pixel return record', async () => {
        const h = harness(), run = h.controls.open(), signal = h.props.onOpen.mock.calls[0][1];
        h.controls.keep(); expect(signal.aborted).toBe(true); expect(h.taskRef.current).toBeNull();
        expect(h.dismiss).toHaveBeenCalledWith('pending', h.window.sessionStorage);
        h.resolve(); await run;
        expect(h.ack).not.toHaveBeenCalled(); expect(h.state.error).toBe(false);
        expect(h.window.history.replaceState).toHaveBeenCalledOnce();
    });
    it('reports a failed acknowledgement without claiming the successful install failed or undoing it', async () => {
        const h = harness(); h.ack.mockImplementation(() => { throw new Error('Storage full'); });
        const run = h.controls.open(); h.resolve(); await run;
        expect(h.props.onOpen).toHaveBeenCalledOnce(); expect(h.state.error).toBe(false);
        expect(h.props.onNotice).toHaveBeenCalledWith(h.copy.ackWarning); expect(h.window.history.replaceState).toHaveBeenCalledOnce();
    });
    it('reports an unsuccessful keep-current status write without describing the incoming pattern as opened', () => {
        const h = harness(); h.dismiss.mockImplementation(() => { throw new Error('Storage blocked'); }); h.controls.keep();
        expect(h.props.onOpen).not.toHaveBeenCalled(); expect(h.props.onNotice).toHaveBeenCalledWith(h.copy.dismissWarning);
        expect(h.window.history.replaceState).toHaveBeenCalledOnce(); expect(h.ack).not.toHaveBeenCalled();
    });
});
