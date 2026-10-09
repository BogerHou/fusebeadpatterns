import { LocalizedGuideIndex, localizedGuideMetadata } from '@/components/guides/LocalizedGuides';

export const metadata = localizedGuideMetadata('de');
export default function Page() { return <LocalizedGuideIndex locale="de" />; }
