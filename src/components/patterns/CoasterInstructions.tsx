import type { SiteLocale } from '@/lib/i18n/locales';

const copy = {
    en: {
        heading: 'Finish the coaster with cork',
        size: 'The 23 × 23 bead motif spans a nominal 115 × 115 mm at 5 mm grid spacing. This is not the finished size after ironing. Measure your cup base first, then check the cooled piece: the whole base must fit on a flat, stable surface.',
        steps: [
            'Have an adult fuse both sides following the bead manufacturer’s instructions. Let the piece cool completely.',
            'Trace the cooled piece’s actual outline onto a sheet of cork and cut the cork to that outline.',
            'Glue the cork to the underside with an adhesive suitable for the materials. Follow the adhesive instructions and allow it to cure fully before use.',
        ],
        limits: 'This digital design has not been assembled or tested in use. Heat resistance and load capacity are untested: do not use it with hot cups or put it in a dishwasher.',
        reference: 'Cork-backing method: ',
        source: 'Perler’s Flower Coaster Set instructions',
        original: '. The diamond artwork is our own original design.',
    },
    de: {
        heading: 'Den Untersetzer mit Kork hinterlegen',
        size: 'Das Motiv mit 23 × 23 Perlen ist bei 5 mm Rasterabstand nominell 115 × 115 mm groß. Das ist nicht die fertige Größe nach dem Bügeln. Miss zuerst den Tassenboden und prüfe danach das abgekühlte Stück: Der gesamte Boden muss auf einer ebenen, stabilen Fläche stehen.',
        steps: [
            'Lass beide Seiten von einem Erwachsenen nach den Angaben des Perlenherstellers bügeln. Lass das Stück vollständig abkühlen.',
            'Zeichne den tatsächlichen Umriss des abgekühlten Stücks auf eine Korkplatte und schneide den Kork entlang dieser Linie aus.',
            'Klebe den Kork mit einem für die Materialien geeigneten Klebstoff auf die Unterseite. Beachte die Klebstoffanleitung und lasse ihn vor der Nutzung vollständig aushärten.',
        ],
        limits: 'Dieses digitale Motiv wurde nicht praktisch hergestellt oder im Gebrauch getestet. Hitzebeständigkeit und Tragfähigkeit sind ungeprüft: Nicht mit heißen Tassen verwenden und nicht in die Spülmaschine geben.',
        reference: 'Methode für die Korkrückseite: ',
        source: 'Perlers Anleitung „Flower Coaster Set“ (Englisch)',
        original: '. Das Rautenmuster ist unser eigenes Originalmotiv.',
    },
    fr: {
        heading: 'Ajouter un dessous en liège',
        size: 'Le motif de 23 × 23 perles mesure nominalement 115 × 115 mm avec un pas de grille de 5 mm. Ce n’est pas sa taille finale après repassage. Mesurez d’abord le fond de votre tasse, puis vérifiez la pièce refroidie : le fond entier doit reposer sur une surface plane et stable.',
        steps: [
            'Faites repasser les deux faces par un adulte selon les instructions du fabricant des perles. Laissez refroidir complètement.',
            'Tracez le contour réel de la pièce refroidie sur une feuille de liège, puis découpez le liège en suivant ce contour.',
            'Collez le liège sous la pièce avec une colle adaptée aux matériaux. Suivez les instructions de la colle et laissez-la durcir entièrement avant utilisation.',
        ],
        limits: 'Ce modèle numérique n’a pas été réalisé ni testé en usage réel. Sa résistance à la chaleur et sa capacité de charge ne sont pas vérifiées : ne l’utilisez pas avec une tasse chaude et ne le passez pas au lave-vaisselle.',
        reference: 'Méthode du dessous en liège : ',
        source: 'instructions « Flower Coaster Set » de Perler (en anglais)',
        original: '. Le dessin à losanges est notre création originale.',
    },
    ja: {
        heading: '裏面にコルクを貼って仕上げる',
        size: '図柄は23×23マスで、5 mm間隔のグリッドでは計算上115×115 mmです。アイロン後の完成寸法ではありません。先にカップの底を測り、冷めた作品でも確認してください。底全体が平らで安定した面に収まる必要があります。',
        steps: [
            'ビーズメーカーの説明に従い、大人が両面をアイロンで接着します。完全に冷ましてください。',
            '冷めた作品の実際の輪郭をコルクシートに写し、その線に沿って切ります。',
            '素材に適した接着剤でコルクを裏面に貼ります。接着剤の説明に従い、完全に硬化してから使用してください。',
        ],
        limits: 'このデジタル図案は実物の制作・使用試験を行っていません。耐熱性と耐荷重は未検証です。熱いカップには使わず、食器洗い機にも入れないでください。',
        reference: 'コルクを貼る方法の参考：',
        source: 'Perler「Flower Coaster Set」の説明（英語）',
        original: '。ひし形の図柄は当サイトのオリジナルです。',
    },
} satisfies Record<SiteLocale, { heading: string; size: string; steps: string[]; limits: string; reference: string; source: string; original: string }>;

export default function CoasterInstructions({ patternId, locale = 'en' }: { patternId: string; locale?: SiteLocale }) {
    if (patternId !== 'original-retro-diamond-coaster') return null;
    const text = copy[locale];
    return <section className="mt-8 max-w-3xl border-t border-line pt-8" aria-labelledby="coaster-finishing-heading">
        <h2 id="coaster-finishing-heading" className="section-heading">{text.heading}</h2>
        <p className="mt-4 leading-8 text-muted">{text.size}</p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 leading-8 text-muted">{text.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <p className="mt-4 leading-8 text-muted">{text.limits}</p>
        <p className="mt-4 text-sm leading-7 text-muted">{text.reference}<a href="https://perler.com/blogs/projects/flower-coaster-set" hrefLang="en" target="_blank" rel="noopener noreferrer" className="text-link">{text.source}</a>{text.original}</p>
    </section>;
}
