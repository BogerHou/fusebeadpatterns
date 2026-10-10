'use client';

import { useId, useState } from 'react';
import type { SiteLocale } from '@/lib/i18n/locales';
import { getPegboardCalculation, PEGBOARD_FIELDS, type PegboardField, type PegboardInputs } from '@/lib/guides/pegboard-calculator';

type CalculatorCopy = {
    title: string;
    intro: string;
    fields: Record<PegboardField, string>;
    range: string;
    error: string;
    invalidResult: string;
    total: string;
    across: string;
    down: string;
    coverage: string;
    positions: string;
    assumption: string;
    coverageNote: string;
};

const copy: Record<SiteLocale, CalculatorCopy> = {
    en: {
        title: 'Pegboard calculator',
        intro: 'Find how many rectangular pegboards you need for your pattern’s grid.',
        fields: { patternWidth: 'Pattern width (columns)', patternHeight: 'Pattern height (rows)', boardWidth: 'Columns on one board', boardHeight: 'Rows on one board' },
        range: 'Use whole numbers from 1 to 10,000. Count usable bead positions on each board.',
        error: 'Enter a whole number from 1 to 10,000.',
        invalidResult: 'Correct the highlighted inputs to see the board count.',
        total: 'Pegboards needed', across: 'Boards across', down: 'Boards down', coverage: 'Grid coverage', positions: 'columns × rows',
        assumption: 'This assumes identical rectangular boards joined into a continuous grid. Check your own board’s usable rows, columns and connectors. Shaped boards are not included.',
        coverageNote: 'Coverage includes empty positions. It is not the actual bead count or the physical size after ironing.',
    },
    de: {
        title: 'Steckplatten-Rechner',
        intro: 'Berechne, wie viele rechteckige Steckplatten du für das Raster deiner Vorlage brauchst.',
        fields: { patternWidth: 'Vorlagenbreite (Spalten)', patternHeight: 'Vorlagenhöhe (Reihen)', boardWidth: 'Spalten pro Steckplatte', boardHeight: 'Reihen pro Steckplatte' },
        range: 'Ganze Zahlen von 1 bis 10.000 eingeben. Zähle die nutzbaren Steckplätze jeder Platte.',
        error: 'Gib eine ganze Zahl von 1 bis 10.000 ein.',
        invalidResult: 'Korrigiere die markierten Eingaben, um die Plattenzahl zu sehen.',
        total: 'Benötigte Steckplatten', across: 'Platten nebeneinander', down: 'Platten untereinander', coverage: 'Abgedecktes Raster', positions: 'Spalten × Reihen',
        assumption: 'Die Berechnung setzt gleich große rechteckige Platten voraus, die ein durchgehendes Raster bilden. Prüfe die nutzbaren Reihen, Spalten und Verbindungen deiner eigenen Platten. Motivplatten werden nicht berücksichtigt.',
        coverageNote: 'Das Raster enthält auch leere Steckplätze. Es entspricht weder der tatsächlichen Perlenzahl noch den Abmessungen nach dem Bügeln.',
    },
    fr: {
        title: 'Calculateur de plaques',
        intro: 'Calculez le nombre de plaques rectangulaires nécessaires pour la grille de votre modèle.',
        fields: { patternWidth: 'Largeur du modèle (colonnes)', patternHeight: 'Hauteur du modèle (rangées)', boardWidth: 'Colonnes sur une plaque', boardHeight: 'Rangées sur une plaque' },
        range: 'Saisissez des nombres entiers de 1 à 10 000. Comptez les emplacements utilisables sur chaque plaque.',
        error: 'Saisissez un nombre entier de 1 à 10 000.',
        invalidResult: 'Corrigez les champs signalés pour afficher le nombre de plaques.',
        total: 'Plaques nécessaires', across: 'Plaques en largeur', down: 'Plaques en hauteur', coverage: 'Grille couverte', positions: 'colonnes × rangées',
        assumption: 'Le calcul suppose des plaques rectangulaires identiques assemblées en une grille continue. Vérifiez les rangées, colonnes et raccords utilisables de vos plaques. Les plaques en forme de motif sont exclues.',
        coverageNote: 'La grille comprend les emplacements vides. Elle ne donne ni le nombre réel de perles ni les dimensions après repassage.',
    },
    ja: {
        title: '必要なプレート枚数を計算',
        intro: '図案のマス数から、必要な長方形プレートの枚数を計算します。',
        fields: { patternWidth: '図案の横幅（マス）', patternHeight: '図案の高さ（マス）', boardWidth: 'プレート1枚の横のマス数', boardHeight: 'プレート1枚の縦のマス数' },
        range: '1〜10,000の整数を入力してください。プレートの使用できるビーズ位置を数えます。',
        error: '1〜10,000の整数を入力してください。',
        invalidResult: '表示された入力エラーを直すと、枚数を確認できます。',
        total: '必要なプレート枚数', across: '横に並べる枚数', down: '縦に並べる枚数', coverage: 'プレート全体のマス数', positions: '横 × 縦',
        assumption: '同じサイズの長方形プレートを、マスが連続するようにつなぐ場合の計算です。お手持ちのプレートの使用できる縦横のマス数と接続部分を確認してください。形付きプレートには対応していません。',
        coverageNote: '空白の位置も含みます。実際に使うビーズの個数や、アイロン後の実寸を示すものではありません。',
    },
};

export default function PegboardCalculator({ locale = 'en' }: { locale?: SiteLocale }) {
    const labels = copy[locale];
    const id = useId();
    const [inputs, setInputs] = useState<PegboardInputs>({ patternWidth: '40', patternHeight: '60', boardWidth: '29', boardHeight: '29' });
    const { layout, invalidFields } = getPegboardCalculation(inputs);
    const format = new Intl.NumberFormat(locale).format;

    return <section id="pegboard-calculator" aria-labelledby={`${id}-heading`} className="mt-10 border-y border-[#d9ded5] py-8 sm:mt-14 sm:py-10">
        <h2 id={`${id}-heading`} className="section-heading">{labels.title}</h2>
        <p className="mt-4 text-base leading-7 text-[#43564d]">{labels.intro}</p>
        <p id={`${id}-range`} className="mt-3 text-sm leading-6 text-[#59685d]">{labels.range}</p>
        <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {PEGBOARD_FIELDS.map(field => {
                const invalid = invalidFields.includes(field);
                const inputId = `${id}-${field}`;
                return <div key={field}>
                    <label htmlFor={inputId} className="block text-sm font-semibold leading-6 text-[#243e36]">{labels.fields[field]}</label>
                    <input
                        id={inputId}
                        name={field}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={inputs[field]}
                        onChange={event => setInputs(previous => ({ ...previous, [field]: event.target.value }))}
                        aria-invalid={invalid}
                        aria-describedby={`${id}-range${invalid ? ` ${inputId}-error` : ''}`}
                        className={`mt-2 w-full rounded-md border bg-white px-3 py-2.5 text-base text-[#243e36] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#28614e] ${invalid ? 'border-[#a2372b]' : 'border-[#b8c6bc]'}`}
                    />
                    {invalid && <p id={`${inputId}-error`} className="mt-2 text-sm leading-6 text-[#a2372b]">{labels.error}</p>}
                </div>;
            })}
        </div>
        <div aria-live="polite" aria-atomic="true" className="mt-7 rounded-lg bg-[#f2f4ed] px-5 py-5 sm:px-6">
            {layout ? <>
                <p className="text-sm font-semibold text-[#43564d]">{labels.total}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-[#243e36]">{format(layout.totalBoards)}</p>
                <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div><dt className="text-sm leading-6 text-[#59685d]">{labels.across}</dt><dd className="mt-1 font-semibold tabular-nums text-[#243e36]">{format(layout.boardsAcross)}</dd></div>
                    <div><dt className="text-sm leading-6 text-[#59685d]">{labels.down}</dt><dd className="mt-1 font-semibold tabular-nums text-[#243e36]">{format(layout.boardsDown)}</dd></div>
                    <div><dt className="text-sm leading-6 text-[#59685d]">{labels.coverage}</dt><dd className="mt-1 font-semibold tabular-nums text-[#243e36]">{format(layout.coverageWidth)} × {format(layout.coverageHeight)}<span className="mt-1 block text-xs font-normal leading-5 text-[#59685d]">{labels.positions}</span></dd></div>
                </dl>
            </> : <p className="text-base leading-7 text-[#43564d]">{labels.invalidResult}</p>}
        </div>
        <p className="mt-5 text-sm leading-6 text-[#59685d]">{labels.assumption}</p>
        <p className="mt-3 text-sm leading-6 text-[#59685d]">{labels.coverageNote}</p>
    </section>;
}
