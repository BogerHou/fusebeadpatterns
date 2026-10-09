import LocalizedSitePage, { localizedSitePageMetadata } from '@/components/layout/LocalizedSitePage';

export const metadata = localizedSitePageMetadata('de', 'terms-of-service');

export default function Page() {
    return <LocalizedSitePage locale="de" slug="terms-of-service" />;
}
