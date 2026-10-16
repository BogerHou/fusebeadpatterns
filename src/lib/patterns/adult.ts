import type { SiteLocale } from '../i18n/locales';
import { getPatternById, type Pattern } from './catalog';

export const adultPatternGroups = [
    { id: 'display', patternIds: ['original-celestial-stained-glass-window', 'original-sunset-mountain-lake'] },
    { id: 'geometry', patternIds: ['original-retro-diamond-coaster'] },
    { id: 'festival', patternIds: ['original-rave-alien-head', 'original-rave-rainbow-smiley', 'original-rave-moon-mushroom'] },
] as const;
export const adultPatternIds = adultPatternGroups.flatMap(group => [...group.patternIds]);
type AdultGroup = typeof adultPatternGroups[number]['id'];
type AdultPatternId = typeof adultPatternIds[number];

type AdultCopy = {
    label: string; title: string; description: string; intro: string; heading: string;
    notes: readonly string[]; home: string; library: string; breadcrumb: string;
    groups: Record<AdultGroup, { title: string; intro: string }>;
    reasons: Record<AdultPatternId, string>;
    motif: string; grid: string; boards: string; beads: string; colors: string;
    boardUnit: string; oneBoard: string; palette: string; details: string; a4: string; letter: string;
    countingGrid: string; project: string; edit: string; downloads: string;
    preparation: string; printNote: string; brandNote: string; physicalNote: string;
    related: string; boardGuide: string; brandGuide: string; rave: string; all: string;
};

export const adultPatternCopy: Record<SiteLocale, AdultCopy> = {
    en: {
        label: 'Adult patterns', title: 'Adult Perler Bead Patterns',
        description: 'Choose adult Perler bead patterns for display, geometric decor or festival motifs. Compare boards, beads and colors, then download free A4 or Letter PDFs.',
        intro: 'Choose a four-board picture, a geometric design or a small festival motif. Compare the layout, bead counts and colors, then download the chart you need.',
        heading: 'Choose the layout and materials that suit you',
        notes: ['Compare the motif size with the full chart. Empty cells stay empty; board capacity is not the number of beads you need.', 'A short color list can simplify gathering materials, while a larger filled area still needs more beads. Check both counts rather than treating every small motif as easy.'],
        home: 'Home', library: 'Patterns', breadcrumb: 'Breadcrumb',
        groups: {
            display: { title: 'Four-board pictures for display', intro: "Both designs use four 29 × 29 Midi boards in a 2 × 2 layout. Choose the composition and colors you prefer." },
            geometry: { title: 'Geometric decor on one board', intro: 'The diamond design uses three colors and repeats its shapes across one board. Choose it for its geometric layout; a coaster needs suitable backing and a check of the finished piece for your intended use.' },
            festival: { title: 'Small festival motifs', intro: 'Compare a compact alien head, a smiley with more colors, and a moon-and-mushroom design with thin connections. These are flat motifs; the charts do not include attachment holes or tested wearable construction.' },
        },
        reasons: {
            'original-celestial-stained-glass-window': 'An arched window with a moon, stars, dark dividing lines and cool-colored panes. It uses the same four-board layout as the landscape; compare the palettes and filled bead counts to choose.',
            'original-sunset-mountain-lake': 'Layered mountains, a lake reflection and warm sunset bands make this the landscape option. Its eight colors need a larger assortment than the single-board diamond.',
            'original-retro-diamond-coaster': 'A repeated diamond motif with three colors. It uses more beads than the small festival motifs, despite having the shortest color list here.',
            'original-rave-alien-head': 'A compact alien face with four colors. Compare its motif size and quantities if you want a smaller filled area.',
            'original-rave-rainbow-smiley': 'A round smiley with seven colors. Choose it for the rainbow bands and check the color list before gathering supplies.',
            'original-rave-moon-mushroom': 'The smallest bead count in the single-board selection, with five colors. Thin one-bead joins still need care when moving and fusing the piece.',
        },
        motif: 'Motif', grid: 'Full chart', boards: 'Midi boards', beads: 'Beads', colors: 'Colors', boardUnit: 'boards, 29 × 29 each', oneBoard: '1 board, 29 × 29',
        palette: 'Downloads: Perler Midi colors', details: 'Pattern details', a4: 'A4 PDF', letter: 'US Letter PDF', countingGrid: 'Counting grid PNG', project: 'Editable project', edit: 'Edit colors', downloads: 'Download or edit',
        preparation: 'Prepare the chart before placing beads',
        printNote: 'Choose A4 or US Letter for your paper. Print placement pages at 100% / actual size and check both 50 mm rulers. A four-board PDF starts with a reduced overview, followed by one placement page per board. The counting PNG is a chart to follow, not an actual-size template.',
        brandNote: 'These fixed downloads use Perler Midi colors. For Hama or Artkal, open the selected pattern in the editor, change the color brand while keeping the board settings, then export a new chart and material list. A palette match is a color approximation, not a test of bead or board compatibility.',
        physicalNote: 'These designs have not been physically assembled or iron-tested. Joined-board strength, hanging, wearable attachments, heat resistance and water resistance have not been verified. Follow your bead brand’s fusing instructions and check the finished piece for its intended use.',
        related: 'Related guides and patterns', boardGuide: 'Choose the board size', brandGuide: 'Change bead brands', rave: 'More about the festival motifs', all: 'Browse all patterns',
    },
    de: {
        label: 'Für Erwachsene', title: 'Bügelperlen-Vorlagen für Erwachsene',
        description: 'Bügelperlen-Vorlagen für Erwachsene: Bilder, geometrische Deko und Festivalmotive. Platten, Perlen und Farben vergleichen; A4- oder Letter-PDF laden.',
        intro: 'Wähle ein Bild auf vier Platten, ein geometrisches Muster oder ein kleines Festivalmotiv. Vergleiche Anordnung, Perlen und Farben, bevor du die Vorlage lädst.',
        heading: 'Anordnung und Material passend auswählen',
        notes: ['Vergleiche die Motivgröße mit dem gesamten Raster. Leere Felder bleiben frei; die Zahl der Steckplätze ist nicht die benötigte Perlenzahl.', 'Wenige Farben erleichtern das Zusammenstellen des Materials. Eine größere gefüllte Fläche braucht trotzdem mehr Perlen. Prüfe beides, statt kleine Motive automatisch als einfach einzustufen.'],
        home: 'Startseite', library: 'Vorlagen', breadcrumb: 'Brotkrümelnavigation',
        groups: {
            display: { title: 'Bilder auf vier Platten', intro: "Beide Motive nutzen vier Midi-Steckplatten mit je 29 × 29 Feldern im 2 × 2-Layout. Vergleiche Aufbau und Farben." },
            geometry: { title: 'Geometrische Deko auf einer Platte', intro: 'Das Rautenmuster wiederholt seine Formen mit drei Farben auf einer Platte. Für die Nutzung als Untersetzer sind eine geeignete Rückseite und eine Prüfung des fertigen Stücks für den vorgesehenen Zweck nötig.' },
            festival: { title: 'Kleine Festivalmotive', intro: 'Vergleiche einen kompakten Alien-Kopf, einen farbenreicheren Smiley und ein Mond-Pilz-Motiv mit schmalen Verbindungen. Die flachen Motive enthalten keine Befestigungslöcher oder geprüfte tragbare Konstruktion.' },
        },
        reasons: {
            'original-celestial-stained-glass-window': 'Ein Bogenfenster mit Mond, Sternen, dunklen Trennlinien und kühlen Farbfeldern. Es nutzt dieselbe Vier-Platten-Anordnung wie die Landschaft. Vergleiche Farblisten und Perlenmengen.',
            'original-sunset-mountain-lake': 'Bergschichten, Spiegelung im See und warme Abendstreifen bilden die Landschaftsvariante. Acht Farben erfordern mehr Auswahl als das einplattige Rautenmuster.',
            'original-retro-diamond-coaster': 'Ein wiederholtes Rautenmuster mit drei Farben. Trotz der kürzesten Farbliste braucht es mehr Perlen als die kleinen Festivalmotive.',
            'original-rave-alien-head': 'Ein kompaktes Alien-Gesicht mit vier Farben. Vergleiche Motivgröße und Mengen, wenn du eine kleinere gefüllte Fläche suchst.',
            'original-rave-rainbow-smiley': 'Ein runder Smiley mit sieben Farben. Wähle ihn für die Regenbogenstreifen und prüfe vorher die Farbliste.',
            'original-rave-moon-mushroom': 'Die geringste Perlenzahl unter den einplattigen Motiven, mit fünf Farben. Schmale Verbindungen aus einzelnen Perlen erfordern dennoch Sorgfalt beim Bewegen und Bügeln.',
        },
        motif: 'Motivgröße', grid: 'Gesamtes Raster', boards: 'Midi-Platten', beads: 'Perlen', colors: 'Farben', boardUnit: 'Platten mit je 29 × 29 Steckplätzen', oneBoard: '1 Platte mit 29 × 29 Steckplätzen',
        palette: 'Downloads: Perler-Midi-Farben', details: 'Vorlagendetails', a4: 'PDF A4', letter: 'PDF US Letter', countingGrid: 'Zählraster als PNG', project: 'Bearbeitbares Projekt', edit: 'Farben bearbeiten', downloads: 'Herunterladen oder bearbeiten',
        preparation: 'Vor dem Stecken die Druckvorlage vorbereiten',
        printNote: 'Wähle A4 oder US Letter passend zum Papier. Drucke Steckvorlagen mit 100 % / tatsächlicher Größe und prüfe beide 50-mm-Maßstäbe. Das PDF für vier Platten beginnt mit einer verkleinerten Übersicht; danach folgt eine Steckseite je Platte. Das PNG dient zum Abzählen, nicht als Vorlage in Originalgröße.',
        brandNote: 'Die fertigen Downloads verwenden Perler Midi. Für Hama oder Artkal öffne das Motiv im Editor, wechsle die Farbmarke bei unveränderten Platteneinstellungen und exportiere ein neues Raster mit Materialliste. Die Farbzuordnung ist eine Annäherung und kein Kompatibilitätstest für Perlen oder Platten.',
        physicalNote: 'Die Motive wurden nicht mit echten Perlen gesteckt oder gebügelt. Stabilität über Plattengrenzen, Aufhängung, tragbare Befestigungen sowie Hitze- und Wasserbeständigkeit sind ungeprüft. Befolge die Bügelhinweise deiner Perlenmarke und prüfe das fertige Stück für seinen Zweck.',
        related: 'Passende Anleitungen und Vorlagen', boardGuide: 'Plattengröße wählen', brandGuide: 'Perlenmarke wechseln', rave: 'Mehr zu den Festivalmotiven', all: 'Alle Vorlagen ansehen',
    },
    fr: {
        label: 'Pour adultes', title: 'Modèles de perles à repasser pour adultes',
        description: 'Modèles de perles à repasser pour adultes : tableaux, décors géométriques et motifs de festival. Comparez le matériel et téléchargez les PDF A4 ou Letter.',
        intro: 'Choisissez un tableau sur quatre plaques, un dessin géométrique ou un petit motif de festival. Comparez la disposition, les perles et les couleurs avant de télécharger.',
        heading: 'Choisir la disposition et le matériel',
        notes: ['Comparez la taille du motif avec la grille complète. Les cases vides restent sans perle ; la capacité des plaques ne correspond pas au nombre de perles nécessaire.', 'Une courte liste de couleurs facilite la préparation du matériel, mais une grande surface remplie demande davantage de perles. Vérifiez les deux : un petit motif n’est pas forcément facile.'],
        home: 'Accueil', library: 'Modèles', breadcrumb: 'Fil d’Ariane',
        groups: {
            display: { title: 'Tableaux sur quatre plaques', intro: "Deux motifs sur quatre plaques Midi de 29 × 29 cases, disposées en 2 × 2. Choisissez la composition et les couleurs." },
            geometry: { title: 'Décors géométriques sur une plaque', intro: 'Le dessin à losanges répète ses formes avec trois couleurs sur une plaque. Pour un usage en dessous de verre, prévoyez un support adapté et vérifiez la pièce finie selon son utilisation.' },
            festival: { title: 'Petits motifs de festival', intro: 'Comparez une tête d’alien compacte, un smiley plus coloré et une lune avec champignon aux jonctions fines. Ces motifs plats ne comprennent ni trous de fixation ni montage testé pour être porté.' },
        },
        reasons: {
            'original-celestial-stained-glass-window': 'Un vitrail en arc avec lune, étoiles, lignes sombres et panneaux de couleurs froides. Il utilise les mêmes quatre plaques que le paysage : comparez les palettes et les quantités de perles.',
            'original-sunset-mountain-lake': 'Montagnes superposées, reflet dans le lac et bandes chaudes du couchant composent le paysage. Ses huit couleurs demandent plus de choix que le losange sur une plaque.',
            'original-retro-diamond-coaster': 'Un motif répétitif à losanges avec trois couleurs. Malgré la liste de couleurs la plus courte, il demande plus de perles que les petits motifs de festival.',
            'original-rave-alien-head': 'Un visage d’alien compact avec quatre couleurs. Comparez sa taille et les quantités pour une surface remplie plus petite.',
            'original-rave-rainbow-smiley': 'Un smiley rond avec sept couleurs. Choisissez-le pour ses bandes arc-en-ciel et vérifiez la liste des couleurs avant de préparer le matériel.',
            'original-rave-moon-mushroom': 'Le moins de perles parmi les motifs sur une plaque, avec cinq couleurs. Ses jonctions d’une seule perle demandent toutefois du soin lors du déplacement et du repassage.',
        },
        motif: 'Taille du motif', grid: 'Grille complète', boards: 'Plaques Midi', beads: 'Perles', colors: 'Couleurs', boardUnit: 'plaques de 29 × 29 picots', oneBoard: '1 plaque de 29 × 29 picots',
        palette: 'Fichiers : couleurs Perler Midi', details: 'Fiche du modèle', a4: 'PDF A4', letter: 'PDF US Letter', countingGrid: 'Grille de comptage PNG', project: 'Projet modifiable', edit: 'Modifier les couleurs', downloads: 'Télécharger ou modifier',
        preparation: 'Préparer la grille avant de poser les perles',
        printNote: 'Choisissez A4 ou US Letter selon votre papier. Imprimez les pages de placement à 100 % / taille réelle et vérifiez les deux repères de 50 mm. Le PDF sur quatre plaques commence par une vue réduite, suivie d’une page de placement par plaque. Le PNG sert à compter les cases, pas de gabarit à taille réelle.',
        brandNote: 'Les fichiers prêts à télécharger utilisent Perler Midi. Pour Hama ou Artkal, ouvrez le motif dans l’éditeur, changez de marque de couleurs sans modifier les réglages de plaque, puis exportez une nouvelle grille et sa liste de matériel. La correspondance des couleurs reste approximative et ne valide pas la compatibilité des perles ou des plaques.',
        physicalNote: 'Ces motifs n’ont pas été assemblés ni repassés avec de vraies perles. La solidité entre plaques, la suspension, les fixations pour porter la pièce et la résistance à la chaleur ou à l’eau ne sont pas vérifiées. Suivez les instructions de repassage de votre marque et contrôlez la pièce finie pour son usage.',
        related: 'Guides et modèles associés', boardGuide: 'Choisir la taille de plaque', brandGuide: 'Changer de marque', rave: 'En savoir plus sur les motifs de festival', all: 'Voir tous les modèles',
    },
    ja: {
        label: '大人向け', title: '大人向けアイロンビーズ図案',
        description: '大人向けのアイロンビーズ図案を、飾る絵・幾何学模様・フェス風の小さなモチーフから選べます。プレート枚数、ビーズ数、色数を比較し、A4・US Letterの無料PDFをダウンロードできます。',
        intro: 'プレート4枚で飾る絵、幾何学模様、小さなフェス風モチーフを選べます。配置・ビーズ数・色数を比較し、必要な図案をダウンロードしましょう。',
        heading: '配置と材料を比べて選ぶ',
        notes: ['モチーフの大きさと図案全体のマス数を分けて確認しましょう。空白にはビーズを置きません。プレートのピン総数と必要なビーズ数は異なります。', '色数が少ないと材料をそろえやすくなりますが、塗られた面積が広ければビーズは多く必要です。小さい図案を一律に簡単と考えず、両方を確認してください。'],
        home: 'ホーム', library: '図案', breadcrumb: 'パンくずリスト',
        groups: {
            display: { title: 'プレート4枚で作る飾る絵', intro: "どちらも29×29マスのミディ用プレート4枚を2×2に並べる図案です。構図と配色を比べて選べます。" },
            geometry: { title: 'プレート1枚の幾何学模様', intro: 'ひし形の図案は3色で形を繰り返す構成です。コースターとして使う場合は用途に合う裏材を検討し、完成品がその使い方に適しているか確認してください。' },
            festival: { title: '小さなフェス風モチーフ', intro: '小ぶりなエイリアンの顔、色数の多いスマイル、細いつなぎ目のある月ときのこを比較できます。平面の図案で、取り付け穴や着用向けの構造は検証していません。' },
        },
        reasons: {
            'original-celestial-stained-glass-window': '月と星、暗い仕切り線、寒色のパネルを組み合わせたアーチ窓です。風景図案と同じ4枚プレート構成なので、配色と必要なビーズ数を比べて選べます。',
            'original-sunset-mountain-lake': '重なる山、湖の反射、暖かい夕景の帯を描く風景図案です。8色を使うため、1枚プレートのひし形より多くの色をそろえます。',
            'original-retro-diamond-coaster': '3色を使った繰り返しのひし形模様です。色数は最も少ない一方、小さなフェス風モチーフよりビーズを多く使います。',
            'original-rave-alien-head': '4色で作る小ぶりなエイリアンの顔です。塗られた面積を抑えたいときは、モチーフの寸法と材料数を比較しましょう。',
            'original-rave-rainbow-smiley': '7色の虹色の帯を使った丸いスマイルです。作り始める前に色別の材料表を確認してください。',
            'original-rave-moon-mushroom': '1枚プレートの中ではビーズ数が最も少ない5色の図案です。ただし1粒幅の細いつなぎ目があり、移動やアイロンがけには注意が必要です。',
        },
        motif: 'モチーフ', grid: '図案全体', boards: 'ミディプレート', beads: 'ビーズ数', colors: '色数', boardUnit: '枚（各29 × 29マス）', oneBoard: '1枚（29 × 29マス）',
        palette: 'ダウンロードの配色：Perler Midi', details: '図案の詳細', a4: 'A4 PDF', letter: 'US Letter PDF', countingGrid: 'マス目付きPNG', project: '編集用プロジェクト', edit: '配色を編集', downloads: 'ダウンロード・編集',
        preparation: 'ビーズを並べる前の印刷準備',
        printNote: '用紙に合わせてA4またはUS Letterを選びます。配置用ページは100%・実際のサイズで印刷し、2本の50 mm目盛りを確認してください。4枚プレートのPDFは縮小した全体図の後に、プレートごとの配置用ページが続きます。PNGはマス目を数えて使う図で、実寸の下敷きではありません。',
        brandNote: '固定のダウンロード資料はPerler Midi配色です。HamaやArtkalを使う場合は図案をエディターで開き、プレート設定を変えずに配色ブランドを変更し、新しい図表と材料表を書き出してください。色の対応は近似で、ビーズやプレートの適合を検証するものではありません。',
        physicalNote: 'これらの図案は実際のビーズでの組み立てやアイロンがけを検証していません。プレート間の接合強度、吊り下げ、着用用の取り付け、耐熱性、耐水性も未確認です。使用するビーズのメーカーの手順に従い、用途に合う完成品か確認してください。',
        related: '関連するガイドと図案', boardGuide: 'プレートのサイズを選ぶ', brandGuide: 'ビーズのブランド変更', rave: 'フェス風モチーフの説明', all: 'すべての図案を見る',
    },
};

export function getAdultPatternGroups() {
    return adultPatternGroups.map(group => ({ id: group.id, patterns: group.patternIds.map(id => {
        const pattern = getPatternById(id);
        if (!pattern) throw new Error(`Missing adult selection: ${id}`);
        return pattern;
    }) }));
}

export function getAdultBoardCount(pattern: Pattern): number {
    return Math.ceil(pattern.gridWidth / 29) * Math.ceil(pattern.gridHeight / 29);
}
