'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { homePatternCopy } from '@/lib/i18n/home-patterns';
import type { SiteLocale } from '@/lib/i18n/locales';
import styles from './PatternStudy.module.css';

/** A visual explanation of the existing pattern, using the same 192 cells. */
export default function PatternStudy({ locale = 'en' }: { locale?: SiteLocale }) {
    const [view, setView] = useState<'pixels' | 'beads'>('beads');
    const copy = homePatternCopy[locale];

    return (
        <figure className={styles.study}>
            <div className={styles.topline}>
                <span className="eyebrow">{copy.studyEyebrow}</span>
                <div className={styles.controls} role="group" aria-label={copy.studyControls}>
                    <button type="button" aria-pressed={view === 'pixels'} onClick={() => setView('pixels')}>{copy.pixels}</button>
                    <button type="button" aria-pressed={view === 'beads'} onClick={() => setView('beads')}>{copy.beads}</button>
                </div>
            </div>
            <div className={styles.art}>
                <Image src={view === 'beads' ? '/studio/blue-chicken-beads.svg' : '/studio/blue-chicken-pixels.svg'} alt={view === 'beads' ? copy.studyBeadAlt : copy.studyPixelAlt} width={580} height={580} unoptimized preload />
            </div>
            <figcaption className={styles.caption}>
                <div><span className={styles.title}>{copy.studyTitle}</span><span className={styles.note}>{copy.studyNote}</span></div>
                <Link href={`${locale === 'en' ? '' : `/${locale}`}/patterns/stardew-valley/blue-chicken`} aria-label={copy.studyLink} className={styles.open}>↗</Link>
            </figcaption>
        </figure>
    );
}
