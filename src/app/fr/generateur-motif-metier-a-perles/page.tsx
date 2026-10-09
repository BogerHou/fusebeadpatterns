import LocalizedLoomPage from '@/components/bead-loom/LocalizedLoomPage';
import { localizedLoomMetadata } from '@/lib/bead-loom/page-content';

export const metadata = localizedLoomMetadata('fr');
export default function FrenchLoomPage() { return <LocalizedLoomPage locale="fr" />; }
