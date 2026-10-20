import {
    EXTENSION_MESSAGE_SOURCE, getHandoffToken, isWebsiteBridgeMessage, WEBSITE_ORIGIN,
} from '../../../src/lib/browser-extension/protocol';

const token = getHandoffToken(window.location.href);
if (token && window.top === window) {
    let requestInFlight = false;
    let finished = false;
    const listener = async (event: MessageEvent<unknown>) => {
        if (finished || event.source !== window || event.origin !== WEBSITE_ORIGIN || !isWebsiteBridgeMessage(event.data, token)) return;
        if (event.data.type === 'extension-ready') {
            if (requestInFlight) return;
            requestInFlight = true;
            try {
                const response = await chrome.runtime.sendMessage<{ ok: boolean; project?: string; error?: string }>({ type: 'read-handoff', token });
                if (finished) return;
                if (response.ok && typeof response.project === 'string') {
                    window.postMessage({ source: EXTENSION_MESSAGE_SOURCE, type: 'extension-project', token, project: response.project }, WEBSITE_ORIGIN);
                } else {
                    window.postMessage({ source: EXTENSION_MESSAGE_SOURCE, type: 'extension-error', token, error: 'handoff_unavailable' }, WEBSITE_ORIGIN);
                }
            } catch {
                window.postMessage({ source: EXTENSION_MESSAGE_SOURCE, type: 'extension-error', token, error: 'handoff_unavailable' }, WEBSITE_ORIGIN);
            } finally { requestInFlight = false; }
            return;
        }
        // Only a website action consumes the one-time record. Reading and
        // retrying do not consume it before the user's decision is preserved.
        try {
            const response = await chrome.runtime.sendMessage<{ ok: boolean }>({ type: 'finish-handoff', token,
                result: event.data.type === 'extension-accepted' ? 'accepted' : 'dismissed' });
            if (response.ok) { finished = true; window.removeEventListener('message', listener); }
        } catch { /* The bounded session record expires even if Chrome unloads. */ }
    };
    window.addEventListener('message', listener);
}
