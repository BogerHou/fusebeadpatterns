import type { LoomLocale } from './messages';
const en={
    save:'Save full workspace',
    help:'Save project keeps the current chart. Save full workspace also keeps the original image, up to 40 undo/redo steps, unapplied settings and paper choice. Open either file with Open project. Full files contain image pixels and may be up to 64 MiB; keep them private if the image is private. Nothing is uploaded.',
    replace:'Replace your current chart, original image, settings and undo/redo history with this workspace? Save a full workspace copy first to keep your current work.',
    cancelled:'Opening the workspace was cancelled. Your current work is unchanged.',
    opened:'Full workspace opened. The chart, original image, saved state, undo/redo history and settings were restored.',
    saved:'Full workspace download started. Check your browser downloads. The original image, history and settings are included.',
    errors:{UNSUPPORTED_FORMAT:'Choose a supported bead loom workspace file.',INVALID:'This workspace is incomplete or damaged. Your current work was kept.',TOO_LARGE:'The full workspace file must be no larger than 64 MiB.',READ_FAILED:'The file could not be read. Your current work was kept.'},
};
const de:typeof en={
    save:'Vollständigen Arbeitsstand speichern',
    help:'„Projekt speichern“ sichert das aktuelle Muster. Der vollständige Arbeitsstand enthält außerdem das Originalbild, bis zu 40 Rückgängig-/Wiederholen-Schritte, noch nicht übernommene Einstellungen und das Papierformat. Beide Dateien lassen sich mit „Projekt öffnen“ laden. Vollständige Dateien enthalten Bildpixel und können bis zu 64 MiB groß sein. Bewahre sie bei privaten Bildern vertraulich auf. Es wird nichts hochgeladen.',
    replace:'Aktuelles Muster, Originalbild, Einstellungen und Rückgängig-/Wiederholen-Verlauf durch diesen Arbeitsstand ersetzen? Speichere vorher eine vollständige Kopie, um deine aktuelle Arbeit zu behalten.',
    cancelled:'Öffnen abgebrochen. Deine aktuelle Arbeit bleibt erhalten.',
    opened:'Vollständiger Arbeitsstand geöffnet. Muster, Originalbild, Speicherstand, Verlauf und Einstellungen wurden wiederhergestellt.',
    saved:'Download des vollständigen Arbeitsstands gestartet. Prüfe die Browser-Downloads. Originalbild, Verlauf und Einstellungen sind enthalten.',
    errors:{UNSUPPORTED_FORMAT:'Wähle eine unterstützte Arbeitsstand-Datei für Perlenwebmuster.',INVALID:'Der Arbeitsstand ist unvollständig oder beschädigt. Deine aktuelle Arbeit bleibt erhalten.',TOO_LARGE:'Die vollständige Arbeitsstand-Datei darf höchstens 64 MiB groß sein.',READ_FAILED:'Die Datei konnte nicht gelesen werden. Deine aktuelle Arbeit bleibt erhalten.'},
};
const fr:typeof en={
    save:'Enregistrer tout l’espace de travail',
    help:'« Enregistrer le projet » conserve la grille actuelle. L’espace de travail complet conserve aussi l’image d’origine, jusqu’à 40 étapes d’annulation/rétablissement, les réglages non appliqués et le format papier. Ouvrez les deux types de fichiers avec « Ouvrir un projet ». Le fichier complet contient les pixels de l’image et peut atteindre 64 Mio. Gardez-le privé si l’image est privée. Rien n’est envoyé en ligne.',
    replace:'Remplacer la grille, l’image d’origine, les réglages et l’historique actuels par cet espace de travail ? Enregistrez d’abord une copie complète pour conserver votre travail.',
    cancelled:'Ouverture annulée. Votre travail actuel est conservé.',
    opened:'Espace de travail complet ouvert. La grille, l’image d’origine, l’état enregistré, l’historique et les réglages ont été restaurés.',
    saved:'Téléchargement de l’espace de travail complet lancé. Consultez les téléchargements du navigateur. L’image d’origine, l’historique et les réglages sont inclus.',
    errors:{UNSUPPORTED_FORMAT:'Choisissez un fichier d’espace de travail pour métier à perles pris en charge.',INVALID:'Cet espace de travail est incomplet ou endommagé. Votre travail actuel est conservé.',TOO_LARGE:'Le fichier complet ne doit pas dépasser 64 Mio.',READ_FAILED:'Le fichier n’a pas pu être lu. Votre travail actuel est conservé.'},
};
const ja:typeof en={
    save:'作業全体を保存',
    help:'「プロジェクトを保存」は現在の図案を保存します。「作業全体を保存」には元画像、最大40回の元に戻す・やり直す履歴、未適用の設定、用紙サイズも含まれます。どちらも「プロジェクトを開く」で読み込めます。全体ファイルは画像のピクセルを含み、最大64 MiBです。非公開の画像を含む場合はファイルも非公開にしてください。アップロードは行いません。',
    replace:'現在の図案、元画像、設定、元に戻す・やり直す履歴を、この作業ファイルに置き換えますか？現在の作業を残す場合は、先に作業全体を別名で保存してください。',
    cancelled:'読み込みをキャンセルしました。現在の作業はそのままです。',
    opened:'作業全体を開きました。図案、元画像、保存状態、履歴、設定を復元しました。',
    saved:'作業全体のダウンロードを開始しました。ブラウザーのダウンロードを確認してください。元画像、履歴、設定が含まれています。',
    errors:{UNSUPPORTED_FORMAT:'対応するビーズ織りの作業ファイルを選んでください。',INVALID:'作業ファイルが不完全、または破損しています。現在の作業はそのままです。',TOO_LARGE:'作業全体のファイルは64 MiB以下にしてください。',READ_FAILED:'ファイルを読み込めませんでした。現在の作業はそのままです。'},
};
export const LOOM_WORKSPACE_COPY={en,de,fr,ja};
export function getLoomWorkspaceCopy(locale:LoomLocale){return LOOM_WORKSPACE_COPY[locale];}
