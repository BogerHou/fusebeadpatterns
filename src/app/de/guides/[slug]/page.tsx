import { LocalizedGuidePage, localizedGuideMetadata } from '@/components/guides/LocalizedGuides';
import { translatedGuideSlugs } from '@/lib/guides/routes';

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return translatedGuideSlugs.map(slug => ({ slug })); }
export async function generateMetadata({ params }: Props) { return localizedGuideMetadata('de', (await params).slug); }
export default async function Page({ params }: Props) { return <LocalizedGuidePage locale="de" slug={(await params).slug} />; }
