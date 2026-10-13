import ColorChartPage from '@/components/color-chart/ColorChartPage';
import { perlerColorChartMetadata } from '@/lib/color-chart/metadata';

export const metadata = perlerColorChartMetadata('de');

export default function PerlerColorChartPage() {
    return <ColorChartPage locale="de" />;
}
