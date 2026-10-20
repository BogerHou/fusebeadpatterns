import type { SiteLocale } from '../i18n/locales';

type ExtensionCopy = {
    title: string; description: string; label: string; heading: string; intro: string;
    install: string; online: string; how: string; pendingTitle: string; pending: string;
    availability: string; imageAlt: string; caption: string; stepsHeading: string;
    steps: { title: string; text: string }[];
    detailsHeading: string; questions: { question: string; answer: string }[];
    privacy: string; support: string; independent: string;
};

export const extensionCopy: Record<SiteLocale, ExtensionCopy> = {
    en: {
        title: 'Perler Bead Pattern Maker for Chrome | Bead Capture',
        description: 'Turn web images into bead patterns with Bead Capture for Chrome. Adjust colors, export a PDF, and continue in the editor. Store release pending.',
        label: 'Chrome extension',
        heading: 'See an image. Make a bead pattern.',
        intro: 'Right-click an image, choose your bead colors, and turn it into a pattern in your browser.',
        install: 'Add to Chrome', online: 'Try the online converter', how: 'How it works',
        pendingTitle: 'Chrome Web Store review in progress',
        pending: 'The extension has been submitted for review. The installation link will appear here once the public listing is available.',
        availability: 'Free extension for desktop Chrome 123 or later. No account required. On a phone? Use the online converter.',
        imageAlt: 'Bead Capture workspace showing an original rocket image converted into an Artkal S bead pattern.',
        caption: 'The actual conversion workspace, shown in English. Also available in German, French, and Japanese.',
        stepsHeading: 'From the image you find to a pattern you can make',
        steps: [
            { title: 'Choose an image', text: 'After installing, right-click a web image and choose “Make a bead pattern”. Allow access to its image host when Chrome asks. You can also open the extension and choose a local file.' },
            { title: 'Make it yours', text: 'Crop the image, remove a plain background, and set your pegboard size. Choose Perler, Hama, or Artkal S colors, then reduce the color count if you want fewer beads to sort.' },
            { title: 'Save it or keep editing', text: 'Export a printable PDF, an image, or an editable project. Choose “Edit Pattern” to open your generated pattern in the website editor and paint, erase, or fill individual beads.' },
        ],
        detailsHeading: 'Before you install',
        questions: [
            { question: 'What permission does it need?', answer: 'If access to the image host has not been granted, choose just that host or access across websites, then confirm the permission in Chrome. The image host may differ from the website you are visiting. Existing grants are reused until you revoke them. Choosing a local file needs no website access.' },
            { question: 'Are my images uploaded?', answer: 'Conversion runs locally in the extension. It has no ads or analytics and does not upload your original image to us. Reading a web image contacts its image server. “Edit Pattern” passes the generated bead grid and settings to our website, without the original image, image URL, or filename. The website has its own privacy policy.' },
            { question: 'Does it work with every image?', answer: 'Right-click capture supports static PNG, JPEG, and WebP images up to 8 MiB and 2048 pixels per side. Protected images, expired links, redirects, and some other image types may not load. If you have permission to use the image, save it and choose it as a local file instead.' },
            { question: 'What can I download?', answer: 'Export PDF, PNG, JPG, SVG, a grid PNG, an XLSX color list, or an editable project. Save your project before closing the workspace. Screen colors may differ from real beads; check your palette and the PDF printing instructions before making the pattern.' },
        ],
        privacy: 'Read the privacy policy', support: 'Get help',
        independent: 'Bead Capture is made by Fuse Bead Patterns. It is independent of Perler, Hama, Artkal, and Google. Use images you own or have permission to use.',
    },
    de: {
        title: 'Bügelperlen-Vorlagen in Chrome erstellen | Bead Capture',
        description: 'Mit Bead Capture Webbilder in Bügelperlen-Vorlagen umwandeln, Farben anpassen und PDFs speichern. Die Chrome-Erweiterung wird noch geprüft.',
        label: 'Chrome-Erweiterung',
        heading: 'Bild entdeckt. Bügelperlen-Vorlage gemacht.',
        intro: 'Bild rechts anklicken, Perlenfarben auswählen und direkt im Browser eine Vorlage erstellen.',
        install: 'Zu Chrome hinzufügen', online: 'Online-Generator ausprobieren', how: 'So funktioniert es',
        pendingTitle: 'Prüfung im Chrome Web Store läuft',
        pending: 'Die Erweiterung wurde zur Prüfung eingereicht. Sobald der öffentliche Eintrag verfügbar ist, erscheint hier der Installationslink.',
        availability: 'Kostenlose Erweiterung für Chrome ab Version 123 auf dem Computer. Kein Konto nötig. Am Handy nutze den Online-Generator.',
        imageAlt: 'Bead Capture mit einer selbst erstellten Raketenillustration und der daraus erzeugten Artkal-S-Bügelperlen-Vorlage.',
        caption: 'Die echte Arbeitsfläche, hier auf Englisch. Auch auf Deutsch, Französisch und Japanisch verfügbar.',
        stepsHeading: 'Vom entdeckten Bild zur eigenen Vorlage',
        steps: [
            { title: 'Ein Bild auswählen', text: 'Nach der Installation ein Webbild rechts anklicken und „Make a bead pattern“ wählen. Erlaube den Zugriff auf den Bildserver, wenn Chrome fragt. Alternativ die Erweiterung öffnen und eine lokale Datei auswählen.' },
            { title: 'Die Vorlage anpassen', text: 'Schneide das Bild zu, entferne einen einfarbigen Hintergrund und wähle die Steckplattengröße. Nutze Perler-, Hama- oder Artkal-S-Farben und begrenze bei Bedarf die Farbanzahl.' },
            { title: 'Speichern oder weiterbearbeiten', text: 'Lade eine PDF, ein Bild oder ein bearbeitbares Projekt herunter. Über die Bearbeiten-Funktion öffnest du das erzeugte Muster im Website-Editor und kannst einzelne Perlen malen, löschen oder Flächen füllen.' },
        ],
        detailsHeading: 'Vor der Installation',
        questions: [
            { question: 'Welche Berechtigung wird benötigt?', answer: 'Fehlt der Zugriff auf den Bildserver, wähle nur diesen Server oder Zugriff über Websites hinweg und bestätige die Berechtigung in Chrome. Der Bildserver kann eine andere Domain als die besuchte Website haben. Vorhandene Freigaben werden bis zum Widerruf weiterverwendet. Lokale Dateien benötigen keinen Website-Zugriff.' },
            { question: 'Werden meine Bilder hochgeladen?', answer: 'Die Umwandlung läuft lokal in der Erweiterung, ohne Werbung oder Analysefunktionen. Dein Originalbild wird nicht an uns hochgeladen. Webbilder werden vom jeweiligen Bildserver geladen. Beim Wechsel zum Website-Editor werden nur das erzeugte Perlenraster und die Einstellungen übergeben, ohne Originalbild, Bildadresse oder Dateiname. Für die Website gilt ihre eigene Datenschutzerklärung.' },
            { question: 'Funktioniert jedes Bild?', answer: 'Der Rechtsklick-Import unterstützt statische PNG-, JPEG- und WebP-Bilder bis 8 MiB und 2048 Pixel je Seite. Geschützte Bilder, abgelaufene Links, Weiterleitungen und manche Formate können nicht geladen werden. Wenn du das Bild verwenden darfst, speichere es und wähle es als lokale Datei aus.' },
            { question: 'Welche Downloads gibt es?', answer: 'PDF, PNG, JPG, SVG, Raster-PNG, eine XLSX-Farbliste und ein bearbeitbares Projekt. Speichere das Projekt vor dem Schließen. Bildschirmfarben können von echten Perlen abweichen. Prüfe die Palette und die Druckhinweise der PDF vor dem Stecken.' },
        ],
        privacy: 'Datenschutzerklärung lesen', support: 'Hilfe erhalten',
        independent: 'Bead Capture stammt von Fuse Bead Patterns und ist unabhängig von Perler, Hama, Artkal und Google. Verwende eigene Bilder oder solche, die du nutzen darfst.',
    },
    fr: {
        title: 'Modèles de perles dans Chrome | Bead Capture',
        description: 'Transformez des images du Web en modèles de perles avec Bead Capture. Ajustez les couleurs et exportez en PDF. Extension Chrome en cours de validation.',
        label: 'Extension Chrome',
        heading: 'Une image repérée. Un modèle de perles à créer.',
        intro: 'Un clic droit sur une image, vos couleurs de perles, et un modèle à créer dans votre navigateur.',
        install: 'Ajouter à Chrome', online: 'Essayer le convertisseur en ligne', how: 'Comment ça marche',
        pendingTitle: 'Validation du Chrome Web Store en cours',
        pending: 'L’extension a été soumise à validation. Le lien d’installation apparaîtra ici lorsque sa fiche publique sera disponible.',
        availability: 'Extension gratuite pour Chrome 123 ou ultérieur sur ordinateur, sans compte. Sur téléphone, utilisez le convertisseur en ligne.',
        imageAlt: 'Espace Bead Capture affichant une illustration originale de fusée convertie en modèle de perles Artkal S.',
        caption: 'Le véritable espace de conversion, présenté en anglais. Également disponible en français, allemand et japonais.',
        stepsHeading: 'De l’image repérée au modèle à réaliser',
        steps: [
            { title: 'Choisissez une image', text: 'Après l’installation, faites un clic droit sur une image du Web et choisissez « Make a bead pattern ». Autorisez l’accès au serveur de l’image lorsque Chrome le demande. Vous pouvez aussi ouvrir l’extension et choisir un fichier local.' },
            { title: 'Adaptez votre modèle', text: 'Recadrez l’image, retirez un fond uni et choisissez la taille des plaques. Sélectionnez une palette Perler, Hama ou Artkal S, puis réduisez le nombre de couleurs pour simplifier le tri des perles.' },
            { title: 'Enregistrez ou continuez à modifier', text: 'Exportez un PDF imprimable, une image ou un projet modifiable. La fonction de modification ouvre le modèle généré dans l’éditeur du site pour peindre, effacer ou remplir les perles une par une.' },
        ],
        detailsHeading: 'Avant l’installation',
        questions: [
            { question: 'Quelle autorisation est nécessaire ?', answer: 'Si l’accès au serveur de l’image n’est pas encore autorisé, choisissez ce serveur seul ou l’accès aux images sur tous les sites, puis confirmez dans Chrome. Le serveur de l’image peut différer du site visité. Les autorisations existantes sont réutilisées jusqu’à leur révocation. Un fichier local ne nécessite aucun accès à un site.' },
            { question: 'Mes images sont-elles envoyées en ligne ?', answer: 'La conversion se fait localement dans l’extension, sans publicité ni outil d’analyse. Votre image originale ne nous est pas envoyée. Une image du Web est récupérée auprès de son serveur. Le passage à l’éditeur du site transmet uniquement la grille de perles et les réglages, sans image originale, adresse d’image ni nom de fichier. Le site possède sa propre politique de confidentialité.' },
            { question: 'Toutes les images fonctionnent-elles ?', answer: 'L’import par clic droit accepte les images statiques PNG, JPEG et WebP de 8 Mio maximum et 2048 pixels par côté. Les images protégées, liens expirés, redirections et certains formats peuvent échouer. Si vous avez le droit d’utiliser l’image, enregistrez-la puis choisissez-la comme fichier local.' },
            { question: 'Quels fichiers peut-on télécharger ?', answer: 'PDF, PNG, JPG, SVG, grille PNG, liste de couleurs XLSX et projet modifiable. Enregistrez le projet avant de fermer l’espace de travail. Les couleurs affichées peuvent différer des vraies perles. Vérifiez la palette et les consignes d’impression du PDF avant de commencer.' },
        ],
        privacy: 'Lire la politique de confidentialité', support: 'Obtenir de l’aide',
        independent: 'Bead Capture est créé par Fuse Bead Patterns, sans affiliation avec Perler, Hama, Artkal ou Google. Utilisez vos propres images ou des images que vous êtes autorisé à utiliser.',
    },
    ja: {
        title: '画像をアイロンビーズ図案にするChrome拡張機能 | Bead Capture',
        description: 'Bead Captureは、Webの画像を右クリックしてビーズ図案に変換するChrome拡張機能です。配色の調整、PDF保存、サイトのエディターでの編集に対応。現在ストア審査中です。',
        label: 'Chrome拡張機能',
        heading: '見つけた画像を、ビーズの図案に。',
        intro: '画像を右クリックして配色を選ぶだけ。ブラウザでアイロンビーズの図案を作れます。',
        install: 'Chromeに追加', online: 'Webの変換ツールを試す', how: '使い方を見る',
        pendingTitle: 'Chrome ウェブストアで審査中です',
        pending: '拡張機能は審査に提出済みです。ストアで公開され次第、このページにインストールリンクを掲載します。',
        availability: 'パソコン版Chrome 123以降に対応する無料の拡張機能です。アカウントは不要。スマートフォンではWebの変換ツールをご利用ください。',
        imageAlt: 'オリジナルのロケット画像をArtkal Sのビーズ図案に変換したBead Captureの作業画面。',
        caption: '実際の変換画面です。画像は英語表示ですが、日本語・ドイツ語・フランス語にも対応しています。',
        stepsHeading: '見つけた画像から、作れる図案まで',
        steps: [
            { title: '画像を選ぶ', text: 'インストール後、Webの画像を右クリックして「Make a bead pattern」を選びます。Chromeに確認されたら、画像の配信元へのアクセスを許可してください。拡張機能を開き、端末内の画像ファイルを選ぶこともできます。' },
            { title: '図案を調整する', text: '画像の切り抜きや単色背景の除去を行い、ボードの大きさを選びます。Perler・Hama・Artkal Sの配色に対応。色数を減らすと、使うビーズを整理しやすくなります。' },
            { title: '保存する・さらに編集する', text: '印刷用PDF、画像、編集可能なプロジェクトとして保存できます。編集ボタンを押すと、生成した図案をサイトのエディターで開き、ビーズを塗る・消す・塗りつぶす操作ができます。' },
        ],
        detailsHeading: 'インストール前に',
        questions: [
            { question: 'どのような権限が必要ですか？', answer: '画像配信元へのアクセスがまだ許可されていない場合、その配信元のみ、または各サイトでのアクセスを選び、Chromeで確認します。画像の配信元は閲覧中のサイトと異なる場合があります。既存の許可は取り消すまで再利用されます。端末内のファイルを使う場合、サイトへのアクセス権限は不要です。' },
            { question: '画像はアップロードされますか？', answer: '変換処理は拡張機能内で行い、原画像を当サイトにアップロードしません。拡張機能内に広告やアクセス解析はありません。Web画像の取得時は画像配信元に接続します。サイトのエディターには生成したビーズ配置と設定のみを渡し、原画像・画像URL・ファイル名は渡しません。サイトには別途プライバシーポリシーが適用されます。' },
            { question: 'すべての画像に対応していますか？', answer: '右クリックでの読み込みは、8 MiB以下・各辺2048ピクセル以下の静止PNG・JPEG・WebPに対応しています。保護された画像、期限切れのURL、リダイレクト、一部の形式は読み込めない場合があります。利用権限のある画像なら、保存してから端末内のファイルとして選んでください。' },
            { question: 'どの形式で保存できますか？', answer: 'PDF・PNG・JPG・SVG・グリッドPNG・XLSXの色一覧・編集可能なプロジェクトを保存できます。画面を閉じる前にプロジェクトを保存してください。画面の色と実物のビーズは異なる場合があります。配色とPDFの印刷案内を確認してから制作してください。' },
        ],
        privacy: 'プライバシーポリシー', support: 'サポート',
        independent: 'Bead CaptureはFuse Bead Patternsが制作しています。Perler・Hama・Artkal・Googleの公式製品ではありません。ご自身の画像、または利用許可のある画像をお使いください。',
    },
};
