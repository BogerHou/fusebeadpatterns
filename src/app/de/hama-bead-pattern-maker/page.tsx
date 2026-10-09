import HamaMakerPage from '@/components/hama-maker/HamaMakerPage';
import { hamaMakerMetadata } from '@/lib/hama-maker/content';

export const metadata = hamaMakerMetadata('de');

export default function GermanHamaMakerPage() {
    return <HamaMakerPage locale="de" />;
}
