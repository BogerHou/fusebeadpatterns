import QrBeadPage from '@/components/qr-beads/QrBeadPage';
import { qrBeadMetadata } from '@/lib/qr-beads/metadata';

export const metadata = qrBeadMetadata('fr');

export default function QrCodeBeadsPage() {
    return <QrBeadPage locale="fr" />;
}
