import LocalizedLoomPage from '@/components/bead-loom/LocalizedLoomPage';
import { localizedLoomMetadata } from '@/lib/bead-loom/page-content';

export const metadata = localizedLoomMetadata('de');
export default function GermanLoomPage() { return <LocalizedLoomPage locale="de" />; }
