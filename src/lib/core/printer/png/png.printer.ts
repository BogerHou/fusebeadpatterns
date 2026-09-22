import { Project } from '../../model/project/project.model';
import { SvgPrinter } from '../svg/svg.printer';
import { downloadRasterSvg } from '../raster';

export class PngPrinter extends SvgPrinter {
    name(): string {
        return 'PNG (Beta)';
    }

    async print(
        reducedColor: Uint8ClampedArray,
        usage: Map<string, number>,
        project: Project,
        filename: string
    ): Promise<void> {
        const svg = this.drawSVG(reducedColor, usage, project);
        await downloadRasterSvg(svg, 'image/png', `${filename}.png`);
    }
}
