import QrBeadPage from '@/components/qr-beads/QrBeadPage';
import { qrBeadMetadata } from '@/lib/qr-beads/metadata';

export const metadata = qrBeadMetadata('ja');

export default function QrCodeBeadsPage() {
    return <QrBeadPage locale="ja" />;
}
