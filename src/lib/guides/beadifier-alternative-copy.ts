import type { GuideCopy } from './types';

export const beadifierAlternativeCopy: Record<'de' | 'fr' | 'ja', GuideCopy> = {
    de: {
        title: 'Eine kostenlose Beadifier-Alternative zum Bearbeiten von Perlenvorlagen',
        description: 'Vergleiche Beadifier und Fuse Bead Patterns beim Umwandeln von Bildern, Bearbeiten einzelner Perlen, Auswählen vorhandener Farben, Drucken und Speichern bearbeitbarer Projekte.',
        eyebrow: 'Ein Vorlagenwerkzeug auswählen',
        intro: 'Suchst du eine Beadifier-Alternative, weil ein umgewandeltes Bild noch Korrekturen braucht? Mit Fuse Bead Patterns kannst du einzelne Perlen umfärben, löschen, Flächen füllen, Änderungen rückgängig machen und ein bearbeitbares Projekt lokal speichern. Die Nutzung ist kostenlos und ohne Konto möglich.',
        sections: [
            {
                heading: 'Welches Beadifier vergleichen wir hier?',
                body: [
                    'Diese Seite vergleicht Eremes’ quelloffenes Beadifier unter beadifier.eremes.xyz mit Fuse Bead Patterns. Am 11. Oktober 2026 haben wir die Oberfläche, den öffentlichen Quellcode und einen tatsächlichen PDF-Download geprüft. Andere Produkte mit dem Namen Beadifier, einschließlich Beadifier PRO, sind nicht Gegenstand dieses Vergleichs.',
                    'Wir betreiben Fuse Bead Patterns und sind nicht mit Beadifier verbunden. Beide Werkzeuge wandeln Bilder mit vorgegebenen Perlenpaletten um, lassen dich aktivierte Farben begrenzen und mehrere Steckplatten anordnen. Beadifier ist eine nützliche quelloffene Wahl zum Umwandeln und Drucken. Unser Ablauf unten zeigt, wie du das Ergebnis korrigierst und ein Projekt behältst, das du später wieder öffnen kannst.',
                ],
            },
            {
                heading: 'Vergleiche die Arbeitsschritte, die du brauchst',
                body: ['Hier vergleichen wir beobachtete Funktionen, nicht die Farbgenauigkeit. Unterschiedliche Standardpaletten und Einstellungen zur Farbzuordnung können zu unterschiedlichen Ergebnissen führen.'],
                table: {
                    caption: 'Geprüft am 11. Oktober 2026',
                    headers: ['Aufgabe', 'Beadifier von Eremes', 'Fuse Bead Patterns'],
                    rows: [
                        { label: 'Ein Bild umwandeln', cells: ['Vorgegebene Perlenpaletten, Plattengrößen und Bildanpassungen.', 'Vorgegebene Perlenpaletten, Plattengrößen und Bildanpassungen.'] },
                        { label: 'Vorhandene Farben verwenden', cells: ['Farben in vorgegebenen Paletten aktivieren oder deaktivieren.', 'Farben in vorgegebenen Paletten aktivieren oder deaktivieren.'] },
                        { label: 'Einzelne Perlen korrigieren', cells: ['In der geprüften Oberfläche und im öffentlichen Quellcode haben wir keine Werkzeuge zum Malen einzelner Perlen gefunden.', 'Malen, Löschen, Füllen, Farbe aufnehmen, Rückgängig und Wiederholen.'] },
                        { label: 'Ein bearbeitbares Projekt behalten', cells: ['In der geprüften Oberfläche und im öffentlichen Quellcode haben wir keine Option für eine wieder zu öffnende Projektdatei gefunden.', 'Eine lokale .bead-pattern.json-Datei speichern und wieder öffnen.'] },
                        { label: 'Eine Vorlage oder ein Bild exportieren', cells: ['PDF; SVG, PNG, JPEG und XLSX sind als Beta gekennzeichnet.', 'PDF, SVG, druckbares PNG, JPG, XLSX und Raster-PNG.'] },
                    ],
                },
            },
            {
                heading: 'Bearbeite eine tatsächlich umgewandelte Vorlage',
                body: [
                    'Die Rakete unten ist unser eigenes 29 × 29-Beispiel mit Perler Midi, kein Vergleich der Umwandlungsergebnisse beider Werkzeuge. Das Ausgangsbild ist eine KI-generierte Illustration. Beim automatischen Ergebnis wirkt der Fensterrand unterbrochen. Wenn du 16 vorhandene Perlen mit Midnight übermalst, entsteht eine geschlossene Kontur.',
                    'Die Perlenzahl bleibt bei 337, während die Farbanzahl von 32 auf 31 sinkt. Öffne das unbearbeitete Projekt in unserem Editor, um die Korrektur auszuprobieren, oder öffne das bearbeitete Projekt zur Kontrolle. Die übrigen Farbtöne wurden nicht vereinfacht. Das Beispiel wurde nicht mit echten Perlen gelegt oder beim Bügeln getestet.',
                ],
                comparison: [
                    { alt: 'Vor der Bearbeitung: gemischte graue und blaue Perlen unterbrechen den Fensterrand der Rakete.', caption: 'Vorher: automatische Umwandlung, 337 Perlen und 32 Farben.' },
                    { alt: 'Nach der Bearbeitung: 16 Midnight-Perlen bilden eine geschlossene Kontur um das Raketenfenster.', caption: 'Nachher: 16 Perlen umgefärbt, 337 Perlen und 31 Farben.' },
                ],
            },
            {
                heading: 'Verwende nur Perlenfarben, die du besitzt',
                body: [
                    'Wähle vor dem manuellen Bearbeiten deine Marke, den passenden Plattentyp und die Plattenanzahl. Öffne im Editor „Vorlageneinstellungen“ beziehungsweise „Einstellungen“ auf einem kleineren Bildschirm und wähle „Änderungen anwenden“. Öffne danach „Farben“; auf einem schmalen Bildschirm wählst du „Farben“ und „Paletten verwalten“. Vergleiche die Farbcodes mit deinen Perlenbeuteln und deaktiviere fehlende Farben. Lass mindestens eine Farbe aktiviert.',
                    'Beim Deaktivieren einer Farbe werden die Perlen mit dieser Farbe aktivierten Farbtönen zugeordnet. Perlen, die bereits eine aktivierte Farbe verwenden, bleiben erhalten, einschließlich manueller Korrekturen. Prüfe das Ergebnis und die Mengen, bevor du fortfährst. Änderungen am Ausgangsbild, am Plattenlayout oder an den Umwandlungseinstellungen können die Vorlage neu erzeugen. Speichere vorher eine Projektdatei.',
                ],
            },
            {
                heading: 'Speichere ein Projekt, das du wieder öffnen kannst',
                body: [
                    'Wähle im Editor „Speichern“, um ein .bead-pattern.json-Projekt herunterzuladen. Wähle später „Projekt öffnen“ und diese Datei, um mit dem Perlenraster und den gespeicherten Einstellungen weiterzuarbeiten. Die Datei bleibt auf deinem Gerät; es handelt sich nicht um eine Cloud-Synchronisierung. Bewahre selbst eine Sicherungskopie auf.',
                    'Wähle „Exportieren“ für eine druckbare Vorlage oder ein Bild. Eine PDF ist beim Legen neben der Steckplatte nützlich, aber sie ist keine bearbeitbare Projektdatei. Bewahre beide Dateien auf, wenn du jetzt drucken und den Entwurf später ändern möchtest.',
                ],
            },
            {
                heading: 'Bevor du wechselst',
                body: [
                    'Beginne mit deinem ursprünglichen Bild und wandle es hier erneut um. Wir bieten keinen Import von Beadifier-Projekten an und rekonstruieren keine bearbeitbare Vorlage aus einer Beadifier-PDF. „Projekt öffnen“ akzeptiert unser eigenes Projektformat.',
                    'Unser Perleneditor verwendet Abmessungen auf Grundlage ganzer Platten und vorgegebene Paletten. Du kannst weder eine beliebige eigene RGB-Palette noch ein frei gewähltes exaktes Raster wie 62 × 62 eingeben. Für frei wählbare Pixelabmessungen ohne Zuordnung zu einer Perlenmarke kannst du unser separates Pixel-Art-Werkzeug verwenden.',
                    'PDF-Exporte aus dem Editor verwenden derzeit A4. Es gibt weder eine Auswahl für US Letter noch eine Material-Zwischensumme pro Platte. Einige Vorlagen in der Bibliothek bieten getrennte Downloads für A4 und US Letter. Prüfe Bildschirmfarben und digitale Vorlagen trotzdem anhand deiner echten Perlen und Steckplatte.',
                ],
            },
        ],
    },
    fr: {
        title: 'Une alternative gratuite à Beadifier pour retoucher vos modèles de perles',
        description: 'Comparez Beadifier et Fuse Bead Patterns pour convertir une image, retoucher chaque perle, choisir les couleurs disponibles, imprimer et enregistrer un projet modifiable.',
        eyebrow: 'Choisir un outil de création de modèles',
        intro: 'Vous cherchez une alternative à Beadifier parce qu’une image convertie nécessite quelques retouches ? Fuse Bead Patterns permet de recolorer chaque perle, d’effacer, de remplir une zone, d’annuler des modifications et d’enregistrer un projet modifiable sur votre appareil. Son utilisation est gratuite et sans compte.',
        sections: [
            {
                heading: 'Quel Beadifier comparons-nous ici ?',
                body: [
                    'Cette page compare le Beadifier open source d’Eremes, disponible sur beadifier.eremes.xyz, avec Fuse Bead Patterns. Nous avons vérifié son interface, son code source public et un téléchargement réel de PDF le 11 octobre 2026. Les autres produits appelés Beadifier, notamment Beadifier PRO, ne sont pas concernés.',
                    'Nous développons Fuse Bead Patterns et ne sommes pas affiliés à Beadifier. Les deux outils convertissent des images avec des palettes de perles prédéfinies, permettent de limiter les couleurs activées et d’organiser plusieurs plaques. Beadifier est un outil open source utile pour convertir et imprimer. Le parcours ci-dessous explique comment retoucher le résultat et conserver un projet que vous pourrez rouvrir.',
                ],
            },
            {
                heading: 'Comparez les tâches que vous souhaitez réaliser',
                body: ['Il s’agit de fonctionnalités observées, pas d’un classement de la précision des couleurs. Des palettes et des réglages de correspondance différents peuvent produire des conversions différentes.'],
                table: {
                    caption: 'Vérifié le 11 octobre 2026',
                    headers: ['Tâche', 'Beadifier d’Eremes', 'Fuse Bead Patterns'],
                    rows: [
                        { label: 'Convertir une image', cells: ['Palettes de perles prédéfinies, dimensions de plaques et réglages de l’image.', 'Palettes de perles prédéfinies, dimensions de plaques et réglages de l’image.'] },
                        { label: 'Utiliser les couleurs que vous possédez', cells: ['Activer ou désactiver des couleurs dans les palettes prédéfinies.', 'Activer ou désactiver des couleurs dans les palettes prédéfinies.'] },
                        { label: 'Corriger chaque perle', cells: ['Nous n’avons trouvé aucun outil de dessin perle par perle dans l’interface vérifiée ou le code source public.', 'Dessiner, effacer, remplir, prélever une couleur, Annuler et Rétablir.'] },
                        { label: 'Conserver un projet modifiable', cells: ['Nous n’avons trouvé aucune option de fichier projet à rouvrir dans l’interface vérifiée ou le code source public.', 'Enregistrer un fichier .bead-pattern.json sur votre appareil et le rouvrir.'] },
                        { label: 'Exporter une grille ou une image', cells: ['PDF ; SVG, PNG, JPEG et XLSX indiqués comme versions Beta.', 'PDF, SVG, PNG imprimable, JPG, XLSX et PNG avec grille.'] },
                    ],
                },
            },
            {
                heading: 'Essayez de retoucher un modèle réellement converti',
                body: [
                    'La fusée ci-dessous est notre propre exemple Perler Midi de 29 × 29, pas une comparaison des conversions des deux outils. L’image source est une illustration générée par IA. Le contour du hublot semble discontinu dans le résultat automatique. Recolorer 16 perles existantes en Midnight permet de le rendre continu.',
                    'Le nombre de perles reste à 337, tandis que le nombre de couleurs passe de 32 à 31. Ouvrez le projet non retouché dans notre éditeur pour essayer la correction, ou rouvrez le projet retouché pour l’examiner. Les autres nuances n’ont pas été simplifiées. Cet exemple n’a pas été assemblé avec des perles réelles ni testé au fer.',
                ],
                comparison: [
                    { alt: 'Avant la retouche : un mélange de perles grises et bleues interrompt le contour du hublot de la fusée.', caption: 'Avant : conversion automatique, 337 perles et 32 couleurs.' },
                    { alt: 'Après la retouche : 16 perles Midnight forment un contour continu autour du hublot de la fusée.', caption: 'Après : 16 perles recolorées, 337 perles et 31 couleurs.' },
                ],
            },
            {
                heading: 'Utilisez uniquement les couleurs de perles que vous possédez',
                body: [
                    'Choisissez votre marque, le type de plaque correspondant et le nombre de plaques avant de retoucher à la main. Dans l’éditeur, ouvrez « Réglages du modèle » (« Réglages » sur petit écran), puis choisissez « Appliquer ». Ouvrez ensuite « Couleurs » ; sur un écran étroit, choisissez « Couleurs », puis « Gérer les palettes ». Comparez les codes de couleur avec vos sachets de perles et désactivez les couleurs manquantes, en gardant au moins une couleur activée.',
                    'Désactiver une couleur remplace les perles qui l’utilisent par des couleurs activées. Les perles qui utilisent déjà une couleur activée restent en place, y compris les retouches manuelles. Vérifiez le résultat et les quantités avant de continuer. Changer l’image d’origine, la disposition des plaques ou les paramètres de conversion peut régénérer le modèle : enregistrez un projet avant ces changements.',
                ],
            },
            {
                heading: 'Enregistrez un projet que vous pourrez rouvrir',
                body: [
                    'Choisissez « Enregistrer » dans l’éditeur pour télécharger un projet .bead-pattern.json. Plus tard, choisissez « Ouvrir un projet » et sélectionnez ce fichier pour reprendre sa grille de perles et ses réglages enregistrés. Le fichier reste sur votre appareil ; il ne s’agit pas d’une synchronisation dans le cloud. Conservez votre propre sauvegarde.',
                    'Utilisez « Exporter » pour obtenir une grille imprimable ou une image. Un PDF est utile à côté de la plaque, mais ce n’est pas le fichier projet modifiable. Gardez les deux si vous souhaitez imprimer maintenant et modifier le dessin plus tard.',
                ],
            },
            {
                heading: 'Avant de changer d’outil',
                body: [
                    'Repartez de votre image d’origine et convertissez-la à nouveau ici. Nous ne proposons pas d’importateur de projets Beadifier et ne reconstruisons pas un modèle modifiable à partir de son PDF. Le bouton « Ouvrir un projet » accepte notre propre format de projet.',
                    'Notre éditeur de perles utilise des dimensions fondées sur les plaques et des palettes prédéfinies : il n’accepte ni palette RVB personnalisée arbitraire ni grille de dimensions exactes au choix, comme 62 × 62. Pour choisir librement les dimensions en pixels sans correspondance avec une marque de perles, utilisez notre outil de pixel art séparé.',
                    'Les exports PDF de l’éditeur utilisent actuellement le format A4. Il n’y a ni sélecteur US Letter ni sous-total des matériaux par plaque. Certains modèles de la bibliothèque proposent des téléchargements A4 et US Letter séparés. Vérifiez toujours les couleurs à l’écran et les grilles numériques avec vos perles et votre plaque réelles.',
                ],
            },
        ],
    },
    ja: {
        title: 'Beadifierの代わりに使える無料のアイロンビーズ図案編集ツール',
        description: 'BeadifierとFuse Bead Patternsを、画像変換、1粒ずつの修正、手持ちの色の選択、印刷用図案、編集可能なプロジェクトの保存で比較します。',
        eyebrow: '図案作成ツールを選ぶ',
        intro: '画像を変換したあとに少し修正したくて、Beadifierの代わりになるツールを探していますか？Fuse Bead Patternsでは、1粒ずつの塗り直し、消去、塗りつぶし、変更を元に戻す操作ができ、編集可能なプロジェクトを端末に保存できます。アカウントなしで無料で使えます。',
        sections: [
            {
                heading: 'どのBeadifierを比較していますか？',
                body: [
                    'このページでは、beadifier.eremes.xyzで公開されているEremesのオープンソース版Beadifierと、Fuse Bead Patternsを比較します。2026年10月11日に、画面、公開ソースコード、実際のPDFダウンロードを確認しました。Beadifier PROなど、同じBeadifierという名前の別製品は対象に含みません。',
                    '私たちはFuse Bead Patternsを運営しており、Beadifierとは提携していません。どちらのツールも、既存のビーズパレットで画像を変換し、有効な色を絞り、複数のプレートを配置できます。Beadifierは画像変換と印刷に役立つオープンソースの選択肢です。以下では、変換結果を修正し、あとから開き直せるプロジェクトとして残す手順を紹介します。',
                ],
            },
            {
                heading: 'やりたい作業で比較する',
                body: ['ここで比較するのは確認できた機能で、色の正確さの順位ではありません。初期設定のパレットや色合わせの設定が違えば、変換結果も変わります。'],
                table: {
                    caption: '2026年10月11日確認',
                    headers: ['作業', 'EremesのBeadifier', 'Fuse Bead Patterns'],
                    rows: [
                        { label: '画像を変換する', cells: ['既存のビーズパレット、プレートサイズ、画像調整。', '既存のビーズパレット、プレートサイズ、画像調整。'] },
                        { label: '手持ちの色を使う', cells: ['既存のパレット内で色を有効・無効にする。', '既存のパレット内で色を有効・無効にする。'] },
                        { label: '1粒ずつ修正する', cells: ['確認した画面と公開ソースコードでは、1粒ずつ描くツールは見つかりませんでした。', '描画、消去、塗りつぶし、色の取得、「元に戻す」「やり直す」。'] },
                        { label: '編集可能なプロジェクトを残す', cells: ['確認した画面と公開ソースコードでは、開き直せるプロジェクトファイルの選択肢は見つかりませんでした。', '.bead-pattern.jsonファイルを端末に保存して開き直す。'] },
                        { label: '図案や画像を書き出す', cells: ['PDF。SVG、PNG、JPEG、XLSXはBeta表記。', 'PDF、SVG、印刷用PNG、JPG、XLSX、グリッドPNG。'] },
                    ],
                },
            },
            {
                heading: '実際に変換した図案を修正してみる',
                body: [
                    '下のロケットは、当サイトで作成した29 × 29のPerler Midiの例で、2つのツールの変換結果を比較したものではありません。元画像はAIで生成したイラストです。自動変換では窓の輪郭が途切れて見えます。既存の16粒をMidnightに塗り直すと、輪郭がつながります。',
                    'ビーズの数は337粒のままで、色数は32色から31色になります。修正前のプロジェクトを当サイトのエディターで開いて試すか、修正後のプロジェクトを開いて確認してください。ほかの色はまだ整理していません。この例は実物のビーズで組み立てたり、アイロンで溶着したりする試験は行っていません。',
                ],
                comparison: [
                    { alt: '修正前：灰色と青色のビーズが混ざり、ロケットの窓の輪郭が途切れています。', caption: '修正前：自動変換、337粒・32色。' },
                    { alt: '修正後：16粒のMidnightがロケットの窓を連続した輪郭で囲んでいます。', caption: '修正後：16粒を塗り直し、337粒・31色。' },
                ],
            },
            {
                heading: '手持ちのビーズの色だけを使う',
                body: [
                    '手作業で修正する前に、ブランド、対応するプレートの種類、プレート数を選びます。エディターで「図案の設定」（小さな画面では「設定」）を開き、「変更を適用」を選びます。そのあと「色」を開きます。画面が狭い場合は「色」から「パレットを管理」を選んでください。色番号をビーズの袋と照合し、持っていない色を無効にします。少なくとも1色は有効にしておいてください。',
                    '色を無効にすると、その色のビーズは有効な色に置き換えられます。すでに有効な色を使っているビーズは、手描きの修正も含めてそのまま残ります。続ける前に、仕上がりと必要数を確認してください。元画像、プレート配置、変換設定を変えると図案が再生成されることがあるため、変更前にプロジェクトを保存します。',
                ],
            },
            {
                heading: '開き直せるプロジェクトを保存する',
                body: [
                    'エディターで「保存」を選ぶと、.bead-pattern.json形式のプロジェクトをダウンロードできます。あとから「プロジェクトを開く」でそのファイルを選ぶと、ビーズのグリッドと保存した設定で作業を続けられます。ファイルは端末に保存され、クラウド同期ではありません。自分でバックアップを保管してください。',
                    '印刷用の図案や画像は「書き出し」で保存します。PDFはプレートの横に置いて確認するのに便利ですが、編集可能なプロジェクトファイルではありません。今は印刷し、あとから図案を修正したい場合は、両方を残しておいてください。',
                ],
            },
            {
                heading: '別のツールへ移る前に',
                body: [
                    '元の画像から始めて、当サイトでもう一度変換してください。Beadifierのプロジェクトを取り込む機能や、そのPDFから編集可能な図案を復元する機能はありません。「プロジェクトを開く」が対応するのは当サイト独自のプロジェクト形式です。',
                    '当サイトのビーズエディターは、プレート単位のサイズと既存のパレットを使います。自由に作成したRGBパレットや、62 × 62のような任意の正確なグリッドサイズは指定できません。ビーズブランドの色合わせをせず、自由なピクセル数で作成する場合は、別のピクセルアートツールを使ってください。',
                    'エディターのPDF書き出しは現在A4です。US Letterを選ぶ機能や、プレートごとの材料数の小計はありません。図案ライブラリの一部には、A4とUS Letterを別々にダウンロードできる図案があります。画面上の色やデジタル図案は、実物のビーズとプレートでも確認してください。',
                ],
            },
        ],
    },
};
