export type SourceImportResponse = { ok: boolean; dataUrl?: string; error?: string };

export class SourceImportError extends Error {
    constructor(readonly code: string) {
        super(code);
        this.name = 'SourceImportError';
    }
}

export function sourceImportErrorMessage(error: unknown): string {
    const code = error instanceof SourceImportError ? error.code : '';
    switch (code) {
        case 'permission_required':
            return 'Allow access to this image’s host to make your pattern. You can also choose a local image.';
        case 'permission_denied':
            return 'Image-host access was not granted. Click the permission button to try again, or choose a local image.';
        case 'source_expired':
            return 'This image link has expired. Right-click the image again to start a new pattern.';
        case 'unsupported_source':
            return 'This image address cannot be read directly. Save the image, then choose that local file here.';
        case 'fetch_timeout':
            return 'The image host took too long to respond. Try again, or save the image and choose the local file.';
        case 'fetch_failed':
            return 'The image host could not provide this image. It may require a login or block direct downloads. Try again, or save the image and choose the local file.';
        case 'unsupported_image':
            return 'This image format is not supported. Choose a still PNG, JPEG or WebP image.';
        case 'image_too_large':
            return 'This image exceeds the 8 MiB limit. Save a smaller PNG, JPEG or WebP image, then choose it here.';
        default:
            return 'Could not load this image. Try again, or save the image and choose the local file.';
    }
}

type SourceImportOptions = {
    permissionGranted: boolean;
    requestPermission(): Promise<boolean>;
    readSource(): Promise<SourceImportResponse>;
    openImage(dataUrl: string): Promise<boolean>;
    makePattern(): Promise<void>;
    isCurrent(): boolean;
    onLoading?(): void;
};

/** Permission requests begin synchronously inside the user's click handler.
 * Every awaited step checks ownership before changing the next stage. */
export async function importCapturedSource(options: SourceImportOptions): Promise<'finished' | 'cancelled'> {
    if (!options.isCurrent()) return 'cancelled';
    if (!options.permissionGranted) {
        const granted = await options.requestPermission();
        if (!options.isCurrent()) return 'cancelled';
        if (!granted) throw new SourceImportError('permission_denied');
    }
    options.onLoading?.();
    const response = await options.readSource();
    if (!options.isCurrent()) return 'cancelled';
    if (!response.ok || !response.dataUrl) throw new SourceImportError(response.error || 'fetch_failed');
    const opened = await options.openImage(response.dataUrl);
    if (!opened || !options.isCurrent()) return 'cancelled';
    await options.makePattern();
    return options.isCurrent() ? 'finished' : 'cancelled';
}
