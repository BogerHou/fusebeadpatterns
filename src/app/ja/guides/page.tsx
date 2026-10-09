import { LocalizedGuideIndex, localizedGuideMetadata } from '@/components/guides/LocalizedGuides';

export const metadata = localizedGuideMetadata('ja');
export default function Page() { return <LocalizedGuideIndex locale="ja" />; }
