import {
    runPatternQuantization,
    type QuantizationRequest,
    type QuantizationResponse,
} from './quantization-protocol';

const workerScope = self as unknown as {
    onmessage: (event: MessageEvent<QuantizationRequest>) => void;
    postMessage: (message: QuantizationResponse, transfer?: Transferable[]) => void;
};

workerScope.onmessage = (event) => {
    try {
        const pixels = runPatternQuantization(event.data);
        workerScope.postMessage({ type: 'result', pixels }, [pixels.buffer]);
    } catch (error) {
        workerScope.postMessage({
            type: 'error',
            message: error instanceof Error ? error.message : 'Pattern conversion failed.',
        });
    }
};

workerScope.postMessage({ type: 'ready' });
