'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { FrenchPatternBrand, FrenchPatternChoices } from '@/lib/patterns/french-patterns';

const brandLabels = { perler: 'Perler Midi', hama: 'Hama Midi' };

export default function FrenchPatternDownloads({ patterns }: { patterns: FrenchPatternChoices }) {
    // Perler cards and real download anchors are included in the initial HTML.
    const [brand, setBrand] = useState<FrenchPatternBrand>('perler');
    const perlerInput = useRef<HTMLInputElement>(null), hamaInput = useRef<HTMLInputElement>(null);
    const label = brandLabels[brand];

    useEffect(() => {
        let timer: number | undefined;
        const syncRestoredBrand = () => {
            window.clearTimeout(timer);
            // History restoration can change checked without input/change events,
            // after pageshow/popstate. Read the restored controls in the next task.
            timer = window.setTimeout(() => {
                if (hamaInput.current?.checked) setBrand('hama');
                else if (perlerInput.current?.checked) setBrand('perler');
            }, 0);
        };
        window.addEventListener('pageshow', syncRestoredBrand);
        window.addEventListener('popstate', syncRestoredBrand);
        syncRestoredBrand();
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('pageshow', syncRestoredBrand);
            window.removeEventListener('popstate', syncRestoredBrand);
        };
    }, []);

    return (
        <section id="modeles" aria-labelledby="models-heading" className="mt-9 scroll-mt-6">
            <h2 id="models-heading" className="text-xl font-semibold leading-relaxed sm:text-2xl">Six modèles originaux à télécharger</h2>
            <fieldset id="marque" className="mt-5 scroll-mt-6" aria-describedby="brand-help">
                <legend className="text-sm font-semibold">Choisir la marque de perles</legend>
                <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
                    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
                        <input ref={perlerInput} type="radio" name="french-pattern-brand" value="perler" checked={brand === 'perler'} onChange={() => setBrand('perler')} />
                        Perler Midi
                    </label>
                    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
                        <input ref={hamaInput} type="radio" name="french-pattern-brand" value="hama" checked={brand === 'hama'} onChange={() => setBrand('hama')} />
                        Hama Midi
                    </label>
                </div>
                <p id="brand-help" className="max-w-3xl text-sm leading-7 text-muted">La marque choisie s’applique aux aperçus, aux PDF, aux projets et aux liens d’édition. Les deux versions utilisent des perles Midi de 5 mm.</p>
            </fieldset>
            <p aria-live="polite" aria-atomic="true" className="mb-6 mt-3 text-sm text-muted">6 modèles affichés en {label}. PDF A4 en français.</p>
            <noscript><p className="mb-6 text-sm leading-7 text-muted">Les téléchargements Perler Midi sont accessibles sans JavaScript. Activez JavaScript pour sélectionner Hama Midi.</p></noscript>
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-3">
                {patterns[brand].map(pattern => {
                    const tracking = { 'data-pattern-id': pattern.projectId, 'data-pattern-palette': pattern.brand, 'data-pattern-entry': 'patterns' };
                    const pdfLabel = `${pattern.name} : télécharger le PDF A4 ${label} en français`;
                    return (
                        <article key={`${brand}-${pattern.id}`} id={pattern.id} className="pattern-card scroll-mt-6" data-pattern-card={pattern.projectId} aria-labelledby={`${pattern.id}-title`}>
                            <a href={pattern.pdf} download={`${pattern.id}-${brand}-fr-a4.pdf`} className="block rounded-[10px]" aria-label={pdfLabel}
                                data-pattern-event="pattern_download" data-pattern-format="pdf" {...tracking}>
                                <div className="pattern-art">
                                    <Image src={pattern.preview} alt={`${pattern.name} en perles ${label}`} width={580} height={580} unoptimized />
                                </div>
                            </a>
                            <div className="pattern-card-title"><h3 id={`${pattern.id}-title`}>{pattern.name}</h3></div>
                            <div className="flex flex-wrap gap-x-4">
                                <a href={pattern.pdf} download={`${pattern.id}-${brand}-fr-a4.pdf`} className="text-link underline decoration-line underline-offset-4 hover:decoration-accent" aria-label={pdfLabel}
                                    data-pattern-event="pattern_download" data-pattern-format="pdf" {...tracking}>PDF A4<span aria-hidden="true">↓</span></a>
                                <a href={pattern.project} download={`${pattern.id}-${brand}.bead-pattern.json`} className="text-link underline decoration-line underline-offset-4 hover:decoration-accent"
                                    aria-label={`${pattern.name} : enregistrer le projet ${label}`} data-pattern-event="pattern_download" data-pattern-format="project" {...tracking}>Enregistrer le projet</a>
                            </div>
                            <a href={pattern.editor} hrefLang="fr" className="inline-flex min-h-11 items-center text-xs text-muted underline underline-offset-4 hover:text-accent"
                                aria-label={`${pattern.name} : modifier le projet ${label} dans l’éditeur en français`} data-pattern-event="pattern_editor_open" {...tracking}>Modifier</a>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
