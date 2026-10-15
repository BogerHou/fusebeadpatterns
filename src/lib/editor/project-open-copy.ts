import type { SiteLocale } from '../i18n/locales';

type ProjectOpenCopy = {
    replaceConfirm: string;
    busy: string;
    invalid: string;
    readError: string;
};

const copy = {
    en: {
        replaceConfirm: 'Opening this project replaces your current pattern, original image and settings, and clears Undo/Redo history. Save a project copy first if needed; project files do not save that history. Cancel keeps your current work. Open this project?',
        busy: 'Wait for the current operation to finish, then try opening the project again.',
        invalid: 'Could not open project file. Choose a bead-pattern project JSON file.',
        readError: 'Could not read project file.',
    },
    de: {
        replaceConfirm: 'Dieses Projekt ersetzt deine aktuelle Vorlage, das Originalbild und die Einstellungen. Der Verlauf für Rückgängig und Wiederholen wird gelöscht. Speichere bei Bedarf vorher eine Projektkopie; Projektdateien enthalten diesen Verlauf nicht. Abbrechen behält deine aktuelle Arbeit. Dieses Projekt öffnen?',
        busy: 'Warte, bis der aktuelle Vorgang abgeschlossen ist, und versuche dann erneut, das Projekt zu öffnen.',
        invalid: 'Die Projektdatei konnte nicht geöffnet werden. Wähle eine JSON-Projektdatei für Bügelperlen.',
        readError: 'Die Projektdatei konnte nicht gelesen werden.',
    },
    fr: {
        replaceConfirm: 'Ouvrir ce projet remplace votre modèle actuel, l’image originale et les réglages, et efface l’historique d’annulation et de rétablissement. Enregistrez d’abord une copie du projet si nécessaire ; les fichiers de projet ne conservent pas cet historique. Annuler conserve votre travail actuel. Ouvrir ce projet ?',
        busy: 'Attendez la fin de l’opération en cours, puis réessayez d’ouvrir le projet.',
        invalid: 'Impossible d’ouvrir ce projet. Choisissez un fichier JSON de projet de perles à repasser.',
        readError: 'Impossible de lire le fichier du projet.',
    },
    ja: {
        replaceConfirm: 'このプロジェクトを開くと、現在の図案・元の画像・設定を置き換え、「元に戻す・やり直す」の履歴を消去します。必要な場合は先にプロジェクトのコピーを保存してください。ただし、プロジェクトファイルにその履歴は含まれません。キャンセルすると現在の作業を保持します。このプロジェクトを開きますか？',
        busy: '現在の処理が完了してから、もう一度プロジェクトを開いてください。',
        invalid: 'プロジェクトを開けませんでした。ビーズ図案のプロジェクトJSONファイルを選んでください。',
        readError: 'プロジェクトファイルを読み取れませんでした。',
    },
} satisfies Record<SiteLocale, ProjectOpenCopy>;

export const getProjectOpenCopy = (locale: SiteLocale): ProjectOpenCopy => copy[locale];
