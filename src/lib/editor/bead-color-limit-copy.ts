import type { SiteLocale } from '../i18n/locales';

export type BeadColorLimitCopy = {
    open: string;
    title: string;
    summary: string;
    label: string;
    unlimited: string;
    hint: string;
    currentCount: string;
    unmatchedCount: string;
    appliedLimit: string;
    noLimit: string;
    nullCurrentNote: string;
    applyCurrent: string;
    regenerate: string;
    sourceWarning: string;
    manualNote: string;
    cancel: string;
    busy: string;
    error: string;
    invalid: string;
    disabledSource: string;
    applySettingsHint: string;
};

const COPY: Record<SiteLocale, BeadColorLimitCopy> = {
    en: {
        applySettingsHint: 'Apply your pattern setup changes first.',
        open: 'Reduce bead colors',
        title: 'Choose a bead color limit',
        summary: 'Automatic conversion uses at most the limit you set, with colors from your selected bead brands.',
        label: 'Maximum colors for automatic conversion',
        unlimited: 'No limit',
        hint: 'Leave blank for no limit, or enter a whole number from 1 to 512. Apply to the current pattern to change its colors while keeping edited bead positions. You can undo this change.',
        currentCount: 'Materials list: {count} colors',
        unmatchedCount: '{count} occupied cells are not in the materials list.',
        appliedLimit: 'Automatic conversion: up to {count} colors',
        noLimit: 'Automatic conversion: no color limit',
        nullCurrentNote: 'Turning off the limit keeps your edited beads; it does not restore earlier detail.',
        applyCurrent: 'Apply to current pattern',
        regenerate: 'Convert source image again',
        sourceWarning: 'Converting the source image again replaces hand-edited beads and starts a new undo history.',
        manualNote: 'Manual edits and brand changes can use more colors than this limit. The materials list shows the colors actually used.',
        cancel: 'Cancel',
        busy: 'Applying color limit…',
        error: 'The color limit could not be applied. Your current pattern is unchanged. Try again.',
        invalid: 'Leave blank for no limit, or enter a whole number from 1 to 512.',
        disabledSource: 'A source image is needed for this option.',
    },
    de: {
        applySettingsHint: 'Wende zuerst die Änderungen an der Vorlageneinstellung an.',
        open: 'Perlenfarben reduzieren',
        title: 'Anzahl der Perlenfarben begrenzen',
        summary: 'Die automatische Umwandlung verwendet höchstens die gewählte Anzahl an Farben aus deinen ausgewählten Perlenmarken.',
        label: 'Maximale Farbanzahl bei automatischer Umwandlung',
        unlimited: 'Keine Begrenzung',
        hint: 'Lass das Feld leer für keine Begrenzung oder gib eine ganze Zahl von 1 bis 512 ein. Beim Anwenden auf die aktuelle Vorlage ändern sich die Farben; von Hand bearbeitete Perlenpositionen bleiben erhalten. Du kannst die Änderung rückgängig machen.',
        currentCount: 'Materialliste: {count} Farben',
        unmatchedCount: '{count} belegte Felder sind nicht in der Materialliste enthalten.',
        appliedLimit: 'Automatische Umwandlung: bis zu {count} Farben',
        noLimit: 'Automatische Umwandlung: keine Farbbegrenzung',
        nullCurrentNote: 'Wenn du die Begrenzung ausschaltest, bleiben deine bearbeiteten Perlen erhalten. Frühere Details werden dadurch nicht wiederhergestellt.',
        applyCurrent: 'Auf aktuelle Vorlage anwenden',
        regenerate: 'Originalbild erneut umwandeln',
        sourceWarning: 'Wenn du das Originalbild erneut umwandelst, werden von Hand bearbeitete Perlen ersetzt und der Rückgängig-Verlauf beginnt neu.',
        manualNote: 'Durch manuelle Bearbeitung und einen Markenwechsel kann die Farbanzahl über dieser Grenze liegen. Die Materialliste zeigt die tatsächlich verwendeten Farben.',
        cancel: 'Abbrechen',
        busy: 'Farbbegrenzung wird angewendet…',
        error: 'Die Farbbegrenzung konnte nicht angewendet werden. Deine aktuelle Vorlage bleibt unverändert. Versuche es erneut.',
        invalid: 'Lass das Feld leer für keine Begrenzung oder gib eine ganze Zahl von 1 bis 512 ein.',
        disabledSource: 'Für diese Option wird ein Originalbild benötigt.',
    },
    fr: {
        applySettingsHint: 'Appliquez d’abord les changements de configuration du modèle.',
        open: 'Réduire les couleurs de perles',
        title: 'Limiter le nombre de couleurs de perles',
        summary: 'La conversion automatique utilise au maximum le nombre choisi, avec les couleurs de vos marques de perles sélectionnées.',
        label: 'Nombre maximal de couleurs pour la conversion automatique',
        unlimited: 'Sans limite',
        hint: 'Laissez le champ vide pour ne pas limiter les couleurs, ou saisissez un nombre entier de 1 à 512. Appliquer au modèle actuel change ses couleurs en conservant les positions des perles retouchées. Vous pouvez annuler cette modification.',
        currentCount: 'Liste du matériel : {count} couleurs',
        unmatchedCount: '{count} cases occupées ne figurent pas dans la liste du matériel.',
        appliedLimit: 'Conversion automatique : jusqu’à {count} couleurs',
        noLimit: 'Conversion automatique : sans limite de couleurs',
        nullCurrentNote: 'Désactiver la limite conserve vos perles retouchées ; cela ne rétablit pas les détails précédents.',
        applyCurrent: 'Appliquer au modèle actuel',
        regenerate: 'Convertir à nouveau l’image source',
        sourceWarning: 'Convertir à nouveau l’image source remplace les perles retouchées à la main et recommence l’historique d’annulation.',
        manualNote: 'Les retouches manuelles et les changements de marque peuvent dépasser cette limite. La liste du matériel indique les couleurs réellement utilisées.',
        cancel: 'Annuler',
        busy: 'Application de la limite de couleurs…',
        error: 'Impossible d’appliquer la limite de couleurs. Votre modèle actuel est inchangé. Réessayez.',
        invalid: 'Laissez le champ vide pour ne pas limiter les couleurs, ou saisissez un nombre entier de 1 à 512.',
        disabledSource: 'Une image source est nécessaire pour cette option.',
    },
    ja: {
        applySettingsHint: '先に図案の設定変更を適用してください。',
        open: 'ビーズの色数を減らす',
        title: 'ビーズの色数の上限を選ぶ',
        summary: '自動変換では、選択したメーカーの色を使い、指定した色数以内で図案を作成します。',
        label: '自動変換で使う色数の上限',
        unlimited: '制限なし',
        hint: '制限しない場合は空欄にしてください。制限する場合は1〜512の整数を入力してください。今の図案に適用すると、手作業で修正したビーズの位置を保ちながら色を変更します。この変更は元に戻せます。',
        currentCount: '材料一覧：{count}色',
        unmatchedCount: '色のある{count}マスが材料一覧に含まれていません。',
        appliedLimit: '自動変換：最大{count}色',
        noLimit: '自動変換：色数の制限なし',
        nullCurrentNote: '制限を解除しても、編集したビーズはそのままです。以前の細部は復元されません。',
        applyCurrent: '今の図案に適用',
        regenerate: '元の画像から作り直す',
        sourceWarning: '元の画像から作り直すと、手作業で修正したビーズも置き換わり、元に戻す履歴が新しくなります。',
        manualNote: '手作業での編集やメーカーの変更により、上限を超える色数になることがあります。材料一覧には実際に使っている色が表示されます。',
        cancel: 'キャンセル',
        busy: '色数の上限を適用中…',
        error: '色数の上限を適用できませんでした。今の図案は変更されていません。もう一度お試しください。',
        invalid: '制限しない場合は空欄にしてください。制限する場合は1〜512の整数を入力してください。',
        disabledSource: 'この操作には元の画像が必要です。',
    },
};

export function getBeadColorLimitCopy(locale: SiteLocale = 'en'): BeadColorLimitCopy {
    return COPY[locale];
}
