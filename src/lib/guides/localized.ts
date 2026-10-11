import { getGuideBySlug, guidePages, type GuidePage } from '../../app/(english)/guides/guide-data';
import { getPatternBySlug } from '../patterns/catalog';
import { getLocalizedPatternName } from '../patterns/localized-content';
import { miniGhostAssetRoot, miniGhostProjectId } from '../patterns/mini';
import { siteNavigation, type SiteLocale } from '../i18n/locales';
import { localeRoutes } from '../i18n/routes';
import { germanGuides } from './de';
import { frenchGuides } from './fr';
import { japaneseGuides } from './ja';
import { guideHref, isTranslatedGuideSlug } from './routes';

export type GuideLocale = Exclude<SiteLocale, 'en'>;
export const guideTranslations = { de: germanGuides, fr: frenchGuides, ja: japaneseGuides };
export const guideUi = {
    de: { home: 'Startseite', title: 'Anleitungen für Bügelperlen', intro: 'Bilder umwandeln, Farben auswählen, Platten planen und fertige Motive bügeln. Wähle den passenden nächsten Schritt für dein Projekt.', next: 'Weiter mit deinem Projekt',
        photo: 'Ein Foto in eine Bügelperlen-Vorlage umwandeln', photoDescription: 'Vergleiche echte Foto- und Illustrationsbeispiele und lerne, Rastergröße und einzelne Perlen zu korrigieren.', photoEyebrow: 'Bilder umwandeln' },
    fr: { home: 'Accueil', title: 'Guides des perles à repasser', intro: 'Convertir une image, choisir les couleurs, préparer les plaques et repasser le motif : trouvez la prochaine étape de votre projet.', next: 'Poursuivre votre projet',
        photo: 'Transformer une photo en modèle de perles', photoDescription: 'Comparez des conversions réelles de photo et d’illustration, ajustez la grille et retouchez les perles.', photoEyebrow: 'Conversion d’image' },
    ja: { home: 'ホーム', title: 'アイロンビーズの使い方ガイド', intro: '画像からの図案作成、色とプレートの選択、印刷、アイロンでの仕上げまで。今の作業に合うガイドから進められます。', next: '次の作業へ',
        photo: '画像からアイロンビーズ図案を作る方法', photoDescription: '画像の読み込みから色と枚数の設定、マスの修正、日本語PDFの保存、プロジェクトの再開まで。', photoEyebrow: '画像を図案にする' },
};

export function getGuideSummaries(locale: GuideLocale) {
    return guidePages.map(guide => {
        const copy = isTranslatedGuideSlug(guide.slug) ? guideTranslations[locale][guide.slug] : {
            title: guideUi[locale].photo, description: guideUi[locale].photoDescription, eyebrow: guideUi[locale].photoEyebrow,
        };
        const href = guideHref(guide.slug, locale);
        return { slug: guide.slug, title: copy.title, description: copy.description, eyebrow: copy.eyebrow, href, language: href.startsWith(`/${locale}/`) ? locale : 'en' };
    });
}

// These labels describe the retained manufacturer sources, not new local sources.
const sourceLabels: Record<string, [string, string, string]> = {
    'https://perler.com/blogs/projects/alien-keychain': ['Perler: Schlüsselanhänger mit Perlenloch (englische Anleitung)', 'Perler : porte-clés fixé dans un trou de perle (instructions en anglais)', 'Perler：ビーズの穴に金具を付ける作例（英語）'],
    'https://perler.com/blogs/projects/carnival-food-keychains': ['Perler: Biegering und Schlüsselring verbinden (englische Anleitung)', 'Perler : relier l’anneau ouvert au porte-clés (instructions en anglais)', 'Perler：丸カンとキーホルダーの接続例（英語）'],
    'https://commons.wikimedia.org/wiki/File:TUXEDO_CAT.jpg': ['Quelle und Fotograf', 'Source et auteur de la photo', '写真の出典と撮影者'],
    'https://creativecommons.org/publicdomain/zero/1.0/': ['Lizenz: CC0 1.0', 'Licence : CC0 1.0', 'CC0 1.0ライセンス'],
    'https://perler.com/products/1-000-perler-beads-multi-mix': ['Perler: Standardmaße', 'Perler : dimensions standard', 'Perler：標準サイズの仕様'],
    'https://perler.com/products/mini-beads-large-pegboards-2-ct': ['Perler: Mini-Steckplatten', 'Perler : plaques Mini', 'Perler：Mini用プレート'],
    'https://perler.com/blogs/projects/football-silhouettes': ['Perler: Mini-Farben White und Black', 'Perler : couleurs Mini White et Black', 'Perler：MiniのWhiteとBlackの使用例'],
    'https://hama.dk/pages/faq': ['Hama: Größenangaben', 'Hama : dimensions des perles', 'Hama：各サイズの仕様'],
    'https://www.artkalfusebeads.com/blogs/faq/artkal-beads-size': ['Artkal: Größen und Serien', 'Artkal : tailles et séries', 'Artkal：サイズとシリーズ'],
    'https://www.artkalfusebeads.com/blogs/faq/which-series-of-artkal-beads-can-work-with-perler-and-hama': ['Artkal: Kompatibilitätserklärung von 2017', 'Artkal : déclaration de compatibilité de 2017', 'Artkal：2017年の互換性についての案内'],
    'https://perler.com/collections/1-000ct-bead-bags': ['Perler: Farben und Verfügbarkeit', 'Perler : couleurs et disponibilité', 'Perler：単色ビーズと在庫'],
    'https://hama.dk/en/pages/colour-chart': ['Hama: Farbkarten nach Größe', 'Hama : nuanciers par taille', 'Hama：サイズ別の色見本'],
    'https://www.artkalfusebeads.com/blogs/artkal-color-chart': ['Artkal: Farbkarten nach Serie', 'Artkal : nuanciers par série', 'Artkal：シリーズ別の色見本'],
    'https://perler.com/pages/frequently-asked-questions': ['Perler: Bügelhinweise und Fehlerbehebung', 'Perler : repassage et dépannage', 'Perler：アイロンの設定とトラブル対処'],
    'https://hama.dk/en/pages/instructions-1': ['Hama: Anleitungen nach Perlengröße', 'Hama : instructions selon la taille', 'Hama：サイズ別の使い方'],
    'https://perler.com/blogs/projects/standard-fusing-method': ['Perler: Standardmethode mit Video', 'Perler : méthode standard et vidéo', 'Perler：標準の接合方法と動画'],
    'https://perler.com/blogs/projects/the-tape-method-for-fusing-large-projects': ['Perler: vollständige Klebeband-Anleitung', 'Perler : méthode complète au ruban adhésif', 'Perler：テープ方式の全手順'],
};

const photoAssetLabels: Record<string, [string, string, string]> = {
    '/guides/photo-to-pattern/cat-source.jpg': ['Ausgangsfoto speichern', 'Enregistrer la photo source', '元写真を保存'],
    '/guides/photo-to-pattern/cat-perler-29.pdf': ['Katze 29 × 29 – PDF', 'Chat 29 × 29 – PDF', '猫29 × 29 — PDF'],
    '/guides/photo-to-pattern/cat-perler-58.pdf': ['Katze 58 × 58 – PDF', 'Chat 58 × 58 – PDF', '猫58 × 58 — PDF'],
    '/guides/photo-to-pattern/cat-perler-29_grid.png': ['Katze 29 × 29 – Raster-PNG', 'Chat 29 × 29 – grille PNG', '猫29 × 29 — マス目PNG'],
    '/guides/photo-to-pattern/cat-perler-58_grid.png': ['Katze 58 × 58 – Raster-PNG', 'Chat 58 × 58 – grille PNG', '猫58 × 58 — マス目PNG'],
    '/guides/photo-to-pattern/cat-perler-29.bead-pattern.json': ['Katze 29 × 29 – bearbeitbares Projekt', 'Chat 29 × 29 – projet modifiable', '猫29 × 29 — 編集用プロジェクト'],
    '/guides/photo-to-pattern/cat-perler-58.bead-pattern.json': ['Katze 58 × 58 – bearbeitbares Projekt', 'Chat 58 × 58 – projet modifiable', '猫58 × 58 — 編集用プロジェクト'],
    '/guides/photo-to-pattern/rocket-source.png': ['Raketenillustration speichern', 'Enregistrer l’illustration de la fusée', '元のロケット画像を保存'],
    '/guides/photo-to-pattern/rocket-perler-29-auto.bead-pattern.json': ['Unbearbeitetes Raketenprojekt', 'Projet de fusée avant retouche', '修正前のロケットプロジェクト'],
    '/guides/photo-to-pattern/rocket-perler-29-cleanup.bead-pattern.json': ['Bearbeitetes Raketenprojekt', 'Projet de fusée après retouche', '修正後のロケットプロジェクト'],
    '/guides/photo-to-pattern/rocket-perler-29-cleanup_grid.png': ['Bearbeitetes Raketenraster – PNG', 'Grille de la fusée retouchée – PNG', '修正後のロケット — マス目PNG'],
    '/guides/photo-to-pattern/rocket-perler-29-cleanup.pdf': ['Bearbeitete Rakete – PDF mit Symbolen', 'Fusée retouchée – PDF avec symboles', '修正後のロケット — 記号付きPDF'],
};
const specialLabels: Record<string, [string, string, string]> = {
    '/patterns/easy': ['Einfache Bügelperlen-Vorlagen', 'Modèles faciles en perles à repasser', '簡単なアイロンビーズ図案'],
    '/patterns/hama': ['Hama-Midi-Vorlagen', 'Modèles Hama Midi', 'Hama Midiの図案'],
    '/printables/calibration/29x29-5mm-a4.pdf': ['A4-Raster mit Messlinien – PDF', 'Grille A4 et repères – PDF', 'A4の空白図案と確認用目盛り — PDF'],
    '/printables/calibration/29x29-5mm-us-letter.pdf': ['US-Letter-Raster mit Messlinien – PDF', 'Grille US Letter et repères – PDF', 'US Letterの空白図案と確認用目盛り — PDF'],
    '/printables/calibration/29x29-5mm-a4.svg': ['Bearbeitbares A4-Raster – SVG', 'Grille A4 modifiable – SVG', '編集用A4図案 — SVG'],
    '/printables/calibration/29x29-5mm-us-letter.svg': ['Bearbeitbares US-Letter-Raster – SVG', 'Grille US Letter modifiable – SVG', '編集用US Letter図案 — SVG'],
};

const miniGhostLinkLabels: Record<string, [string, string, string]> = {
    [`${miniGhostAssetRoot}/pattern-a4.pdf`]: ['Geist — Perler Mini: A4-Zählvorlage', 'Fantôme — Perler Mini : PDF de référence A4', 'ゴースト — Perler Mini：A4参考PDF'],
    [`${miniGhostAssetRoot}/pattern-letter.pdf`]: ['Geist — Perler Mini: US-Letter-Zählvorlage', 'Fantôme — Perler Mini : PDF de référence US Letter', 'ゴースト — Perler Mini：US Letter参考PDF'],
    [`${miniGhostAssetRoot}/grid.png`]: ['Geist — Perler Mini: Raster-PNG', 'Fantôme — Perler Mini : grille PNG', 'ゴースト — Perler Mini：マス目付きPNG'],
    [`${miniGhostAssetRoot}/pattern.bead-pattern.json`]: ['Geist — Perler Mini: Projekt speichern', 'Enregistrer le projet Fantôme — Perler Mini', 'ゴースト — Perler Mini：プロジェクトを保存'],
    [`/editor?pattern=${miniGhostProjectId}`]: ['Geist — Perler Mini im deutschen Editor öffnen', 'Ouvrir Fantôme — Perler Mini dans l’éditeur en français', 'ゴースト — Perler Miniを日本語エディターで開く'],
};

export function localizeGuideLink<T extends { href: string; label: string }>(link: T, locale: GuideLocale): T {
    const index = { de: 0, fr: 1, ja: 2 }[locale];
    const english = (label: string) => `${label} (${siteNavigation[locale].english})`;
    const miniLabel = miniGhostLinkLabels[link.href]?.[index];
    if (miniLabel) {
        const href = link.href === `/editor?pattern=${miniGhostProjectId}`
            ? `${localeRoutes[locale].editor}?pattern=${miniGhostProjectId}`
            : link.href.endsWith('.pdf') || link.href === `${miniGhostAssetRoot}/grid.png` ? link.href.replace(`${miniGhostAssetRoot}/`, `${miniGhostAssetRoot}/${locale}/`) : link.href;
        return { ...link, href, label: miniLabel };
    }
    if (link.href === '/#generator') return { ...link, href: `${localeRoutes[locale].home}#generator`, label: siteNavigation[locale].generator };
    if (link.href === '/editor') return { ...link, href: localeRoutes[locale].editor, label: siteNavigation[locale].editor };
    if (link.href === '/') return { ...link, href: localeRoutes[locale].home, label: siteNavigation[locale].generator };
    if (link.href.startsWith('/guides/')) {
        const slug = link.href.slice('/guides/'.length);
        const summary = getGuideSummaries(locale).find(guide => guide.slug === slug);
        if (summary) return { ...link, href: summary.href, label: summary.language === locale ? summary.title : english(summary.title) };
    }
    if (link.href === '/patterns') return { ...link, href: localeRoutes[locale].patterns, label: siteNavigation[locale].browse };
    if (link.href === '/patterns/easy') return { ...link, href: `/${locale}/patterns/easy`, label: specialLabels[link.href][index] };
    if (link.href === '/patterns/hama') {
        return { ...link, href: localeRoutes[locale].hamaPatterns, label: specialLabels[link.href][index] };
    }
    if (link.href.startsWith('/patterns/')) {
        const pattern = getPatternBySlug(link.href.slice('/patterns/'.length));
        if (pattern) return { ...link, href: `/${locale}${link.href}`, label: getLocalizedPatternName(pattern, locale) };
    }
    const label = sourceLabels[link.href]?.[index] ?? specialLabels[link.href]?.[index] ?? photoAssetLabels[link.href]?.[index];
    if (!label) throw new Error(`Missing guide link translation: ${locale} ${link.href}`);
    if (link.href.startsWith('/printables/calibration/') && specialLabels[link.href]) {
        return { ...link, href: link.href.replace('/printables/calibration/', `/printables/calibration/${locale}/`), label };
    }
    if (link.href.startsWith('/guides/photo-to-pattern/') && link.href.endsWith('.pdf') && photoAssetLabels[link.href]) {
        return { ...link, href: link.href.replace('/guides/photo-to-pattern/', `/guides/photo-to-pattern/${locale}/`), label };
    }
    return { ...link, label: link.href.startsWith('/printables/') || link.href.endsWith('.pdf') ? english(label) : label };
}

export function getLocalizedGuide(slug: string, locale: GuideLocale): GuidePage | undefined {
    if (!isTranslatedGuideSlug(slug)) return undefined;
    const original = getGuideBySlug(slug)!;
    const copy = guideTranslations[locale][slug];
    if (copy.sections.length !== original.sections.length) throw new Error(`Incomplete ${locale} guide: ${slug}`);
    return {
        ...original, ...copy,
        sections: original.sections.map((section, index) => {
            const translated = copy.sections[index];
            if (section.comparison && section.comparison.length !== translated.comparison?.length) throw new Error(`Incomplete image captions: ${locale} ${slug}`);
            return {
                ...section, ...translated,
                comparison: section.comparison?.map((image, imageIndex) => ({ ...image, ...translated.comparison![imageIndex] })),
                figure: section.figure && translated.figure ? { ...section.figure, ...translated.figure } : undefined,
                links: section.links?.map(link => localizeGuideLink(link, locale)),
            };
        }),
        relatedLinks: original.relatedLinks.map(link => localizeGuideLink(link, locale)),
    };
}
