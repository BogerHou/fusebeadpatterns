import LocalizedSitePage, { localizedSitePageMetadata } from '@/components/layout/LocalizedSitePage';

export const metadata = localizedSitePageMetadata('fr', 'privacy-policy');

export default function Page() {
    return <LocalizedSitePage locale="fr" slug="privacy-policy" />;
}
