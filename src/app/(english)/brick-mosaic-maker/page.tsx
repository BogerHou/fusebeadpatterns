import BrickMosaicPage from '@/components/brick-mosaic/BrickMosaicPage';
import { brickMetadata } from '@/lib/brick-mosaic/metadata';

export const metadata = brickMetadata('en');
export default function Page() { return <BrickMosaicPage locale="en" />; }
