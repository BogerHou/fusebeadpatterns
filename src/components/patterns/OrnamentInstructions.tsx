import type { SiteLocale } from '@/lib/i18n/locales';
import { guideHref } from '../../lib/guides/routes';

const copy = {
    en: {
        heading: 'Add a ribbon through the opening',
        size: 'The 21 × 25 bead motif spans a nominal 105 × 125 mm at 5 mm grid spacing. This is not the finished size after ironing. Count from 1 at the top left: leave columns 14–16 and rows 5–7 empty. This 3 × 3 cell opening has a two-bead border on each side. Its nominal 15 mm grid span does not guarantee the size of the cooled opening.',
        steps: [
            'Have an adult fuse both sides following the bead manufacturer’s instructions, then let the piece cool completely.',
            'Inspect the actual opening and use thin cord or ribbon that passes through naturally. Do not stretch the opening or drill a hole.',
            'Loop the cord or ribbon through the opening and tie its two ends together. Check that all bead connections are intact and the attachment is secure before hanging.',
        ],
        limits: 'This original digital design has not been physically assembled, iron-tested or tested for attachment or hanging strength. No jump-ring size or load capacity has been verified.',
        reference: 'Ribbon attachment method: ',
        source: 'Perler’s Easter Egg Ornaments instructions',
        guide: 'Read the ironing guide',
    },
    de: {
        heading: 'Ein Band durch die Öffnung ziehen',
        size: 'Das Motiv mit 21 × 25 Perlen ist bei 5 mm Rasterabstand nominell 105 × 125 mm groß. Das ist nicht die fertige Größe nach dem Bügeln. Zähle oben links ab 1: Lass die Spalten 14–16 und Zeilen 5–7 frei. Diese Öffnung aus 3 × 3 Feldern hat auf jeder Seite einen zwei Perlen breiten Rand. Die nominelle Rasterbreite von 15 mm garantiert nicht die Größe der abgekühlten Öffnung.',
        steps: [
            'Lass beide Seiten von einem Erwachsenen nach den Angaben des Perlenherstellers bügeln. Lass das Stück vollständig abkühlen.',
            'Prüfe die tatsächliche Öffnung und verwende eine dünne Schnur oder ein Band, das sich ohne Druck hindurchziehen lässt. Dehne die Öffnung nicht und bohre kein Loch.',
            'Ziehe die Schnur oder das Band durch die Öffnung und verknote die beiden Enden miteinander. Prüfe vor dem Aufhängen, ob alle Perlenverbindungen intakt sind und die Befestigung sicher sitzt.',
        ],
        limits: 'Dieses digitale Originalmotiv wurde nicht praktisch hergestellt oder bügelgetestet. Befestigung und Festigkeit beim Aufhängen sind ungeprüft. Es wurde keine Biegeringgröße oder Tragfähigkeit bestätigt.',
        reference: 'Methode für die Bandbefestigung: ',
        source: 'Perlers Anleitung „Easter Egg Ornaments“ (Englisch)',
        guide: 'Anleitung zum Bügeln lesen',
    },
    fr: {
        heading: 'Passer un ruban dans l’ouverture',
        size: 'Le motif de 21 × 25 perles mesure nominalement 105 × 125 mm avec un pas de grille de 5 mm. Ce n’est pas sa taille finale après repassage. Comptez à partir de 1 en haut à gauche : laissez vides les colonnes 14–16 et les lignes 5–7. Cette ouverture de 3 × 3 cases est entourée d’une bordure de deux perles de chaque côté. Les 15 mm nominaux de la grille ne garantissent pas la taille de l’ouverture refroidie.',
        steps: [
            'Faites repasser les deux faces par un adulte selon les instructions du fabricant des perles, puis laissez refroidir complètement.',
            'Vérifiez l’ouverture réelle et choisissez une ficelle fine ou un ruban qui la traverse sans forcer. N’écartez pas l’ouverture et ne percez pas de trou.',
            'Passez la ficelle ou le ruban dans l’ouverture et nouez les deux extrémités ensemble. Avant de suspendre la pièce, vérifiez que toutes les jonctions entre perles sont intactes et que l’attache tient correctement.',
        ],
        limits: 'Cette création numérique originale n’a pas été réalisée ni testée au fer. L’attache et la résistance en suspension n’ont pas été testées. Aucune taille d’anneau de jonction ni capacité de charge n’a été validée.',
        reference: 'Méthode de fixation du ruban : ',
        source: 'instructions « Easter Egg Ornaments » de Perler (en anglais)',
        guide: 'Lire le guide de repassage',
    },
    ja: {
        heading: '開口部にひもやリボンを通す',
        size: '図柄は21×25マスで、5 mm間隔のグリッドでは計算上105×125 mmです。アイロン後の完成寸法ではありません。左上を1列目・1行目として、14–16列・5–7行の3×3マスは空けておきます。開口部の四辺にはそれぞれビーズ2個幅の縁があります。グリッド上の計算値15 mmは、冷めた開口部の実寸を保証するものではありません。',
        steps: [
            'ビーズメーカーの説明に従い、大人が両面をアイロンで接着します。完全に冷ましてください。',
            '実際の開口部を確認し、無理なく通る細いひもやリボンを選びます。穴を押し広げたり、ドリルで穴を開けたりしないでください。',
            '開口部にひもやリボンを通し、両端を結び合わせます。吊り下げる前に、ビーズの接着部分がすべてつながり、取り付け部分がしっかりしていることを確認してください。',
        ],
        limits: 'このオリジナルのデジタル図案は、実物の制作・アイロン仕上げ・取り付け・吊り下げ強度を検証していません。使用できる丸カンのサイズや耐荷重も未検証です。',
        reference: 'リボンの取り付け方法の参考：',
        source: 'Perler「Easter Egg Ornaments」の説明（英語）',
        guide: 'アイロンのかけ方を読む',
    },
} satisfies Record<SiteLocale, { heading: string; size: string; steps: string[]; limits: string; reference: string; source: string; guide: string }>;

export default function OrnamentInstructions({ patternId, locale = 'en' }: { patternId: string; locale?: SiteLocale }) {
    if (patternId !== 'original-christmas-bauble-ornament') return null;
    const text = copy[locale];
    return <section className="mt-8 max-w-3xl border-t border-line pt-8" aria-labelledby="ornament-finishing-heading">
        <h2 id="ornament-finishing-heading" className="section-heading">{text.heading}</h2>
        <p className="mt-4 leading-8 text-muted">{text.size}</p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 leading-8 text-muted">{text.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <p className="mt-4 leading-8 text-muted">{text.limits}</p>
        <p className="mt-4 text-sm leading-7 text-muted">{text.reference}<a href="https://perler.com/blogs/projects/easter-egg-ornaments" hrefLang="en" target="_blank" rel="noopener noreferrer" className="text-link">{text.source}</a>.</p>
        <p className="mt-3 text-sm leading-7"><a href={guideHref('how-to-iron-perler-beads', locale)} className="text-link">{text.guide}</a></p>
    </section>;
}
