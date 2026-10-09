import LocalizedSitePage, { localizedSitePageMetadata } from '@/components/layout/LocalizedSitePage';

export const metadata = localizedSitePageMetadata('de', 'about');

export default function Page() {
    return <LocalizedSitePage locale="de" slug="about" />;
}
