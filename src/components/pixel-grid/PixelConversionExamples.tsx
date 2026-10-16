import Image from 'next/image';
import { PIXEL_GRID_MESSAGES, type PixelGridLocale } from '@/lib/pixel-grid/messages';
import { PixelPracticeButton } from './PixelPracticeProvider';
import styles from './PixelConversionExamples.module.css';

const copy = {
    en: {
        heading: 'Compare image-to-pixel examples',
        intro: 'Compare an illustration and a photo at two grid sizes, then try fewer colors. Look at the outlines, small details and shades.',
        rocketTitle: 'A rocket illustration',
        rocketDescription: 'Compare the round window, curved outline and smooth color transitions.',
        rocketCredit: 'Original AI-generated tutorial illustration with a transparent background.',
        rocketAlt: 'Red-and-white rocket illustration with a round teal window.',
        rocketPixelAlt: 'Pixel art of a red-and-white rocket with a teal window.',
        catTitle: 'A cat photo',
        catDescription: 'Compare the eyes, whiskers and dark fur with the white chest.',
        catCredit: 'Photo: Anjeagotilla0920, Wikimedia Commons.',
        catAlt: 'Black-and-white cat with yellow-green eyes in front of a chair.',
        catPixelAlt: 'Pixel art of a black-and-white cat with a white chest.',
        source: 'Source image',
        sourceLink: 'Photo source',
        downloadSource: 'Download source image',
        downloadPng: 'Download PNG',
        downloadProject: 'Download project',
        stepsHeading: 'Try the same settings',
        firstStep: 'Choose “Try this example” under a preview to open its image with those settings. Save your current full workspace first: starting an example replaces its image, edits, history and settings. You can also download a source image and import it yourself.',
        secondStep: 'Use the 32 × 32 and 64 × 64 buttons to compare detail. At 64 × 64, choose “Up to 16 colors” and click “Reconvert original image” to compare a smaller palette.',
        thirdStep: 'Select a subject from the source image, reconvert it, then edit individual pixels. Use “Save full workspace” to keep the source image, your edits, settings and history. The separate example projects below each preview can also be downloaded and opened above.',
        previewNote: 'Previews are enlarged for comparison. Each PNG download is 32 × 32 or 64 × 64 pixels, without grid lines.',
        transparencyNote: 'The checkerboard shows transparency. “Keep proportions” can add transparent margins; it does not remove the background inside a photo. Reducing colors keeps each pixel’s opacity.',
        projectNote: 'These example projects save the current pixels, dimensions and transparency, without the source image, settings or history. After importing a source image, use Save full workspace to keep it with your edits, settings and history.',
    },
    de: {
        heading: 'Beispiele: Bilder in Pixel-Art umwandeln',
        intro: 'Vergleiche eine Illustration und ein Foto in zwei Rastergrößen und mit weniger Farben. Achte auf Konturen, kleine Details und Farbabstufungen.',
        rocketTitle: 'Eine Raketenillustration',
        rocketDescription: 'Vergleiche das runde Fenster, die geschwungene Kontur und die weichen Farbübergänge.',
        rocketCredit: 'Originale, KI-generierte Illustration für diese Anleitung mit transparentem Hintergrund.',
        rocketAlt: 'Rot-weiße Raketenillustration mit einem runden türkisfarbenen Fenster.',
        rocketPixelAlt: 'Pixel-Art einer rot-weißen Rakete mit türkisfarbenem Fenster.',
        catTitle: 'Ein Katzenfoto',
        catDescription: 'Vergleiche Augen, Schnurrhaare und dunkles Fell mit der weißen Brust.',
        catCredit: 'Foto: Anjeagotilla0920, Wikimedia Commons.',
        catAlt: 'Schwarz-weiße Katze mit gelbgrünen Augen vor einem Stuhl.',
        catPixelAlt: 'Pixel-Art einer schwarz-weißen Katze mit weißer Brust.',
        source: 'Originalbild',
        sourceLink: 'Fotoquelle',
        downloadSource: 'Originalbild herunterladen',
        downloadPng: 'PNG herunterladen',
        downloadProject: 'Projekt herunterladen',
        stepsHeading: 'Dieselben Einstellungen ausprobieren',
        firstStep: 'Wähle unter einer Vorschau „Dieses Beispiel ausprobieren“, um das Bild mit diesen Einstellungen zu öffnen. Speichere vorher deinen vollständigen Arbeitsstand: Das Beispiel ersetzt Bild, Änderungen, Verlauf und Einstellungen. Du kannst ein Originalbild auch herunterladen und selbst importieren.',
        secondStep: 'Vergleiche die Details mit den Schaltflächen 32 × 32 und 64 × 64. Wähle bei 64 × 64 „Bis zu 16 Farben“ und klicke auf „Originalbild neu umwandeln“, um eine kleinere Palette zu vergleichen.',
        thirdStep: 'Wähle ein Motiv im Originalbild aus, wandle es neu um und bearbeite einzelne Pixel. Mit „Vollständigen Arbeitsstand speichern“ behältst du Bild, Änderungen, Einstellungen und Verlauf. Die separaten Beispielprojekte unter den Vorschauen lassen sich weiterhin herunterladen und oben öffnen.',
        previewNote: 'Die Vorschauen sind zum Vergleich vergrößert. Die heruntergeladenen PNGs haben 32 × 32 oder 64 × 64 Pixel und keine Rasterlinien.',
        transparencyNote: 'Das Schachbrett zeigt Transparenz. „Seitenverhältnis erhalten“ kann transparente Ränder hinzufügen; der Hintergrund im Foto bleibt erhalten. Die Farbreduktion erhält die Deckkraft jedes Pixels.',
        projectNote: 'Diese Beispielprojekte speichern Pixel, Maße und Transparenz, ohne Originalbild, Einstellungen oder Verlauf. Importiere ein Originalbild und nutze Vollständigen Arbeitsstand speichern, um es mit deinen Änderungen, Einstellungen und dem Verlauf zu behalten.',
    },
    fr: {
        heading: 'Exemples de conversion en pixel art',
        intro: 'Comparez une illustration et une photo avec deux tailles de grille, puis avec moins de couleurs. Observez les contours, les petits détails et les nuances.',
        rocketTitle: 'Une illustration de fusée',
        rocketDescription: 'Comparez le hublot rond, le contour courbe et les dégradés de couleurs.',
        rocketCredit: 'Illustration originale créée par IA pour ce tutoriel, avec un fond transparent.',
        rocketAlt: 'Illustration d’une fusée rouge et blanche avec un hublot rond turquoise.',
        rocketPixelAlt: 'Fusée rouge et blanche avec un hublot turquoise, en pixel art.',
        catTitle: 'Une photo de chat',
        catDescription: 'Comparez les yeux, les moustaches et le pelage sombre avec le poitrail blanc.',
        catCredit: 'Photo : Anjeagotilla0920, Wikimedia Commons.',
        catAlt: 'Chat noir et blanc aux yeux jaune-vert devant une chaise.',
        catPixelAlt: 'Chat noir et blanc avec un poitrail blanc, en pixel art.',
        source: 'Image d’origine',
        sourceLink: 'Source de la photo',
        downloadSource: 'Télécharger l’image d’origine',
        downloadPng: 'Télécharger le PNG',
        downloadProject: 'Télécharger le projet',
        stepsHeading: 'Essayer les mêmes réglages',
        firstStep: 'Choisissez « Essayer cet exemple » sous un aperçu pour ouvrir l’image avec ces réglages. Enregistrez d’abord tout votre espace de travail : l’exemple remplace l’image, les retouches, l’historique et les réglages. Vous pouvez aussi télécharger une image d’origine et l’importer vous-même.',
        secondStep: 'Comparez les détails avec les boutons 32 × 32 et 64 × 64. À 64 × 64, choisissez « Jusqu’à 16 couleurs », puis cliquez sur « Reconvertir l’image d’origine » pour comparer une palette réduite.',
        thirdStep: 'Sélectionnez un sujet dans l’image d’origine, reconvertissez-la, puis retouchez les pixels. Utilisez « Enregistrer tout l’espace de travail » pour conserver l’image, les retouches, les réglages et l’historique. Les projets séparés sous les aperçus restent disponibles au téléchargement et peuvent être ouverts ci-dessus.',
        previewNote: 'Les aperçus sont agrandis pour faciliter la comparaison. Les PNG téléchargés font 32 × 32 ou 64 × 64 pixels, sans quadrillage.',
        transparencyNote: 'Le damier indique la transparence. « Conserver les proportions » peut ajouter des marges transparentes ; le fond de la photo reste présent. La réduction des couleurs conserve l’opacité de chaque pixel.',
        projectNote: 'Ces projets d’exemple conservent les pixels, les dimensions et la transparence, sans l’image d’origine, les réglages ni l’historique. Après avoir importé une image source, utilisez Enregistrer tout l’espace de travail pour la garder avec vos retouches, réglages et historique.',
    },
    ja: {
        heading: '写真とイラストのドット絵変換例',
        intro: '同じ画像を2つのサイズで比べ、減色した結果も見てみましょう。輪郭や細部、色の変化を比較できます。',
        rocketTitle: 'ロケットのイラスト',
        rocketDescription: '丸い窓、曲線の輪郭、なめらかな色の変化を比べてください。',
        rocketCredit: 'このガイド用にAIで作成したオリジナルイラストです。元画像の背景は透明です。',
        rocketAlt: '丸い青緑色の窓がある、赤と白のロケットのイラスト。',
        rocketPixelAlt: '青緑色の窓がある、赤と白のロケットのドット絵。',
        catTitle: '猫の写真',
        catDescription: '目やひげ、暗い毛並みと白い胸元の違いを比べてください。',
        catCredit: '写真：Anjeagotilla0920、Wikimedia Commons。',
        catAlt: '椅子の前にいる、黄緑色の目をした白黒の猫。',
        catPixelAlt: '胸元が白い、白黒の猫のドット絵。',
        source: '元画像',
        sourceLink: '写真の出典',
        downloadSource: '元画像をダウンロード',
        downloadPng: 'PNGをダウンロード',
        downloadProject: 'プロジェクトをダウンロード',
        stepsHeading: '同じ設定で試す',
        firstStep: 'プレビューの下にある「この作例で試す」を押すと、その画像と設定で始められます。現在の画像、編集内容、履歴、設定は置き換わるので、先に「作業全体を保存」を使ってください。元画像をダウンロードして自分で読み込むこともできます。',
        secondStep: '32 × 32と64 × 64のボタンで細かさを比べます。64 × 64で「最大16色」を選び、「元画像から再変換」を押すと、減色した結果を比較できます。',
        thirdStep: '元画像の使う範囲を選び、再変換やピクセルの修正を試してください。「作業全体を保存」で元画像、編集内容、設定、履歴を残せます。各プレビューの図案ファイルも、ダウンロードして上のツールで開けます。',
        previewNote: '比較しやすいようにプレビューを拡大しています。ダウンロードするPNGは32 × 32または64 × 64ピクセルで、グリッド線は入りません。',
        transparencyNote: '市松模様は透明部分です。「縦横比を保つ」では透明な余白ができることがありますが、写真の中の背景は残ります。減色しても各ピクセルの不透明度は保たれます。',
        projectNote: 'この作例のファイルはピクセル、サイズ、透明度を保存し、元画像、設定、履歴は含みません。元画像を読み込んでから「作業全体を保存」を使うと、その画像と編集内容、設定、履歴を残せます。',
    },
} satisfies Record<PixelGridLocale, Record<string, string>>;

const variants = [
    { suffix: '32-original', side: 32, colorLimit: 'original' },
    { suffix: '64-original', side: 64, colorLimit: 'original' },
    { suffix: '64-16-colors', side: 64, colorLimit: 16 },
] as const;

const sources = [
    { id: 'rocket', image: '/guides/photo-to-pattern/rocket-source.png', width: 1254, height: 1254 },
    { id: 'cat', image: '/guides/photo-to-pattern/cat-source.jpg', width: 792, height: 960 },
] as const;

export default function PixelConversionExamples({ locale = 'en' }: { locale?: PixelGridLocale }) {
    const text = copy[locale];
    const workspace = PIXEL_GRID_MESSAGES[locale];

    return <section aria-labelledby="pixel-conversion-examples" className={styles.examples} lang={locale}>
        <h2 id="pixel-conversion-examples" className="section-heading">{text.heading}</h2>
        <p className={styles.intro}>{text.intro}</p>
        {sources.map(source => {
            const title = source.id === 'rocket' ? text.rocketTitle : text.catTitle;
            const description = source.id === 'rocket' ? text.rocketDescription : text.catDescription;
            const sourceAlt = source.id === 'rocket' ? text.rocketAlt : text.catAlt;
            const pixelAlt = source.id === 'rocket' ? text.rocketPixelAlt : text.catPixelAlt;

            return <section key={source.id} className={styles.example} aria-labelledby={`pixel-example-${source.id}`}>
                <h3 id={`pixel-example-${source.id}`}>{title}</h3>
                <p>{description}</p>
                <p className={styles.credit}>
                    {source.id === 'rocket' ? text.rocketCredit : <>
                        {text.catCredit}{' '}
                        <a href="https://commons.wikimedia.org/wiki/File:TUXEDO_CAT.jpg">{text.sourceLink}</a>{' · '}
                        <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0 1.0</a>
                    </>}
                </p>
                <div className={styles.comparison}>
                    <figure className={styles.card}>
                        <div className={`${styles.imageFrame}${source.id === 'cat' ? ` ${styles.photoFrame}` : ''}`}>
                            <Image src={source.image} alt={sourceAlt} width={source.width} height={source.height} unoptimized loading="lazy" className={styles.sourceImage} />
                        </div>
                        <figcaption>
                            <strong>{text.source}</strong>
                            <span>{workspace.number(source.width)} × {workspace.number(source.height)}</span>
                            <a href={source.image} download aria-label={`${text.downloadSource}: ${title}`}>{text.downloadSource}</a>
                        </figcaption>
                    </figure>
                    {variants.map(variant => {
                        const asset = `/guides/pixel-art-examples/${source.id}-${variant.suffix}`;
                        const palette = variant.colorLimit === 'original' ? workspace.originalColors : workspace.colors(variant.colorLimit);
                        const caption = `${variant.side} × ${variant.side} · ${palette}`;

                        return <figure key={variant.suffix} className={styles.card}>
                            <div className={styles.imageFrame}>
                                <Image src={`${asset}.png`} alt={pixelAlt} width={variant.side} height={variant.side} unoptimized loading="lazy" className={styles.pixelImage} />
                            </div>
                            <figcaption>
                                <strong>{variant.side} × {variant.side}</strong>
                                <span>{palette}</span>
                                <PixelPracticeButton id={`${source.id}-${variant.suffix}`} locale={locale} label={`${title}, ${caption}`} />
                                <div className={styles.downloads}>
                                    <a href={`${asset}.png`} download aria-label={`${text.downloadPng}: ${title}, ${caption}`}>{text.downloadPng}</a>
                                    <a href={`${asset}.pixel-grid.json`} download aria-label={`${text.downloadProject}: ${title}, ${caption}`}>{text.downloadProject}</a>
                                </div>
                            </figcaption>
                        </figure>;
                    })}
                </div>
            </section>;
        })}
        <p className={styles.note}>{text.previewNote}</p>
        <p className={styles.note}>{text.transparencyNote}</p>
        <div className={styles.steps}>
            <h3>{text.stepsHeading}</h3>
            <ol>
                <li>{text.firstStep}</li>
                <li>{text.secondStep}</li>
                <li>{text.thirdStep}</li>
            </ol>
            <p className={styles.note}>{text.projectNote}</p>
        </div>
    </section>;
}
