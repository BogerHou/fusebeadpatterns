import { LocalizedGuideIndex, localizedGuideMetadata } from '@/components/guides/LocalizedGuides';

export const metadata = localizedGuideMetadata('fr');
export default function Page() { return <LocalizedGuideIndex locale="fr" />; }
