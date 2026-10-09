import HamaMakerPage from '@/components/hama-maker/HamaMakerPage';
import { hamaMakerMetadata } from '@/lib/hama-maker/content';

export const metadata = hamaMakerMetadata('en');

export default function EnglishHamaMakerPage() {
    return <HamaMakerPage locale="en" />;
}
