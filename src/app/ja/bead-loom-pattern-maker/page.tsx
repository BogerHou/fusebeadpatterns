import LocalizedLoomPage from '@/components/bead-loom/LocalizedLoomPage';
import { localizedLoomMetadata } from '@/lib/bead-loom/page-content';

export const metadata = localizedLoomMetadata('ja');
export default function JapaneseLoomPage() { return <LocalizedLoomPage locale="ja" />; }
