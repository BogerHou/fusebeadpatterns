import { type ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PrivacyPreferencesButton from './PrivacyPreferencesButton';

const runtime = vi.hoisted(() => ({
    consent: 'unknown' as 'unknown' | 'granted' | 'denied', failed: false,
    dialog: { showModal: vi.fn(), close: vi.fn() },
    save: vi.fn<(value: 'granted' | 'denied') => boolean>(() => true),
    start: vi.fn(() => true),
}));

vi.mock('../../lib/analytics-consent', () => ({
    getAnalyticsConsent: () => runtime.consent,
    getServerAnalyticsConsent: () => 'unknown',
    subscribeAnalyticsConsent: () => () => {},
    setAnalyticsConsent: runtime.save,
    startAnalytics: runtime.start,
}));

vi.mock('react', async () => ({
    ...await vi.importActual<typeof import('react')>('react'),
    useId: () => 'privacy-heading',
    useRef: () => ({ current: runtime.dialog }),
    useState: () => [runtime.failed, (value: boolean) => { runtime.failed = value; }],
    useSyncExternalStore: () => runtime.consent,
}));

beforeEach(() => {
    runtime.consent = 'unknown'; runtime.failed = false;
    vi.clearAllMocks(); runtime.save.mockReturnValue(true);
});

function controls(locale: 'en' | 'de' | 'fr' | 'ja' = 'en') {
    type Node = ReactElement<{ children: Node[] | string; onClick: () => void }>;
    const output = PrivacyPreferencesButton({ locale }) as Node;
    const children = output.props.children as Node[];
    const dialog = children.find(child => child.type === 'dialog')!;
    const actions = (dialog.props.children as Node[]).find(child => child.type === 'div')!;
    return { trigger: children.find(child => child.type === 'button')!, dialog, buttons: actions.props.children as Node[] };
}

describe('privacy dialog keyboard isolation', () => {
    it('reproduces why bubble stopPropagation cannot block another listener on the same document', () => {
        // Next hydrates document. Its React bubble delegate and the workspaces’
        // native keyboard listeners therefore share this one EventTarget.
        const documentTarget = new EventTarget();
        const backgroundShortcut = vi.fn();
        documentTarget.addEventListener('keydown', event => event.stopPropagation());
        documentTarget.addEventListener('keydown', backgroundShortcut);
        const event = new Event('keydown', { bubbles: true, cancelable: true });
        documentTarget.dispatchEvent(event);
        expect(backgroundShortcut).toHaveBeenCalledOnce();
        expect(event.defaultPrevented).toBe(false);
    });

    it('intercepts in capture instead and does not cancel Escape, Tab or button defaults', () => {
        const output = PrivacyPreferencesButton({ locale: 'en' }) as ReactElement<{ children: ReactElement[] }>;
        const dialog = output.props.children.find(child => child.type === 'dialog') as ReactElement<{
            onKeyDownCapture: (event: Event) => void;
            onKeyDown?: (event: Event) => void;
        }>;
        expect(dialog.props.onKeyDown).toBeUndefined();
        expect(dialog.props.onKeyDownCapture).toBeTypeOf('function');
        for (const key of ['z', 'y', 'Escape', 'Tab', 'Enter', ' ']) {
            const event = new Event('keydown', { bubbles: true, cancelable: true });
            Object.defineProperties(event, { key: { value: key }, ctrlKey: { value: key === 'z' || key === 'y' } });
            dialog.props.onKeyDownCapture(event);
            expect(event.cancelBubble).toBe(true);
            expect(event.defaultPrevented).toBe(false);
        }
        // Node EventTarget has no ancestor event path. Actual modal-to-document
        // propagation and native keyboard defaults are checked in the browser.
    });
});

describe('privacy choice handlers', () => {
    it('opens only on request and closes without changing an unanswered choice', () => {
        const ui = controls(); expect(runtime.dialog.showModal).not.toHaveBeenCalled();
        ui.trigger.props.onClick(); expect(runtime.dialog.showModal).toHaveBeenCalledOnce();
        ui.buttons[2].props.onClick(); expect(runtime.dialog.close).toHaveBeenCalledOnce();
        expect(runtime.save).not.toHaveBeenCalled(); expect(runtime.start).not.toHaveBeenCalled();
    });

    it('saves rejection or first permission without independently starting a duplicate consent effect', () => {
        controls().buttons[0].props.onClick();
        expect(runtime.save).toHaveBeenCalledExactlyOnceWith('denied'); expect(runtime.start).not.toHaveBeenCalled();
        expect(runtime.dialog.close).toHaveBeenCalledOnce();
        vi.clearAllMocks();
        controls().buttons[1].props.onClick();
        expect(runtime.save).toHaveBeenCalledExactlyOnceWith('granted'); expect(runtime.start).not.toHaveBeenCalled();
        expect(runtime.dialog.close).toHaveBeenCalledOnce();
    });

    it('explicitly retries a previous allowed SDK failure only after successful choice persistence', () => {
        runtime.consent = 'granted'; const order: string[] = [];
        runtime.save.mockImplementation(() => { order.push('persist'); return true; });
        runtime.start.mockImplementation(() => { order.push('start'); return true; });
        controls().buttons[1].props.onClick();
        expect(order).toEqual(['persist', 'start']); expect(runtime.start).toHaveBeenCalledOnce();
        expect(runtime.dialog.close).toHaveBeenCalledOnce();
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('keeps %s storage failures visible without closing or requesting an SDK', locale => {
        runtime.consent = 'granted'; runtime.save.mockReturnValue(false);
        controls(locale).buttons[1].props.onClick();
        expect(runtime.failed).toBe(true); expect(runtime.dialog.close).not.toHaveBeenCalled();
        expect(runtime.start).not.toHaveBeenCalled();
        const status = (controls(locale).dialog.props.children as ReactElement<{ role?: string; children: string }>[]).find(child => child.props.role === 'status')!;
        expect(status.props.children.length).toBeGreaterThan(25);
        if (locale === 'ja') expect(status.props.children).toContain('保存できませんでした');
        else if (locale === 'fr') expect(status.props.children).toContain('enregistrer');
        else if (locale === 'de') expect(status.props.children).toContain('speichern');
        else expect(status.props.children).toContain('could not save');
    });
});
