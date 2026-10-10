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
        previewLink: 'Hama Midi: 6 ausgewählte Vorlagen', previewHref: '/de/hama-perlen-vorlagen',
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
        library: 'Alle Vorlagen in der Bibliothek ansehen',
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
        previewLink: 'Sélection par marque : 6 modèles en Perler et Hama', previewHref: '/fr/modeles-perles-a-repasser',
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
        library: 'Voir toute la bibliothèque de modèles',
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
        library: '図案ライブラリをすべて見る',
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
    stepsHeading: string; steps: string[][]; helpHeading: string; library: string; help: string;
    editor: string; learn: string; learnHref: string;
}>;

export const localizedHomeSections = {
    de: {
        stepsEyebrow: 'Eine Perle nach der anderen', ideasEyebrow: 'Platz für deine Ideen', ideasHeading: 'Ideen für Bügelperlen-Projekte',
        ideas: [
            ['Sprites aus Spielen', 'Pixelbilder mit klaren Formen eignen sich gut für Bügelperlen. Probiere einfache Figuren, Gegenstände, Symbole oder eigene Pixelkunst mit deutlich getrennten Farben.'],
            ['Porträts und Figuren', 'Teste mit einem Haustierfoto, einer gezeichneten Figur oder einem eigenen Charakter, ob das Motiv auch im Perlenraster noch gut erkennbar ist.'],
            ['Vorlagen zum Ausdrucken', 'Ein gedrucktes Raster hilft dir beim Zählen der Perlen, beim Teilen einer Vorlage und beim Nachlegen ohne Bildschirm.'],
            ['Retro-Pixelkunst', '8-Bit- und 16-Bit-Motive lassen sich gut auf Steckplatten übertragen. Kleine Platten reichen für Symbole; ganze Szenen brauchen mehr Platz.'],
            ['Kleine Bastelprojekte', 'Verkleinere ein Motiv für Schlüsselanhänger, Ohrringe, Baumschmuck oder Magnete. Prüfe bei kleinen Projekten, ob wichtige Details erhalten bleiben.'],
            ['Von Hand nachbessern', 'Öffne den Editor, wenn die Vorschau schon fast passt, aber Gesicht, Kontur oder Hintergrund noch einzelne Korrekturen brauchen.'],
        ],
        guidesEyebrow: 'Vor dem ersten Motiv', guidesHeading: 'Anleitungen für dein nächstes Projekt',
        guidesIntro: 'Der Generator führt dich direkt zum Muster. Diese Anleitungen helfen bei Steckplatten, Mini-Perlen, Einsteiger-Sets und der Nachbearbeitung von Fotos.', guidesLink: 'Alle Anleitungen ansehen',
        featuresEyebrow: 'Vom ersten Pixel zur fertigen Vorlage', featuresHeading: 'Was du mit dem Generator machen kannst',
        features: [
            ['Perlenfarben auswählen', 'Wähle vor dem Umwandeln eine Farbpalette, damit das Muster Farben verwendet, die du nachlegen kannst. Der Generator enthält Paletten für Perler, Hama und Artkal.'],
            ['Passende Farben finden', 'Der Generator vergleicht die Bildfarben mit den verfügbaren Perlenfarben und ordnet ihnen ähnliche Farben zu. Prüfe anschließend, ob Konturen und Details erkennbar bleiben.'],
            ['Im passenden Format speichern', 'Exportiere dein Muster als PDF, Bild, SVG, Tabelle oder Rastervorschau, um es auszudrucken, nachzulegen oder zu teilen.'],
            ['Weichere Farbübergänge', 'Nutze die weiche Schattierung für Fotos mit Farbverläufen. Für klare Sprites, Symbole und einfache Motive kannst du sie ausschalten.'],
            ['Einzelne Perlen bearbeiten', 'Im Editor kannst du malen, Flächen füllen, löschen, Farben aufnehmen, zoomen und Änderungen rückgängig machen.'],
        ],
        faqEyebrow: 'Gut zu wissen', faqHeading: 'Häufige Fragen',
        faqs: [
            { question: 'Was sind Bügelperlen?', answer: 'Bügelperlen sind kleine Kunststoffperlen, die auf einer Steckplatte zu einem Motiv angeordnet werden. Lege anschließend Bügelpapier darüber und verbinde sie mit Wärme. Beachte dabei die Anleitung deiner Perlenmarke.' },
            { question: 'Ist der Bügelperlen-Generator kostenlos?', answer: 'Ja. Du kannst kostenlos ein Bild hochladen, die Vorlage ansehen, die Größe anpassen und das Ergebnis direkt im Browser exportieren. Ein Konto ist nicht nötig.' },
            { question: 'Was brauche ich für den Einstieg?', answer: 'Ein Einsteiger-Set enthält meist Perlen in verschiedenen Farben, eine quadratische Steckplatte, Bügelpapier und eine Pinzette. Sobald du mehr Farben sammelst, sind Sortierboxen hilfreich.' },
            { question: 'Kann ich damit auch Vorlagen für Mini-Perlen erstellen?', answer: 'Ja. Wähle eine Einstellung für Mini-Perlen, wenn das fertige Motiv kleiner werden soll. Das eignet sich etwa für Schlüsselanhänger, Ohrringe oder kleine Pixelbilder. Verwende eine dazu passende Mini-Steckplatte.' },
            { question: 'Kann ich das erzeugte Muster von Hand bearbeiten?', answer: 'Ja. Erstelle ein Muster auf der Startseite und öffne danach den Editor. Dort kannst du malen, füllen, löschen, Farben aufnehmen, Änderungen zurücknehmen, das Projekt speichern und die fertige Vorlage exportieren.' },
        ],
    },
    fr: {
        stepsEyebrow: 'Une perle à la fois', ideasEyebrow: 'Place à vos idées', ideasHeading: 'Idées de créations en perles à repasser',
        ideas: [
            ['Sprites de jeux vidéo', 'Les images en pixels aux formes nettes se prêtent bien aux perles à repasser. Essayez des personnages, objets, icônes simples ou vos propres dessins avec des couleurs bien distinctes.'],
            ['Portraits et personnages', 'Testez une photo d’animal, un portrait dessiné ou un personnage original pour vérifier si le sujet reste reconnaissable une fois converti en grille de perles.'],
            ['Modèles à imprimer', 'Une grille imprimée vous aide à compter les perles, à partager un modèle ou à suivre le motif loin de l’écran.'],
            ['Pixel art rétro', 'Les dessins de style 8 bits ou 16 bits se transposent naturellement sur une plaque. Utilisez de petites plaques pour les icônes et davantage de place pour les scènes.'],
            ['Petits objets', 'Réduisez un motif pour un porte-clés, des boucles d’oreilles, une décoration ou un aimant. Vérifiez que les détails importants restent lisibles à cette taille.'],
            ['Retouches à la main', 'Ouvrez l’éditeur quand l’aperçu est presque satisfaisant, mais qu’un visage, un contour ou un fond demande encore quelques corrections.'],
        ],
        guidesEyebrow: 'Quelques repères utiles', guidesHeading: 'Préparer votre prochaine création',
        guidesIntro: 'Le générateur vous mène directement au modèle. Ces guides vous aident à choisir les plaques, les perles Mini, le matériel de départ et les retouches nécessaires pour une photo.', guidesLink: 'Voir tous les guides',
        featuresEyebrow: 'Du premier pixel au modèle terminé', featuresHeading: 'Ce que vous pouvez faire',
        features: [
            ['Choisir les couleurs de perles', 'Sélectionnez une palette avant la conversion pour utiliser des couleurs que vous pouvez reproduire avec vos perles. Le générateur propose des palettes Perler, Hama et Artkal.'],
            ['Trouver les couleurs proches', 'Le générateur compare votre image aux couleurs de perles disponibles et choisit des teintes proches. Vérifiez ensuite que les contours et les détails restent lisibles.'],
            ['Exporter au bon format', 'Téléchargez un PDF, une image, un SVG, un tableau ou une grille pour imprimer, réaliser ou partager votre modèle.'],
            ['Adoucir les dégradés', 'Activez les nuances douces pour une photo qui demande des transitions de couleur. Désactivez-les pour des sprites, icônes et motifs aux contours plus nets.'],
            ['Retoucher les perles', 'Dans l’éditeur, vous pouvez peindre, remplir, effacer, prélever une couleur, zoomer et annuler les modifications.'],
        ],
        faqEyebrow: 'Bon à savoir', faqHeading: 'Questions fréquentes',
        faqs: [
            { question: 'Que sont les perles à repasser ?', answer: 'Ce sont de petites perles en plastique que l’on dispose sur une plaque pour former un motif. On les couvre ensuite de papier à repasser et on les assemble par la chaleur. Suivez les instructions de votre marque de perles.' },
            { question: 'Le générateur de modèles est-il gratuit ?', answer: 'Oui. Vous pouvez importer une image, consulter l’aperçu, ajuster les dimensions et exporter le résultat gratuitement dans votre navigateur. Aucun compte n’est nécessaire.' },
            { question: 'Quel matériel faut-il pour commencer ?', answer: 'Un kit de départ comprend généralement des perles de plusieurs couleurs, une plaque carrée, du papier à repasser et une pince. Des boîtes de rangement deviennent utiles quand vous avez davantage de couleurs.' },
            { question: 'Puis-je créer des modèles pour les perles Mini ?', answer: 'Oui. Choisissez un réglage pour les perles Mini pour obtenir une création plus petite, par exemple un porte-clés, des boucles d’oreilles ou un petit motif en pixels. Utilisez une plaque adaptée aux perles Mini.' },
            { question: 'Puis-je modifier le modèle à la main ?', answer: 'Oui. Créez un modèle sur la page d’accueil, puis ouvrez l’éditeur pour peindre, remplir, effacer, prélever des couleurs, annuler des changements, enregistrer le projet et exporter le modèle final.' },
        ],
    },
    ja: {
        stepsEyebrow: 'ひと粒ずつ形にする', ideasEyebrow: '作りたいものを見つける', ideasHeading: 'アイロンビーズで作れるもの',
        ideas: [
            ['ゲームのドット絵', '輪郭がはっきりしたドット絵は、ビーズの図案にしやすい題材です。シンプルなキャラクターやアイテム、アイコン、自分で描いたドット絵で試してみましょう。'],
            ['写真やキャラクター', 'ペットの写真、イラスト風の肖像、オリジナルキャラクターなどを読み込み、ビーズのマスに置き換えても形が伝わるか確認できます。'],
            ['印刷して使う図案', '図案を印刷すると、ビーズを数えたり、人に渡したり、画面を見ずに並べたりできます。'],
            ['レトロなピクセルアート', '8ビットや16ビット風の絵は、ビーズの配置に向いています。アイコンは小さなプレート、背景のある場面は大きな図案で試しましょう。'],
            ['小さな雑貨', '図案を小さくして、キーホルダー、イヤリング、飾り、マグネットなどに。縮小したときに大切な形が残っているか確認しましょう。'],
            ['マスごとの手直し', 'プレビューがほぼ完成していても、顔や輪郭、背景を調整したいときはエディターでビーズをひとつずつ修正できます。'],
        ],
        guidesEyebrow: '作る前に知っておきたいこと', guidesHeading: '次の作業に役立つガイド',
        guidesIntro: '作成ツールで図案を作りながら、必要に応じてガイドを確認できます。プレートの選び方、ミニビーズ、道具の準備、写真の修正方法をまとめています。', guidesLink: 'すべてのガイドを見る',
        featuresEyebrow: '最初のピクセルから完成した図案まで', featuresHeading: '作成ツールでできること',
        features: [
            ['ビーズの配色を選ぶ', '画像を変換する前に配色を選ぶと、実際に使えるビーズの色で図案を作れます。Perler・Hama・Artkalのパレットを用意しています。'],
            ['近いビーズの色に置き換える', '画像の色と選んだビーズの色を比較し、近い色に自動で置き換えます。プレビューで輪郭や細部が伝わるか確認しましょう。'],
            ['用途に合わせて保存する', 'PDF、画像、SVG、表計算ファイル、マス目付きの画像を書き出し、印刷や制作、共有に使えます。'],
            ['色の変化をなめらかにする', '写真の色の移り変わりを表したいときは、なめらかな陰影の設定を使えます。ドット絵やシンプルな図柄ではオフにすると輪郭がすっきりします。'],
            ['ビーズを手動で修正する', 'エディターで色を塗る、塗りつぶす、消す、色を拾う、拡大する、変更を取り消すといった操作ができます。'],
        ],
        faqEyebrow: 'よくある疑問', faqHeading: 'よくある質問',
        faqs: [
            { question: 'アイロンビーズとは何ですか？', answer: '小さなプラスチック製のビーズをプレートの突起に並べ、図柄を作る工作材料です。並べ終えたらアイロンペーパーをかぶせ、熱でビーズを接着します。仕上げは使うビーズの説明書に従ってください。' },
            { question: '図案作成ツールは無料ですか？', answer: 'はい。画像の読み込み、プレビュー、サイズ調整、図案の保存を無料で使えます。ブラウザー内で動作し、アカウントの登録は不要です。' },
            { question: '初めて作るときは何が必要ですか？', answer: 'ビーズ、四角いプレート、アイロンペーパー、ピンセットがあると始められます。色が増えてきたら、仕分け用のケースがあると便利です。' },
            { question: 'ミニビーズ用の図案も作れますか？', answer: 'はい。ミニビーズ用の設定を選ぶと、同じマス数でも完成品を小さくできます。キーホルダーやイヤリング、小さなドット絵などに使う場合は、対応するミニ用プレートも用意してください。' },
            { question: '作成した図案を手動で修正できますか？', answer: 'はい。ホームで図案を作ったらエディターを開き、色を塗る、塗りつぶす、消す、色を拾う、変更を取り消すなどの操作ができます。続き用のプロジェクトや完成した図案も保存できます。' },
        ],
    },
} satisfies Record<TranslatedLocale, {
    stepsEyebrow: string; ideasEyebrow: string; ideasHeading: string; ideas: [string, string][];
    guidesEyebrow: string; guidesHeading: string; guidesIntro: string; guidesLink: string;
    featuresEyebrow: string; featuresHeading: string; features: [string, string][];
    faqEyebrow: string; faqHeading: string; faqs: { question: string; answer: string }[];
}>;
