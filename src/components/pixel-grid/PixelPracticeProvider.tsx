'use client';

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPixelPracticeBridge, type PixelPracticeId } from '@/lib/pixel-grid/practice';
import { PIXEL_PRACTICE_COPY } from '@/lib/pixel-grid/practice-copy';
import type { PixelGridLocale } from '@/lib/pixel-grid/messages';
import styles from './PixelConversionExamples.module.css';

const PracticeContext = createContext<ReturnType<typeof createPixelPracticeBridge> | null>(null);
const unavailable = () => false;
const subscribeNone = () => () => {};

export default function PixelPracticeProvider({ children }: { children: ReactNode }) {
    const [bridge] = useState(createPixelPracticeBridge);
    return <PracticeContext.Provider value={bridge}>{children}</PracticeContext.Provider>;
}

export function usePixelPracticeRegistration(start: (id: PixelPracticeId) => void, enabled: boolean) {
    const bridge = useContext(PracticeContext);
    const startRef = useRef(start);
    const registration = useRef<ReturnType<ReturnType<typeof createPixelPracticeBridge>['register']> | null>(null);
    useEffect(() => { startRef.current = start; }, [start]);
    useEffect(() => {
        if (!bridge) return;
        const active = bridge.register(id => startRef.current(id), false);
        registration.current = active;
        return () => { active.unregister(); if (registration.current === active) registration.current = null; };
    }, [bridge]);
    useEffect(() => { registration.current?.setEnabled(enabled); }, [bridge, enabled]);
}

export function PixelPracticeButton({ id, locale, label }: { id: PixelPracticeId; locale: PixelGridLocale; label: string }) {
    const bridge = useContext(PracticeContext);
    const enabled = useSyncExternalStore(bridge?.subscribe ?? subscribeNone, bridge?.available ?? unavailable, unavailable);
    return <button className={styles.practice} type="button" disabled={!enabled} aria-label={`${PIXEL_PRACTICE_COPY[locale].start}: ${label}`} onClick={() => bridge?.start(id)}>{PIXEL_PRACTICE_COPY[locale].start}</button>;
}
