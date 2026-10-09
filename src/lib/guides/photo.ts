import type { GuideCopy } from './types';

export const photoGuideCopy = {
    de: {
        title: 'Ein Foto in eine Bügelperlen-Vorlage umwandeln',
        description: 'Wandle ein Foto oder eine Illustration in eine Perlenvorlage um. Vergleiche echte 29 × 29- und 58 × 58-Ergebnisse und korrigiere Details im Editor.',
        eyebrow: 'Bilder umwandeln',
        intro: 'Eine Bildumwandlung gelingt besser, wenn du das Motiv wie Pixelkunst betrachtest. Es geht nicht darum, jedes Fotodetail zu erhalten: Das Motiv soll auch mit wenigen Rasterfeldern und den Farben echter Bügelperlen erkennbar bleiben.',
        sections: [
            { heading: 'Ein echtes Foto: Mehr Perlen reichen nicht immer', body: ['Dieses dunkle Katzenfoto zeigt, warum du eine Umwandlung vor dem Perlenkauf prüfen solltest. Beide Ergebnisse wurden automatisch mit Perler Midi erzeugt, ohne manuelle Korrekturen. Die weiße Brust ist erkennbar, doch Augen, Schnurrhaare und dunkles Gesicht verlieren in beiden Größen viele Details.'], comparison: [
                { alt: 'Originalfoto einer schwarz-weißen Katze mit gelbgrünen Augen.', caption: 'Originalfoto: 792 × 960 Pixel. Anjeagotilla0920, Wikimedia Commons, CC0 1.0.' },
                { alt: 'Tatsächliche automatische Umwandlung des Katzenfotos in ein 29 × 29-Perlenraster.', caption: '29 × 29 · 1 Platte · 667 Perlen · 11 Farben.' },
                { alt: 'Tatsächliche automatische Umwandlung des Katzenfotos in ein 58 × 58-Perlenraster.', caption: '58 × 58 · 4 Platten · 2.726 Perlen · 13 Farben.' },
            ] },
            { heading: 'Dasselbe Foto im Generator ausprobieren', body: [
                'Speichere das unten verlinkte Ausgangsfoto, öffne den Generator und wähle „Bild hochladen“. Wähle Perler Midi und die Midi-Steckplatte mit 29 × 29 Stiften. Stelle die Plattenanzahl nebeneinander und untereinander jeweils auf 1 für das kleine Ergebnis beziehungsweise auf 2 für das große.',
                'Für diesen Vergleich waren alle 103 Perler-Midi-Farben aktiviert. Unter „Erweitert“ war die Farbzuordnung DeltaE CIE2000 eingestellt, Dithering war ausgeschaltet. Helligkeit, Kontrast und Sättigung lagen bei 100, Graustufen bei 0. „Zentrieren“ und „An Platten anpassen“ waren aktiviert. Das Foto wurde weder zugeschnitten noch retuschiert.',
                'Das Foto ist höher als breit. Beim Einpassen auf die quadratische Platte bleiben deshalb Spalten leer; dort werden keine Perlen benötigt. Der dunkle Hintergrund innerhalb des Fotos bleibt dagegen Teil des Musters. Der Upload entfernt einen Fotohintergrund nicht automatisch.',
            ] },
            { heading: 'Die tatsächlichen Ergebnisse herunterladen und vergleichen', body: [
                'Die kleine Version benötigt 667 Perlen, die große 2.726. Im größeren Raster kommen einige helle Stellen hinzu, doch Augenfarben und feine Schnurrhaare fehlen weiterhin weitgehend. Dunkles Fell verschmilzt mit dem Hintergrund. Für dieses Foto liefern die zusätzlichen Perlen kein klares Tierporträt. Probiere ein helleres Bild mit ruhigerem Hintergrund, schneide näher am Gesicht zu oder zeichne wichtige Merkmale im Editor nach.',
                'Die PDFs unten sind auf Deutsch und übernehmen die unveränderten Perler-Symbole, Farbcodes und Mengen aus den gespeicherten Projekten. Die kleine PDF enthält eine Materialliste und eine Plattenseite; die große eine verkleinerte Gesamtübersicht, eine Materialliste und vier Plattenseiten. Jede Plattenseite hat 29 × 29 Felder im 5-mm-Raster und eine 50-mm-Messlinie. Drucke A4 bei 100 % beziehungsweise „Tatsächliche Größe“, schalte „An Seite anpassen“ aus und vergleiche die Messlinie mit deiner Platte. Das Raster-PNG dient weiterhin zur Ansicht. Über den Sprachwechsel zur englischen Anleitung erreichst du die ursprünglichen englischen Zählvorlagen; diese sind keine geprüften Unterlagen in Originalgröße.',
                'Die Downloads sind Übungsumwandlungen, keine fertig überarbeiteten Porträtvorlagen. Speichere eine Projektdatei und lade sie über „Projekt öffnen“ im Generator oder Editor. Prüfe deine Farben und überarbeite Augen, Hintergrund und Konturen vor dem Legen. Diese Beispiele wurden nicht mit echten Perlen zusammengesetzt oder gebügelt.',
            ] },
            { heading: 'Eine glatte Illustration: kleine Details vergleichen', body: [
                'Auch eine einfache Illustration kann Nacharbeit benötigen. Die eigens für dieses Beispiel mit KI erzeugte Rakete hat glatte Kanten und einen transparenten Hintergrund. Beide automatischen Ergebnisse nutzen dieselben Perler-Midi-Einstellungen wie das Katzenfoto: alle 103 Farben, CIE2000, kein Dithering, Zentrieren und Anpassen an die Platten.',
                'Das 29 × 29-Ergebnis hat 337 Perlen und 32 Farben; bei 58 × 58 sind es 1.216 Perlen und ebenfalls 32 Farben. Im größeren Raster hat das Fenster mehr Platz, aber beide Versionen enthalten mehrere Schattierungen an den glatten Kanten. Eine größere Platte vereinfacht die Materialliste nicht automatisch.',
            ], comparison: [
                { alt: 'Glatte Raketenillustration mit rundem türkisfarbenem Fenster auf transparentem Hintergrund.', caption: 'Ausgangsillustration: 1.254 × 1.254 Pixel. Mit KI für die Anleitung erstellt, noch keine fertige Perlenvorlage.' },
                { alt: 'Automatische Raketen-Umwandlung mit 29 × 29 Feldern vor manuellen Änderungen.', caption: 'Automatisch, 29 × 29: 337 Perlen und 32 Farben.' },
                { alt: 'Automatische Raketen-Umwandlung mit 58 × 58 Feldern vor manuellen Änderungen.', caption: 'Automatisch, 58 × 58: 1.216 Perlen und 32 Farben.' },
            ] },
            { heading: 'Eine Fensterkontur mit 16 Änderungen ausbessern', body: [
                'Öffne das unbearbeitete Raketenprojekt im Editor. Schalte „Ausgangsbild anzeigen“ aus, um die Perlen zu sehen. Auf kleinen Bildschirmen heißt der Schalter „Referenz anzeigen“ und steht unter „Einstellungen“. Wähle Midnight (Perler 80-15201) in der Schnellauswahl; auf dem Smartphone öffnest du „Farben“ und wählst 80-15201. Beim kleinen automatischen Ergebnis besteht der Fensterrand aus unterbrochenen grauen, blauen und türkisfarbenen Abschnitten. Male eine geschlossene Kontur mit Midnight.',
                'Nutze die nummerierten Zeilen und Spalten: Färbe die Spalten 14–16 in den Zeilen 9 und 15; die Spalten 13 und 17 in den Zeilen 10 und 14; sowie die Spalten 12 und 18 in den Zeilen 11–13. Das sind 16 bereits belegte Felder. Fensterfüllung, Rumpf, Flossen und Flamme bleiben unverändert. Ziehe die Kontur in einem Zug und vergleiche sie mit „Rückgängig“ und „Wiederholen“.',
                'Die bearbeitete Version hat weiterhin 337 Perlen, jetzt in 31 Farben. Nur die Fensterkontur wurde korrigiert; andere Farbabstufungen sind nicht vereinfacht. Das Projekt dient zum Üben im Editor und wurde nicht physisch gelegt oder gebügelt.',
                'Die dreiseitige deutsche PDF enthält zwei Materialseiten für alle 31 Farben und eine Plattenseite mit den unveränderten Symbolen. Ihr Raster hat 5 mm Abstand und eine 50-mm-Messlinie; drucke A4 bei 100 % und prüfe Linie und Plattenabstand vor dem Legen. Die ursprüngliche englische Zählvorlage bleibt über den Sprachwechsel zur englischen Anleitung verfügbar. Aus dem deutschen Editor kannst du weiterhin eine eigene deutsche PDF exportieren.',
            ], comparison: [
                { alt: 'Vorher: Graue und blaue Abschnitte unterbrechen die Kontur des kleinen Raketenfensters.', caption: 'Vorher: automatische Umwandlung mit 29 × 29 Feldern.' },
                { alt: 'Nach 16 Änderungen umschließt eine durchgehende Midnight-Kontur das türkisfarbene Fenster.', caption: 'Nachher: 16 Perlen mit Midnight übermalt; alle anderen Felder bleiben gleich.' },
            ] },
            { heading: 'Mit einem klaren Ausgangsbild beginnen', body: ['Wähle ein deutliches Motiv mit kräftigen Kontrasten und einfachem Hintergrund. Porträts, Spielfiguren, Tiere, Symbole und Logos lassen sich meist besser umwandeln als unruhige Szenen.', 'Ist das Motiv im Bild sehr klein, schneide es vor dem Hochladen zu. So stehen für den wichtigen Bereich mehr Perlenpositionen zur Verfügung.'], bullets: ['Verwende möglichst kontrastreiche Bilder.', 'Schneide vor der Umwandlung um das Hauptmotiv herum zu.', 'Vermeide winzige Gesichter oder Schrift, außer du planst ein großes Raster.'] },
            { heading: 'Plattengröße wählen, bevor du das Ergebnis beurteilst', body: ['Die Plattengröße bestimmt die verfügbaren Perlenpositionen. Ein 29 × 29-Raster eignet sich für kleine Arbeiten. Detaillierte Fotos brauchen oft mehrere Platten oder eine Mini-Platte mit mehr Stiften.', 'Wenn das Motiv undeutlich wirkt, teste zuerst mehr Rasterfelder, bevor du die Farben stark veränderst. Zusätzliche Positionen helfen häufig mehr als starke Filter.'] },
            { heading: 'Im Editor gezielt nacharbeiten', body: ['Die automatische Zuordnung ist ein Ausgangspunkt. Überarbeite Gesichtszüge, Konturen, Schrift und störende Hintergrundpunkte vor dem Export, wenn die Darstellung noch nicht klar genug ist.', 'Im Editor kannst du einzelne Perlen setzen, störende Farben löschen, Flächen füllen oder eine genaue Perlenfarbe aus dem vorhandenen Motiv aufnehmen.'] },
        ],
    },
    fr: {
        title: 'Transformer une photo en modèle de perles à repasser',
        description: 'Convertissez une photo ou une illustration, comparez de vrais résultats en 29 × 29 et 58 × 58, puis corrigez les petits détails dans l’éditeur.',
        eyebrow: 'Conversion d’image',
        intro: 'Pour convertir une image, pensez comme pour du pixel art. Le but n’est pas de conserver chaque détail de la photo, mais de garder un motif lisible avec un nombre limité de cases et les couleurs des perles réelles.',
        sections: [
            { heading: 'Une vraie photo : plus de perles ne suffit pas toujours', body: ['Cette photo sombre de chat montre pourquoi il faut examiner une conversion avant d’acheter les perles. Les deux résultats ont été générés automatiquement avec Perler Midi, sans retouche manuelle. Le poitrail blanc reste visible, mais une grande partie des yeux, des moustaches et du visage sombre disparaît dans les deux tailles.'], comparison: [
                { alt: 'Photo originale d’un chat noir et blanc aux yeux jaune-vert.', caption: 'Photo originale : 792 × 960 pixels. Anjeagotilla0920, Wikimedia Commons, CC0 1.0.' },
                { alt: 'Conversion automatique réelle de la photo du chat sur une grille de 29 × 29 perles.', caption: '29 × 29 · 1 plaque · 667 perles · 11 couleurs.' },
                { alt: 'Conversion automatique réelle de la photo du chat sur une grille de 58 × 58 perles.', caption: '58 × 58 · 4 plaques · 2 726 perles · 13 couleurs.' },
            ] },
            { heading: 'Essayer la même photo dans le générateur', body: [
                'Enregistrez la photo source ci-dessous, ouvrez le générateur et choisissez « Importer une image ». Sélectionnez Perler Midi et la plaque Midi de 29 × 29. Réglez les plaques en largeur et en hauteur sur 1 pour le petit résultat, ou sur 2 pour le grand.',
                'Les 103 couleurs Perler Midi étaient activées pour ce comparatif. Dans « Avancé », la correspondance était DeltaE CIE2000 et le tramage désactivé. Luminosité, contraste et saturation étaient à 100, les niveaux de gris à 0. « Centrer » et « Adapter aux plaques » étaient cochés. La source n’a été ni recadrée ni retouchée.',
                'La photo est plus haute que large : son adaptation à une grille carrée laisse des colonnes vides, qui ne demandent aucune perle. En revanche, le fond sombre à l’intérieur de la photo fait toujours partie du motif. Importer une image ne supprime pas automatiquement son arrière-plan.',
            ] },
            { heading: 'Télécharger et comparer les résultats réels', body: [
                'La version 29 × 29 utilise 667 perles, contre 2 726 pour la 58 × 58. La grande ajoute quelques reflets, mais perd encore largement la couleur des yeux et les fines moustaches. Le pelage sombre se confond avec le fond. Les perles supplémentaires ne donnent donc pas un portrait net de cet animal. Essayez une photo plus lumineuse avec un fond simple, recadrez sur le visage ou redessinez les traits importants dans l’éditeur.',
                'Les PDF ci-dessous sont en français et conservent les symboles, références Perler et quantités des projets enregistrés. Le petit comprend une liste du matériel et une grille de plaque ; le grand, une vue d’ensemble réduite, une liste et quatre grilles. Chaque grille de plaque comporte 29 × 29 cases espacées de 5 mm et un repère de 50 mm. Imprimez en A4 à 100 % ou « Taille réelle », désactivez « Ajuster à la page », puis comparez le repère avec votre plaque. Le PNG sert à examiner la disposition. Le sélecteur de langue permet d’ouvrir le guide anglais et ses PDF de comptage d’origine, qui ne sont pas des gabarits vérifiés à taille réelle.',
                'Ce sont des conversions d’entraînement, pas des portraits finalisés. Enregistrez un projet puis utilisez « Ouvrir un projet » dans le générateur ou l’éditeur. Vérifiez vos couleurs et reprenez les yeux, le fond et les contours avant de fabriquer l’objet. Ces exemples n’ont pas été assemblés ni testés au fer.',
            ] },
            { heading: 'Une illustration lisse : comparer les petits détails', body: [
                'Même un dessin simple peut demander des corrections. Cette fusée créée par IA pour le tutoriel possède des contours lisses et un fond transparent. Les deux conversions utilisent les mêmes réglages Perler Midi que la photo : 103 couleurs activées, CIE2000, aucun tramage, centrage et adaptation aux plaques.',
                'Le résultat 29 × 29 utilise 337 perles et 32 couleurs. En 58 × 58, il utilise 1 216 perles et toujours 32 couleurs. La grande grille donne plus de place au hublot, mais les deux versions comportent plusieurs nuances le long des contours. Agrandir ne simplifie pas automatiquement la liste du matériel.',
            ], comparison: [
                { alt: 'Illustration lisse d’une fusée au hublot turquoise sur fond transparent.', caption: 'Illustration source : 1 254 × 1 254 pixels. Créée par IA pour le tutoriel ; ce n’est pas encore un modèle finalisé.' },
                { alt: 'Conversion automatique de la fusée en 29 × 29 avant retouche.', caption: 'Conversion automatique 29 × 29 : 337 perles, 32 couleurs.' },
                { alt: 'Conversion automatique de la fusée en 58 × 58 avant retouche.', caption: 'Conversion automatique 58 × 58 : 1 216 perles, 32 couleurs.' },
            ] },
            { heading: 'Réparer le contour du hublot avec 16 retouches', body: [
                'Ouvrez le projet de fusée non retouché dans l’éditeur. Désactivez « Afficher l’image source » pour voir les perles. Sur petit écran, ce réglage s’appelle « Afficher la référence » dans « Réglages ». Choisissez Midnight (Perler 80-15201) dans « Couleurs rapides » ; sur téléphone, ouvrez « Couleurs » et choisissez 80-15201. Le petit résultat automatique mélange du gris, du bleu et du turquoise autour du hublot. Tracez un contour continu avec Midnight.',
                'En suivant les lignes et colonnes numérotées, colorez les colonnes 14–16 des lignes 9 et 15 ; les colonnes 13 et 17 des lignes 10 et 14 ; et les colonnes 12 et 18 des lignes 11–13. Cela représente 16 perles déjà présentes. Ne changez ni le centre turquoise, ni le corps, les ailerons ou la flamme. Tracez le contour d’un seul geste, puis essayez « Annuler » et « Rétablir » pour comparer.',
                'La version retouchée conserve 337 perles et passe à 31 couleurs. Seul le contour du hublot a été réparé ; les autres nuances n’ont pas été simplifiées. Ce projet sert à apprendre l’éditeur et n’a pas été assemblé ni testé au fer.',
                'Le PDF français de trois pages contient deux listes de matériel couvrant les 31 couleurs et une grille de plaque, sans modifier les symboles. Cette grille utilise un espacement de 5 mm et un repère de 50 mm : imprimez en A4 à 100 % et vérifiez le repère et votre plaque avant de placer les perles. Le PDF de comptage anglais d’origine reste accessible en passant au guide anglais. Vous pouvez aussi exporter votre propre PDF depuis l’éditeur français.',
            ], comparison: [
                { alt: 'Avant retouche : des nuances grises et bleues interrompent le contour du petit hublot.', caption: 'Avant : conversion automatique en 29 × 29.' },
                { alt: 'Après 16 retouches : un contour Midnight continu entoure le hublot turquoise.', caption: 'Après : 16 perles recolorées en Midnight, toutes les autres cases inchangées.' },
            ] },
            { heading: 'Choisir une image source lisible', body: ['Privilégiez un sujet net, du contraste et un fond simple. Portraits, sprites, animaux, icônes et logos se convertissent généralement mieux que les scènes chargées.', 'Si le sujet est très petit dans l’image, recadrez avant l’import. Davantage de perles pourront ainsi représenter la partie importante.'], bullets: ['Utilisez si possible des images contrastées.', 'Recadrez autour du sujet avant la conversion.', 'Évitez les petits visages ou textes, sauf pour une grande grille.'] },
            { heading: 'Choisir la taille avant de juger le résultat', body: ['La taille de la plaque fixe le nombre de positions disponibles. Une grille de 29 × 29 convient à un petit projet, mais les photos détaillées demandent souvent plusieurs plaques ou une plaque Mini avec davantage de picots.', 'Si le motif paraît confus, augmentez d’abord le nombre de cases avant de modifier fortement les couleurs. Davantage de positions aide souvent plus que des filtres poussés.'] },
            { heading: 'Retoucher dans l’éditeur', body: ['La correspondance automatique constitue un point de départ. Reprenez les traits du visage, contours, textes et détails parasites du fond avant l’export si nécessaire.', 'L’éditeur permet de peindre une perle, d’effacer des couleurs isolées, de remplir une zone ou de prélever une couleur exacte dans le motif.'] },
        ],
    },
    ja: {
        title: '画像からアイロンビーズ図案を作る方法',
        description: '写真とイラストを実際に変換し、29 × 29と58 × 58の結果を比較。エディターで16マスを直す例と練習用ファイルを用意しています。',
        eyebrow: '画像を図案にする',
        intro: '写真のすべての細部を残すのではなく、ドット絵として読みやすくすることを考えます。実際のビーズの色に減らしても、少ないマスで形が伝わる図案を目指しましょう。',
        sections: [
            { heading: '実際の写真：ビーズを増やすだけでは改善しない例', body: ['この暗い猫の写真は、材料を買う前に変換結果を確認する大切さを示しています。どちらもPerler Midiで自動変換し、手作業の修正はしていません。白い胸は分かりますが、目、ひげ、暗い顔の細部は両サイズで大きく失われています。'], comparison: [
                { alt: '黄緑色の目をした白黒の猫の元写真。', caption: '元写真：792 × 960ピクセル。Anjeagotilla0920、Wikimedia Commons、CC0 1.0。' },
                { alt: '猫の写真を実際に29 × 29マスへ自動変換した図案。', caption: '29 × 29・プレート1枚・667個・11色。' },
                { alt: '猫の写真を実際に58 × 58マスへ自動変換した図案。', caption: '58 × 58・プレート4枚・2,726個・13色。' },
            ] },
            { heading: '同じ写真を作成ツールで試す', body: [
                '下の元写真を保存し、作成ツールの「画像を読み込む」で開きます。Perler Midiと29 × 29マスのMidiプレートを選びます。横・縦のプレート数をそれぞれ1にすると小さい結果、両方2にすると大きい結果になります。',
                'この比較ではPerler Midiの103色すべてを有効にしました。「詳細設定」の「色の照合」はDeltaE CIE2000、ディザリングはなしです。明るさ・コントラスト・彩度は100、グレースケールは0で、「中央に配置」と「プレートに合わせる」を有効にしています。元写真は切り抜きも修正もしていません。',
                '縦長の写真を正方形に収めるため、左右に空白の列ができます。空白にはビーズを置きません。一方、写真の中にある暗い背景は図案に含まれます。画像を読み込んでも背景が自動で消えるわけではありません。',
            ] },
            { heading: '実際の出力ファイルを比較する', body: [
                '29 × 29版は667個、58 × 58版は2,726個です。大きい方には明るい部分が少し増えますが、目の色や細いひげは依然ほとんど残らず、暗い毛が背景と混ざっています。この写真では個数を増やしても明瞭なペットの肖像にはなりません。明るく背景が単純な写真に変える、顔を大きく切り抜く、重要な部分を描き直す方法を試してください。',
                '以下のPDFは日本語で、保存済みプロジェクトのPerlerの色番号・記号・必要数をそのまま載せています。小さいPDFは材料表とプレート1枚分の図案、大きいPDFは縮小した全体図、材料表、プレート4枚分の図案です。プレート別ページは29 × 29マス・5 mm間隔で、50 mmの確認線があります。A4・100 %または「実際のサイズ」で印刷し、「用紙に合わせる」は選ばず、確認線と実物のプレートを比べてください。マス目PNGでは配置を確認できます。言語メニューで英語ガイドに切り替えると、元の英語カウント図も保存できます。元の英語版は実寸の下敷きとして検証していません。',
                '完成済みの肖像図案ではなく、変換の練習用です。プロジェクトを保存して「プロジェクトを開く」で作成ツールまたはエディターに読み込めます。手元の色を確認し、目、背景、輪郭を直してから制作してください。実物で並べたりアイロンで接合したりする検証は行っていません。',
            ] },
            { heading: '滑らかなイラスト：小さな部分を比べる', body: [
                '単純なイラストでも修正が必要な場合があります。このロケットは解説用にAIで作成したオリジナル画像で、滑らかな輪郭と透明な背景があります。両方の自動変換は猫の写真と同じPerler Midi設定です。103色有効、CIE2000、ディザリングなし、中央配置とプレートに合わせる設定を使っています。',
                '29 × 29版は337個・32色、58 × 58版は1,216個・32色です。大きい方は窓を描けるマスが増えますが、どちらも滑らかな縁に複数の近い色を使います。プレートを増やしても材料の色数が自動で減るわけではありません。',
            ], comparison: [
                { alt: '透明背景に、丸い青緑色の窓を持つ滑らかなロケットのイラスト。', caption: '元イラスト：1,254 × 1,254ピクセル。解説用にAIで作成した画像で、完成済みビーズ図案ではありません。' },
                { alt: '手作業で修正する前のロケットの29 × 29自動変換。', caption: '29 × 29の自動変換：337個・32色。' },
                { alt: '手作業で修正する前のロケットの58 × 58自動変換。', caption: '58 × 58の自動変換：1,216個・32色。' },
            ] },
            { heading: '16個の色を変えて窓の輪郭を直す', body: [
                '修正前のロケットプロジェクトをエディターで開きます。「元画像を表示」を切ってビーズを確認します。小さな画面では「設定」にある「参考画像を表示」を切ります。「よく使う色」からMidnight（Perler 80-15201）を選んでください。スマートフォンでは「色」を開いて80-15201を選びます。小さい自動変換では、窓の周囲に灰色・青・青緑が途切れながら混ざっています。Midnightでつながった輪郭に直します。',
                '番号付きの行と列を見ながら、9行目と15行目の14～16列、10行目と14行目の13列と17列、11～13行目の12列と18列を塗ります。すでにビーズがある16マスです。青緑の窓の中心、胴体、尾翼、炎は変えません。一筆で輪郭をなぞり、「元に戻す」と「やり直す」で比較してください。',
                '修正後も337個で、色数は31色になります。直したのは窓の輪郭だけで、ほかの近い色は減らしていません。エディターの練習用であり、実物での組み立てや接合は未検証です。',
                '日本語の3ページPDFは、31色分の材料表2ページとプレート用図案1ページです。記号を変更せず、5 mm間隔と50 mmの確認線を付けています。A4・100 %で印刷し、確認線とプレートの間隔を測ってから並べてください。元の英語カウント図は、言語メニューから英語ガイドに切り替えて保存できます。日本語エディターから自分のPDFを書き出すこともできます。',
            ], comparison: [
                { alt: '修正前：小さなロケットの窓の縁に灰色や青が混ざり、輪郭が途切れています。', caption: '修正前：29 × 29の自動変換。' },
                { alt: '16マスの修正後：青緑の窓をMidnightの連続した輪郭が囲みます。', caption: '修正後：16個をMidnightに変更し、それ以外のマスは同じままです。' },
            ] },
            { heading: '分かりやすい元画像を選ぶ', body: ['主役がはっきりし、コントラストが高く、背景が単純な画像を選びます。人物、ゲームのドット絵、ペット、アイコン、ロゴは、複雑な風景より形を残しやすい傾向があります。', '主役が小さく写っている場合は、読み込み前に切り抜きます。大切な部分に使えるビーズのマスが増えます。'], bullets: ['なるべく色の差がはっきりした画像を使います。', '変換前に主役の周囲を切り抜きます。', '小さな顔や文字を残したい場合は、大きな図案を検討します。'] },
            { heading: '結果を見る前にマス数を決める', body: ['プレートは画像に使えるビーズの位置数を決めます。29 × 29は小さな作品向けですが、細かい写真には複数枚やピン数の多いMiniプレートが必要になることがあります。', '絵がつぶれて見える場合は、強い色調整より先にマス数を増やして比べてください。過度なフィルターより位置数を増やす方が細部を残せることがあります。'] },
            { heading: 'エディターで仕上げる', body: ['自動の色合わせを出発点に、顔、輪郭、文字、背景の余分な点を必要に応じて直してから書き出します。', 'エディターでは、1個ずつ塗る、不要な色を消す、領域を塗りつぶす、図案から色を拾うといった操作ができます。'] },
        ],
    },
} satisfies Record<'de' | 'fr' | 'ja', GuideCopy>;
