'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import styles from './PatternStudy.module.css';

/** A visual explanation of the existing pattern, using the same 192 cells. */
export default function PatternStudy() {
    const [view, setView] = useState<'pixels' | 'beads'>('beads');

    return (
        <figure className={styles.study}>
            <div className={styles.topline}>
                <span className="eyebrow">From pixel to pegboard</span>
                <div className={styles.controls} role="group" aria-label="Pattern preview style">
                    <button type="button" aria-pressed={view === 'pixels'} onClick={() => setView('pixels')}>Pixels</button>
                    <button type="button" aria-pressed={view === 'beads'} onClick={() => setView('beads')}>Beads</button>
                </div>
            </div>
            <div className={styles.art}>
                <Image src={view === 'beads' ? '/studio/blue-chicken-beads.svg' : '/studio/blue-chicken-pixels.svg'} alt={`Stardew Valley Blue Chicken ${view === 'beads' ? 'digital bead layout' : 'pixel pattern'}`} width={580} height={580} unoptimized preload />
            </div>
            <figcaption className={styles.caption}>
                <div><span className={styles.title}>Stardew Valley Blue Chicken</span><span className={styles.note}>Digital preview · ready to make your own</span></div>
                <Link href="/patterns/stardew-valley/blue-chicken" aria-label="View Stardew Valley Blue Chicken pattern" className={styles.open}>↗</Link>
            </figcaption>
        </figure>
    );
}
