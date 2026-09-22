import { downloadBlob } from './download';

type RasterMimeType = 'image/png' | 'image/jpeg';

export async function downloadRasterSvg(
    svg: SVGElement,
    mimeType: RasterMimeType,
    filename: string
): Promise<void> {
    const canvas = document.createElement('canvas');
    canvas.width = Number(svg.getAttribute('width') ?? 0);
    canvas.height = Number(svg.getAttribute('height') ?? 0);
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Canvas 2D context is unavailable.');
    }
    if (canvas.width <= 0 || canvas.height <= 0) {
        throw new Error('The exported image must have a positive size.');
    }

    const data = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    const url = URL.createObjectURL(
        new Blob([data], { type: 'image/svg+xml' })
    );
    const blob = await new Promise<Blob>((resolve, reject) => {
        let settled = false;
        const timeout = setTimeout(() => {
            fail(new Error('Image export timed out. Try a smaller pattern.'));
        }, 60_000);

        function cleanup(): boolean {
            if (settled) {
                return false;
            }
            settled = true;
            clearTimeout(timeout);
            image.onload = null;
            image.onerror = null;
            URL.revokeObjectURL(url);
            return true;
        }

        function fail(error: unknown): void {
            if (cleanup()) {
                reject(error);
            }
        }

        image.onload = () => {
            try {
                context.drawImage(image, 0, 0);
                canvas.toBlob((result) => {
                    if (!result) {
                        fail(new Error('The image could not be encoded. Try a smaller pattern.'));
                    } else if (cleanup()) {
                        resolve(result);
                    }
                }, mimeType);
            } catch (error) {
                fail(error);
            }
        };
        image.onerror = () => {
            fail(new Error('The pattern image could not be loaded for export.'));
        };

        try {
            image.src = url;
        } catch (error) {
            fail(error);
        }
    });

    downloadBlob(blob, filename);
}
