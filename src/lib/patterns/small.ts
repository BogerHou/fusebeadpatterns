import { getPatternById, type Pattern } from './catalog';
import type { SiteLocale } from '../i18n/locales';

// This is a size-based selection of existing library patterns, not new inventory.
export const smallPatternIds = [
    'minecraft-full-heart-1-21-1',
    'minecraft-feather-1-21-1',
    'smb-super-star',
    'smb-small-mario',
    'pokemon-ditto-gen5',
    'smb-super-mushroom',
    'smb-bob-omb-smb3',
    'kirby-adventure-normal',
    'kirby-waddle-dee-adventure',
    'smb-question-block',
] as const;

export const smallPatternGroupRanges = [
    { id: 'under150', min: 0, max: 149 },
    { id: '150to199', min: 150, max: 199 },
    { id: '200to254', min: 200, max: 254 },
] as const;
type SmallGroupId = typeof smallPatternGroupRanges[number]['id'];

export function getSmallPatterns(): Pattern[] {
    return smallPatternIds.map(id => {
        const pattern = getPatternById(id);
        if (!pattern) throw new Error(`Unknown small pattern: ${id}`);
        if (pattern.motifWidth > 16 || pattern.motifHeight > 16 || pattern.colorCount > 4
            || pattern.gridWidth !== 29 || pattern.gridHeight !== 29) {
            throw new Error(`Small pattern no longer fits the published size: ${id}`);
        }
        return pattern;
    });
}

export function getSmallPatternGroups() {
    const selected = getSmallPatterns();
    return smallPatternGroupRanges.map(group => ({
        ...group,
        patterns: selected.filter(pattern => pattern.beads >= group.min && pattern.beads <= group.max)
            .sort((a, b) => a.beads - b.beads),
    }));
}

export function hasSmallPatternFineConnections(pattern: Pattern): boolean {
    return pattern.notes.some(note => note.startsWith('Thin one-bead connections at '));
}

type SmallCopy = {
    label: string; title: string; metadataTitle: string; description: string; intro: string;
    heading: string; notes: readonly string[];
    groups: Record<SmallGroupId, string>;
    home: string; library: string; breadcrumb: string; related: string; all: string;
    motif: string; beads: string; colors: string; cells: string; version: string; details: string;
    delicate: string; miniNote: string; miniGuide: string; boardGuide: string;
    easy: string; cute: string;
    fewestQuestion: string; fewestAnswer: string; miniQuestion: string; miniAnswer: string;
};

export const smallPatternCopy: Record<SiteLocale, SmallCopy> = {
    en: {
        label: 'Small patterns', title: 'Small Perler Bead Patterns',
        metadataTitle: 'Small Perler Bead Patterns — 16×16 or Smaller',
        description: 'Compare 10 small Perler bead patterns, each 16×16 beads or smaller, using 54–254 beads and two to four colors. Free charts in the original 29×29 Midi layout.',
        intro: 'Choose a small design using 54–254 beads and two to four colors. Every motif below is at most 16 beads wide and 16 beads tall, centered on a 29 × 29 Midi pegboard. Blank cells need no beads. Open a pattern for its printable chart, color list and editor.',
        heading: 'Motif size and board size',
        notes: [
            'The motif size measures the occupied design, from its first bead to its last bead in each direction. It does not count the empty margins on the board. The Minecraft Heart occupies 9 × 9 cells with 54 beads; the Question Block occupies 16 × 16 cells with 254 beads. Both downloads keep their original 29 × 29 Midi layout.',
            'Print the PDF at 100% / actual size and check its 50 mm scale. The PNG is a chart to follow by rows and columns. These patterns have not been physically assembled or iron-tested; read the individual assembly notes before lifting or fusing a piece.',
        ],
        groups: { under150: 'Under 150 beads', '150to199': '150–199 beads', '200to254': '200–254 beads' },
        home: 'Home', library: 'Patterns', breadcrumb: 'Breadcrumb', related: 'Related patterns and guides', all: 'Browse all patterns',
        motif: 'Motif size', beads: 'Beads', colors: 'Colors', cells: 'cells', version: 'Reference version', details: 'Pattern and downloads',
        delicate: 'Thin one-bead connections. Handle carefully; see the assembly notes.',
        miniNote: '“Small” means fewer occupied cells here. The downloads use Midi beads; they are not Mini-bead placement templates.',
        miniGuide: 'Mini bead size guide', boardGuide: 'Pegboard sizes and printing', easy: 'Patterns with fewer colors', cute: 'Cute pattern ideas',
        fewestQuestion: 'Which designs use the fewest beads?',
        fewestAnswer: 'The Minecraft Heart uses 54 beads and the Feather uses 65. Both have thin one-bead connections, so fewer beads does not guarantee an easier finish. Check the assembly notes on their pattern pages.',
        miniQuestion: 'Do these patterns use Mini beads?',
        miniAnswer: 'The existing downloads use Perler Midi colors and a 29 × 29 Midi layout. Mini beads need a matching Mini pegboard and different print spacing. Changing only the color brand in the editor does not change the board or bead size.',
    },
    de: {
        label: 'Kleine Vorlagen', title: 'Kleine Bügelperlen-Vorlagen',
        metadataTitle: 'Kleine Bügelperlen-Vorlagen — höchstens 16×16 Perlen',
        description: 'Vergleiche 10 kleine Bügelperlen-Motive mit höchstens 16×16 Perlen, 54–254 Perlen und zwei bis vier Farben. Kostenlose Raster im ursprünglichen 29×29-Midi-Layout.',
        intro: 'Wähle ein kleines Motiv mit 54–254 Perlen und zwei bis vier Farben. Jedes Motiv ist höchstens 16 Perlen breit und 16 Perlen hoch und liegt mittig auf einer 29 × 29-Midi-Steckplatte. Leere Felder brauchen keine Perlen. Öffne eine Vorlage für Druckdateien, Farbliste und deutschen Editor.',
        heading: 'Motivgröße und Plattengröße',
        notes: [
            'Die Motivgröße umfasst die belegten Felder von der ersten bis zur letzten Perle in jeder Richtung. Leere Ränder zählen nicht dazu. Das Minecraft-Herz belegt 9 × 9 Felder mit 54 Perlen; der Fragezeichen-Block 16 × 16 Felder mit 254 Perlen. Beide Downloads behalten das ursprüngliche 29 × 29-Midi-Layout.',
            'Drucke das PDF mit 100 % / tatsächlicher Größe und prüfe die 50-mm-Messlinie. Das PNG dient zum Abzählen nach Zeilen und Spalten. Die Motive wurden nicht mit echten Perlen gebaut oder bügelgetestet. Lies vor dem Abheben und Bügeln die Herstellungshinweise der Vorlage.',
        ],
        groups: { under150: 'Unter 150 Perlen', '150to199': '150–199 Perlen', '200to254': '200–254 Perlen' },
        home: 'Startseite', library: 'Vorlagen', breadcrumb: 'Brotkrümelnavigation', related: 'Passende Vorlagen und Anleitungen', all: 'Alle Vorlagen ansehen',
        motif: 'Motivgröße', beads: 'Perlen', colors: 'Farben', cells: 'Felder', version: 'Referenzversion', details: 'Vorlage und Downloads',
        delicate: 'Dünne Verbindungen mit nur einer Perle. Vorsichtig behandeln; Herstellungshinweise lesen.',
        miniNote: '„Klein“ bedeutet hier wenige belegte Felder. Die Downloads verwenden Midi-Perlen und sind keine Schablonen für Mini-Perlen.',
        miniGuide: 'Mini-Perlengrößen', boardGuide: 'Steckplattengrößen und Drucken', easy: 'Vorlagen mit wenigen Farben', cute: 'Niedliche Motive',
        fewestQuestion: 'Welche Motive brauchen die wenigsten Perlen?',
        fewestAnswer: 'Das Minecraft-Herz braucht 54 Perlen, die Feder 65. Beide haben dünne Verbindungen mit nur einer Perle. Weniger Perlen garantieren deshalb keine einfachere Fertigstellung. Prüfe die Herstellungshinweise auf den Detailseiten.',
        miniQuestion: 'Verwenden diese Vorlagen Mini-Perlen?',
        miniAnswer: 'Die vorhandenen Downloads verwenden Perler-Midi-Farben und ein 29 × 29-Midi-Layout. Mini-Perlen brauchen eine passende Mini-Steckplatte und andere Druckabstände. Ein Wechsel der Farbmarke im Editor ändert weder Platte noch Perlengröße.',
    },
    fr: {
        label: 'Petits modèles', title: 'Petits modèles de perles à repasser',
        metadataTitle: 'Petits modèles de perles à repasser — 16×16 perles maximum',
        description: 'Comparez 10 petits motifs de 16×16 perles maximum, avec 54–254 perles et deux à quatre couleurs. Grilles gratuites dans leur disposition Midi de 29×29 cases.',
        intro: 'Choisissez un petit motif de 54–254 perles et deux à quatre couleurs. Chaque dessin mesure au maximum 16 perles de large et 16 de haut, centré sur une plaque Midi de 29 × 29 cases. Les cases vides restent sans perle. Ouvrez sa fiche pour les fichiers à imprimer, les couleurs et l’éditeur en français.',
        heading: 'Taille du motif et taille de la plaque',
        notes: [
            'La taille du motif mesure les cases occupées, de la première à la dernière perle dans chaque direction. Les marges vides ne comptent pas. Le cœur Minecraft occupe 9 × 9 cases avec 54 perles ; le Bloc point d’interrogation, 16 × 16 cases avec 254 perles. Les deux fichiers gardent leur disposition Midi d’origine de 29 × 29 cases.',
            'Imprimez le PDF à 100 % / taille réelle et contrôlez le repère de 50 mm. Le PNG est une grille à suivre par lignes et colonnes. Les motifs n’ont pas été assemblés avec de vraies perles ni testés au fer. Lisez les conseils de chaque fiche avant de soulever ou repasser une pièce.',
        ],
        groups: { under150: 'Moins de 150 perles', '150to199': '150–199 perles', '200to254': '200–254 perles' },
        home: 'Accueil', library: 'Modèles', breadcrumb: 'Fil d’Ariane', related: 'Modèles et guides associés', all: 'Voir tous les modèles',
        motif: 'Taille du motif', beads: 'Perles', colors: 'Couleurs', cells: 'cases', version: 'Version de référence', details: 'Modèle et téléchargements',
        delicate: 'Jonctions fines d’une seule perle. Manipulez avec soin ; consultez les conseils d’assemblage.',
        miniNote: '« Petit » désigne ici un motif avec peu de cases occupées. Les fichiers utilisent des perles Midi et ne sont pas des gabarits pour perles Mini.',
        miniGuide: 'Tailles des perles Mini', boardGuide: 'Tailles des plaques et impression', easy: 'Modèles avec peu de couleurs', cute: 'Motifs mignons',
        fewestQuestion: 'Quels motifs utilisent le moins de perles ?',
        fewestAnswer: 'Le cœur Minecraft utilise 54 perles et la plume, 65. Tous deux comportent des jonctions d’une seule perle : moins de perles ne garantit donc pas une finition plus facile. Consultez les conseils sur leurs fiches.',
        miniQuestion: 'Ces modèles utilisent-ils des perles Mini ?',
        miniAnswer: 'Les fichiers existants utilisent des couleurs Perler Midi et une disposition Midi de 29 × 29 cases. Les perles Mini demandent une plaque Mini adaptée et un espacement d’impression différent. Changer uniquement la marque de couleurs dans l’éditeur ne change ni la plaque ni la taille des perles.',
    },
    ja: {
        label: '小さな図案', title: '小さなアイロンビーズ図案',
        metadataTitle: '小さなアイロンビーズ図案 — 縦横16マス以内',
        description: '縦横16マス以内、54〜254個・2〜4色で作る小さなアイロンビーズ図案10点。元の29×29マスのミディ配置で無料の図案を保存・編集できます。',
        intro: '54〜254個・2〜4色で作る小さな図柄を選べます。すべて横16マス・縦16マス以内で、29×29マスのミディ用プレートの中央に配置されています。空白のマスにはビーズを置きません。各図案の詳細ページから、印刷用ファイル・色別の必要数・日本語エディターを開けます。',
        heading: '図柄の大きさとプレートの大きさ',
        notes: [
            '図柄の大きさは、ビーズを置く範囲の端から端までを縦横に数えたものです。プレートの空白の余白は含みません。Minecraftのハートは9×9マスで54個、ハテナブロックは16×16マスで254個です。どちらのファイルも元の29×29マスのミディ配置を保っています。',
            'PDFは100％・実際のサイズで印刷し、50 mmの目盛りを確認してください。PNGは行と列を数えて使う図表です。実物のビーズでの組み立て・アイロン仕上げは検証していません。持ち上げる前やアイロンをかける前に、各図案の制作上の注意を確認してください。',
        ],
        groups: { under150: '150個未満', '150to199': '150〜199個', '200to254': '200〜254個' },
        home: 'ホーム', library: '図案一覧', breadcrumb: 'パンくずリスト', related: '関連する図案・ガイド', all: 'すべての図案を見る',
        motif: '図柄の大きさ', beads: 'ビーズ数', colors: '色数', cells: 'マス', version: '参照バージョン', details: '図案とダウンロード',
        delicate: 'ビーズ1個幅の細い接続部分があります。慎重に扱い、制作上の注意を確認してください。',
        miniNote: 'ここでの「小さい」は、使うマスが少ない図柄を意味します。ファイルはミディ用で、ミニビーズ用の原寸配置図ではありません。',
        miniGuide: 'ミニビーズのサイズガイド', boardGuide: 'プレートのサイズと印刷', easy: '少ない色で作る図案', cute: 'かわいい図案',
        fewestQuestion: '必要なビーズが最も少ない図案は？',
        fewestAnswer: 'Minecraftのハートは54個、羽根は65個です。どちらにもビーズ1個幅の細い接続部分があるため、個数が少なくても仕上げが簡単とは限りません。詳細ページの制作上の注意を確認してください。',
        miniQuestion: 'ミニビーズを使う図案ですか？',
        miniAnswer: '既存のファイルはPerler Midiの色と29×29マスのミディ配置を使っています。ミニビーズには対応するミニ用プレートと異なる印刷間隔が必要です。エディターで色のブランドだけを変えても、プレートやビーズのサイズは変わりません。',
    },
};

const smallVersions: Record<string, Record<SiteLocale, string>> = {
    'Java Edition 1.21.1': { en: 'Java Edition 1.21.1', de: 'Java Edition 1.21.1', fr: 'Java Edition 1.21.1', ja: 'Java Edition 1.21.1' },
    'Gen V menu icon': { en: 'Gen V menu icon', de: 'Menüsymbol der 5. Generation', fr: 'Icône de menu de la 5e génération', ja: '第5世代のメニューアイコン' },
    'Super Mario Bros. (NES)': { en: 'Super Mario Bros. (NES)', de: 'Super Mario Bros. (NES)', fr: 'Super Mario Bros. (NES)', ja: 'スーパーマリオブラザーズ（NES）' },
    'Super Mario Bros. 3 (NES)': { en: 'Super Mario Bros. 3 (NES)', de: 'Super Mario Bros. 3 (NES)', fr: 'Super Mario Bros. 3 (NES)', ja: 'スーパーマリオブラザーズ3（NES）' },
    'Kirby’s Adventure (NES)': { en: 'Kirby’s Adventure (NES)', de: 'Kirby’s Adventure (NES)', fr: 'Kirby’s Adventure (NES)', ja: 'Kirby’s Adventure（NES／夢の泉の物語）' },
};

export function getSmallPatternVersion(pattern: Pattern, locale: SiteLocale): string {
    const version = smallVersions[pattern.version]?.[locale];
    if (!version) throw new Error(`Missing ${locale} small pattern version: ${pattern.version}`);
    if (pattern.id !== 'smb-small-mario') return version;
    return `${{ en: 'Small Mario', de: 'Kleiner Mario', fr: 'Petit Mario', ja: 'ちびマリオ' }[locale]} · ${version}`;
}
