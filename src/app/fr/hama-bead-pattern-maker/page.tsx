import HamaMakerPage from '@/components/hama-maker/HamaMakerPage';
import { hamaMakerMetadata } from '@/lib/hama-maker/content';

export const metadata = hamaMakerMetadata('fr');

export default function FrenchHamaMakerPage() {
    return <HamaMakerPage locale="fr" />;
}
