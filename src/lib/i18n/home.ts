import type { SiteLocale } from './locales';

export type TranslatedLocale = Exclude<SiteLocale, 'en'>;

export const localizedHomeCopy = {
    de: {
        title: 'Bügelperlen-Vorlagen selbst erstellen | Fuse Bead Patterns',
        description: 'Erstelle kostenlos Bügelperlen-Vorlagen aus Fotos und Bildern. Wähle Marke und Steckplatte, bearbeite einzelne Perlen und lade dein Muster als PDF oder PNG herunter.',
        eyebrow: 'Aus deinem Bild wird dein Muster.',
        heading: 'Bügelperlen-Vorlagen selbst erstellen',
        intro: 'Lade ein Foto oder Pixelbild hoch, wähle deine Perlenmarke und passe die Größe an. Bearbeite das Muster im Editor und speichere es zum Ausdrucken. Dein Bild wird direkt im Browser verarbeitet.',
        start: 'Vorlage erstellen', browse: 'Kostenlose Vorlagen ansehen',
        free: 'Kostenlos · Ohne Anmeldung', workspace: 'Dein Arbeitsbereich', flow: 'Bild laden → Anpassen → Gestalten',
        preview: 'Geist als Bügelperlen-Muster', previewNote: 'Digitale Vorschau einer unserer Vorlagen',
        previewLink: 'Hama-Vorlagen ansehen', previewHref: '/de/hama-perlen-vorlagen',
        patternsHeading: 'Mit einer fertigen Vorlage beginnen',
        patternsText: 'Lade eine fertige Vorlage herunter oder öffne sie zum Bearbeiten. Die Download-Seite nennt die verwendete Perlenmarke und die Sprache der Druckdatei.',
        patternsHref: '/de/patterns',
        stepsHeading: 'Vom Bild zur Bügelperlen-Vorlage',
        steps: [
            ['Bild auswählen', 'Verwende ein eigenes Foto, eine Zeichnung oder ein Bild, das du verwenden darfst. Klare Umrisse und wenige Details funktionieren auf kleinen Steckplatten besonders gut.'],
            ['Marke und Größe wählen', 'Wähle deine Farbpalette und Steckplatte. Vergleiche die Vorschau und reduziere bei Bedarf die Farben. Beim Markenwechsel werden die Farben des Musters neu zugeordnet.'],
            ['Bearbeiten und speichern', 'Korrigiere einzelne Perlen im Editor. Speichere die Projektdatei zum Weiterarbeiten und exportiere eine PDF oder ein Bild für dein Bastelprojekt.'],
        ],
        helpHeading: 'Vor dem Drucken',
        help: 'Bildschirmfarben können von echten Perlen abweichen. Beachte die Farbcodes und die Druckhinweise in der PDF. Nicht jede Exportdatei ist eine Vorlage in Originalgröße; prüfe den Maßstab vor dem Auflegen auf eine Steckplatte.',
        editor: 'Editor öffnen',
        learn: 'Anleitungen zum Drucken und Gestalten',
        learnHref: '/de/guides',
    },
    fr: {
        title: 'Générateur de modèles de perles à repasser | Fuse Bead Patterns',
        description: 'Créez gratuitement un modèle de perles à repasser à partir d’une photo. Choisissez la marque et la plaque, retouchez les perles et exportez en PDF ou PNG.',
        eyebrow: 'Une image, des couleurs, votre création.',
        heading: 'Créez vos modèles de perles à repasser',
        intro: 'Importez une photo ou un dessin, choisissez votre marque de perles et ajustez les dimensions. Retouchez votre modèle dans l’éditeur, puis enregistrez-le pour l’imprimer. Votre image reste dans votre navigateur.',
        start: 'Créer un modèle', browse: 'Voir les modèles gratuits',
        free: 'Gratuit · Sans inscription', workspace: 'Votre espace de création', flow: 'Importer → Ajuster → Créer',
        preview: 'Modèle de fantôme en perles à repasser', previewNote: 'Aperçu numérique d’un de nos modèles',
        previewLink: 'Voir les modèles à télécharger', previewHref: '/fr/modeles-perles-a-repasser',
        patternsHeading: 'Commencer avec un modèle prêt à utiliser',
        patternsText: 'Téléchargez un modèle ou ouvrez-le dans l’éditeur pour le personnaliser. La page de téléchargement indique la marque de perles et la langue du fichier à imprimer.',
        patternsHref: '/fr/patterns',
        stepsHeading: 'De l’image au modèle de perles',
        steps: [
            ['Choisir une image', 'Utilisez une photo, un dessin personnel ou une image que vous avez le droit d’utiliser. Les contours nets et les formes simples restent plus lisibles sur une petite plaque.'],
            ['Régler les couleurs et la taille', 'Choisissez la palette et la plaque. Comparez l’aperçu et réduisez les couleurs si nécessaire. Changer de marque adapte les couleurs du modèle à la nouvelle palette.'],
            ['Retoucher et enregistrer', 'Corrigez les perles une à une dans l’éditeur. Enregistrez le projet pour continuer plus tard, puis exportez un PDF ou une image pour votre création.'],
        ],
        helpHeading: 'Avant d’imprimer',
        help: 'Les couleurs à l’écran peuvent différer des perles réelles. Consultez les références et les consignes d’impression du PDF. Tous les exports ne sont pas à taille réelle : vérifiez l’échelle avant de les utiliser sous une plaque.',
        editor: 'Ouvrir l’éditeur',
        learn: 'Guides d’impression et de création',
        learnHref: '/fr/guides',
    },
    ja: {
        title: 'アイロンビーズ図案作成ツール｜写真から無料で作成',
        description: '写真やイラストからアイロンビーズ図案を無料で作成。日本語でサイズと配色を選び、マスを修正してPDF・PNGを保存できます。Perler・Hama・Artkalのミディ用、登録不要。',
        eyebrow: '好きな画像から、自分だけの図案へ。',
        heading: 'アイロンビーズの図案を作る',
        intro: '写真やイラストを読み込み、ビーズのブランドとプレートを選びます。編集画面で気になるマスを直したら、印刷用のPDFや画像を保存できます。画像の処理はブラウザー内で行います。',
        start: '図案を作る', browse: '無料の図案を見る',
        free: '無料・登録不要', workspace: '図案作成ツール', flow: '画像を選ぶ → 色と大きさを調整 → 作る',
        preview: '白いゴーストのアイロンビーズ図案', previewNote: '図案のデジタルプレビュー',
        previewLink: '無料の図案を見る', previewHref: '/ja/patterns',
        patternsHeading: '完成済みの図案から始める',
        patternsText: '図案をダウンロードするか、編集画面で配色を変えてみましょう。ダウンロードページで、使用するビーズのブランドと印刷用ファイルの言語を確認できます。',
        patternsHref: '/ja/patterns',
        stepsHeading: '画像から図案を作る手順',
        steps: [
            ['画像を選ぶ', '自分で撮影・制作した画像など、利用できる画像を選んでください。輪郭がはっきりした絵やシンプルな形は、小さなプレートでも表現しやすくなります。'],
            ['色と大きさを決める', 'ビーズの配色とプレートを選び、プレビューを確認します。必要に応じて色数を減らしましょう。ブランドを変えると、新しいブランドの色に置き換わります。'],
            ['修正して保存する', '編集画面でマスごとに色を直せます。続きを作るためのプロジェクトを保存し、印刷や作業用にPDFや画像を書き出しましょう。'],
        ],
        helpHeading: '印刷前に確認すること',
        help: '画面や印刷の色は実物のビーズと異なる場合があります。色番号とPDFの印刷説明を確認してください。すべての出力が原寸図案ではありません。プレートに重ねる前に、定規で倍率と間隔を確かめましょう。',
        editor: '編集画面を開く',
        learn: '画像から図案を作るガイド',
        learnHref: '/ja/guides/photo-to-perler-bead-pattern',
    },
} satisfies Record<TranslatedLocale, {
    title: string; description: string; eyebrow: string; heading: string; intro: string;
    start: string; browse: string; free: string; workspace: string; flow: string;
    preview: string; previewNote: string; previewLink: string; previewHref: string;
    patternsHeading: string; patternsText: string; patternsHref: string;
    stepsHeading: string; steps: string[][]; helpHeading: string; help: string;
    editor: string; learn: string; learnHref: string;
}>;
