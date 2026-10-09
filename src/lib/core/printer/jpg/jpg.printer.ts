import { Project } from '../../model/project/project.model';
import { SvgPrinter } from '../svg/svg.printer';
import { downloadRasterSvg } from '../raster';
import type { PrinterOptions } from '../messages';

export class JpgPrinter extends SvgPrinter {
    name(): string {
        return 'JPEG (Beta)';
    }

    async print(
        reducedColor: Uint8ClampedArray,
        usage: Map<string, number>,
        project: Project,
        filename: string,
        { locale = 'en' }: PrinterOptions = {}
    ): Promise<void> {
        const svg = this.drawSVG(reducedColor, usage, project, locale);
        await downloadRasterSvg(svg, 'image/jpeg', `${filename}.jpeg`, { locale });
    }
}
