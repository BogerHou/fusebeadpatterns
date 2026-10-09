import LocalizedSitePage, { localizedSitePageMetadata } from '@/components/layout/LocalizedSitePage';

export const metadata = localizedSitePageMetadata('fr', 'terms-of-service');

export default function Page() {
    return <LocalizedSitePage locale="fr" slug="terms-of-service" />;
}
