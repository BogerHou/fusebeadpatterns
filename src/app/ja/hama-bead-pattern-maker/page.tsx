import HamaMakerPage from '@/components/hama-maker/HamaMakerPage';
import { hamaMakerMetadata } from '@/lib/hama-maker/content';

export const metadata = hamaMakerMetadata('ja');

export default function JapaneseHamaMakerPage() {
    return <HamaMakerPage locale="ja" />;
}
