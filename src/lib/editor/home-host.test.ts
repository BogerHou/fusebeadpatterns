import { describe, expect, it } from 'vitest';
import { HomeHostImageRequests } from './home-host';

describe('homepage host image request arbitration', () => {
    it('accepts each delivery once, including after effect rerenders', () => {
        const requests = new HomeHostImageRequests();
        const first = requests.claim('right-click-one')!;
        expect(first).not.toBeNull();
        expect(requests.claim('right-click-one')).toBeNull();
        expect(requests.isCurrent(first)).toBe(true);
    });

    it('a later delivery invalidates the previous asynchronous result', () => {
        const requests = new HomeHostImageRequests();
        const first = requests.claim('first')!;
        const second = requests.claim('second')!;
        expect(requests.isCurrent(first)).toBe(false);
        expect(requests.isCurrent(second)).toBe(true);
    });

    it('manual image/project selection before readiness suppresses the queued image', () => {
        const requests = new HomeHostImageRequests();
        requests.cancel('waiting-for-palette');
        expect(requests.claim('waiting-for-palette')).toBeNull();
        expect(requests.claim('a-new-right-click')).not.toBeNull();
    });

    it('manual replacement or explicit cancel invalidates an import without retrying it', () => {
        const requests = new HomeHostImageRequests();
        const old = requests.claim('old')!;
        requests.cancel('old');
        expect(requests.isCurrent(old)).toBe(false);
        expect(requests.claim('old')).toBeNull();
        const replacement = requests.claim('replacement')!;
        expect(requests.isCurrent(replacement)).toBe(true);
    });
});
