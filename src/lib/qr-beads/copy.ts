import type { SiteLocale } from '../i18n/locales';

export type QrBeadCopy = {
    title: string; description: string; heading: string; intro: string; home: string;
    howTitle: string; steps: string[]; notesTitle: string; notes: string[];
    text: string; textHelp: string; ecc: string; eccHelp: string; scale: string; scaleOption: string;
    brand: string; foreground: string; background: string; paper: string; preview: string;
    previewLabel: string; dimensions: string; modules: string; beadCount: string; boardCount: string;
    physicalSize: string; pdfPages: string; quiet: string; materials: string; emptyText: string; tooLong: string;
    tooLarge: string; invalidText: string; invalidOptions: string; invalidColor: string;
    check: string; checking: string; checkPassed: string; checkFailed: string; checkError: string;
    downloadPng: string; downloadChart: string; downloadPdf: string; saveProject: string; openProject: string;
    editorHelp: string; editorLink: string; replaceProject: string; saved: string; loaded: string;
    invalidProject: string; exportFailed: string; working: string; cancel: string; cancelled: string;
    restoring: string; restoreFailed: string; retryRestore: string; discardRestore: string;
    discardFailed: string; transferFailed: string; savedState: string; unsavedState: string;
};

export const qrBeadCopy: Record<SiteLocale, QrBeadCopy> = {
    en: {
        title: 'QR Code Bead Pattern Maker | Fuse Bead Patterns',
        description: 'Turn a URL or short text into a two-color QR bead pattern. Choose Perler, Hama or Artkal, check the PNG and download a printable chart or project.',
        heading: 'QR code bead pattern maker',
        intro: 'Make a two-color bead chart for a web address or short message. Your text stays in this browser; it is not uploaded.', home: 'Home',
        howTitle: 'Make your QR pattern',
        steps: ['Enter a complete web address, including https://, or a short message.', 'Choose two contrasting bead colors and a module size. Keep the pale border intact.', 'Check the digital PNG, then download the chart and materials. Test your finished piece with a phone before using it.'],
        notesTitle: 'Before you make it',
        notes: ['A digital decode is not a guarantee that physical beads will scan. Holes, ironing, reflections, size and lighting affect the result.', 'The four-module quiet zone is filled with background beads and included in the materials. Do not trim it away.', 'Brand colors are digital approximations. Start with a dark foreground and light background.', 'QR codes reveal their content to anyone who scans them. Avoid private credentials or information you do not want to share.'],
        text: 'URL or text', textHelp: 'Up to 1,024 UTF-8 bytes. Longer text needs more beads. This tool does not create a redirect or track scans.',
        ecc: 'Error correction', eccHelp: 'Higher correction can increase the pattern size; it does not guarantee a physical scan.', scale: 'Beads per module', scaleOption: '{count} × {count} beads',
        brand: 'Bead brand', foreground: 'Dark modules', background: 'Light background and border', paper: 'PDF paper', preview: 'Your bead pattern', previewLabel: 'Two-color QR pattern with its quiet border',
        dimensions: '{width} × {height} beads', modules: '{count} × {count} QR modules, plus the quiet zone', beadCount: '{count} beads including the border', boardCount: '{wide} × {tall} boards ({size} × {size} each)', physicalSize: '{width} × {height} mm at 5 mm per bead',
        pdfPages: 'PDF: {count} pages — one overview and {boards} board charts',
        quiet: 'Keep all four modules of the light border on every side.', materials: 'Colors and quantities', emptyText: 'Enter a URL or short message to see a pattern.', tooLong: 'This text exceeds 1,024 UTF-8 bytes. Shorten it to generate a pattern.', tooLarge: 'This combination exceeds the 232-bead side limit. Shorten the text, reduce beads per module or lower error correction.', invalidText: 'This text contains an invalid character sequence. Edit the text and try again.', invalidOptions: 'Check the pattern settings.', invalidColor: 'Choose two different colors with a dark foreground and light background.',
        check: 'Check the digital PNG', checking: 'Checking the PNG…', checkPassed: 'The PNG decodes to your exact text. The finished bead piece still needs a phone scan test.', checkFailed: 'The PNG did not decode to your text. Try higher contrast, shorter text or lower error correction.', checkError: 'The digital check could not finish. Your input is unchanged; you can try again.',
        downloadPng: 'Download QR PNG', downloadChart: 'Download chart PNG', downloadPdf: 'Download printable PDF', saveProject: 'Save editable project', openProject: 'Open saved project',
        editorHelp: 'Save the project, then open it in the bead editor to change individual beads. Changing the QR modules or border can break scanning.', editorLink: 'Open bead editor', replaceProject: 'Replace your unsaved QR settings with this project?', saved: 'Project saved. Keep this file to reopen your work.', loaded: 'Project opened.', invalidProject: 'This is not a valid project from this QR tool. Your input has been kept.', exportFailed: 'The file could not be created. Your input is unchanged.', working: 'Preparing the file…', cancel: 'Cancel', cancelled: 'Cancelled. Your input is unchanged.',
        restoring: 'Restoring QR settings…', restoreFailed: 'The language transfer could not be read. Retry, or explicitly discard it to start over.', retryRestore: 'Retry restore', discardRestore: 'Discard transfer and start over', discardFailed: 'The transfer could not be removed. Your recovery copy is still protected.', transferFailed: 'The language change was stopped because your settings could not be saved. Stay here and try again.', savedState: 'No unsaved changes', unsavedState: 'Unsaved settings',
    },
    de: {
        title: 'QR-Code aus Bügelperlen erstellen | Fuse Bead Patterns',
        description: 'Erstelle aus Text oder URL eine zweifarbige QR-Code-Vorlage für Perler, Hama oder Artkal. Prüfe das PNG und lade PDF, Raster oder Projekt herunter.',
        heading: 'QR-Code als Bügelperlen-Vorlage',
        intro: 'Erstelle eine zweifarbige Vorlage für eine Webadresse oder kurze Nachricht. Dein Text bleibt im Browser und wird nicht hochgeladen.', home: 'Startseite',
        howTitle: 'So erstellst du deine QR-Vorlage',
        steps: ['Gib eine vollständige Webadresse mit https:// oder eine kurze Nachricht ein.', 'Wähle zwei kontrastreiche Perlenfarben und die Modulgröße. Lass den hellen Rand vollständig erhalten.', 'Prüfe das digitale PNG und lade Raster sowie Materialliste herunter. Teste das fertige Stück mit einem Handy, bevor du es verwendest.'],
        notesTitle: 'Vor dem Stecken beachten',
        notes: ['Ein digital lesbarer Code garantiert keinen Scan der echten Perlen. Löcher, Bügeln, Reflexionen, Größe und Licht beeinflussen das Ergebnis.', 'Die vier Module breite Ruhezone besteht aus Hintergrundperlen und ist in der Materialliste enthalten. Schneide sie nicht ab.', 'Die Markenfarben sind digitale Näherungswerte. Beginne mit dunklen Modulen auf hellem Hintergrund.', 'Jeder, der den QR-Code scannt, kann seinen Inhalt lesen. Verwende keine privaten Zugangsdaten oder Informationen, die du nicht teilen möchtest.'],
        text: 'URL oder Text', textHelp: 'Bis zu 1.024 UTF-8-Bytes. Längere Texte brauchen mehr Perlen. Das Werkzeug erstellt keine Weiterleitung und zählt keine Scans.',
        ecc: 'Fehlerkorrektur', eccHelp: 'Eine höhere Stufe kann die Vorlage vergrößern; sie garantiert keinen Scan des fertigen Stücks.', scale: 'Perlen pro Modul', scaleOption: '{count} × {count} Perlen',
        brand: 'Perlenmarke', foreground: 'Dunkle Module', background: 'Heller Hintergrund und Rand', paper: 'PDF-Papierformat', preview: 'Deine Perlenvorlage', previewLabel: 'Zweifarbiger QR-Code mit Ruhezone',
        dimensions: '{width} × {height} Perlen', modules: '{count} × {count} QR-Module zuzüglich Ruhezone', beadCount: '{count} Perlen einschließlich Rand', boardCount: '{wide} × {tall} Steckplatten (je {size} × {size})', physicalSize: '{width} × {height} mm bei 5 mm pro Perle',
        pdfPages: 'PDF: {count} Seiten — eine Übersicht und {boards} Steckplattenraster',
        quiet: 'Erhalte auf jeder Seite alle vier Module des hellen Randes.', materials: 'Farben und Mengen', emptyText: 'Gib eine URL oder kurze Nachricht ein, um die Vorlage zu sehen.', tooLong: 'Der Text überschreitet 1.024 UTF-8-Bytes. Kürze ihn, um eine Vorlage zu erstellen.', tooLarge: 'Diese Einstellungen überschreiten 232 Perlen pro Seite. Kürze den Text oder verringere Modulgröße oder Fehlerkorrektur.', invalidText: 'Der Text enthält eine ungültige Zeichenfolge. Bearbeite ihn und versuche es erneut.', invalidOptions: 'Prüfe die Einstellungen der Vorlage.', invalidColor: 'Wähle zwei unterschiedliche Farben mit dunklen Modulen und hellem Hintergrund.',
        check: 'Digitales PNG prüfen', checking: 'PNG wird geprüft…', checkPassed: 'Das PNG ergibt genau deinen Text. Das fertige Perlenstück muss trotzdem mit einem Handy getestet werden.', checkFailed: 'Das PNG ergab nicht deinen Text. Versuche mehr Kontrast, einen kürzeren Text oder eine niedrigere Fehlerkorrektur.', checkError: 'Die digitale Prüfung konnte nicht beendet werden. Deine Eingabe bleibt erhalten; versuche es erneut.',
        downloadPng: 'QR-PNG herunterladen', downloadChart: 'Raster-PNG herunterladen', downloadPdf: 'Druck-PDF herunterladen', saveProject: 'Bearbeitbares Projekt speichern', openProject: 'Gespeichertes Projekt öffnen',
        editorHelp: 'Speichere das Projekt und öffne es im Perleneditor, um einzelne Perlen zu ändern. Änderungen an Modulen oder Rand können den Code unlesbar machen.', editorLink: 'Perleneditor öffnen', replaceProject: 'Deine ungespeicherten QR-Einstellungen durch dieses Projekt ersetzen?', saved: 'Projekt gespeichert. Bewahre die Datei zum erneuten Öffnen auf.', loaded: 'Projekt geöffnet.', invalidProject: 'Die Datei ist kein gültiges Projekt dieses QR-Werkzeugs. Deine Eingabe bleibt erhalten.', exportFailed: 'Die Datei konnte nicht erstellt werden. Deine Eingabe bleibt erhalten.', working: 'Datei wird vorbereitet…', cancel: 'Abbrechen', cancelled: 'Abgebrochen. Deine Eingabe bleibt erhalten.',
        restoring: 'QR-Einstellungen werden wiederhergestellt…', restoreFailed: 'Der Sprachwechsel konnte nicht wiederhergestellt werden. Versuche es erneut oder verwirf die Übertragung ausdrücklich.', retryRestore: 'Erneut wiederherstellen', discardRestore: 'Übertragung verwerfen und neu beginnen', discardFailed: 'Die Übertragung konnte nicht entfernt werden. Deine Wiederherstellungskopie bleibt geschützt.', transferFailed: 'Der Sprachwechsel wurde angehalten, weil deine Einstellungen nicht gespeichert werden konnten. Bleibe hier und versuche es erneut.', savedState: 'Keine ungespeicherten Änderungen', unsavedState: 'Ungespeicherte Einstellungen',
    },
    fr: {
        title: 'QR code en perles à repasser | Fuse Bead Patterns',
        description: 'Transformez un texte ou une URL en QR code pour Perler, Hama ou Artkal. Vérifiez le PNG et téléchargez la grille PDF ou le projet modifiable.',
        heading: 'Créer un QR code en perles à repasser',
        intro: 'Créez une grille bicolore pour une adresse web ou un court message. Votre texte reste dans le navigateur, sans être envoyé au serveur.', home: 'Accueil',
        howTitle: 'Préparer votre QR code',
        steps: ['Saisissez une adresse web complète avec https:// ou un court message.', 'Choisissez deux couleurs contrastées et la taille des modules. Conservez toute la bordure claire.', 'Vérifiez le PNG, puis téléchargez la grille et le matériel. Testez votre réalisation avec un téléphone avant de l’utiliser.'],
        notesTitle: 'Avant de commencer',
        notes: ['Un décodage numérique ne garantit pas la lecture des perles réelles. Les trous, le repassage, les reflets, la taille et la lumière influencent le résultat.', 'La zone calme de quatre modules est remplie de perles de fond et comprise dans les quantités. Ne la retirez pas.', 'Les couleurs des marques sont approximatives à l’écran. Commencez par des modules foncés sur fond clair.', 'Toute personne qui scanne le QR code peut lire son contenu. Évitez les identifiants privés et les informations que vous ne souhaitez pas partager.'],
        text: 'URL ou texte', textHelp: '1 024 octets UTF-8 maximum. Un texte plus long exige davantage de perles. Cet outil ne crée pas de redirection et ne suit pas les scans.',
        ecc: 'Correction d’erreur', eccHelp: 'Un niveau plus élevé peut agrandir la grille, sans garantir la lecture de la réalisation.', scale: 'Perles par module', scaleOption: '{count} × {count} perles',
        brand: 'Marque de perles', foreground: 'Modules foncés', background: 'Fond et bordure clairs', paper: 'Papier du PDF', preview: 'Votre grille de perles', previewLabel: 'QR code bicolore avec sa zone calme',
        dimensions: '{width} × {height} perles', modules: '{count} × {count} modules QR, plus la zone calme', beadCount: '{count} perles, bordure comprise', boardCount: '{wide} × {tall} plaques de {size} × {size}', physicalSize: '{width} × {height} mm à raison de 5 mm par perle',
        pdfPages: 'PDF : {count} pages — une vue d’ensemble et {boards} grilles de plaques',
        quiet: 'Conservez les quatre modules de bordure claire sur chaque côté.', materials: 'Couleurs et quantités', emptyText: 'Saisissez une URL ou un court message pour afficher la grille.', tooLong: 'Ce texte dépasse 1 024 octets UTF-8. Raccourcissez-le pour créer une grille.', tooLarge: 'Ces réglages dépassent 232 perles par côté. Raccourcissez le texte ou réduisez la taille des modules ou la correction d’erreur.', invalidText: 'Le texte contient une séquence de caractères invalide. Modifiez-le et réessayez.', invalidOptions: 'Vérifiez les réglages de la grille.', invalidColor: 'Choisissez deux couleurs distinctes, avec des modules foncés et un fond clair.',
        check: 'Vérifier le PNG numérique', checking: 'Vérification du PNG…', checkPassed: 'Le PNG restitue exactement votre texte. Il reste à tester les perles réalisées avec un téléphone.', checkFailed: 'Le PNG ne restitue pas votre texte. Essayez plus de contraste, un texte plus court ou une correction d’erreur moins élevée.', checkError: 'La vérification n’a pas pu aboutir. Votre saisie est conservée ; vous pouvez réessayer.',
        downloadPng: 'Télécharger le PNG du QR', downloadChart: 'Télécharger la grille PNG', downloadPdf: 'Télécharger le PDF à imprimer', saveProject: 'Enregistrer le projet modifiable', openProject: 'Ouvrir un projet enregistré',
        editorHelp: 'Enregistrez le projet, puis ouvrez-le dans l’éditeur de perles pour modifier des cases. Modifier les modules ou la bordure peut rendre le code illisible.', editorLink: 'Ouvrir l’éditeur de perles', replaceProject: 'Remplacer vos réglages QR non enregistrés par ce projet ?', saved: 'Projet enregistré. Conservez le fichier pour reprendre votre travail.', loaded: 'Projet ouvert.', invalidProject: 'Ce fichier n’est pas un projet valide de cet outil QR. Votre saisie est conservée.', exportFailed: 'Le fichier n’a pas pu être créé. Votre saisie est conservée.', working: 'Préparation du fichier…', cancel: 'Annuler', cancelled: 'Annulé. Votre saisie est conservée.',
        restoring: 'Restauration des réglages QR…', restoreFailed: 'Le changement de langue n’a pas pu être restauré. Réessayez ou abandonnez explicitement le transfert pour recommencer.', retryRestore: 'Réessayer la restauration', discardRestore: 'Abandonner le transfert et recommencer', discardFailed: 'Le transfert n’a pas pu être supprimé. La copie de récupération reste protégée.', transferFailed: 'Le changement de langue a été arrêté car vos réglages n’ont pas pu être enregistrés. Restez ici et réessayez.', savedState: 'Aucune modification non enregistrée', unsavedState: 'Réglages non enregistrés',
    },
    ja: {
        title: 'QRコードのアイロンビーズ図案作成 | Fuse Bead Patterns',
        description: 'URLや短い文章を2色のQRコード図案に変換。Perler・Hama・Artkalの色を選び、PNGの読み取り確認やPDF・編集用プロジェクトの保存ができます。',
        heading: 'QRコードのアイロンビーズ図案を作る',
        intro: 'ウェブサイトのURLや短いメッセージを2色の図案にできます。入力した内容はブラウザ内で処理され、アップロードされません。', home: 'ホーム',
        howTitle: 'QR図案の作り方',
        steps: ['https://を含む完全なURL、または短い文章を入力します。', '濃い色と明るい色、1マスに使うビーズの数を選びます。明るい外枠は残してください。', 'PNGの読み取りを確認し、図案と材料表を保存します。完成品は使う前にスマートフォンで読み取りテストをしてください。'],
        notesTitle: '作る前の確認',
        notes: ['PNGが読み取れても、実物のビーズが読み取れる保証にはなりません。穴・アイロンのかけ方・反射・大きさ・明るさが影響します。', '周囲4マス分の余白にも背景色のビーズを使い、必要数に含めています。この枠は切り落とさないでください。', 'ブランドの色は画面上の目安です。濃い図柄と明るい背景の組み合わせから試してください。', 'QRコードは読み取った人に内容が見えます。公開したくない情報やパスワードなどは入力しないでください。'],
        text: 'URL・文章', textHelp: 'UTF-8で1,024バイトまで。文章が長いほどビーズが増えます。短縮URLの発行や読み取り回数の追跡は行いません。',
        ecc: '誤り訂正レベル', eccHelp: 'レベルを上げると図案が大きくなる場合があります。実物の読み取りを保証するものではありません。', scale: 'QRの1マスに使うビーズ', scaleOption: '{count} × {count} 個',
        brand: 'ビーズのブランド', foreground: '濃い図柄の色', background: '明るい背景・外枠の色', paper: 'PDFの用紙', preview: 'ビーズ図案', previewLabel: '周囲の余白を含む2色のQRコード図案',
        dimensions: '{width} × {height} 個のビーズ', modules: 'QR本体は{count} × {count} マス＋周囲の余白', beadCount: '外枠込みで{count}個', boardCount: '{size} × {size} のプレートを横{wide}枚・縦{tall}枚', physicalSize: '1個5 mmで {width} × {height} mm',
        pdfPages: 'PDFは全{count}ページ（全体図1ページ＋プレート別{boards}ページ）',
        quiet: 'すべての辺に4マス分の明るい外枠を残してください。', materials: '色と必要な個数', emptyText: 'URLか短い文章を入力すると図案を表示します。', tooLong: 'UTF-8で1,024バイトを超えています。文章を短くしてください。', tooLarge: 'この設定では1辺232個の上限を超えます。文章を短くするか、1マスのビーズ数・誤り訂正レベルを下げてください。', invalidText: '文章に正しくない文字の組み合わせがあります。入力を修正してください。', invalidOptions: '図案の設定を確認してください。', invalidColor: '濃い図柄と明るい背景になるよう、異なる2色を選んでください。',
        check: 'PNGの読み取りを確認', checking: 'PNGを確認中…', checkPassed: 'PNGから入力と同じ内容を読み取れました。実物の完成品は別途スマートフォンで確認してください。', checkFailed: 'PNGから入力と同じ内容を読み取れませんでした。濃淡の差を大きくするか、文章を短くする・誤り訂正レベルを下げる設定を試してください。', checkError: '確認を完了できませんでした。入力は残っています。もう一度試してください。',
        downloadPng: 'QRコードPNGを保存', downloadChart: 'マス目付きPNGを保存', downloadPdf: '印刷用PDFを保存', saveProject: '編集用プロジェクトを保存', openProject: '保存したプロジェクトを開く',
        editorHelp: 'プロジェクトを保存し、ビーズエディターで開くと1個ずつ修正できます。QR本体や外枠を変えると読み取れなくなる場合があります。', editorLink: 'ビーズエディターを開く', replaceProject: '保存していないQR設定を、このプロジェクトで置き換えますか？', saved: '保存しました。再開するときはこのファイルを開いてください。', loaded: 'プロジェクトを開きました。', invalidProject: 'このQRツールの正しいプロジェクトではありません。現在の入力は残しています。', exportFailed: 'ファイルを作成できませんでした。入力は残っています。', working: 'ファイルを準備中…', cancel: '中止', cancelled: '中止しました。入力は残っています。',
        restoring: 'QR設定を復元中…', restoreFailed: '言語切り替え前の設定を読み取れませんでした。再試行するか、転送データを破棄してやり直してください。', retryRestore: '復元を再試行', discardRestore: '転送データを破棄してやり直す', discardFailed: '転送データを削除できませんでした。復元用のコピーは保護されています。', transferFailed: '設定を保存できなかったため言語切り替えを止めました。このページで再試行してください。', savedState: '未保存の変更はありません', unsavedState: '未保存の設定',
    },
};
