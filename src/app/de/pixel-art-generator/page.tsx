import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import PixelGridWorkspace from '@/components/pixel-grid/PixelGridWorkspace';
import { pixelLanguageAlternates } from '@/lib/i18n/metadata';

const title = 'Pixel-Art-Generator — Bild in Pixel-Art umwandeln | Fuse Bead Patterns';
const description = 'Wandle Bilder kostenlos im Browser in Pixel-Art um. Wähle Größe und Farbanzahl, bearbeite einzelne Pixel und lade ein transparentes PNG oder dein Projekt herunter.';
const pageUrl = 'https://fusebeadpatterns.art/de/pixel-art-generator';

export const metadata: Metadata = {
    title, description,
    alternates: { canonical: pageUrl, languages: pixelLanguageAlternates },
    openGraph: { title, description, url: pageUrl, siteName: 'Fuse Bead Patterns', type: 'website', images: [] },
    twitter: { card: 'summary', title, description, images: [] },
};

const applicationSchema = {
    '@context': 'https://schema.org', '@type': 'WebApplication',
    name: 'Pixel-Art-Generator', description, url: pageUrl,
    inLanguage: 'de', applicationCategory: 'DesignApplication', operatingSystem: 'Web',
};

export default function GermanPixelArtPage() {
    return <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema).replace(/</g, '\\u003c') }} />
        <SiteHeader locale="de" />
        <main id="main-content" tabIndex={-1} className="page-shell flex-1">
            <Breadcrumbs label="Brotkrümelnavigation" items={[
                { label: 'Startseite', href: '/de' },
                { label: 'Pixel-Art-Generator', href: '/de/pixel-art-generator' },
            ]} />
            <div className="mb-8">
                <h1 className="page-heading">Bild in Pixel-Art umwandeln</h1>
                <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted">
                    Lade ein Bild, wähle die Detailstufe und bearbeite einzelne Pixel.
                    Die Umwandlung erfolgt in deinem Browser. Lade das Ergebnis anschließend als PNG herunter.
                </p>
            </div>
            <PixelGridWorkspace locale="de" experience="converter" />
            <section aria-labelledby="conversion-help" className="mt-10 max-w-[75ch] border-t border-line pt-8 text-base leading-7 text-muted">
                <h2 id="conversion-help" className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink">Vom Bild zur PNG-Datei</h2>
                <p className="mt-4">
                    Wähle ein unbewegtes PNG, JPEG oder WebP mit höchstens 8 MiB und 2.048 Pixeln pro Seite.
                    Die Zeichenfläche beginnt bei 64 × 64 Pixeln. Probiere 32 × 32 für grobe Pixel oder 128 × 128 für mehr Details.
                    Du kannst Breite und Höhe auch unabhängig von 1 bis 128 Pixeln einstellen.
                    Ein Motiv, das sich klar vom Hintergrund abhebt, bleibt bei kleinen Größen leichter erkennbar.
                </p>
                <p className="mt-5">
                    Behalte die Originalfarben oder begrenze die Umwandlung auf 8, 16, 32 oder 64 Farben.
                    Eine kleinere Palette kann feine Details entfernen: Vergleiche die Ergebnisse und korrigiere Zellen mit Pinsel und Radierer.
                    Erneutes Umwandeln ersetzt deine Änderungen; „Rückgängig“ stellt den vorherigen Schritt wieder her.
                </p>
                <p className="mt-5">
                    Im PNG in Originalgröße entspricht eine Zelle einem Pixel: Aus einer Zeichnung mit 64 × 64 Zellen wird eine Datei mit 64 × 64 Pixeln.
                    Für größere Bilder kannst du ohne Raster um einen ganzzahligen Faktor vergrößern oder ein PNG mit Rasterlinien exportieren.
                    Speichere zusätzlich das Projekt, um später weiterzuarbeiten. Es enthält die aktuellen Farben, die Transparenz und die Maße,
                    aber weder das Originalbild noch Einstellungen oder Verlauf. Es gibt keine automatische Speicherung.
                </p>
                <p className="mt-5">
                    Für eine Vorlage mit echten Perlenfarben nutze den{' '}
                    <Link href="/de#generator" prefetch={false} className="text-link text-accent">Bügelperlen-Vorlagengenerator</Link>.
                </p>
            </section>
        </main>
        <SiteFooter locale="de" />
    </>;
}
