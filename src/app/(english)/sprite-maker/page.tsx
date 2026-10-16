import SpritePage from '@/components/sprites/SpritePage';
import { spriteMetadata } from '@/lib/sprites/metadata';

export const metadata = spriteMetadata('en');

export default function SpriteMakerPage() {
    return <SpritePage locale="en" />;
}
