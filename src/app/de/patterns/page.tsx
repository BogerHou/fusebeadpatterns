import LocalizedPatternCatalog from '@/components/patterns/LocalizedPatternCatalog';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { patternLanguageAlternates } from '@/lib/i18n/metadata';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getPatternById } from '@/lib/patterns/catalog';
import germanPatterns from '@/lib/patterns/german.json';

const title = 'Kostenlose Bügelperlen-Vorlagen: Pokémon als PDF | Fuse Bead Patterns';
const description = '8 Pokémon-Bügelperlen-Vorlagen kostenlos herunterladen: Pikachu, Evoli und mehr. Deutsche A4-PDFs mit Farbnummern und Druckanleitung, ohne Anmeldung.';
const preview = '/patterns/pokemon-pikachu-gen5/preview.png';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: '/de/patterns', languages: patternLanguageAlternates() },
    openGraph: {
        title, description, locale: 'de_DE', type: 'website',
        url: 'https://fusebeadpatterns.art/de/patterns',
        siteName: 'Fuse Bead Patterns',
        images: [{ url: preview, width: 580, height: 580, alt: 'Pikachu als Bügelperlen-Vorlage' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [preview] },
};

export default function GermanPatternsPage() {
    return (
        <>
            <SiteHeader locale="de" active="patterns" />
            <main id="main-content" tabIndex={-1} className="page-shell pattern-index flex-1">
                <nav aria-label="Brotkrümelnavigation" className="mb-6 text-xs font-medium text-muted">
                    <ol className="flex flex-wrap items-center gap-x-2">
                        <li><Link href="/de" className="inline-flex min-h-10 items-center hover:underline">Startseite</Link></li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page">Deutsche Vorlagen</li>
                    </ol>
                </nav>
                <h1 className="page-heading leading-snug">Kostenlose Bügelperlen-Vorlagen</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted sm:text-lg">
                    Durchsuche alle Motive: Jede Detailseite bietet ein deutsches PDF und den deutschen Editor zum Bearbeiten. Weiter unten findest du außerdem acht Pokémon-Vorlagen zum direkten Herunterladen. Ohne Anmeldung.
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                    Du suchst Hama-Farbnummern? Hier findest du <Link href="/de/hama-perlen-vorlagen" className="text-link">sechs Hama-Midi-Vorlagen als deutsche PDFs</Link>, darunter Fußball, Halloween- und Weihnachtsmotive.
                </p>
                <p className="mt-5"><a href="#vorlagen" className="text-link">Auswahl mit deutschen PDFs ↓</a></p>
                <LocalizedPatternCatalog locale="de" />
                <section id="vorlagen" aria-labelledby="pokemon-heading" className="mt-9">
                    <h2 id="pokemon-heading" className="mb-6 text-xl font-semibold leading-relaxed sm:text-2xl">Pokémon-Vorlagen zum Ausdrucken</h2>
                    <div className="pattern-grid">
                        {germanPatterns.patterns.map(({ id, name }) => {
                            const pattern = getPatternById(id);
                            if (!pattern) throw new Error(`German library pattern is missing: ${id}`);
                            return (
                                <article key={id} className="pattern-card" data-pattern-card={id} aria-labelledby={`${id}-title`}>
                                    <a href={pattern.assets.grid} target="_blank" rel="noopener" className="block rounded-[10px]" aria-label={`${name}: Rasterbild vergrößern (neuer Tab)`}>
                                        <div className="pattern-art">
                                            <Image src={pattern.assets.preview} alt={`${name} als Bügelperlen-Vorlage`} width={580} height={580} unoptimized />
                                        </div>
                                    </a>
                                    <div className="pattern-card-title"><h3 id={`${id}-title`}>{name}</h3></div>
                                    <div className="flex flex-wrap gap-x-4">
                                        <a href={`/patterns-de/${id}/pattern.pdf`} download={`${id}-de.pdf`} className="text-link underline decoration-line underline-offset-4 hover:decoration-accent"
                                            aria-label={`${name}: deutsches PDF herunterladen`}
                                            data-pattern-event="pattern_download" data-pattern-id={id} data-pattern-palette="perler" data-pattern-entry="patterns" data-pattern-format="pdf">
                                            PDF (Deutsch)<span aria-hidden="true">↓</span>
                                        </a>
                                        <a href={pattern.assets.grid} download={`${id}-grid.png`} className="text-link underline decoration-line underline-offset-4 hover:decoration-accent"
                                            aria-label={`${name}: Rasterbild als PNG herunterladen`}
                                            data-pattern-event="pattern_download" data-pattern-id={id} data-pattern-palette="perler" data-pattern-entry="patterns" data-pattern-format="grid_png">
                                            PNG<span aria-hidden="true">↓</span>
                                        </a>
                                    </div>
                                    <Link href={`/de/editor?pattern=${encodeURIComponent(id)}`} prefetch={false} className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-4"
                                        aria-label={`${name}: Vorlage bearbeiten`} data-pattern-event="pattern_editor_open" data-pattern-id={id} data-pattern-palette="perler" data-pattern-entry="patterns">
                                        Bearbeiten
                                    </Link>
                                    <br />
                                    <Link href={`/de/patterns/${pattern.slug}`} hrefLang="de" prefetch={false} className="inline-flex min-h-11 items-center text-xs text-muted underline underline-offset-4 hover:text-accent">
                                        Details und Quelle
                                    </Link>
                                </article>
                            );
                        })}
                    </div>
                </section>
                <section id="drucken" aria-labelledby="print-heading" className="mt-14 border-t border-line pt-8">
                    <h2 id="print-heading" className="text-2xl font-semibold leading-relaxed">So druckst du deine Vorlage</h2>
                    <ol className="mt-5 max-w-3xl list-decimal space-y-3 pl-6 leading-8 text-muted">
                        <li>Speichere das deutsche PDF. Für die Ansicht am Bildschirm eignet sich auch das PNG mit Raster.</li>
                        <li>Wähle A4 und 100 % oder „Tatsächliche Größe“. Schalte „An Seite anpassen“ aus.</li>
                        <li>Miss die 50-mm-Kontrolllinie auf dem Ausdruck. Das Raster hat 29 × 29 Felder mit 5 mm Abstand. Prüfe zusätzlich, ob es zu deiner Steckplatte passt.</li>
                        <li>Leere Felder bleiben frei. Symbole und Farbliste zeigen dir, welche Perle auf welches Feld gehört. Hinweise zu schmalen Verbindungen stehen im PDF.</li>
                    </ol>
                    <p className="mt-5 max-w-3xl text-sm leading-7 text-muted">
                        Die Farblisten verwenden Perler Midi mit den ursprünglichen Farbnummern und englischen Farbnamen. Bildschirm- und Druckfarben können von echten Perlen abweichen. Die Motive wurden nicht mit echten Perlen gesteckt und gebügelt. Für Mini-Perlen sind die PDFs keine Vorlagen in Originalgröße.
                    </p>
                </section>
                <section aria-labelledby="questions-heading" className="mt-12 max-w-3xl">
                    <h2 id="questions-heading" className="text-2xl font-semibold leading-relaxed">Häufige Fragen</h2>
                    <div className="mt-5 divide-y divide-line border-y border-line">
                        <details className="py-4">
                            <summary className="min-h-11 cursor-pointer py-2 font-semibold">Sind die Vorlagen kostenlos?</summary>
                            <p className="mt-2 pb-2 leading-8 text-muted">Ja. Alle acht PDFs und Rasterbilder auf dieser Seite kannst du kostenlos und ohne Konto herunterladen.</p>
                        </details>
                        <details className="py-4">
                            <summary className="min-h-11 cursor-pointer py-2 font-semibold">Kann ich Hama-Perlen verwenden?</summary>
                            <p className="mt-2 pb-2 leading-8 text-muted">
                                Die Farbnummern dieser PDFs gehören zu Perler, nicht zu Hama. Prüfe deine verfügbaren Farben oder passe die Palette im deutschen Editor an. Die <Link href="/de/guides/perler-to-hama-artkal" className="text-link">Anleitung zum Markenwechsel</Link> erklärt den Ablauf.
                                {' '}Für andere Motive mit bereits vorbereiteten Hama-Farbnummern gibt es unsere <Link href="/de/hama-perlen-vorlagen" className="text-link">kostenlosen Hama-Midi-PDFs</Link>.
                            </p>
                        </details>
                        <details className="py-4">
                            <summary className="min-h-11 cursor-pointer py-2 font-semibold">Wie mache ich aus einem eigenen Bild eine Vorlage?</summary>
                            <p className="mt-2 pb-2 leading-8 text-muted">
                                Im <Link href="/de" className="text-link">Bügelperlen-Generator</Link> kannst du ein eigenes Bild öffnen, die Größe und Marke wählen und das Ergebnis bearbeiten. Für die fertigen Vorlagen auf dieser Seite brauchst du den Konverter nicht.
                            </p>
                        </details>
                    </div>
                </section>
            </main>
            <SiteFooter locale="de" active="patterns" />
        </>
    );
}
