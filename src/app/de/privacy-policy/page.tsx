import LocalizedSitePage, { localizedSitePageMetadata } from '@/components/layout/LocalizedSitePage';

export const metadata = localizedSitePageMetadata('de', 'privacy-policy');

export default function Page() {
    return <LocalizedSitePage locale="de" slug="privacy-policy" />;
}
