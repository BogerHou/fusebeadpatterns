import type { SiteLocale } from '../i18n/locales';

type CraftProgressLabels = {
    open: string;
    title: string;
    summary: string;
    openError: string;
    applySettingsHint: string;
    boardLabel: string;
    /** Board indices are zero-based; displayed labels are one-based. */
    boardPosition: (row: number, column: number) => string;
    /** Inclusive ranges in the whole pattern, already one-based. */
    globalRows: (from: number, to: number) => string;
    globalColumns: (from: number, to: number) => string;
    allColors: string;
    colorLabel: string;
    mark: string;
    unmark: string;
    instructions: string;
    canvasLabel: string;
    completed: string;
    remaining: string;
    total: string;
    whole: string;
    board: string;
    undo: string;
    redo: string;
    clear: string;
    clearConfirm: string;
    close: string;
    loading: string;
    loadError: string;
    retry: string;
    startNew: string;
    startNewConfirm: string;
    saving: string;
    saved: string;
    saveError: string;
    exportProgress: string;
    importProgress: string;
    importError: string;
    importMismatch: string;
    fileHelp: string;
    localHelp: string;
    unknownColor: string;
    emptyCell: string;
    filteredCell: string;
    cellStatus: string;
    done: string;
    todo: string;
    closing: string;
    closeSaveError: string;
    closeWithoutSaving: string;
    closeConfirm: string;
    emptyBoard: string;
    noChanges: string;
    error: string;
};

export type CraftProgressCopy = CraftProgressLabels & {
    help: string;
    reading: string;
};

const COPY: Record<SiteLocale, CraftProgressLabels> = {
    en: {
        open: 'Track bead progress',
        title: 'Bead placement progress',
        summary: 'Mark the beads you have placed without changing your pattern.',
        openError: 'Progress is not ready. Try again after the pattern finishes updating.',
        applySettingsHint: 'Apply the pending pattern settings first.',
        boardLabel: 'Board',
        boardPosition: (row, column) => `Row ${row + 1}, column ${column + 1}`,
        globalRows: (from, to) => `Whole pattern rows ${from}–${to}`,
        globalColumns: (from, to) => `Whole pattern columns ${from}–${to}`,
        allColors: 'All colors',
        colorLabel: 'Show color',
        mark: 'Mark as placed',
        unmark: 'Mark as not placed',
        instructions: 'Drag to mark or unmark a line. Hold Shift and drag for a rectangle. Use arrow keys to move; press Space or Enter to toggle a bead’s progress.',
        canvasLabel: 'Bead placement progress grid',
        completed: 'Placed',
        remaining: 'Remaining',
        total: 'Total beads',
        whole: 'Whole pattern',
        board: 'Selected board',
        undo: 'Undo progress change',
        redo: 'Redo progress change',
        clear: 'Clear all placed marks',
        clearConfirm: 'Clear all placed marks for this pattern? You can undo this change.',
        close: 'Close progress',
        loading: 'Loading saved progress…',
        loadError: 'Saved progress could not be loaded. Try again, or explicitly start a new record.',
        retry: 'Try again',
        startNew: 'Start new progress record',
        startNewConfirm: 'Progress may already be saved for this pattern. Starting a new record replaces it. Continue?',
        saving: 'Saving progress…',
        saved: 'Progress saved in this browser.',
        saveError: 'Progress could not be saved. Try again or export a progress file to keep your marks.',
        exportProgress: 'Export progress file',
        importProgress: 'Import progress file',
        importError: 'The progress file could not be opened. Your current marks are unchanged.',
        importMismatch: 'This progress file belongs to a different grid or bead brand. Open its original bead project first.',
        fileHelp: 'Progress files contain placement marks only. Keep the original bead project with the same brand and grid to use them.',
        localHelp: 'This browser keeps progress for up to 12 patterns on this device; older records may be removed. Progress is not uploaded. Export a progress file to keep it long term.',
        unknownColor: 'Color not in the materials list',
        emptyCell: 'Empty cell',
        filteredCell: 'Hidden by the color filter',
        cellStatus: 'Row {row}, column {column}: {state}; {color}.',
        done: 'Placed',
        todo: 'Not placed',
        closing: 'Saving progress before closing…',
        closeSaveError: 'Progress could not be saved. Export a progress file, try saving again, or choose to leave without saving.',
        closeWithoutSaving: 'Leave without saving',
        closeConfirm: 'Leave with unsaved progress? Export a progress file first if you want to keep these marks.',
        emptyBoard: 'This board has no beads to track.',
        noChanges: 'No progress marks changed.',
        error: 'Progress could not be updated. Your current marks are unchanged. Try again.',
    },
    de: {
        open: 'Perlenfortschritt verfolgen',
        title: 'Fortschritt beim Legen der Perlen',
        summary: 'Markiere bereits gelegte Perlen, ohne deine Vorlage zu ändern.',
        openError: 'Der Fortschritt ist noch nicht bereit. Versuche es erneut, sobald die Vorlage fertig aktualisiert ist.',
        applySettingsHint: 'Wende zuerst die ausstehenden Vorlageneinstellungen an.',
        boardLabel: 'Platte',
        boardPosition: (row, column) => `Reihe ${row + 1}, Spalte ${column + 1}`,
        globalRows: (from, to) => `Reihen ${from}–${to} in der gesamten Vorlage`,
        globalColumns: (from, to) => `Spalten ${from}–${to} in der gesamten Vorlage`,
        allColors: 'Alle Farben',
        colorLabel: 'Farbe anzeigen',
        mark: 'Als gelegt markieren',
        unmark: 'Als noch nicht gelegt markieren',
        instructions: 'Ziehe für eine Linie, um Perlen zu markieren oder Markierungen zu entfernen. Halte beim Ziehen die Umschalttaste für ein Rechteck. Bewege dich mit den Pfeiltasten; mit Leertaste oder Eingabetaste wechselst du den Status einer Perle.',
        canvasLabel: 'Raster für den Fortschritt beim Perlenlegen',
        completed: 'Gelegt',
        remaining: 'Übrig',
        total: 'Perlen insgesamt',
        whole: 'Gesamte Vorlage',
        board: 'Ausgewählte Platte',
        undo: 'Fortschrittsänderung rückgängig machen',
        redo: 'Fortschrittsänderung wiederholen',
        clear: 'Alle Gelegt-Markierungen entfernen',
        clearConfirm: 'Alle Gelegt-Markierungen dieser Vorlage entfernen? Du kannst die Änderung rückgängig machen.',
        close: 'Fortschritt schließen',
        loading: 'Gespeicherter Fortschritt wird geladen…',
        loadError: 'Der gespeicherte Fortschritt konnte nicht geladen werden. Versuche es erneut oder starte ausdrücklich einen neuen Eintrag.',
        retry: 'Erneut versuchen',
        startNew: 'Neuen Fortschrittseintrag starten',
        startNewConfirm: 'Für diese Vorlage ist möglicherweise bereits Fortschritt gespeichert. Ein neuer Eintrag ersetzt ihn. Fortfahren?',
        saving: 'Fortschritt wird gespeichert…',
        saved: 'Fortschritt in diesem Browser gespeichert.',
        saveError: 'Der Fortschritt konnte nicht gespeichert werden. Versuche es erneut oder exportiere eine Fortschrittsdatei, um deine Markierungen zu behalten.',
        exportProgress: 'Fortschrittsdatei exportieren',
        importProgress: 'Fortschrittsdatei importieren',
        importError: 'Die Fortschrittsdatei konnte nicht geöffnet werden. Deine aktuellen Markierungen bleiben unverändert.',
        importMismatch: 'Diese Fortschrittsdatei gehört zu einem anderen Raster oder einer anderen Perlenmarke. Öffne zuerst ihr ursprüngliches Perlenprojekt.',
        fileHelp: 'Fortschrittsdateien enthalten nur Platzierungsmarkierungen. Bewahre das ursprüngliche Perlenprojekt mit derselben Marke und demselben Raster auf, um sie zu verwenden.',
        localHelp: 'Dieser Browser speichert auf diesem Gerät Fortschritt für bis zu 12 Vorlagen; ältere Einträge können entfernt werden. Der Fortschritt wird nicht hochgeladen. Exportiere eine Fortschrittsdatei, um ihn langfristig zu behalten.',
        unknownColor: 'Farbe nicht in der Materialliste',
        emptyCell: 'Leeres Feld',
        filteredCell: 'Durch den Farbfilter ausgeblendet',
        cellStatus: 'Reihe {row}, Spalte {column}: {state}; {color}.',
        done: 'Gelegt',
        todo: 'Noch nicht gelegt',
        closing: 'Fortschritt wird vor dem Schließen gespeichert…',
        closeSaveError: 'Der Fortschritt konnte nicht gespeichert werden. Exportiere eine Fortschrittsdatei, versuche das Speichern erneut oder wähle, ohne Speichern zu verlassen.',
        closeWithoutSaving: 'Ohne Speichern verlassen',
        closeConfirm: 'Mit ungespeichertem Fortschritt verlassen? Exportiere zuerst eine Fortschrittsdatei, wenn du diese Markierungen behalten möchtest.',
        emptyBoard: 'Auf dieser Platte gibt es keine Perlen zum Verfolgen.',
        noChanges: 'Keine Fortschrittsmarkierungen geändert.',
        error: 'Der Fortschritt konnte nicht aktualisiert werden. Deine aktuellen Markierungen bleiben unverändert. Versuche es erneut.',
    },
    fr: {
        open: 'Suivre la pose des perles',
        title: 'Progression de la pose des perles',
        summary: 'Marquez les perles déjà posées sans modifier votre modèle.',
        openError: 'La progression n’est pas encore disponible. Réessayez après la mise à jour du modèle.',
        applySettingsHint: 'Appliquez d’abord les réglages du modèle en attente.',
        boardLabel: 'Plaque',
        boardPosition: (row, column) => `Ligne ${row + 1}, colonne ${column + 1}`,
        globalRows: (from, to) => `Lignes ${from}–${to} du modèle complet`,
        globalColumns: (from, to) => `Colonnes ${from}–${to} du modèle complet`,
        allColors: 'Toutes les couleurs',
        colorLabel: 'Afficher la couleur',
        mark: 'Marquer comme posées',
        unmark: 'Marquer comme non posées',
        instructions: 'Faites glisser pour marquer ou démarquer une ligne. Maintenez Maj en faisant glisser pour un rectangle. Déplacez-vous avec les flèches ; Espace ou Entrée change le statut d’une perle.',
        canvasLabel: 'Grille de progression de la pose des perles',
        completed: 'Posées',
        remaining: 'Restantes',
        total: 'Total des perles',
        whole: 'Modèle complet',
        board: 'Plaque sélectionnée',
        undo: 'Annuler la modification de progression',
        redo: 'Rétablir la modification de progression',
        clear: 'Effacer toutes les marques de pose',
        clearConfirm: 'Effacer toutes les marques de pose de ce modèle ? Vous pourrez annuler cette modification.',
        close: 'Fermer la progression',
        loading: 'Chargement de la progression enregistrée…',
        loadError: 'Impossible de charger la progression enregistrée. Réessayez ou choisissez explicitement de créer un nouvel enregistrement.',
        retry: 'Réessayer',
        startNew: 'Créer un nouvel enregistrement de progression',
        startNewConfirm: 'Une progression est peut-être déjà enregistrée pour ce modèle. Un nouvel enregistrement la remplacera. Continuer ?',
        saving: 'Enregistrement de la progression…',
        saved: 'Progression enregistrée dans ce navigateur.',
        saveError: 'Impossible d’enregistrer la progression. Réessayez ou exportez un fichier de progression pour conserver vos marques.',
        exportProgress: 'Exporter le fichier de progression',
        importProgress: 'Importer un fichier de progression',
        importError: 'Impossible d’ouvrir le fichier de progression. Vos marques actuelles sont inchangées.',
        importMismatch: 'Ce fichier de progression correspond à une autre grille ou marque de perles. Ouvrez d’abord son projet de perles original.',
        fileHelp: 'Les fichiers de progression contiennent uniquement les marques de pose. Conservez le projet de perles original avec la même marque et la même grille pour les utiliser.',
        localHelp: 'Ce navigateur conserve la progression de 12 modèles au maximum sur cet appareil ; les anciens enregistrements peuvent être supprimés. La progression n’est pas envoyée à un serveur. Exportez un fichier de progression pour la conserver à long terme.',
        unknownColor: 'Couleur absente de la liste du matériel',
        emptyCell: 'Case vide',
        filteredCell: 'Masquée par le filtre de couleur',
        cellStatus: 'Ligne {row}, colonne {column} : {state} ; {color}.',
        done: 'Posée',
        todo: 'Non posée',
        closing: 'Enregistrement de la progression avant fermeture…',
        closeSaveError: 'Impossible d’enregistrer la progression. Exportez un fichier, réessayez l’enregistrement ou choisissez de quitter sans enregistrer.',
        closeWithoutSaving: 'Quitter sans enregistrer',
        closeConfirm: 'Quitter avec une progression non enregistrée ? Exportez d’abord un fichier de progression pour conserver ces marques.',
        emptyBoard: 'Cette plaque n’a aucune perle à suivre.',
        noChanges: 'Aucune marque de progression n’a changé.',
        error: 'Impossible de mettre à jour la progression. Vos marques actuelles sont inchangées. Réessayez.',
    },
    ja: {
        open: 'ビーズの配置進捗を記録',
        title: 'ビーズの配置進捗',
        summary: '図案を変更せずに、置き終わったビーズを記録できます。',
        openError: '進捗をまだ表示できません。図案の更新が終わってから、もう一度お試しください。',
        applySettingsHint: '先に変更予定の図案設定を適用してください。',
        boardLabel: 'プレート',
        boardPosition: (row, column) => `行${row + 1}・列${column + 1}`,
        globalRows: (from, to) => `図案全体の${from}～${to}行`,
        globalColumns: (from, to) => `図案全体の${from}～${to}列`,
        allColors: 'すべての色',
        colorLabel: '表示する色',
        mark: '配置済みにする',
        unmark: '未配置に戻す',
        instructions: 'ドラッグで線状の範囲を記録・解除できます。Shiftを押しながらドラッグすると長方形の範囲を選べます。矢印キーで移動し、SpaceまたはEnterでビーズの配置状態を切り替えます。',
        canvasLabel: 'ビーズ配置の進捗グリッド',
        completed: '配置済み',
        remaining: '残り',
        total: 'ビーズの合計',
        whole: '図案全体',
        board: '選択したプレート',
        undo: '進捗の変更を元に戻す',
        redo: '進捗の変更をやり直す',
        clear: '配置済みの記録をすべて消す',
        clearConfirm: 'この図案の配置済みの記録をすべて消しますか？この変更は元に戻せます。',
        close: '進捗を閉じる',
        loading: '保存した進捗を読み込み中…',
        loadError: '保存した進捗を読み込めませんでした。再試行するか、新しい記録を始めることを選んでください。',
        retry: '再試行',
        startNew: '新しい進捗記録を始める',
        startNewConfirm: 'この図案の進捗がすでに保存されている可能性があります。新しい記録を始めると、その記録を上書きします。続けますか？',
        saving: '進捗を保存中…',
        saved: '進捗をこのブラウザに保存しました。',
        saveError: '進捗を保存できませんでした。再試行するか、進捗ファイルを書き出して記録を残してください。',
        exportProgress: '進捗ファイルを書き出す',
        importProgress: '進捗ファイルを読み込む',
        importError: '進捗ファイルを開けませんでした。現在の記録は変更されていません。',
        importMismatch: 'この進捗ファイルは、別のグリッドまたはビーズメーカーの図案用です。先に元のビーズプロジェクトを開いてください。',
        fileHelp: '進捗ファイルには、配置状態の記録だけが含まれます。同じメーカー・グリッドの元のビーズプロジェクトも保管してください。',
        localHelp: 'このブラウザでは、この端末に最大12図案の進捗を保存できます。古い記録は削除される場合があります。進捗はサーバーに送信しません。長く残したい場合は進捗ファイルを書き出してください。',
        unknownColor: '材料一覧にない色',
        emptyCell: '空きマス',
        filteredCell: '色フィルターで非表示',
        cellStatus: '行{row}・列{column}：{state}、{color}。',
        done: '配置済み',
        todo: '未配置',
        closing: '閉じる前に進捗を保存中…',
        closeSaveError: '進捗を保存できませんでした。進捗ファイルを書き出すか、保存を再試行するか、保存せずに終了することを選んでください。',
        closeWithoutSaving: '保存せずに終了',
        closeConfirm: '進捗を保存せずに終了しますか？記録を残したい場合は、先に進捗ファイルを書き出してください。',
        emptyBoard: 'このプレートには記録するビーズがありません。',
        noChanges: '進捗の記録に変更はありません。',
        error: '進捗を更新できませんでした。現在の記録は変更されていません。もう一度お試しください。',
    },
};

export function getCraftProgressCopy(locale: SiteLocale): CraftProgressCopy {
    const copy = COPY[locale];
    return { ...copy, help: copy.instructions, reading: copy.loading };
}
