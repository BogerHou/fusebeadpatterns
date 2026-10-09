import LocalizedSitePage, { localizedSitePageMetadata } from '@/components/layout/LocalizedSitePage';

export const metadata = localizedSitePageMetadata('fr', 'about');

export default function Page() {
    return <LocalizedSitePage locale="fr" slug="about" />;
}
