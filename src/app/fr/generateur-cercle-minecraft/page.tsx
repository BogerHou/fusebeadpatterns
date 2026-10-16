import BlockShapePage from '@/components/block-shapes/BlockShapePage';
import { blockShapeMetadata } from '@/lib/block-shapes/metadata';

export const metadata = blockShapeMetadata('fr');

export default function MinecraftCirclePage() {
    return <BlockShapePage locale="fr" />;
}
