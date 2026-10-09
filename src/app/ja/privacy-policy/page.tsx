import LocalizedSitePage, { localizedSitePageMetadata } from '@/components/layout/LocalizedSitePage';

export const metadata = localizedSitePageMetadata('ja', 'privacy-policy');

export default function Page() {
    return <LocalizedSitePage locale="ja" slug="privacy-policy" />;
}
