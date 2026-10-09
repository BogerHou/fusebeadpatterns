import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { hamaMakerLanguageAlternates, hamaMakerPaths } from './routes';

type HamaMakerContent = {
    title: string;
    description: string;
    heading: string;
    introduction: string;
    workspace: string;
    stepsHeading: string;
    steps: readonly string[];
    faqHeading: string;
    faqs: readonly { question: string; answer: string }[];
    linksHeading: string;
    downloads: string;
    photoGuide: string;
    brandGuide: string;
    boardGuide: string;
    sourceNote: string;
    colourChart: string;
    sizeGuide: string;
};

export const hamaMakerContent: Record<SiteLocale, HamaMakerContent> = {
    en: {
        title: 'Free Hama Bead Pattern Maker — Image to Pattern | Fuse Bead Patterns',
        description: 'Turn a photo or drawing into a Hama Midi bead pattern. Choose the colours you own, edit the grid and save a PDF, grid PNG or project in your browser.',
        heading: 'Hama Bead Pattern Maker',
        introduction: 'Upload a photo or drawing and turn it into a Hama Midi bead pattern. Adjust the grid, choose the colours you own and edit individual beads. Save a printable PDF, grid PNG or project file. Free to use, with image processing in your browser.',
        workspace: 'Hama Midi pattern generator',
        stepsHeading: 'From your image to a Hama pattern',
        steps: [
            'Upload your own photo or drawing. Simple shapes and clear outlines are easier to read on a small grid.',
            'Choose Hama Midi and the Midi pegboard. Set how many boards wide and tall you need, and apply any changes to the setup.',
            'Open Colors and disable colours you do not own. Check the updated preview, then use the editor to correct individual beads.',
            'Choose PDF or grid PNG to save the chart. Enable symbols for printable exports to make colours easier to identify. Save the project file if you want to continue editing later.',
        ],
        faqHeading: 'Before you make your pattern',
        faqs: [
            {
                question: 'Will the colours match my beads?',
                answer: 'Matching uses approximate digital RGB colours, not measurements of physical beads. Check the colour numbers and finishes, including transparent and glow colours, against the beads you own. Screen and printed colours can differ from the real beads.',
            },
            {
                question: 'Is this for Hama Mini, Midi or Maxi?',
                answer: 'This page starts new designs with Hama Midi. Midi beads are 5 mm in diameter and need a matching Midi pegboard. Mini and Maxi use different sizes and spacing; this Midi chart does not verify their fit.',
            },
            {
                question: 'Can I print a template to place under my pegboard?',
                answer: 'A page-fit PDF is a counting chart. For the supported 29 × 29 Midi grid and Hama Midi palette, you can choose the 5 mm actual-size PDF option. Print at 100% with page scaling off, measure the calibration mark and compare the grid with your pegboard. The tool does not verify physical assembly or ironing.',
            },
        ],
        linksHeading: 'Ready-made patterns and help',
        downloads: 'Download six ready-made Hama Midi patterns',
        photoGuide: 'Turn a photo into a bead pattern',
        brandGuide: 'Convert a Perler pattern to Hama or Artkal',
        boardGuide: 'Choose pegboards and check print size',
        sourceNote: 'Check the manufacturer’s colour chart and size instructions against the beads and board you use. Fuse Bead Patterns is an independent tool.',
        colourChart: 'Hama colour chart (English)',
        sizeGuide: 'Hama size guide (Danish)',
    },
    de: {
        title: 'Hama-Vorlagen aus Bildern erstellen | Fuse Bead Patterns',
        description: 'Verwandle ein Foto oder eine Zeichnung in eine Hama-Midi-Vorlage. Wähle deine Farben, bearbeite das Raster und speichere PDF, Raster-PNG oder Projekt.',
        heading: 'Hama-Vorlagen aus Bildern erstellen',
        introduction: 'Verwandle ein Foto oder eine Zeichnung in eine Hama-Midi-Vorlage. Passe das Raster an, wähle deine vorhandenen Farben und bearbeite einzelne Perlen. Speichere eine druckbare PDF, ein Raster-PNG oder die Projektdatei. Kostenlos; die Bildverarbeitung erfolgt in deinem Browser.',
        workspace: 'Hama-Midi-Vorlagengenerator',
        stepsHeading: 'Vom Bild zur Hama-Vorlage',
        steps: [
            'Lade dein eigenes Foto oder deine Zeichnung hoch. Einfache Formen und klare Umrisse bleiben auf einem kleinen Raster besser erkennbar.',
            'Wähle Hama Midi und die Midi-Steckplatte. Lege die Anzahl der Platten in Breite und Höhe fest und wende Änderungen an den Einstellungen an.',
            'Öffne „Farben“ und deaktiviere Farben, die du nicht besitzt. Prüfe die aktualisierte Vorschau und korrigiere einzelne Perlen im Editor.',
            'Speichere die Vorlage als PDF oder Raster-PNG. Aktiviere Symbole in Druckvorlagen, damit du Farben leichter unterscheiden kannst. Speichere die Projektdatei zum späteren Weiterarbeiten.',
        ],
        faqHeading: 'Vor dem Stecken',
        faqs: [
            {
                question: 'Passen die Farben zu meinen Perlen?',
                answer: 'Die Zuordnung verwendet angenäherte digitale RGB-Farben, keine Messwerte echter Perlen. Vergleiche Farbnummern und Ausführungen, etwa transparente oder nachleuchtende Farben, mit deinen Perlen. Bildschirm- und Druckfarben können vom Original abweichen.',
            },
            {
                question: 'Ist die Vorlage für Hama Mini, Midi oder Maxi?',
                answer: 'Neue Vorlagen beginnen auf dieser Seite mit Hama Midi. Midi-Perlen haben 5 mm Durchmesser und benötigen eine passende Midi-Steckplatte. Mini und Maxi haben andere Größen und Abstände; das Midi-Raster bestätigt nicht deren Passform.',
            },
            {
                question: 'Kann ich die PDF unter meine Steckplatte legen?',
                answer: 'Eine an die Seite angepasste PDF dient zum Abzählen. Beim unterstützten 29 × 29-Midi-Raster mit Hama-Midi-Palette kannst du die PDF in 5-mm-Originalgröße wählen. Drucke mit 100 % ohne Seitenanpassung, miss die Kontrollmarkierung und vergleiche das Raster mit deiner Steckplatte. Das Werkzeug prüft keinen Aufbau mit echten Perlen und kein Bügelergebnis.',
            },
        ],
        linksHeading: 'Fertige Vorlagen und Anleitungen',
        downloads: 'Sechs fertige Hama-Midi-Vorlagen herunterladen',
        photoGuide: 'Ein Foto in eine Perlenvorlage umwandeln',
        brandGuide: 'Eine Perler-Vorlage zu Hama oder Artkal umwandeln',
        boardGuide: 'Steckplatten wählen und Druckgröße prüfen',
        sourceNote: 'Vergleiche die Farbkarte und Größenangaben des Herstellers mit deinen Perlen und deiner Steckplatte. Fuse Bead Patterns ist ein unabhängiges Werkzeug.',
        colourChart: 'Hama-Farbkarte (Englisch)',
        sizeGuide: 'Hama-Größenangaben (Dänisch)',
    },
    fr: {
        title: 'Créer un modèle Hama à partir d’une image | Fuse Bead Patterns',
        description: 'Transformez une photo ou un dessin en modèle Hama Midi. Choisissez vos couleurs, retouchez la grille et enregistrez un PDF, une grille PNG ou le projet.',
        heading: 'Créer un modèle Hama à partir d’une image',
        introduction: 'Transformez une photo ou un dessin en modèle de perles Hama Midi. Ajustez la grille, choisissez les couleurs que vous possédez et retouchez les perles. Enregistrez un PDF imprimable, une grille PNG ou le projet. L’outil est gratuit et traite l’image dans votre navigateur.',
        workspace: 'Générateur de modèles Hama Midi',
        stepsHeading: 'De votre image au modèle Hama',
        steps: [
            'Importez votre photo ou votre dessin. Des formes simples et des contours nets restent plus lisibles sur une petite grille.',
            'Choisissez Hama Midi et la plaque Midi. Réglez le nombre de plaques en largeur et en hauteur, puis appliquez les changements.',
            'Ouvrez « Couleurs » et désactivez les couleurs que vous ne possédez pas. Vérifiez l’aperçu mis à jour, puis corrigez les perles dans l’éditeur.',
            'Enregistrez le modèle en PDF ou en grille PNG. Activez les symboles dans les exports imprimables pour distinguer les couleurs. Enregistrez aussi le projet pour continuer plus tard.',
        ],
        faqHeading: 'Avant de poser les perles',
        faqs: [
            {
                question: 'Les couleurs correspondent-elles à mes perles ?',
                answer: 'La conversion utilise des valeurs RGB numériques approximatives, sans mesurer les perles réelles. Vérifiez les références et les finitions, notamment les couleurs transparentes ou phosphorescentes, avec les perles que vous possédez. Les couleurs à l’écran et sur papier peuvent différer des perles.',
            },
            {
                question: 'Le modèle est-il prévu pour Hama Mini, Midi ou Maxi ?',
                answer: 'Cette page commence les nouveaux modèles avec Hama Midi. Les perles Midi ont un diamètre de 5 mm et nécessitent une plaque Midi adaptée. Mini et Maxi utilisent d’autres tailles et espacements ; la grille Midi ne vérifie pas leur compatibilité.',
            },
            {
                question: 'Puis-je placer le PDF sous ma plaque ?',
                answer: 'Un PDF ajusté à la page sert à compter les cases. Pour la grille Midi de 29 × 29 et la palette Hama Midi compatibles, vous pouvez choisir le PDF à taille réelle de 5 mm. Imprimez à 100 %, sans ajustement à la page, mesurez le repère de calibration et comparez la grille à votre plaque. L’outil ne vérifie ni l’assemblage avec des perles réelles ni le repassage.',
            },
        ],
        linksHeading: 'Modèles prêts à utiliser et guides',
        downloads: 'Télécharger six modèles Hama Midi prêts à utiliser',
        photoGuide: 'Transformer une photo en modèle de perles',
        brandGuide: 'Convertir un modèle Perler aux couleurs Hama ou Artkal',
        boardGuide: 'Choisir les plaques et vérifier la taille d’impression',
        sourceNote: 'Comparez le nuancier et les indications de taille du fabricant aux perles et à la plaque que vous utilisez. Fuse Bead Patterns est un outil indépendant.',
        colourChart: 'Nuancier Hama (anglais)',
        sizeGuide: 'Tailles des perles Hama (danois)',
    },
    ja: {
        title: '画像からHamaビーズの図案を作る | Fuse Bead Patterns',
        description: '写真やイラストからHama Midiの図案を無料作成。手持ちの色を選び、マスを修正して、PDF・マス目付きPNG・編集用プロジェクトを保存できます。',
        heading: '画像からHamaビーズの図案を作る',
        introduction: '写真やイラストからHama Midiの図案を作れます。マス数を調整し、手持ちの色を選んで、ビーズを一つずつ修正できます。印刷用PDF・マス目付きPNG・編集用プロジェクトを保存できます。無料で使え、画像の処理はブラウザー内で行います。',
        workspace: 'Hama Midiの図案作成ツール',
        stepsHeading: '画像からHamaの図案を作る手順',
        steps: [
            '自分の写真やイラストを読み込みます。輪郭がはっきりしたシンプルな絵は、小さなマス目でも表現しやすくなります。',
            'Hama Midiとミディ用プレートを選びます。横と縦に使うプレートの枚数を設定し、変更を適用します。',
            '「色」で、持っていない色を無効にします。更新されたプレビューを確認し、エディターで必要なマスを修正します。',
            'PDFまたはマス目付きPNGを保存します。印刷用の書き出しに記号を付けると、色を区別しやすくなります。続きを作る場合はプロジェクトも保存してください。',
        ],
        faqHeading: 'ビーズを並べる前に',
        faqs: [
            {
                question: '手持ちのビーズと同じ色になりますか？',
                answer: '実物の測定値ではなく、近似のデジタルRGB値で色を選びます。色番号と、透明色や蓄光色などの種類を手持ちのビーズと照合してください。画面や印刷の色は実物と異なる場合があります。',
            },
            {
                question: 'Hama Mini・Midi・Maxiのどれに対応していますか？',
                answer: 'このページでは新しい図案をHama Midiで作り始めます。Midiは直径5 mmのビーズで、対応するミディ用プレートが必要です。Mini・Maxiはサイズと間隔が異なるため、このミディ用図案で適合を確認することはできません。',
            },
            {
                question: 'PDFをプレートの下に敷けますか？',
                answer: 'ページに合わせたPDFは数えて作るための参考図です。対応する29 × 29マスのミディ用プレートとHama Midi配色では、5 mm原寸PDFを選べます。100％・拡大縮小なしで印刷し、確認目盛りを測って、お使いのプレートと照合してください。実物のビーズでの組み立てやアイロン仕上げは、このツールでは検証していません。',
            },
        ],
        linksHeading: '完成済みの図案と使い方ガイド',
        downloads: 'Hama Midi用の図案6点をダウンロード',
        photoGuide: '写真からビーズ図案を作る方法',
        brandGuide: 'Perler図案をHama・Artkalの配色に変える',
        boardGuide: 'プレートを選び、印刷サイズを確認する',
        sourceNote: 'メーカーの色見本とサイズ説明を、使うビーズとプレートに照合してください。Fuse Bead PatternsはHamaとは独立したツールです。',
        colourChart: 'Hama公式色表（英語）',
        sizeGuide: 'Hamaのサイズ説明（デンマーク語）',
    },
};

export function hamaMakerMetadata(locale: SiteLocale): Metadata {
    const copy = hamaMakerContent[locale];
    const url = `https://fusebeadpatterns.art${hamaMakerPaths[locale]}`;
    const image = {
        url: '/patterns-hama/original-friendly-ghost/preview.png',
        width: 580,
        height: 580,
        alt: copy.heading,
    };
    return {
        title: copy.title,
        description: copy.description,
        alternates: { canonical: url, languages: hamaMakerLanguageAlternates },
        robots: { index: true, follow: true },
        openGraph: {
            title: copy.title,
            description: copy.description,
            url,
            siteName: 'Fuse Bead Patterns',
            locale: { en: 'en_GB', de: 'de_DE', fr: 'fr_FR', ja: 'ja_JP' }[locale],
            type: 'website',
            images: [image],
        },
        twitter: {
            card: 'summary_large_image',
            title: copy.title,
            description: copy.description,
            images: [image.url],
        },
    };
}
