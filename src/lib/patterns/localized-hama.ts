import { getPatternById } from './catalog';
import { hamaPatterns } from './hama';
import { getLocalizedPatternName } from './localized-content';
import { guideHref } from '../guides/routes';

export type HamaDownloadLocale = 'fr' | 'ja';
export const localizedHamaCopy = {
    fr: {
        path: '/fr/patterns/hama', title: 'Modèles Hama gratuits : 6 grilles Midi à imprimer | Fuse Bead Patterns',
        description: 'Six modèles Hama Midi gratuits : ballon, fantôme, chauve-souris et motifs de Noël. PDFs A4 en français, références Hama, PNG et projets modifiables.',
        heading: 'Modèles Hama gratuits', breadcrumb: 'Fil d’Ariane', home: 'Accueil', library: 'Modèles', category: 'Modèles Hama',
        intro: 'Choisissez l’un de ces six motifs originaux pour Hama Midi : ballon de football, fantôme, chauve-souris, sapin, bonhomme de neige et bonhomme en pain d’épices. Téléchargez le PDF en français au format A4 ou US Letter, avec grille à symboles et références Hama. Aucun compte nécessaire.',
        sizeHelp: 'Chaque motif tient sur une grille de 29 × 29 cases pour des perles Midi de 5 mm. Imprimez à 100 % / taille réelle, puis vérifiez les deux repères de 50 mm et votre plaque. Ces gabarits ne sont pas dimensionnés pour les perles Mini ou Maxi.',
        cardsHeading: 'Six motifs pour Hama Midi', pdf: 'PDF A4 (français)', letterPdf: 'PDF US Letter (français)', pixels: 'PNG de pixels', project: 'Enregistrer le projet', edit: 'Modifier', perler: 'Version Perler',
        pdfLabel: (name: string) => `${name} : télécharger le PDF Hama Midi A4 en français`,
        letterLabel: (name: string) => `${name} : télécharger le PDF Hama Midi US Letter en français`,
        pixelsLabel: (name: string) => `${name} : télécharger le PNG Hama de 29 × 29 pixels`,
        projectLabel: (name: string) => `${name} : enregistrer le projet Hama modifiable`,
        editLabel: (name: string) => `${name} : modifier le motif Hama dans l’éditeur en français`,
        previewAlt: (name: string) => `${name}, modèle Hama Midi`,
        fileHelp: 'Les PDFs A4 et US Letter sont en français. Utilisez le format qui correspond à votre papier pour imprimer. Le PNG contient 29 × 29 pixels, sans grille ni liste de couleurs : ce n’est pas un gabarit à taille réelle. Le projet conserve le motif modifiable et sa palette Hama.',
        coloursHeading: 'Références Hama et projets modifiables',
        colours: 'Les PDFs contiennent une grille à symboles et le nombre de perles de chaque couleur. Les motifs utilisent une sélection de couleurs unies Hama Midi, dont 01 Blanc et 18 Noir. Dans l’éditeur, H01 correspond à Hama 01 et H18 à Hama 18 : le préfixe H désigne notre palette logicielle, le nombre désigne la couleur Hama.',
        editing: 'Les aperçus, PDFs, PNG et projets utilisent les mêmes couleurs Hama et positions de perles. « Modifier » ouvre le motif dans l’éditeur en français. « Enregistrer le projet » télécharge un fichier à rouvrir avec « Ouvrir un projet ». Changer de marque peut regrouper des couleurs proches ; exportez une nouvelle grille après toute modification.',
        limitations: 'Les couleurs à l’écran et sur papier sont approximatives. Ces motifs originaux ont été vérifiés numériquement, mais n’ont pas été assemblés ni testés au fer avec de vraies perles. Suivez la notice de vos perles et vérifiez la solidité de la pièce finie avant utilisation. Fuse Bead Patterns est indépendant de Hama.',
        references: 'Vérifiez les numéros sur la', colourChart: 'carte officielle des couleurs Hama (anglais)', referenceJoin: 'et les dimensions Midi, Mini et Maxi dans le', sizeGuide: 'guide Hama (danois)',
        printingHeading: 'Imprimer le modèle à la bonne taille',
        printingSteps: [
            'Téléchargez le PDF français correspondant à votre papier : A4 ou US Letter. Sélectionnez le même format dans les réglages d’impression, choisissez 100 % / taille réelle et désactivez l’ajustement à la page.',
            'Mesurez les deux repères de 50 mm sur la page imprimée : horizontal et vertical. Comparez aussi l’espacement de 5 mm à votre plaque avant d’utiliser la feuille comme guide de placement.',
            'Suivez les symboles et références Hama. Laissez les cases vides sans perles ; une case blanche portant un symbole demande une perle blanche. Les quantités indiquées n’incluent pas de réserve.',
        ],
        guides: ['Plaques et calibrage d’impression', 'Changer de marque de perles', 'Comparer Perler, Hama et Artkal'],
    },
    ja: {
        path: '/ja/patterns/hama', title: 'Hamaビーズの無料図案6点：日本語PDFと配色 | Fuse Bead Patterns',
        description: 'Hama Midi用のサッカーボール、ゴースト、コウモリとクリスマスの図案6点。Hama色番号付き日本語A4 PDF、PNG、編集用プロジェクトを無料で保存。',
        heading: 'Hamaビーズの無料図案', breadcrumb: 'パンくずリスト', home: 'ホーム', library: '図案', category: 'Hamaの図案',
        intro: 'Hama Midi用のオリジナル図案6点から選べます。サッカーボール、ゴースト、コウモリ、クリスマスツリー、雪だるま、ジンジャーブレッドマンの日本語PDFに、文字付き図案とHamaの色番号をまとめました。用紙に合わせてA4またはUS Letterを選べます。登録は不要です。',
        sizeHelp: '各図案は29 × 29マスのプレート1枚用で、5 mmのMidiビーズを使います。100％・実際のサイズで印刷してください。A4は横方向、US Letterは縦と横の50 mm目盛りを測り、マス目もお使いのプレートに合わせて確認します。MiniやMaxiビーズ用の実寸図案ではありません。',
        cardsHeading: 'Hama Midi用の図案6点', pdf: 'A4 PDF（日本語）', letterPdf: 'US Letter PDF（日本語）', pixels: 'ピクセルPNG', project: 'プロジェクトを保存', edit: '編集する', perler: 'Perlerの図案',
        pdfLabel: (name: string) => `${name}：Hama Midi用の日本語A4 PDFをダウンロード`,
        letterLabel: (name: string) => `${name}：Hama Midi用の日本語US Letter PDFをダウンロード`,
        pixelsLabel: (name: string) => `${name}：29 × 29ピクセルのHama PNGをダウンロード`,
        projectLabel: (name: string) => `${name}：編集できるHamaプロジェクトを保存`,
        editLabel: (name: string) => `${name}：Hamaの図案を日本語エディターで編集`,
        previewAlt: (name: string) => `${name}のHama Midiビーズ図案`,
        fileHelp: 'A4とUS LetterのPDFはどちらも日本語です。印刷には用紙に合うPDFを使ってください。PNGは29 × 29ピクセルの画像で、マス目や色表はありません。実寸印刷用ではありません。プロジェクトには編集できる図案とHama配色を保存しています。',
        coloursHeading: 'Hamaの色番号と編集用プロジェクト',
        colours: 'PDFには文字付きのマス目と、色ごとの必要数が入ります。Hama Midiの単色から選んだ配色で、01の白や18の黒を使います。エディターのH01はHama 01、H18はHama 18です。HはこのソフトのHama配色を示し、数字はHamaの色番号を示します。',
        editing: 'プレビュー、PDF、PNG、プロジェクトは同じHama配色とビーズ配置を使います。「編集する」で日本語エディターを開き、「プロジェクトを保存」で編集用ファイルを保存できます。後から「プロジェクトを開く」で読み込んでください。ブランドを変えると近い色がまとまる場合があります。編集後は新しい図案を書き出してください。',
        limitations: '画面上と印刷時の色は目安です。オリジナル図案はデジタルで確認していますが、実物のビーズでの組み立てやアイロン仕上げは検証していません。使うビーズの説明に従い、完成品を使用する前に強度を確認してください。Fuse Bead PatternsはHamaとは独立したサイトです。',
        references: '色番号は', colourChart: 'Hama公式色表（英語）', referenceJoin: 'で、Midi・Mini・Maxiの寸法は', sizeGuide: 'Hamaのサイズ説明（デンマーク語）',
        printingHeading: '図案を正しいサイズで印刷する',
        printingSteps: [
            '用紙に合わせ、日本語のA4 PDFかUS Letter PDFを選んでください。印刷設定も同じ用紙サイズにし、100％・実際のサイズに設定して「ページに合わせる」はオフにします。',
            'A4は横方向の50 mm目盛り、US Letterは縦と横の50 mm目盛りを測ります。配置用の下敷きとして使う前に、5 mm間隔のマス目がお使いのプレートに合うか確認してください。',
            '文字とHama色番号に従って配置します。空白のマスにはビーズを置きません。文字がある白いマスには白いビーズが必要です。予備の個数は色表に含めていません。',
        ],
        guides: ['プレートと印刷サイズの調整', 'ビーズのブランドを変える', 'Perler・Hama・Artkalを比較'],
    },
};

export function localizedHamaPatterns(locale: HamaDownloadLocale) {
    return hamaPatterns.map(hama => {
        const original = getPatternById(hama.id);
        if (!original || original.source !== null) throw new Error(`Missing original Hama pattern: ${hama.id}`);
        return {
            ...hama, name: getLocalizedPatternName(original, locale),
            pdf: `/patterns-${locale}-hama/${hama.id}/pattern.pdf`,
            pdfLetter: `/patterns-${locale}-hama/${hama.id}/pattern-letter.pdf`,
            pixels: `/patterns-hama/${hama.id}/pixels.png`,
            editor: `/${locale}/editor?pattern=${encodeURIComponent(hama.projectId)}`,
            perler: `/${locale}/patterns/${original.slug}`,
        };
    });
}
export type LocalizedHamaPattern = ReturnType<typeof localizedHamaPatterns>[number];
export function localizedHamaGuideLinks(locale: HamaDownloadLocale) {
    return ['perler-bead-pegboards', 'perler-to-hama-artkal', 'perler-vs-hama-vs-artkal'].map((slug, index) => ({ href: guideHref(slug, locale), label: localizedHamaCopy[locale].guides[index] }));
}
