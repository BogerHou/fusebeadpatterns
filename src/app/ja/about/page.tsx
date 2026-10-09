import LocalizedSitePage, { localizedSitePageMetadata } from '@/components/layout/LocalizedSitePage';

export const metadata = localizedSitePageMetadata('ja', 'about');

export default function Page() {
    return <LocalizedSitePage locale="ja" slug="about" />;
}
