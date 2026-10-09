import Image from 'next/image';
import type { GermanHamaPattern } from '@/lib/patterns/german-hama';

export default function GermanHamaDownloads({ patterns }: { patterns: GermanHamaPattern[] }) {
    return (
        <section id="vorlagen" aria-labelledby="patterns-heading" className="mt-9 scroll-mt-6">
            <h2 id="patterns-heading" className="mb-6 text-xl font-semibold leading-relaxed sm:text-2xl">Sechs Motive für Hama Midi</h2>
            <div className="pattern-grid">
                {patterns.map(pattern => {
                    const tracking = { 'data-pattern-id': pattern.projectId, 'data-pattern-palette': pattern.brand, 'data-pattern-entry': 'patterns' };
                    const pdfLabel = `${pattern.name}: deutsches Hama-Midi-PDF im A4-Format herunterladen`;
                    return (
                        <article key={pattern.id} id={pattern.id} className="pattern-card scroll-mt-6" data-pattern-card={pattern.projectId} aria-labelledby={`${pattern.id}-title`}>
                            <a href={pattern.pdf} download={`${pattern.id}-hama-de-a4.pdf`} className="block rounded-[10px]" aria-label={pdfLabel}
                                data-pattern-event="pattern_download" data-pattern-format="pdf" {...tracking}>
                                <div className="pattern-art">
                                    <Image src={pattern.preview} alt={`${pattern.name} als Hama-Midi-Bügelperlen-Vorlage`} width={580} height={580} unoptimized />
                                </div>
                            </a>
                            <div className="pattern-card-title"><h3 id={`${pattern.id}-title`}>{pattern.name}</h3></div>
                            <div className="flex flex-wrap gap-x-4">
                                <a href={pattern.pdf} download={`${pattern.id}-hama-de-a4.pdf`} className="text-link underline decoration-line underline-offset-4 hover:decoration-accent" aria-label={pdfLabel}
                                    data-pattern-event="pattern_download" data-pattern-format="pdf" {...tracking}>PDF A4 (Deutsch)<span aria-hidden="true">↓</span></a>
                                <a href={pattern.pixels} download={`${pattern.id}-hama-pixels.png`} className="text-link underline decoration-line underline-offset-4 hover:decoration-accent"
                                    aria-label={`${pattern.name}: Hama-Pixelbild mit 29 mal 29 Pixeln herunterladen`} data-pattern-event="pattern_download" data-pattern-format="png" {...tracking}>Pixel-PNG</a>
                            </div>
                            <div className="flex flex-wrap gap-x-4 text-xs text-muted">
                                <a href={pattern.project} download={`${pattern.id}-hama.bead-pattern.json`} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-accent"
                                    aria-label={`${pattern.name}: bearbeitbares Hama-Projekt speichern`} data-pattern-event="pattern_download" data-pattern-format="project" {...tracking}>Projekt speichern</a>
                                <a href={pattern.editor} hrefLang="de" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-accent"
                                    aria-label={`${pattern.name}: Hama-Projekt im deutschen Editor bearbeiten`} data-pattern-event="pattern_editor_open" {...tracking}>Bearbeiten</a>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
