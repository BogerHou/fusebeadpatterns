import { Project } from '../../model/project/project.model';
import { SvgPrinter } from '../svg/svg.printer';

export class JpgPrinter extends SvgPrinter {
    name(): string {
        return 'JPEG (Beta)';
    }

    print(
        reducedColor: Uint8ClampedArray,
        usage: Map<string, number>,
        project: Project,
        filename: string
    ) {
        const svg = this.drawSVG(reducedColor, usage, project);
        const canvas = document.createElement('canvas');
        canvas.width = Number(svg.getAttribute('width') ?? 0);
        canvas.height = Number(svg.getAttribute('height') ?? 0);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Canvas 2D context is unavailable.');
        }

        const data = new XMLSerializer().serializeToString(svg);
        const domUrl = window.URL;
        const img = new Image();
        const url = domUrl.createObjectURL(
            new Blob([data], { type: 'image/svg+xml' })
        );

        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            domUrl.revokeObjectURL(url);

            const a = document.createElement('a');
            a.href = canvas
                .toDataURL('image/jpeg')
                .replace('image/jpeg', 'octet/stream');
            a.setAttribute('download', `${filename}.jpeg`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        img.src = url;
    }
}
