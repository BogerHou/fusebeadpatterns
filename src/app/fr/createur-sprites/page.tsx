import SpritePage from '@/components/sprites/SpritePage';
import { spriteMetadata } from '@/lib/sprites/metadata';

export const metadata = spriteMetadata('fr');

export default function SpriteMakerPage() {
    return <SpritePage locale="fr" />;
}
