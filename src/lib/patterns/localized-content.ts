import type { SiteLocale } from '../i18n/locales';
import type { Pattern } from './catalog';
import pokemonNames from './pokemon-locale-names.json';
import { getPatternDisplayName } from './presentation';

export type PatternLocale = Exclude<SiteLocale, 'en'>;
type Names = Record<PatternLocale, string>;
const namedPokemon = pokemonNames as Record<string, Names>;
// Literal descriptions of the pictured subject; original game names remain search aliases.
const subjects: Record<string, [string, string, string]> = {
    'Blue Chicken': ['Blaues Huhn', 'Poule bleue', '青いニワトリ'],
    'White Chicken': ['Weißes Huhn', 'Poule blanche', '白いニワトリ'],
    'Brown Chicken': ['Braunes Huhn', 'Poule brune', '茶色のニワトリ'],
    'Void Chicken': ['Void Chicken', 'Void Chicken', 'Void Chicken'],
    'Golden Chicken': ['Goldenes Huhn', 'Poule dorée', '金色のニワトリ'],
    'Green Junimo': ['Grüner Junimo', 'Junimo vert', '緑のジュニモ'],
    'Diamond Sword': ['Diamantschwert', 'Épée en diamant', 'ダイヤモンドの剣'],
    'Diamond Pickaxe': ['Diamantspitzhacke', 'Pioche en diamant', 'ダイヤモンドのツルハシ'],
    Diamond: ['Diamant', 'Diamant', 'ダイヤモンド'],
    'Golden Apple': ['Goldener Apfel', 'Pomme dorée', '金のリンゴ'],
    Apple: ['Apfel', 'Pomme', 'リンゴ'], Heart: ['Herz', 'Cœur', 'ハート'], TNT: ['TNT', 'TNT', 'TNT'],
    'Diamond Ore': ['Diamanterz', 'Minerai de diamant', 'ダイヤモンド鉱石'],
    Emerald: ['Smaragd', 'Émeraude', 'エメラルド'],
    'Ender Pearl': ['Enderperle', 'Perle de l’Ender', 'エンダーパール'],
    'Eye of Ender': ['Enderauge', 'Œil de l’Ender', 'エンダーアイ'],
    'Totem of Undying': ['Totem der Unsterblichkeit', 'Totem d’immortalité', '不死のトーテム'],
    'Netherite Pickaxe': ['Netheritspitzhacke', 'Pioche en Netherite', 'ネザライトのツルハシ'],
    'Netherite Sword': ['Netheritschwert', 'Épée en Netherite', 'ネザライトの剣'],
    Carrot: ['Karotte', 'Carotte', 'ニンジン'], Bread: ['Brot', 'Pain', 'パン'], Cookie: ['Keks', 'Cookie', 'クッキー'],
    Arrow: ['Pfeil', 'Flèche', '矢'], Trident: ['Dreizack', 'Trident', 'トライデント'], Book: ['Buch', 'Livre', '本'], Feather: ['Feder', 'Plume', '羽根'],
    'Amethyst Shard': ['Amethystscherbe', 'Éclat d’améthyste', 'アメジストの欠片'],
    Slimeball: ['Schleimball', 'Boule de Slime', 'スライムボール'],
    'Honey Bottle': ['Honigflasche', 'Fiole de miel', 'ハチミツ入りの瓶'],
    'Milk Bucket': ['Milcheimer', 'Seau de lait', 'ミルク入りバケツ'],
    'Redstone Dust': ['Redstone-Staub', 'Poudre de Redstone', 'レッドストーンダスト'],
    'Nether Quartz': ['Netherquarz', 'Quartz du Nether', 'ネザークォーツ'],
    'Carved Pumpkin': ['Geschnitzter Kürbis', 'Citrouille sculptée', 'くり抜かれたカボチャ'],
    Kirby: ['Kirby', 'Kirby', 'カービィ'], 'Waddle Dee': ['Waddle Dee', 'Waddle Dee', 'ワドルディ'], 'Waddle Doo': ['Waddle Doo', 'Waddle Doo', 'ワドルドゥ'],
    Mario: ['Mario', 'Mario', 'マリオ'], Luigi: ['Luigi', 'Luigi', 'ルイージ'],
    'Super Mushroom': ['Superpilz', 'Super Champignon', 'スーパーキノコ'], 'Super Star': ['Superstern', 'Super étoile', 'スーパースター'],
    'Green Koopa Troopa': ['Grüner Koopa Troopa', 'Koopa Troopa vert', '緑のノコノコ'],
    'Red Cheep Cheep': ['Roter Cheep Cheep', 'Cheep Cheep rouge', '赤いプクプク'],
    'Bullet Bill': ['Kugelwilli', 'Bill Balle', 'キラー'], Blooper: ['Blooper', 'Blooper', 'ゲッソー'],
    'Piranha Plant': ['Piranha-Pflanze', 'Plante Piranha', 'パックンフラワー'],
    'Fire Flower': ['Feuerblume', 'Fleur de feu', 'ファイアフラワー'],
    '1-Up Mushroom': ['1-Up-Pilz', 'Champignon 1-Up', '1UPキノコ'],
    'Question Block': ['Fragezeichen-Block', 'Bloc point d’interrogation', 'ハテナブロック'],
    Goomba: ['Goomba', 'Goomba', 'クリボー'], Boo: ['Boo', 'Boo', 'テレサ'], 'Bob-omb': ['Bob-omb', 'Bob-omb', 'ボムへい'],
    'Potion Class Capybara': ['Capybara mit Hexentrank', 'Capybara et potion', '魔法の薬を持つカピバラ'],
    'Pumpkin Hug Ghost Cat': ['Geisterkatze mit Kürbis', 'Chat fantôme avec citrouille', 'カボチャを抱えたゴーストキャット'],
    'Soccer Ball': ['Fußball', 'Ballon de football', 'サッカーボール'], Ghost: ['Geist', 'Fantôme', 'ゴースト'],
    'Christmas Tree': ['Weihnachtsbaum', 'Sapin de Noël', 'クリスマスツリー'],
    'Halloween Bat': ['Halloween-Fledermaus', 'Chauve-souris d’Halloween', 'ハロウィンのコウモリ'],
    Snowman: ['Schneemann', 'Bonhomme de neige', '雪だるま'],
    'Gingerbread Man': ['Lebkuchenmann', 'Bonhomme en pain d’épices', 'ジンジャーブレッドマン'],
    'Santa Hat': ['Weihnachtsmütze', 'Bonnet de Noël', 'サンタの帽子'],
};

export function getLocalizedSubjectName(pattern: Pick<Pattern, 'id' | 'title'>, locale: PatternLocale): string {
    const name = namedPokemon[pattern.id]?.[locale] ?? subjects[pattern.title]?.[{ de: 0, fr: 1, ja: 2 }[locale]];
    if (!name) throw new Error(`Missing ${locale} pattern name: ${pattern.id}`);
    return name;
}

export function getLocalizedPatternName(pattern: Pattern, locale: PatternLocale): string {
    const name = getLocalizedSubjectName(pattern, locale);
    const series = pattern.collectionId === 'pokemon' ? (locale === 'ja' ? 'ポケモン' : 'Pokémon')
        : pattern.collectionId === 'stardew-valley' ? 'Stardew Valley'
        : pattern.collectionId === 'minecraft' ? 'Minecraft'
        : pattern.collectionId === 'super-mario' ? (locale === 'ja' ? 'スーパーマリオ' : 'Super Mario') : '';
    return series ? `${series} · ${name}` : name;
}

export function getLocalizedPatternTitle(pattern: Pattern, locale: PatternLocale): string {
    const name = getLocalizedPatternName(pattern, locale);
    return locale === 'de' ? `${name} – Bügelperlen-Vorlage` : locale === 'fr' ? `${name} : modèle de perles à repasser` : `${name}のアイロンビーズ図案`;
}

export function getLocalizedPatternIntro(pattern: Pattern, locale: PatternLocale): string {
    const name = getLocalizedPatternName(pattern, locale);
    const { beads, colorCount, motifWidth: w, motifHeight: h, gridWidth: gw, gridHeight: gh } = pattern;
    return locale === 'de'
        ? `${name}: ${beads} Perlen in ${colorCount} Perler-Farben. Das Motiv misst ${w} × ${h} Perlen auf einem ${gw} × ${gh}-Raster. Lade die Vorlage herunter oder bearbeite die Farben im deutschen Editor.`
        : locale === 'fr'
        ? `${name} : ${beads} perles et ${colorCount} couleurs Perler. Le motif mesure ${w} × ${h} perles sur une grille de ${gw} × ${gh} cases. Téléchargez le modèle ou modifiez les couleurs dans l’éditeur en français.`
        : `${name}の図案です。${colorCount}色のPerlerビーズを${beads}個使い、${gw}×${gh}マスのプレート上で図柄は横${w}×縦${h}マスです。図案を保存するか、日本語エディターで配色を変更できます。`;
}

const notes: Record<string, [string, string, string]> = {
    'Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.': ['Verwende eine Midi-Steckplatte mit 29 × 29 Feldern. Leere Felder bleiben ohne Perle.', 'Utilisez une plaque Midi de 29 × 29 cases. Les cases vides restent sans perle.', '29×29マスのミディ用プレートを1枚使います。空白のマスにはビーズを置きません。'],
    'Print the PDF at 100% / Actual size and check its 50 mm scale line before use.': ['Drucke das PDF mit 100 % / tatsächlicher Größe und prüfe vor der Nutzung die 50-mm-Messlinie.', 'Imprimez le PDF à 100 % / taille réelle et vérifiez le repère de 50 mm avant utilisation.', 'PDFを100％・実際のサイズで印刷し、使用前に50 mmの目盛りを確認してください。'],
    'This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.': ['Dieses Motiv wurde nicht mit echten Perlen gebaut oder bügelgetestet. Die Perler-Farben am Bildschirm sind Näherungen.', 'Ce motif n’a pas été assemblé avec des perles réelles ni testé au fer. Les couleurs Perler à l’écran sont approximatives.', '実物のビーズでの組み立て・アイロン仕上げは検証していません。画面上のPerlerの色は目安です。'],
    'The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly.': ['Umriss und getrennte Farbbereiche der Vorlage bleiben erhalten. Die Perlenfarben nähern sich den Referenzfarben an, stimmen aber nicht exakt überein.', 'Le contour et les zones de couleur de la référence sont conservés. Les couleurs des perles s’en approchent sans correspondance exacte.', '参照画像の輪郭と色の領域を保っています。ビーズの色は参照色に近づけていますが、完全には一致しません。'],
};

export function localizePatternNote(note: string, locale: PatternLocale): string {
    const index = { de: 0, fr: 1, ja: 2 }[locale];
    if (notes[note]) return notes[note][index];
    const thin = /^Thin one-bead connections at (.+)\. Handle these areas carefully and consider a backing\.$/.exec(note);
    if (thin) {
        const positions = [...thin[1].matchAll(/row (\d+), column (\d+)/g)].map(([, r, c]) => locale === 'de' ? `Zeile ${r}, Spalte ${c}` : locale === 'fr' ? `ligne ${r}, colonne ${c}` : `${r}行${c}列`).join('；');
        return locale === 'de' ? `Dünne Verbindungen mit nur einer Perle: ${positions}. Behandle diese Stellen vorsichtig und erwäge eine Trägerplatte.` : locale === 'fr' ? `Jonctions fragiles d’une seule perle : ${positions}. Manipulez ces zones avec soin et envisagez un support.` : `ビーズ一個幅の細い接続部分：${positions}。慎重に扱い、台紙などの支持材の使用を検討してください。`;
    }
    const parts = /^This design has (\d+) separate parts\./.exec(note)?.[1] ?? (note.startsWith('The body and feet form three separate parts.') ? '3' : null);
    if (parts) return locale === 'de' ? `Das Motiv besteht aus ${parts} getrennten Teilen. Befestige sie auf einer Trägerplatte und hebe diese Version nicht als ein Stück an.` : locale === 'fr' ? `Ce motif comporte ${parts} parties séparées. Fixez-les sur un support ; n’essayez pas de soulever cette version en une seule pièce.` : `図案は${parts}つのパーツに分かれています。支持材に固定し、このまま一体の作品として持ち上げないでください。`;
    throw new Error(`Untranslated ${locale} assembly note: ${note}`);
}

export function getPatternSearchAliases(pattern: Pattern): string {
    return `${getPatternDisplayName(pattern)} ${Object.values(namedPokemon[pattern.id] ?? {}).join(' ')} ${(subjects[pattern.title] ?? []).join(' ')}`;
}
