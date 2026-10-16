import BannerPage from '@/components/minecraft-banners/BannerPage';
import { getBannerMetadata } from '@/lib/minecraft-banners/metadata';

export const metadata = getBannerMetadata('letters', 'fr');

export default function BannerToolPage() {
    return <BannerPage mode="letters" locale="fr" />;
}
