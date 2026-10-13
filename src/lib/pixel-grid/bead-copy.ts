import type { SiteLocale } from '../i18n/locales';

type PixelBeadStrings = {
    open: string;
    title: string;
    intro: string;
    brandLabel: string;
    prepare: string;
    preparing: string;
    cancel: string;
    empty: string;
    sourceError: string;
    storageError: string;
    returnToPixels: string;
    receiveTitle: string;
    receiveSummary: string;
    incomingLayout: string;
    replaceWarning: string;
    openIncoming: string;
    keepCurrent: string;
    saveCurrent: string;
    error: string;
    retry: string;
    dismissWarning: string;
    ackWarning: string;
    returnWarning: string;
    opened: string;
    alphaNote: string;
    privacyNote: string;
    returnRestoring: string;
    returnRestored: string;
    returnFailed: string;
    returnUnavailable: string;
    returnDiscard: string;
    returnSaved: string;
};

export type PixelBeadCopy = PixelBeadStrings & {
    brand: string;
    help: string;
    preview: (width: number, height: number, boardWidth: number, boardHeight: number, boardSize: number) => string;
    transferFailed: string;
    returnRetry: string;
};

const COPY: Record<SiteLocale, PixelBeadStrings> = {
    en: {
        open: 'Make a bead pattern',
        title: 'Turn your pixels into beads',
        intro: 'Each pixel becomes one bead position. Empty positions are added at the right and bottom to fill whole pegboards, without resizing your grid. Your pixel project stays unchanged.',
        brandLabel: 'Bead brand',
        prepare: 'Prepare bead pattern',
        preparing: 'Preparing your bead pattern…',
        cancel: 'Cancel',
        empty: 'Add some pixels before making a bead pattern.',
        sourceError: 'The pixel grid could not be converted. Your pixel project is unchanged. Try again.',
        storageError: 'The bead pattern could not be saved for transfer. Stay here and try again. Your pixel project is unchanged.',
        returnToPixels: 'Return to pixel editor',
        receiveTitle: 'Open your bead pattern',
        receiveSummary: 'A {width} × {height} grid is ready to open as a bead pattern. Review the brand and board layout below.',
        incomingLayout: '{columns} × {rows} boards · {brand}',
        replaceWarning: 'Opening this bead pattern replaces the current editor project and its undo history. Save the current project first if you want to keep it.',
        openIncoming: 'Open bead pattern',
        keepCurrent: 'Keep current project',
        saveCurrent: 'Save current bead project',
        error: 'The bead pattern could not be opened. Your current editor project has not been replaced. Try again or return to the pixel editor.',
        retry: 'Try again',
        dismissWarning: 'Your current project is unchanged. We could not record your choice to keep it. Try again.',
        ackWarning: 'Your bead pattern is open, but the transfer confirmation could not be saved. Download a bead project file to keep it.',
        returnWarning: 'Your pixel project stays separate. Save a bead project file to keep the changes made in this editor before returning.',
        opened: 'Your bead pattern is open in the editor.',
        alphaNote: 'Fully transparent pixels stay empty. Partially transparent pixels are blended with white before matching bead colors. The original pixel grid is unchanged.',
        privacyNote: 'Conversion and transfer happen locally in this browser. Your pixel data is not uploaded.',
        returnRestoring: 'Restoring your pixel project…',
        returnRestored: 'Your original pixel project is restored, including its colors, settings and undo history.',
        returnFailed: 'Your pixel project could not be restored. Try again or continue without restoring it.',
        returnUnavailable: 'The saved pixel project could not be loaded. It may be temporarily unavailable, missing or expired. Try again, or choose to continue with an empty pixel project.',
        returnDiscard: 'Continue without restoring the pixel project',
        returnSaved: 'When you open the bead editor, we temporarily keep your original pixel project in this browser for up to 24 hours. Download a pixel project file to keep it long term.',
    },
    de: {
        open: 'Bügelperlen-Vorlage erstellen',
        title: 'Aus deinen Pixeln werden Perlen',
        intro: 'Jeder Pixel wird zu einer Perlenposition. Rechts und unten werden leere Positionen ergänzt, damit ganze Steckplatten entstehen. Dein Raster wird nicht skaliert; dein Pixelprojekt bleibt unverändert.',
        brandLabel: 'Perlenmarke',
        prepare: 'Perlenvorlage vorbereiten',
        preparing: 'Deine Perlenvorlage wird vorbereitet…',
        cancel: 'Abbrechen',
        empty: 'Füge zuerst Pixel hinzu, bevor du eine Perlenvorlage erstellst.',
        sourceError: 'Das Pixelraster konnte nicht umgewandelt werden. Dein Pixelprojekt bleibt unverändert. Versuche es erneut.',
        storageError: 'Die Perlenvorlage konnte nicht für die Übertragung gespeichert werden. Bleib auf dieser Seite und versuche es erneut. Dein Pixelprojekt bleibt unverändert.',
        returnToPixels: 'Zurück zum Pixeleditor',
        receiveTitle: 'Deine Perlenvorlage öffnen',
        receiveSummary: 'Ein Raster mit {width} × {height} Feldern ist bereit, als Perlenvorlage geöffnet zu werden. Prüfe unten die Marke und die Plattenaufteilung.',
        incomingLayout: '{columns} × {rows} Platten · {brand}',
        replaceWarning: 'Diese Perlenvorlage ersetzt beim Öffnen das aktuelle Editorprojekt und seinen Rückgängig-Verlauf. Speichere zuerst das aktuelle Projekt, wenn du es behalten möchtest.',
        openIncoming: 'Perlenvorlage öffnen',
        keepCurrent: 'Aktuelles Projekt behalten',
        saveCurrent: 'Aktuelles Perlenprojekt speichern',
        error: 'Die Perlenvorlage konnte nicht geöffnet werden. Dein aktuelles Editorprojekt wurde nicht ersetzt. Versuche es erneut oder kehre zum Pixeleditor zurück.',
        retry: 'Erneut versuchen',
        dismissWarning: 'Dein aktuelles Projekt bleibt erhalten. Deine Entscheidung, es zu behalten, konnte nicht gespeichert werden. Versuche es erneut.',
        ackWarning: 'Deine Perlenvorlage ist geöffnet, aber die Übertragungsbestätigung konnte nicht gespeichert werden. Lade eine Perlenprojektdatei herunter, um sie zu behalten.',
        returnWarning: 'Dein Pixelprojekt bleibt unabhängig von der Perlenvorlage. Speichere vor der Rückkehr eine Perlenprojektdatei, um die Änderungen aus diesem Editor zu behalten.',
        opened: 'Deine Perlenvorlage ist im Editor geöffnet.',
        alphaNote: 'Vollständig transparente Pixel bleiben leer. Teilweise transparente Pixel werden vor der Farbzuordnung mit Weiß gemischt. Das ursprüngliche Pixelraster bleibt unverändert.',
        privacyNote: 'Umwandlung und Übertragung erfolgen lokal in diesem Browser. Deine Pixeldaten werden nicht hochgeladen.',
        returnRestoring: 'Dein Pixelprojekt wird wiederhergestellt…',
        returnRestored: 'Dein ursprüngliches Pixelprojekt ist wiederhergestellt, einschließlich Farben, Einstellungen und Rückgängig-Verlauf.',
        returnFailed: 'Dein Pixelprojekt konnte nicht wiederhergestellt werden. Versuche es erneut oder fahre ohne Wiederherstellung fort.',
        returnUnavailable: 'Das gespeicherte Pixelprojekt konnte nicht geladen werden. Es kann vorübergehend nicht verfügbar sein, fehlen oder abgelaufen sein. Versuche es erneut oder wähle ein leeres Pixelprojekt.',
        returnDiscard: 'Ohne Wiederherstellung des Pixelprojekts fortfahren',
        returnSaved: 'Wenn du den Perleneditor öffnest, bewahren wir dein ursprüngliches Pixelprojekt vorübergehend bis zu 24 Stunden in diesem Browser auf. Lade eine Pixelprojektdatei herunter, um es langfristig zu behalten.',
    },
    fr: {
        open: 'Créer un modèle de perles',
        title: 'Transformer vos pixels en perles',
        intro: 'Chaque pixel devient une position de perle. Des positions vides sont ajoutées à droite et en bas pour compléter les plaques, sans redimensionner la grille. Votre projet de pixels reste inchangé.',
        brandLabel: 'Marque de perles',
        prepare: 'Préparer le modèle de perles',
        preparing: 'Préparation de votre modèle de perles…',
        cancel: 'Annuler',
        empty: 'Ajoutez des pixels avant de créer un modèle de perles.',
        sourceError: 'Impossible de convertir la grille de pixels. Votre projet de pixels est inchangé. Réessayez.',
        storageError: 'Impossible d’enregistrer le modèle de perles pour le transfert. Restez sur cette page et réessayez. Votre projet de pixels est inchangé.',
        returnToPixels: 'Retour à l’éditeur de pixels',
        receiveTitle: 'Ouvrir votre modèle de perles',
        receiveSummary: 'Une grille de {width} × {height} cases est prête à être ouverte comme modèle de perles. Vérifiez la marque et la disposition des plaques ci-dessous.',
        incomingLayout: '{columns} × {rows} plaques · {brand}',
        replaceWarning: 'Ouvrir ce modèle de perles remplace le projet actuel de l’éditeur et son historique d’annulation. Enregistrez d’abord le projet actuel si vous souhaitez le conserver.',
        openIncoming: 'Ouvrir le modèle de perles',
        keepCurrent: 'Conserver le projet actuel',
        saveCurrent: 'Enregistrer le projet de perles actuel',
        error: 'Impossible d’ouvrir le modèle de perles. Le projet actuel de l’éditeur n’a pas été remplacé. Réessayez ou retournez à l’éditeur de pixels.',
        retry: 'Réessayer',
        dismissWarning: 'Votre projet actuel est conservé. Impossible d’enregistrer ce choix. Réessayez.',
        ackWarning: 'Votre modèle de perles est ouvert, mais la confirmation du transfert n’a pas pu être enregistrée. Téléchargez un fichier de projet de perles pour le conserver.',
        returnWarning: 'Votre projet de pixels reste distinct. Avant de revenir, enregistrez un fichier de projet de perles pour conserver les modifications faites dans cet éditeur.',
        opened: 'Votre modèle de perles est ouvert dans l’éditeur.',
        alphaNote: 'Les pixels entièrement transparents restent vides. Les pixels partiellement transparents sont mélangés à du blanc avant la correspondance des couleurs de perles. La grille de pixels originale reste inchangée.',
        privacyNote: 'La conversion et le transfert se font localement dans ce navigateur. Vos pixels ne sont pas envoyés à un serveur.',
        returnRestoring: 'Restauration de votre projet de pixels…',
        returnRestored: 'Votre projet de pixels d’origine est restauré, avec ses couleurs, ses réglages et son historique d’annulation.',
        returnFailed: 'Impossible de restaurer votre projet de pixels. Réessayez ou continuez sans le restaurer.',
        returnUnavailable: 'Impossible de charger le projet de pixels enregistré. Il peut être temporairement inaccessible, absent ou expiré. Réessayez ou choisissez de continuer avec un projet de pixels vide.',
        returnDiscard: 'Continuer sans restaurer le projet de pixels',
        returnSaved: 'Lorsque vous ouvrez l’éditeur de perles, nous conservons temporairement votre projet de pixels original dans ce navigateur pendant 24 heures au maximum. Téléchargez un fichier de projet de pixels pour le garder à long terme.',
    },
    ja: {
        open: 'ビーズ図案を作る',
        title: 'ピクセルをビーズ図案に変換',
        intro: '1ピクセルを1つのビーズ位置に変換します。プレート全体を埋めるため、右端と下端に空きマスを追加します。拡大・縮小はせず、元のピクセルプロジェクトも変更しません。',
        brandLabel: 'ビーズのメーカー',
        prepare: 'ビーズ図案を準備',
        preparing: 'ビーズ図案を準備中…',
        cancel: 'キャンセル',
        empty: 'ビーズ図案を作る前に、ピクセルを描いてください。',
        sourceError: 'ピクセルの図案を変換できませんでした。元のピクセルプロジェクトは変更されていません。もう一度お試しください。',
        storageError: 'ビーズ図案を引き継ぐための保存ができませんでした。このページで再試行してください。元のピクセルプロジェクトは変更されていません。',
        returnToPixels: 'ピクセルエディターに戻る',
        receiveTitle: 'ビーズ図案を開く',
        receiveSummary: '{width} × {height}マスの図案をビーズ図案として開く準備ができました。下のメーカーとプレート配置を確認してください。',
        incomingLayout: '横{columns}枚 × 縦{rows}枚のプレート・{brand}',
        replaceWarning: 'このビーズ図案を開くと、エディターの現在のプロジェクトと元に戻す履歴が置き換わります。残しておきたい場合は、先に現在のプロジェクトを保存してください。',
        openIncoming: 'ビーズ図案を開く',
        keepCurrent: '現在のプロジェクトを保持',
        saveCurrent: '現在のビーズプロジェクトを保存',
        error: 'ビーズ図案を開けませんでした。エディターの現在のプロジェクトは置き換わっていません。再試行するか、ピクセルエディターに戻ってください。',
        retry: '再試行',
        dismissWarning: '現在の作品は保持されています。この選択を記録できませんでした。もう一度お試しください。',
        ackWarning: 'ビーズ図案は開けましたが、引き継ぎの確認を保存できませんでした。図案を残すには、ビーズプロジェクトのファイルをダウンロードしてください。',
        returnWarning: 'ピクセルプロジェクトとは別の図案です。戻る前にビーズプロジェクトのファイルを保存すると、このエディターでの変更を残せます。',
        opened: 'ビーズ図案をエディターで開きました。',
        alphaNote: '完全に透明なピクセルは空きマスのままです。半透明のピクセルは白と合成してからビーズの色に合わせます。元のピクセル図案は変更しません。',
        privacyNote: '変換と引き継ぎは、このブラウザ内だけで処理します。ピクセルデータをサーバーに送信しません。',
        returnRestoring: 'ピクセルプロジェクトを復元中…',
        returnRestored: '元の色、設定、元に戻す履歴を含めて、ピクセルプロジェクトを復元しました。',
        returnFailed: 'ピクセルプロジェクトを復元できませんでした。再試行するか、復元せずに続けてください。',
        returnUnavailable: '保存したピクセルプロジェクトを読み込めませんでした。一時的に利用できないか、保存データが見つからない、または期限切れの可能性があります。再試行するか、空のピクセルプロジェクトで続けることを選べます。',
        returnDiscard: 'ピクセルプロジェクトを復元せずに続ける',
        returnSaved: 'ビーズエディターを開くと、元のピクセルプロジェクトをこのブラウザに最大24時間、一時保存します。長く残したい場合は、ピクセルプロジェクトのファイルをダウンロードしてください。',
    },
};

export function getPixelBeadCopy(locale: SiteLocale): PixelBeadCopy {
    const copy = COPY[locale];
    return {
        ...copy,
        brand: copy.brandLabel,
        help: `${copy.intro} ${copy.alphaNote}`,
        transferFailed: copy.storageError,
        returnRetry: copy.retry,
        preview: (width, height, boardWidth, boardHeight, boardSize) => {
            const dimensions = `${width} × ${height}`;
            const boards = `${boardWidth} × ${boardHeight}`;
            const board = `${boardSize} × ${boardSize}`;
            switch (locale) {
                case 'de': return `${dimensions} Pixel → ${boards} Platten (${board} Positionen pro Platte)`;
                case 'fr': return `${dimensions} pixels → ${boards} plaques (${board} positions par plaque)`;
                case 'ja': return `${dimensions}ピクセル → 横${boardWidth}枚 × 縦${boardHeight}枚のプレート（1枚${board}マス）`;
                case 'en': return `${dimensions} pixels → ${boards} boards (${board} positions per board)`;
            }
        },
    };
}
