import LocalizedSitePage, { localizedSitePageMetadata } from '@/components/layout/LocalizedSitePage';

export const metadata = localizedSitePageMetadata('ja', 'terms-of-service');

export default function Page() {
    return <LocalizedSitePage locale="ja" slug="terms-of-service" />;
}
