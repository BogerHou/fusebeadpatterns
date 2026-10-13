import { runSourceBackgroundMask, type SourceBackgroundMaskRequest } from './source-background';

const scope = self as unknown as { onmessage: (event: MessageEvent<SourceBackgroundMaskRequest & { id: number }>) => void;
    postMessage: (message: unknown, transfer?: Transferable[]) => void };
scope.onmessage = event => {
    const id = event.data?.id;
    try {
        if (!Number.isSafeInteger(id) || id < 1) throw new Error('Invalid background request ID.');
        const result = runSourceBackgroundMask(event.data);
        scope.postMessage({ type: 'result', id, ...result }, [result.pixels.buffer, result.mask.buffer]);
    } catch (error) { scope.postMessage({ type: 'error', id, message: error instanceof Error ? error.message : 'Background processing failed.' }); }
};
scope.postMessage({ type: 'ready' });
