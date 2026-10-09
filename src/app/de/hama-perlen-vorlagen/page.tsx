import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import type { Metadata } from 'next';
import Link from 'next/link';
import GermanHamaDownloads from '@/components/patterns/GermanHamaDownloads';
import { germanHamaPath, germanHamaPatterns } from '@/lib/patterns/german-hama';
import { hamaLanguageAlternates } from '@/lib/i18n/metadata';

const title = 'Hama-Perlen-Vorlagen kostenlos: 6 PDFs | Fuse Bead Patterns';
const description = 'Sechs kostenlose Hama-Midi-Vorlagen: Fußball, Geist, Fledermaus und Weihnachtsmotive. Deutsche A4-PDFs mit Hama-Farbnummern, Symbolraster und Druckanleitung.';
const preview = '/patterns-hama/original-friendly-ghost/preview.png';
const url = `https://fusebeadpatterns.art${germanHamaPath}`;

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: germanHamaPath, languages: hamaLanguageAlternates },
    openGraph: {
        title, description, locale: 'de_DE', type: 'website', url,
        siteName: 'Fuse Bead Patterns',
        images: [{ url: preview, width: 580, height: 580, alt: 'Geist als Hama-Midi-Bügelperlen-Vorlage' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [preview] },
};

const structuredData = [
    {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title, description, inLanguage: 'de', url,
        mainEntity: {
            '@type': 'ItemList', numberOfItems: germanHamaPatterns.length,
            itemListElement: germanHamaPatterns.map((pattern, index) => ({
                '@type': 'ListItem', position: index + 1, name: pattern.name,
                url: `${url}#${pattern.id}`,
            })),
        },
    },
    {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://fusebeadpatterns.art/de' },
            { '@type': 'ListItem', position: 2, name: 'Deutsche Vorlagen', item: 'https://fusebeadpatterns.art/de/patterns' },
            { '@type': 'ListItem', position: 3, name: 'Hama-Perlen-Vorlagen', item: url },
        ],
    },
];

export default function GermanHamaPatternsPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
            <SiteHeader locale="de" active="patterns" />
            <main id="main-content" tabIndex={-1} className="page-shell pattern-index flex-1">
                <nav aria-label="Brotkrümelnavigation" className="mb-6 text-xs font-medium text-muted">
                    <ol className="flex flex-wrap items-center gap-x-2">
                        <li><Link href="/de" className="inline-flex min-h-10 items-center hover:underline">Startseite</Link></li>
                        <li aria-hidden="true">/</li>
                        <li><Link href="/de/patterns" className="inline-flex min-h-10 items-center hover:underline">Deutsche Vorlagen</Link></li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page">Hama-Perlen-Vorlagen</li>
                    </ol>
                </nav>
                <h1 className="page-heading leading-snug">Kostenlose Hama-Perlen-Vorlagen</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted sm:text-lg">
                    Sechs eigene Motive für Hama Midi: Fußball, Geist, Fledermaus, Weihnachtsbaum, Schneemann und Lebkuchenmann. Lade dein deutsches PDF im A4- oder US-Letter-Format mit Symbolraster und Hama-Farbnummern direkt herunter. Ohne Anmeldung.
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                    Jedes Motiv passt auf ein Raster mit 29 × 29 Feldern. Die Druckvorlagen sind für Midi-Perlen mit 5 mm vorgesehen. Prüfe den Ausdruck an deiner Steckplatte, bevor du ihn als Unterlage verwendest.
                </p>
                <GermanHamaDownloads patterns={germanHamaPatterns} />
                <p className="mt-6 max-w-3xl text-sm leading-7 text-muted">
                    Die PDFs im A4- und US-Letter-Format sind beide auf Deutsch. Zum Ausdrucken nutze das Format, das zu deinem Papier passt. Das Pixel-PNG ist ein Bild mit 29 × 29 Pixeln ohne Rasterlinien oder Farbliste. Das Projekt enthält das bearbeitbare Motiv und seine Hama-Palette.
                </p>
                <section id="drucken" aria-labelledby="print-heading" className="mt-14 max-w-3xl scroll-mt-6 border-t border-line pt-8">
                    <h2 id="print-heading" className="text-2xl font-semibold leading-relaxed">Hama-Vorlagen in der richtigen Größe drucken</h2>
                    <ol className="mt-5 list-decimal space-y-3 pl-6 leading-8 text-muted">
                        <li>Lade das deutsche PDF passend zu deinem Papier herunter: A4 oder US Letter. Beide enthalten das Symbolraster und die benötigte Anzahl jeder Hama-Farbe.</li>
                        <li>Wähle dasselbe Papierformat wie im PDF und 100 % oder „Tatsächliche Größe“. Schalte „An Seite anpassen“ aus.</li>
                        <li>Miss beide 50-mm-Kontrolllinien auf dem Ausdruck: waagerecht und senkrecht. Vergleiche das Raster mit 5 mm Abstand zusätzlich mit deiner Steckplatte.</li>
                        <li>Leere Felder bleiben frei. Ein weißes Feld mit Symbol braucht eine weiße Perle. Folge den Symbolen und Hama-Farbnummern in der Liste.</li>
                    </ol>
                    <p className="mt-5 text-sm leading-7 text-muted">
                        Für Hama Mini oder Maxi sind diese PDFs keine Vorlagen in Originalgröße. Bildschirm- und Druckfarben sind Näherungen. Die Motive wurden digital geprüft, aber nicht mit echten Perlen gesteckt oder gebügelt. Beachte die Anleitung deiner Perlenmarke; das Bügeln übernimmt ein Erwachsener.
                    </p>
                </section>
                <section aria-labelledby="colours-heading" className="mt-10 max-w-3xl">
                    <h2 id="colours-heading" className="text-2xl font-semibold leading-relaxed">Hama-Farbnummern und bearbeitbare Projekte</h2>
                    <p className="mt-4 leading-8 text-muted">
                        Alle Vorschauen, Pixelbilder, PDFs und Projekte auf dieser Seite verwenden dieselbe Hama-Midi-Farbzuordnung. Die Nummern gehören zu Hama. Im Editor steht davor ein H für unsere Softwarepalette: H01 entspricht Hama 01 Weiß, H18 entspricht Hama 18 Schwarz.
                    </p>
                    <p className="mt-4 leading-8 text-muted">
                        „Bearbeiten“ öffnet das gewählte Hama-Projekt im deutschen Editor. Mit „Projekt speichern“ lädst du eine Datei herunter, die du später im Editor wieder öffnen kannst. Beachte beim erneuten PDF-Export dessen Druckhinweise. Exportiere nach Änderungen eine neue Vorlage; die Downloads auf dieser Seite bleiben unverändert.
                    </p>
                    <p className="mt-4 leading-8 text-muted">
                        Vergleiche deine Vorräte mit der <a href="https://hama.dk/en/pages/colour-chart" hrefLang="en" className="text-link">offiziellen Hama-Farbkarte (Englisch)</a>. Für weitere Motive gibt es die <Link href="/de/patterns" className="text-link">deutschen Pokémon-PDFs mit Perler-Farbnummern</Link>. Die <Link href="/de/guides/perler-to-hama-artkal" className="text-link">Anleitung zum Markenwechsel</Link> erklärt, wie du andere Vorlagen im Editor an deine Palette anpasst.
                    </p>
                </section>
            </main>
            <SiteFooter locale="de" active="patterns" />
        </>
    );
}
