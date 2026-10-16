import type { PixelGridLocale } from './messages';

export const PIXEL_PRACTICE_COPY = {
    en: {
        start: 'Try this example',
        loading: 'Opening example…',
        replace: 'Start this example and replace your image, edits, history and settings? Save your full workspace first if you want to keep your current work.',
        cancelled: 'Example cancelled. Your current workspace was kept.',
        failed: 'This example could not be opened. Your current workspace was kept. You can try again or import a source image yourself.',
        loaded: 'Example ready. Try selecting a subject, reconverting, or editing pixels. Save the full workspace to keep the original image and your changes.',
    },
    de: {
        start: 'Dieses Beispiel ausprobieren',
        loading: 'Beispiel wird geöffnet…',
        replace: 'Dieses Beispiel starten und dein Bild, deine Änderungen, den Verlauf und die Einstellungen ersetzen? Speichere zuerst den vollständigen Arbeitsstand, wenn du deine bisherige Arbeit behalten möchtest.',
        cancelled: 'Beispiel abgebrochen. Dein bisheriger Arbeitsstand bleibt erhalten.',
        failed: 'Dieses Beispiel konnte nicht geöffnet werden. Dein bisheriger Arbeitsstand bleibt erhalten. Versuche es erneut oder importiere selbst ein Originalbild.',
        loaded: 'Beispiel bereit. Wähle ein Motiv aus, wandle das Original neu um oder bearbeite die Pixel. Speichere den vollständigen Arbeitsstand, um Originalbild und Änderungen zu behalten.',
    },
    fr: {
        start: 'Essayer cet exemple',
        loading: 'Ouverture de l’exemple…',
        replace: 'Démarrer cet exemple et remplacer votre image, vos retouches, l’historique et les réglages ? Enregistrez d’abord tout l’espace de travail pour conserver votre travail actuel.',
        cancelled: 'Exemple annulé. Votre espace de travail actuel est conservé.',
        failed: 'Impossible d’ouvrir cet exemple. Votre espace de travail actuel est conservé. Réessayez ou importez vous-même une image d’origine.',
        loaded: 'Exemple prêt. Sélectionnez un sujet, reconvertissez l’image ou retouchez les pixels. Enregistrez tout l’espace de travail pour conserver l’image d’origine et vos modifications.',
    },
    ja: {
        start: 'この作例で試す',
        loading: '作例を読み込んでいます…',
        replace: 'この作例を開き、現在の画像、編集内容、履歴、設定を置き換えますか？今の作業を残す場合は、先に「作業全体を保存」を使ってください。',
        cancelled: '作例の読み込みをキャンセルしました。現在の作業はそのままです。',
        failed: '作例を開けませんでした。現在の作業はそのままです。もう一度試すか、元画像を自分で読み込んでください。',
        loaded: '作例を開きました。使う範囲を選ぶ、元画像から再変換する、ピクセルを修正する操作を試せます。元画像と編集内容を残すには「作業全体を保存」を使ってください。',
    },
} satisfies Record<PixelGridLocale, Record<string, string>>;
