import { Project } from '../../model/project/project.model';
import { SvgPrinter } from '../svg/svg.printer';
import { downloadRasterSvg } from '../raster';
import type { PrinterOptions } from '../messages';

export class PngPrinter extends SvgPrinter {
    name(): string {
        return 'PNG (Beta)';
    }

    async print(
        reducedColor: Uint8ClampedArray,
        usage: Map<string, number>,
        project: Project,
        filename: string,
        { locale = 'en' }: PrinterOptions = {}
    ): Promise<void> {
        const svg = this.drawSVG(reducedColor, usage, project, locale);
        await downloadRasterSvg(svg, 'image/png', `${filename}.png`, { locale });
    }
}
