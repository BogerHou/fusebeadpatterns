import type { PatternLocale } from './localized-content';
import type { PatternSectionSlug } from './section-routes';
import { smallPatternCopy } from './small';

export type TopicCopy = { label: string; title: string; metadataTitle?: string; description: string; intro: string; heading: string; notes: readonly string[] };
export const sectionLabels: Record<PatternLocale, Record<PatternSectionSlug, string>> = {
    de: { 'stardew-valley': 'Stardew Valley', pokemon: 'Pokémon', minecraft: 'Minecraft', 'super-mario': 'Super Mario', kirby: 'Kirby', easy: 'Einfache Vorlagen', cute: 'Niedliche Motive', small: smallPatternCopy.de.label, halloween: 'Halloween', christmas: 'Weihnachten' },
    fr: { 'stardew-valley': 'Stardew Valley', pokemon: 'Pokémon', minecraft: 'Minecraft', 'super-mario': 'Super Mario', kirby: 'Kirby', easy: 'Modèles faciles', cute: 'Motifs mignons', small: smallPatternCopy.fr.label, halloween: 'Halloween', christmas: 'Noël' },
    ja: { 'stardew-valley': 'Stardew Valley', pokemon: 'ポケモン', minecraft: 'Minecraft', 'super-mario': 'スーパーマリオ', kirby: '星のカービィ', easy: '簡単な図案', cute: 'かわいい図案', small: smallPatternCopy.ja.label, halloween: 'ハロウィン', christmas: 'クリスマス' },
};

export const sectionUi = {
    de: { nav: 'Figuren und Themen', choose: 'Eine Vorlage auswählen', all: 'Alle Vorlagen ansehen', english: 'Englisch', related: 'Passende Anleitungen und Motive', library: 'Vorlagen', additional: 'Weitere Weihnachtsvorlagen',
        additionalHalloween: 'Weitere Halloween-Vorlagen',
        title: (name: string) => `${name}-Bügelperlen-Vorlagen`,
        intro: (name: string, count: number, subjects: string) => `${count} ${name}-Vorlagen mit ${subjects}. Wähle ein Bild für das Raster, die Farbliste und die Druckdateien oder bearbeite das Motiv im deutschen Editor.`,
        fewest: (name: string, colors: number, beads: number) => `${name} verwendet ${colors} Perler-Farben und ${beads} Perlen – die kleinste Farbliste in dieser Sammlung. Prüfe vor dem Start die Anordnung und Hinweise zu schmalen Verbindungen.`,
        sizes: 'Auf jeder Detailseite findest du die Rastergröße, Mengen pro Farbe und Druckdateien. Leere Felder bleiben frei; die Zahl der Steckplätze ist nicht die Zahl der benötigten Perlen.',
        brand: 'Für Hama oder Artkal öffne die gewünschte Vorlage im deutschen Editor und ändere die Perlenmarke. Behalte die Platteneinstellungen bei, damit Perlenpositionen und Leerstellen erhalten bleiben, und exportiere eine neue Farbliste.',
    },
    fr: { nav: 'Personnages et thèmes', choose: 'Choisir un modèle', all: 'Voir tous les modèles', english: 'anglais', related: 'Guides et modèles associés', library: 'Modèles', additional: 'Un autre modèle de Noël',
        additionalHalloween: 'Autres modèles d’Halloween',
        title: (name: string) => `Modèles ${name} en perles à repasser`,
        intro: (name: string, count: number, subjects: string) => `${count} modèles ${name} avec ${subjects}. Choisissez une image pour consulter sa grille, ses couleurs et ses fichiers à imprimer, ou retouchez le motif dans l’éditeur en français.`,
        fewest: (name: string, colors: number, beads: number) => `${name} utilise ${colors} couleurs Perler et ${beads} perles : c’est la plus petite liste de couleurs de cette collection. Vérifiez la disposition et les éventuelles jonctions fragiles avant de commencer.`,
        sizes: 'Chaque fiche indique les dimensions de la grille, les quantités par couleur et les fichiers à imprimer. Les cases vides restent sans perle ; le nombre de picots n’est pas le nombre de perles nécessaires.',
        brand: 'Pour Hama ou Artkal, ouvrez le modèle dans l’éditeur en français et changez de marque. Gardez les réglages de la plaque pour conserver les positions et les cases vides, puis exportez une nouvelle liste de couleurs.',
    },
    ja: { nav: 'キャラクター・テーマ', choose: '図案を選ぶときのポイント', all: 'すべての図案を見る', english: '英語', related: '関連する図案・ガイド', library: '図案一覧', additional: '追加のクリスマス図案',
        additionalHalloween: '追加のハロウィン図案',
        title: (name: string) => `${name}のアイロンビーズ図案`,
        intro: (name: string, count: number, subjects: string) => `${subjects}など、${name}の図案${count}点を掲載しています。画像を選ぶと、マス目・色と数量・印刷用ファイルを確認できます。日本語エディターで配色や形を変更することもできます。`,
        fewest: (name: string, colors: number, beads: number) => `${name}はPerlerの${colors}色・${beads}個を使い、このコレクションで最も色数が少ない図案です。始める前に配置や細い接続部分の注意事項を確認してください。`,
        sizes: '各図案の詳細ページには、マス目の大きさ、色別の必要数、印刷用ファイルがあります。空白のマスにはビーズを置きません。プレートのマス数と必要なビーズ数は異なります。',
        brand: 'HamaやArtkalを使う場合は、日本語エディターで図案を開き、ブランドを変更してください。プレート設定を変えなければビーズの位置と空白を保てます。その後、新しい色表を書き出します。',
    },
};

export const collectionSubjects: Record<PatternLocale, Record<string, string>> = {
    de: { 'stardew-valley': 'blauen, weißen, braunen und goldenen Hühnern, Void Chicken und einem grünen Junimo', pokemon: 'Pikachu, Evoli und seinen Entwicklungen, Gengar, Starter-Pokémon und weiteren Figuren', minecraft: 'Diamant- und Netheritwerkzeugen, Erzen, Lebensmitteln und weiteren Gegenständen', 'super-mario': 'Mario, Luigi, Pilzen, einem Superstern, Gegnern und weiteren klassischen Spielfiguren', kirby: 'Kirby, Waddle Dee und Waddle Doo aus Kirby’s Adventure' },
    fr: { 'stardew-valley': 'des poules bleues, blanches, brunes et dorées, Void Chicken et un Junimo vert', pokemon: 'Pikachu, Évoli et ses évolutions, Ectoplasma, des Pokémon de départ et d’autres personnages', minecraft: 'des outils en diamant et en Netherite, des minerais, des aliments et d’autres objets', 'super-mario': 'Mario, Luigi, des champignons, une Super étoile, des ennemis et d’autres personnages classiques', kirby: 'Kirby, Waddle Dee et Waddle Doo de Kirby’s Adventure' },
    ja: { 'stardew-valley': '青・白・茶色・金色のニワトリ、Void Chicken、緑のジュニモ', pokemon: 'ピカチュウ、イーブイとその進化形、ゲンガー、最初のパートナーになるポケモン', minecraft: 'ダイヤモンドやネザライトの道具、鉱石、食べ物、各種アイテム', 'super-mario': 'マリオ、ルイージ、キノコ、スーパースター、敵キャラクター', kirby: '『星のカービィ 夢の泉の物語』のカービィ、ワドルディ、ワドルドゥ' },
};

export const topicMessages: Record<PatternLocale, Record<string, TopicCopy>> = {
    de: {
        small: smallPatternCopy.de,
        easy: {
            label: 'Einfache Vorlagen', title: 'Einfache Bügelperlen-Vorlagen', description: 'Bügelperlen-Vorlagen mit höchstens vier Farben für eine 29 × 29-Midi-Platte: Kirby, Ditto, Mario-Motive und mehr. Kostenlose Raster und Druckdateien.',
            intro: 'Beginne mit wenigen Farben und einer einzelnen Steckplatte. Diese Vorlagen verwenden höchstens vier Farben auf einem 29 × 29-Midi-Raster. Wähle ein Motiv für PDF, Farbliste und bearbeitbare Vorlage.', heading: 'Deine erste Vorlage auswählen',
            notes: ['Die Auswahl hat kurze Farblisten, einteilige Formen und passt jeweils auf eine Platte. Bob-omb verwendet zwei Farben, Ditto vier. Wenige Farben erleichtern das Sortieren, garantieren aber kein einfaches Bügelergebnis.', 'Der Fußball besteht nur aus Schwarz und Weiß, belegt aber 501 Perlenpositionen. Er eignet sich für ein größeres Projekt auf einer Platte; kleinere Figuren benötigen weniger Perlen.', 'Prüfe die Mengen und Herstellungshinweise der einzelnen Vorlage. Die Motive wurden nicht mit echten Perlen gebaut oder bügelgetestet. Sei beim Abheben und Bügeln vorsichtig und beachte die Anleitung deiner Perlenmarke.', 'Die Dateien verwenden Perler Midi. Ein kleines Motiv ist keine Vorlage für Mini-Perlen. Drucke mit 100 % / tatsächlicher Größe und prüfe die 50-mm-Messlinie und deine Plattengröße.'],
        },
        cute: {
            label: 'Niedliche Motive', title: 'Niedliche Bügelperlen-Motive', description: 'Niedliche Bügelperlen-Ideen mit Pikachu, Evoli, Kirby, Ditto und dem blauen Huhn aus Stardew Valley. Kostenlose Vorlagen zum Drucken und Bearbeiten.',
            intro: 'Wähle eine Lieblingsfigur für dein nächstes Projekt: Pikachu, Evoli, Kirby und weitere niedliche Motive. Öffne ein Bild, um das Raster herunterzuladen oder die Farben zu ändern.', heading: 'Vom Motiv zum fertigen Projekt',
            notes: ['Hier findest du Figuren aus Pokémon, Kirby und Stardew Valley. Auf der Detailseite stehen die verwendete Referenzversion und Quelle, damit du das Motiv vor dem Start prüfen kannst.', 'Kirby und Ditto haben kurze Farblisten. Pikachu, Evoli und das blaue Huhn besitzen dünne Verbindungen mit nur einer Perle. Lies die Hinweise, bevor du ein Stück zum Anfassen oder Bewegen planst. Die Vorlagen wurden nicht mit echten Perlen gebaut oder bügelgetestet.', 'Alle Motive passen auf eine 29 × 29-Midi-Platte. Die kleinen Zeichnungen sind keine Mini-Perlen-Schablonen. Drucke mit 100 % / tatsächlicher Größe und kontrolliere die Messlinie.', 'Die Downloads verwenden Perler-Farben. Für Hama oder Artkal öffne die Vorlage im Editor, ändere die Marke bei unveränderten Platteneinstellungen und exportiere ein neues Raster.'],
        },
        halloween: {
            label: 'Halloween', title: 'Halloween-Bügelperlen-Vorlagen', description: 'Drei kostenlose Halloween-Vorlagen: Geist, Fledermaus und Geisterkatze mit Kürbis. Druckbare PDFs, Rasterbilder und bearbeitbare Motive für eine Platte.',
            intro: 'Wähle einen weißen Geist, eine violett-schwarze Fledermaus oder eine Geisterkatze mit Kürbis. Jedes Motiv passt auf eine 29 × 29-Midi-Platte. Die Detailseite enthält PDF, Raster-PNG, Farbliste und Editorzugang.', heading: 'Dein Halloween-Motiv auswählen',
            notes: ['Der Geist benötigt Schwarz und Weiß, die Fledermaus drei Farben. Die Geisterkatze mit Kürbis verwendet sieben Farben für Gesicht, Kürbis und Schattierungen. Vergleiche die jeweilige Liste mit deinen Vorräten.', 'Alle drei sind eigene flache Motive für eine quadratische Platte. Sie wurden nicht mit echten Perlen gebaut, gebügelt oder zum Aufhängen getestet. Die Vorlagen enthalten keine Ständer oder Anleitung für einen dreidimensionalen Aufbau.', 'Die Dateien verwenden Perler Midi. Drucke das PDF mit 100 % / tatsächlicher Größe und prüfe die 50-mm-Messlinie. Das PNG dient zum Abzählen nach Zeilen und Spalten, nicht als Schablone in Originalgröße.', 'Für Hama oder Artkal ändere im Editor die Marke und behalte die Platteneinstellungen bei. Exportiere danach ein neues Raster mit passender Farbliste.'],
        },
        christmas: {
            label: 'Weihnachten', title: 'Weihnachts-Bügelperlen-Vorlagen', description: 'Drei kostenlose Weihnachtsmotive aus Bügelperlen: Weihnachtsbaum, Schneemann und Lebkuchenmann. Druckvorlagen, Farblisten und Editor für eine Midi-Platte.',
            intro: 'Wähle einen Weihnachtsbaum, Schneemann oder Lebkuchenmann für dein Festtagsprojekt. Jedes eigene Motiv passt auf eine 29 × 29-Midi-Platte. Öffne ein Bild für PDF, Raster-PNG, Farben und bearbeitbare Vorlage.', heading: 'Dein Weihnachtsmotiv anfertigen',
            notes: ['Die Downloads verwenden Perler Midi und eine 29 × 29-Platte. Der Lebkuchenmann benötigt drei Farben, Baum und Schneemann jeweils vier. Prüfe die einzelne Farbliste vor dem Start.', 'Die eigenen Motive sind flach und wurden nicht mit echten Perlen gebaut, gebügelt oder zum Aufhängen getestet. Prüfe die Festigkeit und Befestigung, bevor du ein fertiges Stück aufhängst.', 'Drucke das PDF mit 100 % / tatsächlicher Größe und kontrolliere die 50-mm-Messlinie. Das PNG ist eine Zählvorlage, keine Schablone in Originalgröße.', 'Für Hama oder Artkal öffne das Motiv im Editor, ändere die Marke bei unveränderten Platteneinstellungen und exportiere eine neue Vorlage.'],
        },
    },
    fr: {
        small: smallPatternCopy.fr,
        easy: {
            label: 'Modèles faciles', title: 'Modèles faciles en perles à repasser', description: 'Des modèles gratuits avec quatre couleurs maximum sur une plaque Midi de 29 × 29 cases : Kirby, Métamorph, Mario et d’autres motifs à imprimer.',
            intro: 'Commencez avec peu de couleurs et une seule plaque. Ces modèles utilisent quatre couleurs maximum sur une plaque Midi de 29 × 29 cases. Choisissez une image pour son PDF, ses couleurs et son projet modifiable.', heading: 'Choisir son premier modèle',
            notes: ['Cette sélection privilégie peu de couleurs, une seule plaque et des formes reliées. Bob-omb utilise deux couleurs, Métamorph quatre. Moins de couleurs facilite le tri, mais ne garantit pas une finition facile.', 'Le ballon de football n’utilise que du noir et du blanc, mais occupe 501 positions. Choisissez-le pour un projet plus rempli sur une seule plaque ; les petits personnages demandent moins de perles.', 'Vérifiez les quantités et les conseils de chaque fiche. Ces motifs n’ont pas été assemblés avec de vraies perles ni testés au fer. Soulevez et repassez avec précaution, en suivant la notice de votre marque.', 'Les fichiers utilisent des couleurs Perler Midi. Un petit dessin n’est pas un gabarit pour perles Mini. Imprimez à 100 % / taille réelle et vérifiez le repère de 50 mm et la taille de votre plaque.'],
        },
        cute: {
            label: 'Motifs mignons', title: 'Idées de perles à repasser mignonnes', description: 'Pikachu, Évoli, Kirby, Métamorph et la poule bleue de Stardew Valley : des idées mignonnes avec grilles gratuites à imprimer ou à modifier.',
            intro: 'Choisissez votre personnage préféré pour votre prochain projet. Retrouvez Pikachu, Évoli, Kirby et d’autres motifs mignons, puis ouvrez une image pour télécharger sa grille ou modifier ses couleurs.', heading: 'Passer de l’idée au projet',
            notes: ['La collection rassemble des personnages de Pokémon, Kirby et Stardew Valley. Chaque fiche précise la version et la source de l’image de référence pour vérifier le dessin avant de préparer les perles.', 'Kirby et Métamorph ont peu de couleurs. Pikachu, Évoli et la poule bleue ont des jonctions d’une seule perle : lisez les conseils avant de prévoir une pièce à déplacer ou à manipuler. Les modèles n’ont pas été assemblés ni testés au fer.', 'Chaque dessin tient sur une plaque Midi de 29 × 29 cases. Leur petite taille ne signifie pas que les fichiers conviennent aux perles Mini. Imprimez à 100 % / taille réelle et contrôlez le repère.', 'Les fichiers utilisent des couleurs Perler. Pour Hama ou Artkal, ouvrez le modèle dans l’éditeur, changez de marque en gardant les réglages de la plaque, puis exportez une nouvelle grille.'],
        },
        halloween: {
            label: 'Halloween', title: 'Modèles de perles à repasser pour Halloween', description: 'Trois modèles Halloween gratuits : fantôme, chauve-souris et chat fantôme avec citrouille. PDFs, grilles et projets modifiables pour une plaque Midi.',
            intro: 'Choisissez un fantôme blanc, une chauve-souris violette et noire ou un chat fantôme avec une citrouille. Chaque motif tient sur une plaque Midi de 29 × 29 cases. Ouvrez sa fiche pour le PDF, la grille PNG, les couleurs et l’éditeur.', heading: 'Choisir un motif d’Halloween',
            notes: ['Le fantôme utilise du noir et du blanc ; la chauve-souris, trois couleurs. Le chat fantôme et sa citrouille demandent sept couleurs pour le visage, la citrouille et les ombres. Comparez la liste à vos perles disponibles.', 'Les trois motifs sont des créations originales plates pour une plaque carrée. Ils n’ont pas été assemblés, testés au fer ou suspendus. Les grilles ne comprennent ni support ni instructions de montage en trois dimensions.', 'Les fichiers utilisent Perler Midi. Imprimez le PDF à 100 % / taille réelle et vérifiez le repère de 50 mm. Suivez le PNG par lignes et colonnes : ce n’est pas un gabarit à taille réelle.', 'Pour Hama ou Artkal, changez de marque dans l’éditeur tout en gardant les réglages de la plaque. Exportez ensuite une nouvelle grille avec sa liste de couleurs.'],
        },
        christmas: {
            label: 'Noël', title: 'Modèles de Noël en perles à repasser', description: 'Sapin, bonhomme de neige et bonhomme en pain d’épices : trois motifs originaux gratuits pour une plaque Midi, avec PDF, grille et projet modifiable.',
            intro: 'Choisissez un sapin, un bonhomme de neige ou un bonhomme en pain d’épices pour les fêtes. Chaque motif original tient sur une plaque Midi de 29 × 29 cases. Ouvrez l’image pour les fichiers, les couleurs et l’éditeur.', heading: 'Réaliser votre motif de Noël',
            notes: ['Les fichiers utilisent Perler Midi sur une plaque de 29 × 29 cases. Le bonhomme en pain d’épices utilise trois couleurs ; le sapin et le bonhomme de neige, quatre. Consultez la liste du modèle choisi.', 'Ce sont des motifs originaux plats. Ils n’ont pas été assemblés, testés au fer ou suspendus. Si vous souhaitez suspendre une pièce finie, vérifiez sa solidité et sa fixation.', 'Imprimez le PDF à 100 % / taille réelle et contrôlez le repère de 50 mm. Le PNG est une grille à suivre, pas un gabarit à taille réelle.', 'Pour Hama ou Artkal, ouvrez le motif dans l’éditeur, changez de marque en conservant les réglages de la plaque, puis exportez une nouvelle grille.'],
        },
    },
    ja: {
        small: smallPatternCopy.ja,
        easy: {
            label: '簡単な図案', title: '少ない色で作る簡単なアイロンビーズ図案', description: '4色以内・29×29マスのミディプレート1枚で作る図案。カービィ、メタモン、マリオのモチーフなど、無料の図案と印刷用ファイルを選べます。',
            intro: '少ない色とプレート1枚から始めたい方向けの図案です。いずれも4色以内で、29×29マスのミディ用プレートに収まります。画像を選ぶと、PDF・色表・編集用プロジェクトを開けます。', heading: '最初の図案の選び方',
            notes: ['色数が少なく、1枚のプレートに収まり、形がつながっている図案を選んでいます。ボムへいは2色、メタモンは4色です。色数が少ないと仕分けは楽になりますが、仕上げが必ず簡単になるわけではありません。', 'サッカーボールは黒と白の2色ですが、501個のビーズを使います。プレート1枚を広く使う作品向けです。小さなキャラクターなら必要な個数を抑えられます。', '各図案で個数と制作上の注意を確認してください。実物のビーズでの組み立て・アイロン仕上げは検証していません。持ち上げやアイロン作業に注意し、使うブランドの説明に従ってください。', '配色はPerler Midiです。小さな図柄でもミニビーズ用の原寸図案ではありません。100％・実際のサイズで印刷し、50 mmの目盛りとプレートの大きさを確認してください。'],
        },
        cute: {
            label: 'かわいい図案', title: 'かわいいアイロンビーズ図案・アイデア', description: 'ピカチュウ、イーブイ、カービィ、メタモン、Stardew Valleyの青いニワトリなど。かわいいキャラクターの無料図案を保存・編集できます。',
            intro: '次に作りたいキャラクターを選びましょう。ピカチュウ、イーブイ、カービィなどの画像から詳細を開き、図案を保存したり配色を変更したりできます。', heading: 'かわいい図案を作品にするとき',
            notes: ['ポケモン、星のカービィ、Stardew Valleyのキャラクターを集めています。各詳細ページに参照画像のバージョンと出典があるので、ビーズを用意する前に形を確認できます。', 'カービィやメタモンは色数が少ない図案です。ピカチュウ、イーブイ、青いニワトリにはビーズ1個幅の細い接続部分があります。動かしたり手に持ったりする作品にする前に注意事項を確認してください。実物での組み立て・アイロン検証はしていません。', 'すべて29×29マスのミディ用プレート1枚に収まります。小さな図案でもミニビーズ用の原寸シートではありません。100％・実際のサイズで印刷し、目盛りを確認してください。', 'ダウンロードはPerlerの配色です。HamaやArtkalを使う場合は、エディターでプレート設定を保ったままブランドを変え、新しい図案を書き出してください。'],
        },
        halloween: {
            label: 'ハロウィン', title: 'ハロウィンのアイロンビーズ図案', description: '白いゴースト、コウモリ、カボチャを抱えたゴーストキャットの無料図案3点。ミディプレート1枚のPDF・画像・編集用プロジェクト。',
            intro: '白いゴースト、紫と黒のコウモリ、カボチャを抱えたゴーストキャットから選べます。どれも29×29マスのミディプレート1枚用です。詳細ページでPDF、マス目付きPNG、色表、編集用プロジェクトを開けます。', heading: 'ハロウィンの図案を選ぶ',
            notes: ['ゴーストは黒と白、コウモリは3色です。ゴーストキャットとカボチャは顔・カボチャ・陰影に7色を使います。各色表と手持ちのビーズを確認してください。', '3点とも四角いプレート1枚用の平面オリジナル図案です。実物での組み立て・アイロン仕上げ・吊り下げは検証していません。スタンドや立体作品の組み立て説明は含みません。', '配色はPerler Midiです。PDFを100％・実際のサイズで印刷し、50 mmの目盛りを確認してください。PNGは行と列を数えて作るための参考図で、原寸印刷用ではありません。', 'HamaやArtkalを使う場合はエディターでブランドを変更し、プレート設定は維持してください。その後、対応する色表と新しい図案を書き出します。'],
        },
        christmas: {
            label: 'クリスマス', title: 'クリスマスのアイロンビーズ図案', description: 'クリスマスツリー、雪だるま、ジンジャーブレッドマンの無料図案3点。ミディプレート1枚で作るオリジナル図案と印刷用ファイル。',
            intro: 'クリスマスツリー、雪だるま、ジンジャーブレッドマンから選べます。オリジナル図案はそれぞれ29×29マスのミディ用プレート1枚に収まります。画像からPDF、PNG、色表、編集用プロジェクトを開けます。', heading: 'クリスマスの図案を作る',
            notes: ['配色はPerler Midi、プレートは29×29マスです。ジンジャーブレッドマンは3色、ツリーと雪だるまは4色を使います。各図案の色表を見てからビーズを用意してください。', '平面のオリジナル図案です。実物での組み立て・アイロン仕上げ・吊り下げは検証していません。完成品を吊るす場合は、強度と取り付け部分を確認してください。', 'PDFを100％・実際のサイズで印刷し、50 mmの目盛りを確認してください。PNGは図案を見て数えるためのもので、原寸の配置シートではありません。', 'HamaやArtkalを使う場合はエディターで図案を開き、プレート設定を変えずにブランドを変更して、新しい図案を書き出してください。'],
        },
    },
};
