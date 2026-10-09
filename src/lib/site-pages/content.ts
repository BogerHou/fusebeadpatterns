import { germanSitePages } from './de';
import { frenchSitePages } from './fr';
import { japaneseSitePages } from './ja';

export const sitePageCopy = { de: germanSitePages, fr: frenchSitePages, ja: japaneseSitePages };
export const sitePageUi = {
    de: { home: 'Startseite', breadcrumb: 'Brotkrümelnavigation', updated: 'Zuletzt aktualisiert:' },
    fr: { home: 'Accueil', breadcrumb: 'Fil d’Ariane', updated: 'Dernière mise à jour :' },
    ja: { home: 'ホーム', breadcrumb: 'パンくずリスト', updated: '最終更新日：' },
};
