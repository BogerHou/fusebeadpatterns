import type { PatternLocale } from './localized-content';

type Translation = Record<PatternLocale, string>;

// Exact, reviewed source descriptions. A changed source needs a new review;
// matching a few words must not silently assign it another source's provenance.
const sources = new Map<string, Translation>([
    [
        'Hand-authored Creeper face fan art with a simplified green-and-black bead palette. The official Minecraft article is a character identity reference, not a licensed source file. This unofficial pattern is by Fuse Bead Patterns and is not approved by or associated with Mojang or Microsoft. Character rights belong to Mojang/Microsoft; permission for public redistribution is unconfirmed.',
        {
            de: 'Von Hand erstellte Fan-Art des Creeper-Gesichts mit vereinfachten grünen und schwarzen Perlenfarben. Der offizielle Minecraft-Artikel dient zur Identifizierung der Figur, nicht als lizenzierte Quelldatei. Diese inoffizielle Vorlage stammt von Fuse Bead Patterns und ist weder von Mojang oder Microsoft genehmigt noch mit ihnen verbunden. Die Figurenrechte liegen bei Mojang/Microsoft; eine Erlaubnis zur öffentlichen Weiterverbreitung ist nicht bestätigt.',
            fr: 'Fan art du visage du Creeper dessiné à la main avec une palette simplifiée de perles vertes et noires. L’article officiel de Minecraft sert à identifier le personnage, pas de fichier source sous licence. Ce modèle non officiel de Fuse Bead Patterns n’est ni approuvé par Mojang ou Microsoft, ni associé à ces sociétés. Les droits du personnage appartiennent à Mojang/Microsoft ; l’autorisation de redistribution publique n’est pas confirmée.',
            ja: '緑と黒の簡略化したビーズ配色で、クリーパーの顔を手作業で図案化したファンアートです。Minecraft公式記事はキャラクターの確認用の参照であり、使用許諾された画像素材ではありません。Fuse Bead Patternsによる非公式図案で、MojangまたはMicrosoftの承認・提携はありません。キャラクターの権利はMojang/Microsoftに帰属し、公開再配布の許可は確認されていません。',
        },
    ],
    [
        'Based on this community-maintained Wiki game depiction. The verified 3× display enlargement was reduced to its native pixel grid without interpolation.',
        {
            de: 'Grundlage ist diese von der Wiki-Community gepflegte Darstellung aus dem Spiel. Die nachweislich 3× vergrößerte Anzeige wurde ohne Interpolation auf das ursprüngliche Pixelraster zurückgeführt.',
            fr: 'Le modèle s’appuie sur cette représentation du jeu conservée par la communauté du Wiki. L’image affichée, dont l’agrandissement 3× a été vérifié, a été ramenée à sa grille de pixels d’origine sans interpolation.',
            ja: 'コミュニティが管理するWikiのゲーム画像をもとにしています。表示用に3×拡大されていることを確認し、補間せずに元のピクセル格子へ戻しました。',
        },
    ],
    [
        'Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board.',
        {
            de: 'Grundlage ist das 32 × 32 Pixel große Menüsymbol aus Gen V in der archivierten Repository-Version. Vor dem Zentrieren auf der Steckplatte wurden nur transparente Ränder zugeschnitten.',
            fr: 'Le modèle s’appuie sur l’icône de menu de 32 × 32 pixels de Gen V dans la version archivée du dépôt. Seules les marges transparentes ont été retirées avant de centrer le motif sur la plaque.',
            ja: 'リポジトリのアーカイブ版にある、第5世代（Gen V）の32 × 32ピクセルのメニューアイコンをもとにしています。透明な余白だけを切り取り、図柄をプレートの中央に配置しました。',
        },
    ],
    [
        'Based on the original Java Edition 1.21.1 item texture in the pinned archive. Only transparent margins were cropped before centering it on the board.',
        {
            de: 'Grundlage ist die ursprüngliche Gegenstandstextur aus Java Edition 1.21.1 im Archiv mit festgelegter Version. Vor dem Zentrieren auf der Steckplatte wurden nur transparente Ränder zugeschnitten.',
            fr: 'Le modèle s’appuie sur la texture d’objet d’origine de Java Edition 1.21.1 dans l’archive fixée à une version précise. Seules les marges transparentes ont été retirées avant de centrer l’image sur la plaque.',
            ja: 'バージョンを固定したアーカイブ内の、Java Edition 1.21.1の元のアイテムテクスチャをもとにしています。透明な余白だけを切り取り、プレートの中央に配置しました。',
        },
    ],
    [
        'Based on the Java Edition 1.21.1 health display: the original container and full-heart textures are overlaid at their native size. The combined outline and color regions are preserved.',
        {
            de: 'Grundlage ist die Lebensanzeige aus Java Edition 1.21.1: Die ursprünglichen Texturen für den Herzrahmen und das volle Herz wurden in ihrer Originalgröße übereinandergelegt. Der daraus entstandene Umriss und die Farbbereiche bleiben erhalten.',
            fr: 'Le modèle s’appuie sur l’affichage de la santé de Java Edition 1.21.1 : les textures d’origine du cadre et du cœur plein sont superposées à leur taille native. Le contour et les zones de couleur ainsi obtenus sont conservés.',
            ja: 'Java Edition 1.21.1の体力表示をもとにしています。元のハートの枠と満タンのハートのテクスチャを、それぞれ元のサイズのまま重ねました。合成後の輪郭と色の領域を保っています。',
        },
    ],
    [
        'Based on the original Java Edition 1.21.1 block texture. This is one flat block face, not a three-dimensional model.',
        {
            de: 'Grundlage ist die ursprüngliche Blocktextur aus Java Edition 1.21.1. Dargestellt ist eine einzelne flache Blockseite, kein dreidimensionales Modell.',
            fr: 'Le modèle s’appuie sur la texture de bloc d’origine de Java Edition 1.21.1. Il représente une seule face plane du bloc, et non un modèle en trois dimensions.',
            ja: 'Java Edition 1.21.1の元のブロックテクスチャをもとにしています。ブロックの1つの面を平面で表したもので、立体モデルではありません。',
        },
    ],
    [
        'Based on the Kirby’s Adventure sprite archived by the community Wiki. This shows normal Kirby facing right, with the original occupied pixels and color regions preserved.',
        {
            de: 'Grundlage ist der von der Wiki-Community archivierte Sprite aus Kirby’s Adventure. Zu sehen ist der normale Kirby mit Blick nach rechts; die ursprünglich belegten Pixel und Farbbereiche bleiben erhalten.',
            fr: 'Le modèle s’appuie sur le sprite de Kirby’s Adventure archivé par la communauté du Wiki. Il montre Kirby normal tourné vers la droite ; les pixels occupés et les zones de couleur d’origine sont conservés.',
            ja: 'コミュニティのWikiに保存されたKirby’s Adventureのスプライトをもとにしています。右を向いた通常のカービィで、元の画像で色があるピクセルの位置と色の領域を保っています。',
        },
    ],
    [
        'Based on the original Super Mario Bros. Super Mushroom sprite archived by the community Wiki. The original occupied pixels and color regions are preserved.',
        {
            de: 'Grundlage ist der ursprüngliche Superpilz-Sprite aus Super Mario Bros., archiviert von der Wiki-Community. Die ursprünglich belegten Pixel und Farbbereiche bleiben erhalten.',
            fr: 'Le modèle s’appuie sur le sprite d’origine du Super Champignon de Super Mario Bros., archivé par la communauté du Wiki. Les pixels occupés et les zones de couleur d’origine sont conservés.',
            ja: 'コミュニティのWikiに保存された、Super Mario Bros.の元のスーパーキノコのスプライトをもとにしています。元の画像で色があるピクセルの位置と色の領域を保っています。',
        },
    ],
    [
        'Based on the original Super Mario Bros. Super Star sprite archived by the community Wiki. This is one static color frame; the source file records the Nestopia palette.',
        {
            de: 'Grundlage ist der ursprüngliche Superstern-Sprite aus Super Mario Bros., archiviert von der Wiki-Community. Gezeigt wird ein einzelnes statisches Farbbild; die Quelldatei nennt die Nestopia-Palette.',
            fr: 'Le modèle s’appuie sur le sprite d’origine de la Super étoile de Super Mario Bros., archivé par la communauté du Wiki. Il montre une seule image fixe colorée ; le fichier source indique la palette Nestopia.',
            ja: 'コミュニティのWikiに保存された、Super Mario Bros.の元のスーパースターのスプライトをもとにしています。1フレームの配色を静止画として使い、ソースファイルにはNestopiaのパレットが記載されています。',
        },
    ],
    [
        'Based on the original carved pumpkin front-face block texture from Minecraft Java Edition 1.21.1, shown as a flat square.',
        {
            de: 'Grundlage ist die ursprüngliche Textur der Vorderseite des geschnitzten Kürbisses aus Minecraft Java Edition 1.21.1, dargestellt als flaches Quadrat.',
            fr: 'Le modèle s’appuie sur la texture d’origine de la face avant de la citrouille sculptée de Minecraft Java Edition 1.21.1, représentée comme un carré plat.',
            ja: 'Minecraft Java Edition 1.21.1の元のくり抜かれたカボチャの正面テクスチャを、平面の正方形として表しています。',
        },
    ],
    [
        'The Super Mario Wiki file identifies this as Small Mario from Super Mario Bros. on the NES. The native standing sprite is preserved.',
        {
            de: 'Die Datei im Super Mario Wiki bezeichnet dies als den kleinen Mario aus Super Mario Bros. auf dem NES. Der stehende Sprite bleibt in seinem ursprünglichen Pixelraster erhalten.',
            fr: 'Le fichier du Super Mario Wiki identifie ce sprite comme le petit Mario de Super Mario Bros. sur NES. Le sprite debout est conservé dans sa grille de pixels d’origine.',
            ja: 'Super Mario Wikiのファイル情報では、NES版Super Mario Bros.の小さいマリオとされています。立ち姿のスプライトを元のピクセル格子で保っています。',
        },
    ],
    [
        "The Super Mario Wiki identifies this as Small Luigi from Super Mario Bros. on the NES. Its file information records Mario's native shape rendered with Luigi's game palette; the current file history specifies the Nestopia palette.",
        {
            de: 'Das Super Mario Wiki bezeichnet dies als den kleinen Luigi aus Super Mario Bros. auf dem NES. Laut Dateiinformationen wird Marios ursprüngliche Form mit Luigis Spielpalette dargestellt; der aktuelle Dateiverlauf nennt die Nestopia-Palette.',
            fr: 'Le Super Mario Wiki identifie ce sprite comme le petit Luigi de Super Mario Bros. sur NES. Les informations du fichier indiquent que la forme d’origine de Mario est affichée avec la palette de Luigi dans le jeu ; l’historique actuel du fichier précise la palette Nestopia.',
            ja: 'Super Mario Wikiでは、NES版Super Mario Bros.の小さいルイージとされています。ファイル情報には、マリオの元の形をルイージのゲーム内パレットで描いたものと記載され、現在のファイル履歴にはNestopiaのパレットが指定されています。',
        },
    ],
    [
        'The Super Mario Wiki identifies this green Koopa Troopa sprite as an extract from a Super Mario Bros. NES World 2-1 screenshot.',
        {
            de: 'Laut Super Mario Wiki wurde dieser Sprite des grünen Koopa Troopa aus einem Screenshot von Welt 2-1 in Super Mario Bros. auf dem NES ausgeschnitten.',
            fr: 'Le Super Mario Wiki indique que ce sprite de Koopa Troopa vert a été extrait d’une capture d’écran du monde 2-1 de Super Mario Bros. sur NES.',
            ja: 'Super Mario Wikiでは、この緑のノコノコのスプライトは、NES版Super Mario Bros.のワールド2-1のスクリーンショットから切り出したものとされています。',
        },
    ],
    [
        'The Super Mario Wiki identifies this as a red Cheep Cheep sprite from Super Mario Bros. on the NES, isolated from a game screenshot.',
        {
            de: 'Das Super Mario Wiki bezeichnet dies als einen Sprite des roten Cheep Cheep aus Super Mario Bros. auf dem NES, freigestellt aus einem Spiel-Screenshot.',
            fr: 'Le Super Mario Wiki identifie ce sprite comme un Cheep Cheep rouge de Super Mario Bros. sur NES, isolé à partir d’une capture d’écran du jeu.',
            ja: 'Super Mario Wikiでは、NES版Super Mario Bros.のゲームのスクリーンショットから切り出した赤いプクプクのスプライトとされています。',
        },
    ],
    [
        'The Super Mario Wiki file identifies this as a Bullet Bill sprite from Super Mario Bros. on the NES. The isolated native sprite is preserved.',
        {
            de: 'Die Datei im Super Mario Wiki bezeichnet dies als einen Kugelwilli-Sprite aus Super Mario Bros. auf dem NES. Der freigestellte Sprite bleibt in seinem ursprünglichen Pixelraster erhalten.',
            fr: 'Le fichier du Super Mario Wiki identifie ce sprite comme un Bill Balle de Super Mario Bros. sur NES. Le sprite isolé est conservé dans sa grille de pixels d’origine.',
            ja: 'Super Mario Wikiのファイル情報では、NES版Super Mario Bros.のキラーのスプライトとされています。切り出したスプライトを元のピクセル格子で保っています。',
        },
    ],
    [
        'The Super Mario Wiki identifies this Blooper sprite as being from Super Mario Bros. on the NES, isolated from a game screenshot.',
        {
            de: 'Laut Super Mario Wiki stammt dieser Blooper-Sprite aus Super Mario Bros. auf dem NES und wurde aus einem Spiel-Screenshot freigestellt.',
            fr: 'Le Super Mario Wiki indique que ce sprite de Blooper provient de Super Mario Bros. sur NES et a été isolé à partir d’une capture d’écran du jeu.',
            ja: 'Super Mario Wikiでは、このゲッソーのスプライトは、NES版Super Mario Bros.のゲームのスクリーンショットから切り出したものとされています。',
        },
    ],
    [
        'The Super Mario Wiki identifies this as a Piranha Plant sprite from Super Mario Bros. on the NES. Its file history references the Nestopia palette.',
        {
            de: 'Das Super Mario Wiki bezeichnet dies als einen Piranha-Pflanzen-Sprite aus Super Mario Bros. auf dem NES. Der Dateiverlauf verweist auf die Nestopia-Palette.',
            fr: 'Le Super Mario Wiki identifie ce sprite comme une Plante Piranha de Super Mario Bros. sur NES. L’historique du fichier mentionne la palette Nestopia.',
            ja: 'Super Mario Wikiでは、NES版Super Mario Bros.のパックンフラワーのスプライトとされています。ファイル履歴にはNestopiaのパレットへの言及があります。',
        },
    ],
    [
        'The Super Mario Wiki identifies this as a Fire Flower sprite from Super Mario Bros. on the NES. This is one static color phase; the file history references the Nestopia palette.',
        {
            de: 'Das Super Mario Wiki bezeichnet dies als einen Feuerblumen-Sprite aus Super Mario Bros. auf dem NES. Gezeigt wird eine einzelne statische Farbphase; der Dateiverlauf verweist auf die Nestopia-Palette.',
            fr: 'Le Super Mario Wiki identifie ce sprite comme une Fleur de feu de Super Mario Bros. sur NES. Une seule phase de couleur est représentée en image fixe ; l’historique du fichier mentionne la palette Nestopia.',
            ja: 'Super Mario Wikiでは、NES版Super Mario Bros.のファイアフラワーのスプライトとされています。1つの配色段階を静止画として使い、ファイル履歴にはNestopiaのパレットへの言及があります。',
        },
    ],
    [
        'The Super Mario Wiki identifies this as the 1-Up Mushroom sprite from Super Mario Bros. on the NES. The file history references the Nestopia palette.',
        {
            de: 'Das Super Mario Wiki bezeichnet dies als den 1-Up-Pilz-Sprite aus Super Mario Bros. auf dem NES. Der Dateiverlauf verweist auf die Nestopia-Palette.',
            fr: 'Le Super Mario Wiki identifie ce sprite comme le Champignon 1-Up de Super Mario Bros. sur NES. L’historique du fichier mentionne la palette Nestopia.',
            ja: 'Super Mario Wikiでは、NES版Super Mario Bros.の1UPキノコのスプライトとされています。ファイル履歴にはNestopiaのパレットへの言及があります。',
        },
    ],
    [
        'The Super Mario Wiki identifies this as a Question Block sprite from Super Mario Bros. on the NES. One static color phase is retained, including the original transparent corner pixels.',
        {
            de: 'Das Super Mario Wiki bezeichnet dies als einen Fragezeichen-Block-Sprite aus Super Mario Bros. auf dem NES. Eine einzelne statische Farbphase bleibt erhalten, einschließlich der ursprünglichen transparenten Eckpixel.',
            fr: 'Le Super Mario Wiki identifie ce sprite comme un Bloc point d’interrogation de Super Mario Bros. sur NES. Une seule phase de couleur est conservée en image fixe, avec les pixels transparents d’origine aux coins.',
            ja: 'Super Mario Wikiでは、NES版Super Mario Bros.のハテナブロックのスプライトとされています。1つの配色段階を静止画として使い、元の角の透明なピクセルも保っています。',
        },
    ],
    [
        'The Super Mario Wiki identifies this as a Goomba sprite from Super Mario Bros. 3 on the NES. Its source is credited to The Spriters Resource.',
        {
            de: 'Das Super Mario Wiki bezeichnet dies als einen Goomba-Sprite aus Super Mario Bros. 3 auf dem NES. Als Quelle wird The Spriters Resource angegeben.',
            fr: 'Le Super Mario Wiki identifie ce sprite comme un Goomba de Super Mario Bros. 3 sur NES. La source indiquée est The Spriters Resource.',
            ja: 'Super Mario Wikiでは、NES版Super Mario Bros. 3のクリボーのスプライトとされ、出典にはThe Spriters Resourceが記載されています。',
        },
    ],
    [
        'The Super Mario Wiki identifies this as a Boo sprite from Super Mario Bros. 3 on the NES. The isolated native sprite is preserved.',
        {
            de: 'Das Super Mario Wiki bezeichnet dies als einen Boo-Sprite aus Super Mario Bros. 3 auf dem NES. Der freigestellte Sprite bleibt in seinem ursprünglichen Pixelraster erhalten.',
            fr: 'Le Super Mario Wiki identifie ce sprite comme un Boo de Super Mario Bros. 3 sur NES. Le sprite isolé est conservé dans sa grille de pixels d’origine.',
            ja: 'Super Mario Wikiでは、NES版Super Mario Bros. 3のテレサのスプライトとされています。切り出したスプライトを元のピクセル格子で保っています。',
        },
    ],
    [
        'The Super Mario Wiki identifies this as a Bob-omb sprite from Super Mario Bros. 3 on the NES. Its source is credited to The Spriters Resource.',
        {
            de: 'Das Super Mario Wiki bezeichnet dies als einen Bob-omb-Sprite aus Super Mario Bros. 3 auf dem NES. Als Quelle wird The Spriters Resource angegeben.',
            fr: 'Le Super Mario Wiki identifie ce sprite comme un Bob-omb de Super Mario Bros. 3 sur NES. La source indiquée est The Spriters Resource.',
            ja: 'Super Mario Wikiでは、NES版Super Mario Bros. 3のボムへいのスプライトとされ、出典にはThe Spriters Resourceが記載されています。',
        },
    ],
    [
        'WiKirby identifies this as a Waddle Dee sprite from Kirby’s Adventure on the NES and credits The Spriters Resource. This preserves that game’s pink palette layout.',
        {
            de: 'WiKirby bezeichnet dies als einen Waddle-Dee-Sprite aus Kirby’s Adventure auf dem NES und nennt The Spriters Resource als Quelle. Die Anordnung der rosa Farbbereiche aus diesem Spiel bleibt erhalten.',
            fr: 'WiKirby identifie ce sprite comme un Waddle Dee de Kirby’s Adventure sur NES et cite The Spriters Resource comme source. La répartition des couleurs de la palette rose de ce jeu est conservée.',
            ja: 'WiKirbyでは、NES版Kirby’s Adventureのワドルディのスプライトとされ、出典にはThe Spriters Resourceが記載されています。このゲームのピンク系の配色の配置を保っています。',
        },
    ],
    [
        'WiKirby identifies this as a Waddle Doo sprite from Kirby’s Adventure on the NES and credits The Spriters Resource. The isolated native sprite is preserved.',
        {
            de: 'WiKirby bezeichnet dies als einen Waddle-Doo-Sprite aus Kirby’s Adventure auf dem NES und nennt The Spriters Resource als Quelle. Der freigestellte Sprite bleibt in seinem ursprünglichen Pixelraster erhalten.',
            fr: 'WiKirby identifie ce sprite comme un Waddle Doo de Kirby’s Adventure sur NES et cite The Spriters Resource comme source. Le sprite isolé est conservé dans sa grille de pixels d’origine.',
            ja: 'WiKirbyでは、NES版Kirby’s Adventureのワドルドゥのスプライトとされ、出典にはThe Spriters Resourceが記載されています。切り出したスプライトを元のピクセル格子で保っています。',
        },
    ],
]);

// These item descriptions differ only in the named, reviewed inventory item.
// Keep the list explicit rather than accepting arbitrary texture descriptions.
const inventoryItems: Array<[string, Translation]> = [
    ['Emerald', { de: 'Smaragd', fr: 'Émeraude', ja: 'エメラルド' }],
    ['Ender Pearl', { de: 'Enderperle', fr: 'Perle de l’Ender', ja: 'エンダーパール' }],
    ['Eye of Ender', { de: 'Enderauge', fr: 'Œil de l’Ender', ja: 'エンダーアイ' }],
    ['Totem of Undying', { de: 'Totem der Unsterblichkeit', fr: 'Totem d’immortalité', ja: '不死のトーテム' }],
    ['Netherite Pickaxe', { de: 'Netheritspitzhacke', fr: 'Pioche en Netherite', ja: 'ネザライトのツルハシ' }],
    ['Netherite Sword', { de: 'Netheritschwert', fr: 'Épée en Netherite', ja: 'ネザライトの剣' }],
    ['Carrot', { de: 'Karotte', fr: 'Carotte', ja: 'ニンジン' }],
    ['Bread', { de: 'Brot', fr: 'Pain', ja: 'パン' }],
    ['Cookie', { de: 'Keks', fr: 'Cookie', ja: 'クッキー' }],
    ['Arrow', { de: 'Pfeil', fr: 'Flèche', ja: '矢' }],
    ['Trident', { de: 'Dreizack', fr: 'Trident', ja: 'トライデント' }],
    ['Book', { de: 'Buch', fr: 'Livre', ja: '本' }],
    ['Feather', { de: 'Feder', fr: 'Plume', ja: '羽根' }],
    ['Amethyst Shard', { de: 'Amethystscherbe', fr: 'Éclat d’améthyste', ja: 'アメジストの欠片' }],
    ['Slimeball', { de: 'Schleimball', fr: 'Boule de Slime', ja: 'スライムボール' }],
    ['Honey Bottle', { de: 'Honigflasche', fr: 'Fiole de miel', ja: 'ハチミツ入りの瓶' }],
    ['Milk Bucket', { de: 'Milcheimer', fr: 'Seau de lait', ja: 'ミルク入りバケツ' }],
    ['Redstone Dust', { de: 'Redstone-Staub', fr: 'Poudre de Redstone', ja: 'レッドストーンダスト' }],
    ['Nether Quartz', { de: 'Netherquarz', fr: 'Quartz du Nether', ja: 'ネザークォーツ' }],
];

for (const [item, name] of inventoryItems) {
    sources.set(`Based on the original ${item} inventory item texture from Minecraft Java Edition 1.21.1.`, {
        de: `Grundlage ist die ursprüngliche Inventartextur des Gegenstands „${name.de}“ aus Minecraft Java Edition 1.21.1.`,
        fr: `Le modèle s’appuie sur la texture d’origine de l’objet d’inventaire « ${name.fr} » de Minecraft Java Edition 1.21.1.`,
        ja: `Minecraft Java Edition 1.21.1のインベントリに表示されるアイテム「${name.ja}」の元のテクスチャをもとにしています。`,
    });
}

export function localizePatternSourceDescription(description: string, locale: PatternLocale): string {
    const translated = sources.get(description)?.[locale];
    if (!translated) throw new Error(`Untranslated ${locale} pattern source: ${description}`);
    return translated;
}
