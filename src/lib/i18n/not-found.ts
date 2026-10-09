import type { Metadata } from 'next';
import type { SiteLocale } from './locales';
import { getLocaleFromPath } from './routes';

export const notFoundCopy = {
    en: {
        title: 'Page not found', eyebrow: '404 · A missing piece',
        description: "This link doesn't lead to a page. Find a pattern in the library, or start a new design with the generator.",
        patterns: 'Browse patterns', home: 'Back to generator',
    },
    de: {
        title: 'Seite nicht gefunden', eyebrow: '404 · Hier fehlt etwas',
        description: 'Unter diesem Link gibt es keine Seite. Finde eine Vorlage in der Sammlung oder erstelle ein neues Muster mit dem Generator.',
        patterns: 'Vorlagen ansehen', home: 'Zurück zum Generator',
    },
    fr: {
        title: 'Page introuvable', eyebrow: '404 · Une page manque',
        description: 'Ce lien ne mène à aucune page. Trouvez un modèle dans la collection ou créez un nouveau motif avec le générateur.',
        patterns: 'Voir les modèles', home: 'Retour au générateur',
    },
    ja: {
        title: 'ページが見つかりません', eyebrow: '404 · ページがありません',
        description: 'このリンクのページは見つかりませんでした。図案一覧から選ぶか、画像から新しい図案を作成してください。',
        patterns: '図案一覧を見る', home: '図案作成に戻る',
    },
} satisfies Record<SiteLocale, Record<string, string>>;

export function notFoundMetadata(locale: SiteLocale): Metadata {
    return {
        title: `${notFoundCopy[locale].title} | Fuse Bead Patterns`,
        robots: { index: false, follow: true },
    };
}

/** The shared global 404 is prerendered without the unmatched request URL. */
export function serverNotFoundPathname(): string {
    return '/_not-found';
}

export function readNotFoundPathname(routerPathname: string | null): string {
    return window.location.pathname || routerPathname || '/';
}

export function readNotFoundLocale(routerPathname: string | null): SiteLocale {
    return getLocaleFromPath(readNotFoundPathname(routerPathname));
}

export function subscribeToNotFoundLocation(onChange: () => void): () => void {
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
}
