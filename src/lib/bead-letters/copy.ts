import type { SiteLocale } from '../i18n/locales';

export interface BeadLetterCopy {
    title: string;
    description: string;
    heading: string;
    intro: string;
    home: string;
    text: string;
    supported: string;
    letterSpacing: string;
    lineSpacing: string;
    padding: string;
    alignment: string;
    alignments: { left: string; center: string; right: string };
    brand: string;
    foreground: string;
    background: string;
    backgroundEnabled: string;
    paper: string;
    preview: string;
    previewLabel: string;
    dimensions: string;
    beadCount: string;
    boardCount: string;
    colors: string;
    downloadPng: string;
    downloadPdf: string;
    saveProject: string;
    loadProject: string;
    replaceProject: string;
    editorLink: string;
    editorHelp: string;
    exporting: string;
    exportFailed: string;
    invalidColor: string;
    unsupported: string;
    tooLarge: string;
    invalidOptions: string;
    emptyText: string;
    normalizedText: string;
    saved: string;
    loaded: string;
    invalidProject: string;
    transferFailed: string;
    restoring: string;
    restoreFailed: string;
    retryRestore: string;
    discardRestore: string;
    discardFailed: string;
    howTitle: string;
    steps: string[];
    notesTitle: string;
    notes: string[];
}

export const beadLetterCopy: Record<SiteLocale, BeadLetterCopy> = {
    "en": {
        "title": "Bead Letter Generator | Fuse Bead Patterns",
        "description": "Make A–Z bead letters with Perler, Hama or Artkal colors. Download a grid PNG, printable PDF or editable project.",
        "heading": "Bead letter generator",
        "intro": "Turn supported letters, numbers and symbols into a bead chart. Arrange several lines and choose colors from Perler, Hama or Artkal S (5 mm). Start with text; no account or image upload is needed.",
        "home": "Home",
        "text": "Your text",
        "supported": "Use A–Z, 0–9 and the symbols (. ! ? - + & '), plus spaces and line breaks. Lowercase becomes uppercase. Accented letters, Chinese characters, Japanese kana and emoji are not supported.",
        "letterSpacing": "Letter spacing",
        "lineSpacing": "Line spacing",
        "padding": "Margin",
        "alignment": "Alignment",
        "alignments": {
            "left": "Left",
            "center": "Center",
            "right": "Right"
        },
        "brand": "Bead brand",
        "foreground": "Letter color",
        "background": "Background color",
        "backgroundEnabled": "Add background beads",
        "paper": "PDF paper size",
        "preview": "Pattern preview",
        "previewLabel": "Bead lettering grid",
        "dimensions": "Grid: {width} × {height}",
        "beadCount": "Beads: {count}",
        "boardCount": "Pegboards: {count}",
        "colors": "Colors and quantities",
        "downloadPng": "Download grid PNG",
        "downloadPdf": "Download PDF",
        "saveProject": "Save project",
        "loadProject": "Load project",
        "replaceProject": "Loading this project will replace your unsaved text and settings. Continue?",
        "editorLink": "Open bead editor",
        "editorHelp": "Save a project first. Open the editor, then load that file to edit individual beads. Use this tool to change the text settings.",
        "exporting": "Preparing download…",
        "exportFailed": "The download could not be created. Please try again.",
        "invalidColor": "Choose colors from the selected bead brand. If background beads are enabled, use different colors for the letters and background.",
        "unsupported": "This text contains unsupported characters. Check the supported characters and edit your text.",
        "tooLarge": "The pattern is too large. Shorten the text or reduce the spacing and margin.",
        "invalidOptions": "Check the spacing, margin, alignment and color settings.",
        "emptyText": "Enter at least one supported letter, number or symbol.",
        "normalizedText": "Preview text: {text}",
        "saved": "Project saved.",
        "loaded": "Project loaded.",
        "invalidProject": "This file is not a valid project for the bead letter tool.",
        "transferFailed": "Your current settings could not be saved for the language change. They are still open here. Save a project file before trying again.",
        "restoring": "Checking saved lettering settings…",
        "restoreFailed": "Saved lettering settings could not be checked or restored. Retry, or discard them to start a new pattern. Editing and downloads remain locked.",
        "retryRestore": "Retry recovery",
        "discardRestore": "Discard saved settings and start new",
        "discardFailed": "The saved settings could not be confirmed as cleared. The tool remains locked. Retry recovery or try discarding again.",
        "howTitle": "Make a bead letter pattern",
        "steps": [
            "Enter supported text. Use line breaks to arrange several lines, then adjust spacing, margin and alignment.",
            "Choose a bead brand and a letter color. Turn on background beads if you want a filled background.",
            "Check the grid, dimensions, color codes and bead quantities.",
            "Download a grid PNG or a PDF on A4 or US Letter. Save a project to continue editing later."
        ],
        "notesTitle": "Before you make it",
        "notes": [
            "Transparent cells contain no beads and are excluded from the bead count.",
            "Without background beads, letters may be separate pieces. The chart does not guarantee that they connect or stay together after ironing.",
            "Screen colors are approximate. Match the color codes to your chosen bead brand before buying supplies.",
            "The PDF fits the chart to the page for reading. It is not a 5 mm actual-size template to place under a pegboard. Check the dimensions of your own board.",
            "The project keeps both the chart and the text settings. Load it in this tool to continue arranging the letters.",
            "Follow the instructions for your exact bead range and pegboard; an adult handles the iron. The digital chart does not establish a finished piece’s strength.",
            "Reload the original project saved by this tool to change the text. If you change beads, colors or project settings in the main editor, continue there. This letter tool cannot reconstruct text from an edited chart and will not reopen that version."
        ]
    },
    "de": {
        "title": "Bügelperlen-Buchstaben erstellen | Fuse Bead Patterns",
        "description": "Erstelle Buchstaben mit A–Z und 0–9. Wähle Perlenfarben und lade ein Raster-PNG, ein druckbares PDF oder ein bearbeitbares Projekt herunter.",
        "heading": "Bügelperlen-Buchstaben erstellen",
        "intro": "Erstelle aus unterstützten Buchstaben, Zahlen und Zeichen eine Bügelperlen-Vorlage. Ordne mehrere Zeilen an und wähle Farben von Perler, Hama oder Artkal S (5 mm). Du brauchst nur Text, kein Konto und keinen Bild-Upload.",
        "home": "Startseite",
        "text": "Dein Text",
        "supported": "Erlaubt sind A–Z, 0–9, die Zeichen (. ! ? - + & ') sowie Leerzeichen und Zeilenumbrüche. Kleinbuchstaben werden großgeschrieben. Buchstaben mit Akzenten, chinesische oder japanische Schriftzeichen und Emojis werden nicht unterstützt.",
        "letterSpacing": "Buchstabenabstand",
        "lineSpacing": "Zeilenabstand",
        "padding": "Rand",
        "alignment": "Ausrichtung",
        "alignments": {
            "left": "Links",
            "center": "Zentriert",
            "right": "Rechts"
        },
        "brand": "Perlenmarke",
        "foreground": "Buchstabenfarbe",
        "background": "Hintergrundfarbe",
        "backgroundEnabled": "Hintergrund mit Perlen füllen",
        "paper": "Papierformat für das PDF",
        "preview": "Vorschau der Vorlage",
        "previewLabel": "Raster für Bügelperlen-Buchstaben",
        "dimensions": "Raster: {width} × {height}",
        "beadCount": "Perlen: {count}",
        "boardCount": "Stiftplatten: {count}",
        "colors": "Farben und Mengen",
        "downloadPng": "Raster-PNG herunterladen",
        "downloadPdf": "PDF herunterladen",
        "saveProject": "Projekt speichern",
        "loadProject": "Projekt laden",
        "replaceProject": "Dieses Projekt ersetzt deinen ungespeicherten Text und deine Einstellungen. Fortfahren?",
        "editorLink": "Bügelperlen-Editor öffnen",
        "editorHelp": "Speichere zuerst ein Projekt. Öffne dann den Editor und lade die Datei, um einzelne Perlen zu bearbeiten. Die Texteinstellungen änderst du in diesem Werkzeug.",
        "exporting": "Download wird vorbereitet…",
        "exportFailed": "Die Download-Datei konnte nicht erstellt werden. Bitte versuche es erneut.",
        "invalidColor": "Wähle Farben der ausgewählten Perlenmarke. Wenn du Hintergrundperlen verwendest, müssen Buchstaben und Hintergrund unterschiedliche Farben haben.",
        "unsupported": "Der Text enthält nicht unterstützte Zeichen. Prüfe die erlaubten Zeichen und passe den Text an.",
        "tooLarge": "Die Vorlage ist zu groß. Kürze den Text oder verringere Abstände und Rand.",
        "invalidOptions": "Prüfe Abstände, Rand, Ausrichtung und Farbeinstellungen.",
        "emptyText": "Gib mindestens einen unterstützten Buchstaben, eine Zahl oder ein Zeichen ein.",
        "normalizedText": "Text in der Vorschau: {text}",
        "saved": "Projekt gespeichert.",
        "loaded": "Projekt geladen.",
        "invalidProject": "Diese Datei ist kein gültiges Projekt für das Buchstabenwerkzeug.",
        "transferFailed": "Deine aktuellen Einstellungen konnten für den Sprachwechsel nicht gespeichert werden. Sie bleiben hier geöffnet. Speichere vor einem erneuten Versuch eine Projektdatei.",
        "restoring": "Gespeicherte Vorlageneinstellungen werden geprüft…",
        "restoreFailed": "Gespeicherte Vorlageneinstellungen konnten nicht geprüft oder wiederhergestellt werden. Versuche es erneut oder verwirf sie, um neu zu beginnen. Bearbeitung und Downloads bleiben gesperrt.",
        "retryRestore": "Wiederherstellung erneut versuchen",
        "discardRestore": "Gespeicherte Einstellungen verwerfen und neu beginnen",
        "discardFailed": "Das Löschen der gespeicherten Einstellungen konnte nicht bestätigt werden. Das Werkzeug bleibt gesperrt. Versuche die Wiederherstellung oder das Verwerfen erneut.",
        "howTitle": "Eine Buchstabenvorlage erstellen",
        "steps": [
            "Gib unterstützten Text ein. Mit Zeilenumbrüchen erhältst du mehrere Zeilen. Passe anschließend Abstände, Rand und Ausrichtung an.",
            "Wähle eine Perlenmarke und eine Buchstabenfarbe. Aktiviere Hintergrundperlen, wenn du den Hintergrund füllen möchtest.",
            "Prüfe Raster, Maße, Farbcodes und Perlenmengen.",
            "Lade ein Raster-PNG oder ein PDF für A4 oder US Letter herunter. Speichere ein Projekt, um später weiterzuarbeiten."
        ],
        "notesTitle": "Vor dem Basteln",
        "notes": [
            "Transparente Kästchen enthalten keine Perlen und werden bei der Perlenmenge nicht mitgezählt.",
            "Ohne Hintergrundperlen können die Buchstaben einzelne Teile bilden. Die Vorlage garantiert nicht, dass sie verbunden sind oder nach dem Bügeln zusammenhalten.",
            "Bildschirmfarben sind Näherungen. Vergleiche die Farbcodes vor dem Einkauf mit deiner gewählten Perlenmarke.",
            "Das PDF passt die Vorlage zum Ablesen an die Seite an. Es ist keine maßstabsgetreue 5-mm-Unterlage für eine Stiftplatte. Prüfe die Maße deiner eigenen Platte.",
            "Das Projekt speichert die Vorlage und die Texteinstellungen. Lade es in diesem Werkzeug, um die Buchstaben weiter anzuordnen.",
            "Beachte die Anleitung für deine genaue Perlenserie und Stiftplatte; eine erwachsene Person übernimmt das Bügeleisen. Die digitale Vorlage belegt nicht die Festigkeit eines fertigen Stücks.",
            "Lade das unveränderte, hier gespeicherte Buchstabenprojekt, um den Text anzupassen. Hast du im Haupteditor Perlen, Farben oder Projekteinstellungen geändert, arbeite dort weiter. Dieses Werkzeug kann aus einer bearbeiteten Vorlage keinen Text zurückgewinnen und öffnet diese Fassung daher nicht."
        ]
    },
    "fr": {
        "title": "Lettres en perles à repasser | Fuse Bead Patterns",
        "description": "Créez des lettres avec A–Z et 0–9. Choisissez vos couleurs de perles et téléchargez le PNG, le PDF à imprimer ou le projet modifiable.",
        "heading": "Créer des lettres en perles à repasser",
        "intro": "Transformez les lettres, chiffres et symboles acceptés en grille de perles. Organisez plusieurs lignes et choisissez des couleurs Perler, Hama ou Artkal S (5 mm). Du texte suffit : aucun compte ni import d’image n’est nécessaire.",
        "home": "Accueil",
        "text": "Votre texte",
        "supported": "Utilisez A–Z, 0–9, les symboles (. ! ? - + & '), les espaces et les retours à la ligne. Les minuscules deviennent des majuscules. Les lettres accentuées, les caractères chinois, les kanjis, les kanas et les emoji ne sont pas pris en charge.",
        "letterSpacing": "Espacement des lettres",
        "lineSpacing": "Espacement des lignes",
        "padding": "Marge",
        "alignment": "Alignement",
        "alignments": {
            "left": "À gauche",
            "center": "Centré",
            "right": "À droite"
        },
        "brand": "Marque de perles",
        "foreground": "Couleur des lettres",
        "background": "Couleur du fond",
        "backgroundEnabled": "Ajouter des perles de fond",
        "paper": "Format du PDF",
        "preview": "Aperçu du modèle",
        "previewLabel": "Grille de lettres en perles",
        "dimensions": "Grille : {width} × {height}",
        "beadCount": "Perles : {count}",
        "boardCount": "Plaques : {count}",
        "colors": "Couleurs et quantités",
        "downloadPng": "Télécharger la grille PNG",
        "downloadPdf": "Télécharger le PDF",
        "saveProject": "Enregistrer le projet",
        "loadProject": "Charger un projet",
        "replaceProject": "Charger ce projet remplacera votre texte et vos réglages non enregistrés. Continuer ?",
        "editorLink": "Ouvrir l’éditeur de perles",
        "editorHelp": "Enregistrez d’abord un projet. Ouvrez ensuite l’éditeur et chargez ce fichier pour modifier les perles une par une. Les réglages du texte se modifient dans cet outil.",
        "exporting": "Préparation du téléchargement…",
        "exportFailed": "Le fichier à télécharger n’a pas pu être créé. Réessayez.",
        "invalidColor": "Choisissez des couleurs de la marque sélectionnée. Si les perles de fond sont activées, les lettres et le fond doivent avoir des couleurs différentes.",
        "unsupported": "Le texte contient des caractères non acceptés. Vérifiez les caractères disponibles et modifiez le texte.",
        "tooLarge": "Le modèle est trop grand. Raccourcissez le texte ou réduisez les espacements et la marge.",
        "invalidOptions": "Vérifiez les espacements, la marge, l’alignement et les couleurs.",
        "emptyText": "Saisissez au moins une lettre, un chiffre ou un symbole accepté.",
        "normalizedText": "Texte de l’aperçu : {text}",
        "saved": "Projet enregistré.",
        "loaded": "Projet chargé.",
        "invalidProject": "Ce fichier n’est pas un projet valide pour l’outil de lettres en perles.",
        "transferFailed": "Vos réglages actuels n’ont pas pu être enregistrés pour le changement de langue. Ils restent ouverts ici. Enregistrez un fichier de projet avant de réessayer.",
        "restoring": "Vérification des réglages enregistrés…",
        "restoreFailed": "Impossible de vérifier ou de restaurer les réglages enregistrés du motif. Réessayez ou abandonnez-les pour créer un nouveau motif. La modification et les téléchargements restent bloqués.",
        "retryRestore": "Réessayer la restauration",
        "discardRestore": "Abandonner les réglages enregistrés et recommencer",
        "discardFailed": "La suppression des réglages enregistrés n’a pas pu être confirmée. L’outil reste bloqué. Réessayez la restauration ou la suppression.",
        "howTitle": "Créer un modèle de lettres",
        "steps": [
            "Saisissez un texte accepté. Utilisez les retours à la ligne, puis réglez les espacements, la marge et l’alignement.",
            "Choisissez une marque de perles et une couleur de lettres. Activez les perles de fond si vous souhaitez un fond rempli.",
            "Vérifiez la grille, les dimensions, les codes couleur et les quantités de perles.",
            "Téléchargez une grille PNG ou un PDF au format A4 ou US Letter. Enregistrez un projet pour reprendre plus tard."
        ],
        "notesTitle": "Avant de réaliser le motif",
        "notes": [
            "Les cases transparentes ne contiennent pas de perles et ne sont pas comptées dans la quantité totale.",
            "Sans perles de fond, les lettres peuvent former des pièces séparées. La grille ne garantit pas qu’elles seront reliées ou tiendront ensemble après le repassage.",
            "Les couleurs à l’écran sont approximatives. Comparez les codes avec la marque de perles choisie avant d’acheter le matériel.",
            "Le PDF adapte la grille à la page pour la lire. Ce n’est pas un gabarit à taille réelle de 5 mm à placer sous une plaque. Vérifiez les dimensions de votre plaque.",
            "Le projet conserve la grille et les réglages du texte. Chargez-le dans cet outil pour continuer à organiser les lettres.",
            "Suivez les consignes de votre gamme de perles et de votre plaque ; un adulte manipule le fer. La grille numérique ne prouve pas la solidité d’une pièce terminée.",
            "Rechargez ici le projet d’origine enregistré avec cet outil pour changer le texte. Après une modification des perles, des couleurs ou des réglages dans l’éditeur principal, continuez dans cet éditeur. L’outil de lettres ne reconstitue pas le texte à partir d’une grille retouchée et ne rouvre donc pas cette version."
        ]
    },
    "ja": {
        "title": "アイロンビーズのアルファベット図案 | Fuse Bead Patterns",
        "description": "英大文字A–Zと数字0–9で、アイロンビーズの文字図案を作れます。配色や文字間隔を調整し、PNG・印刷用PDF・編集用プロジェクトを保存できます。",
        "heading": "アイロンビーズの文字図案メーカー",
        "intro": "対応する英字・数字・記号を入力して、ビーズの文字図案を作れます。複数行を配置し、Perler・Hama・Artkal S（5 mm）の色を選びましょう。文字だけで始められ、アカウント登録や画像のアップロードは必要ありません。",
        "home": "ホーム",
        "text": "文字を入力",
        "supported": "入力できるのはA–Z、0–9、記号 . ! ? - + & ' と、空白・改行です。小文字は大文字になります。アクセント付き文字、漢字、ひらがな・カタカナ、絵文字は使えません。",
        "letterSpacing": "文字の間隔",
        "lineSpacing": "行の間隔",
        "padding": "余白",
        "alignment": "文字揃え",
        "alignments": {
            "left": "左揃え",
            "center": "中央揃え",
            "right": "右揃え"
        },
        "brand": "ビーズのブランド",
        "foreground": "文字の色",
        "background": "背景の色",
        "backgroundEnabled": "背景にもビーズを置く",
        "paper": "PDFの用紙サイズ",
        "preview": "図案のプレビュー",
        "previewLabel": "ビーズ文字のマス目図案",
        "dimensions": "マス数：{width} × {height}",
        "beadCount": "ビーズ{count}個",
        "boardCount": "プレート{count}枚",
        "colors": "色と必要数",
        "downloadPng": "マス目付きPNGを保存",
        "downloadPdf": "PDFを保存",
        "saveProject": "プロジェクトを保存",
        "loadProject": "プロジェクトを読み込む",
        "replaceProject": "このプロジェクトを読み込むと、保存していない文字と設定が置き換わります。続けますか？",
        "editorLink": "ビーズエディターを開く",
        "editorHelp": "先にプロジェクトを保存してください。エディターを開いてそのファイルを読み込むと、ビーズを1個ずつ編集できます。文字の設定はこのツールで変更します。",
        "exporting": "ダウンロードを準備中…",
        "exportFailed": "保存用ファイルを作成できませんでした。もう一度お試しください。",
        "invalidColor": "選択したブランドのビーズ色を使ってください。背景にもビーズを置く場合、文字と背景には別の色を選んでください。",
        "unsupported": "対応していない文字が含まれています。使える文字を確認し、入力を修正してください。",
        "tooLarge": "図案が大きすぎます。文字を短くするか、文字や行の間隔・余白を小さくしてください。",
        "invalidOptions": "文字や行の間隔、余白、文字揃え、配色を確認してください。",
        "emptyText": "対応する英字・数字・記号を1文字以上入力してください。",
        "normalizedText": "プレビューの文字：{text}",
        "saved": "プロジェクトを保存しました。",
        "loaded": "プロジェクトを読み込みました。",
        "invalidProject": "このファイルは文字図案ツールの有効なプロジェクトではありません。",
        "transferFailed": "言語を切り替えるための設定を保存できませんでした。現在の図案はこの画面に残っています。もう一度試す前に、プロジェクトをファイルに保存してください。",
        "restoring": "保存された図案の設定を確認しています…",
        "restoreFailed": "保存された図案の設定を確認・復元できませんでした。もう一度試すか、保存された設定を破棄して新しく始めてください。それまでは編集とダウンロードを停止しています。",
        "retryRestore": "復元をもう一度試す",
        "discardRestore": "保存された設定を破棄して新しく始める",
        "discardFailed": "保存された設定を削除できたか確認できませんでした。編集は引き続き停止しています。復元または破棄をもう一度お試しください。",
        "howTitle": "文字図案の作り方",
        "steps": [
            "対応する文字を入力します。改行で複数行に分け、文字や行の間隔、余白、文字揃えを調整しましょう。",
            "ビーズのブランドと文字の色を選びます。背景を埋めたい場合は、背景のビーズを有効にします。",
            "マス目、サイズ、色番号、ビーズの必要数を確認します。",
            "マス目付きPNG、またはA4・US LetterのPDFを保存します。あとで続ける場合はプロジェクトも保存しましょう。"
        ],
        "notesTitle": "ビーズを並べる前に",
        "notes": [
            "透明なマスにはビーズを置かず、必要数にも含めません。",
            "背景にビーズを置かない場合、文字は別々のパーツになることがあります。図案だけでは、文字同士がつながることや、アイロンがけの後につながった状態を保てることは保証できません。",
            "画面の色は目安です。材料を買う前に、選んだブランドの色番号と照合してください。",
            "PDFは図案を読みやすいよう用紙に収めたものです。プレートの下に敷く5 mm間隔の実寸テンプレートではありません。手持ちのプレートの寸法も確認してください。",
            "プロジェクトには図案と文字の設定が保存されます。このツールで読み込むと、文字の配置を続けて変更できます。",
            "使うビーズのシリーズとプレートの説明に従い、アイロンは大人が扱ってください。デジタル図案は完成品の強度を確認するものではありません。",
            "このツールで保存した元のプロジェクトなら、読み込んで文字を変更できます。メインエディターでマス、色、プロジェクトの設定を変更した後は、そのエディターで作業を続けてください。修正後の図案から文字を復元することはできないため、この文字ツールでは読み込めません。"
        ]
    }
};
