import type { PixelGridLocale } from './messages';

const en = {
    open: 'Choose image area', title: 'Choose the area to convert',
    instruction: 'Drag to select an area, drag inside it to move it, or adjust the numbers. Arrow keys move the selection; focus a corner to resize it. Hold Shift for 10 pixels.',
    help: 'Apply keeps this selection without changing your drawing. Reconvert the original image to use it with the current size, color limit and fit mode. Undo and redo restore the drawing, not this selection. The complete original image is kept.',
    summary: (x: number, y: number, width: number, height: number) => `Selected area: left ${x}, top ${y}, ${width} × ${height} source pixels.`,
    wholeSummary: 'Using the whole original image.', whole: 'Use whole image', apply: 'Apply selection', cancel: 'Cancel',
    left: 'Left', top: 'Top', width: 'Width', height: 'Height', selection: 'Selected image area',
    preview: 'Original image and selected area', result: 'Conversion preview',
    previewHelp: 'Preview only. Your drawing changes when you reconvert.',
    previewPending: 'Preview updates after you finish adjusting the area.',
    invalid: 'Use whole pixel values inside the original image, with width and height of at least 1.',
    previewFailed: 'The preview could not be shown. Your drawing is unchanged.',
    applied: 'Image area selected. Reconvert to update the drawing. Undo does not change the selection.',
    nw: 'Resize top left', ne: 'Resize top right', sw: 'Resize bottom left', se: 'Resize bottom right',
};
type Copy = typeof en;
const de: Copy = {
    open: 'Bildbereich wählen', title: 'Bereich zum Umwandeln wählen',
    instruction: 'Ziehe einen Bereich auf oder verschiebe ihn durch Ziehen im Inneren. Du kannst auch Zahlen eingeben. Pfeiltasten verschieben die Auswahl; an einer fokussierten Ecke ändern sie die Größe. Mit Umschalt sind es 10 Pixel.',
    help: 'Übernehmen speichert nur die Auswahl und verändert deine Zeichnung nicht. Wandle das Originalbild erneut um, um den Bereich mit aktueller Größe, Farbgrenze und Anpassung zu verwenden. Rückgängig und Wiederholen ändern die Zeichnung, nicht die Auswahl. Das vollständige Originalbild bleibt erhalten.',
    summary: (x, y, width, height) => `Auswahl: links ${x}, oben ${y}, ${width} × ${height} Originalpixel.`,
    wholeSummary: 'Das gesamte Originalbild wird verwendet.', whole: 'Ganzes Bild verwenden', apply: 'Auswahl übernehmen', cancel: 'Abbrechen',
    left: 'Links', top: 'Oben', width: 'Breite', height: 'Höhe', selection: 'Ausgewählter Bildbereich',
    preview: 'Originalbild mit Auswahl', result: 'Umwandlungsvorschau', previewHelp: 'Nur eine Vorschau. Die Zeichnung ändert sich erst beim erneuten Umwandeln.',
    previewPending: 'Die Vorschau wird nach dem Anpassen der Auswahl aktualisiert.',
    invalid: 'Gib ganze Pixelwerte innerhalb des Originalbilds und mindestens 1 für Breite und Höhe ein.',
    previewFailed: 'Die Vorschau konnte nicht angezeigt werden. Deine Zeichnung bleibt erhalten.',
    applied: 'Bildbereich ausgewählt. Wandle das Bild erneut um, um die Zeichnung zu ändern. Rückgängig verändert die Auswahl nicht.',
    nw: 'Oben links anpassen', ne: 'Oben rechts anpassen', sw: 'Unten links anpassen', se: 'Unten rechts anpassen',
};
const fr: Copy = {
    open: 'Choisir une zone de l’image', title: 'Choisir la zone à convertir',
    instruction: 'Tracez une zone ou faites-la glisser depuis l’intérieur. Vous pouvez aussi saisir les valeurs. Les flèches déplacent la sélection ; sur un coin sélectionné, elles changent sa taille. Maintenez Maj pour avancer de 10 pixels.',
    help: 'Appliquer conserve la sélection sans modifier le dessin. Reconvertissez l’image d’origine pour utiliser cette zone avec la taille, la limite de couleurs et l’ajustement actuels. Annuler et rétablir modifient le dessin, pas cette sélection. L’image d’origine complète est conservée.',
    summary: (x, y, width, height) => `Zone : gauche ${x}, haut ${y}, ${width} × ${height} pixels d’origine.`,
    wholeSummary: 'Toute l’image d’origine est utilisée.', whole: 'Utiliser toute l’image', apply: 'Appliquer la sélection', cancel: 'Annuler',
    left: 'Gauche', top: 'Haut', width: 'Largeur', height: 'Hauteur', selection: 'Zone sélectionnée',
    preview: 'Image d’origine avec la sélection', result: 'Aperçu de la conversion', previewHelp: 'Aperçu uniquement. Le dessin change lors de la reconversion.',
    previewPending: 'L’aperçu se met à jour une fois la zone ajustée.',
    invalid: 'Saisissez des pixels entiers dans les limites de l’image, avec une largeur et une hauteur d’au moins 1.',
    previewFailed: 'L’aperçu n’a pas pu être affiché. Votre dessin est conservé.',
    applied: 'Zone sélectionnée. Reconvertissez pour modifier le dessin. L’annulation ne change pas la sélection.',
    nw: 'Redimensionner en haut à gauche', ne: 'Redimensionner en haut à droite', sw: 'Redimensionner en bas à gauche', se: 'Redimensionner en bas à droite',
};
const ja: Copy = {
    open: '画像の範囲を選ぶ', title: '変換する範囲を選ぶ',
    instruction: 'ドラッグで範囲を選び、範囲内をドラッグして移動できます。数値でも指定できます。矢印キーで移動し、四隅のボタンにフォーカスするとサイズを変えられます。Shiftを押すと10ピクセルずつ動きます。',
    help: '「選択を適用」は範囲だけを保存し、描画は変更しません。「元画像から再変換」で、現在のサイズ、色数制限、配置方法を使って変換します。元に戻す・やり直す操作は描画だけに適用され、この範囲は変わりません。元画像全体は保持されます。',
    summary: (x, y, width, height) => `選択範囲：左${x}、上${y}、元画像の${width} × ${height}ピクセル。`,
    wholeSummary: '元画像全体を使用します。', whole: '画像全体を使う', apply: '選択を適用', cancel: 'キャンセル',
    left: '左', top: '上', width: '幅', height: '高さ', selection: '画像の選択範囲',
    preview: '元画像と選択範囲', result: '変換プレビュー', previewHelp: 'プレビューのみです。再変換すると描画に反映されます。',
    previewPending: '範囲の調整が終わるとプレビューを更新します。',
    invalid: '元画像内の整数ピクセルで指定し、幅と高さは1以上にしてください。',
    previewFailed: 'プレビューを表示できませんでした。現在の描画はそのままです。',
    applied: '範囲を選びました。再変換すると描画に反映されます。元に戻す操作では範囲は変わりません。',
    nw: '左上を調整', ne: '右上を調整', sw: '左下を調整', se: '右下を調整',
};
export const PIXEL_CROP_COPY: Record<PixelGridLocale, Copy> = { en, de, fr, ja };
