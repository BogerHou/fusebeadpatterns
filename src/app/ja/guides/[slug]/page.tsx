import { LocalizedGuidePage, localizedGuideMetadata } from '@/components/guides/LocalizedGuides';
import { translatedGuideSlugs } from '@/lib/guides/routes';

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return translatedGuideSlugs.filter(slug => slug !== 'photo-to-perler-bead-pattern').map(slug => ({ slug })); }
export async function generateMetadata({ params }: Props) { return localizedGuideMetadata('ja', (await params).slug); }
export default async function Page({ params }: Props) { return <LocalizedGuidePage locale="ja" slug={(await params).slug} />; }
