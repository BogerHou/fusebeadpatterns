import BannerPage from '@/components/minecraft-banners/BannerPage';
import { getBannerMetadata } from '@/lib/minecraft-banners/metadata';

export const metadata = getBannerMetadata('designer', 'fr');

export default function BannerToolPage() {
    return <BannerPage mode="designer" locale="fr" />;
}
