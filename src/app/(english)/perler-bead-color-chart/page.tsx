import ColorChartPage from '@/components/color-chart/ColorChartPage';
import { perlerColorChartMetadata } from '@/lib/color-chart/metadata';

export const metadata = perlerColorChartMetadata('en');

export default function PerlerColorChartPage() {
    return <ColorChartPage locale="en" />;
}
