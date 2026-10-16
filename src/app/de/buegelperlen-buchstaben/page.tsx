import BeadLetterPage from '@/components/bead-letters/BeadLetterPage';
import { beadLetterMetadata } from '@/lib/bead-letters/metadata';

export const metadata = beadLetterMetadata('de');

export default function BeadLettersPage() {
    return <BeadLetterPage locale="de" />;
}
