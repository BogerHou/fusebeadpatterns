import { describe, expect, it, vi } from 'vitest';
import { importCapturedSource, SourceImportError, sourceImportErrorMessage } from './source-import';

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
}

function setup() {
    return {
        permissionGranted: false,
        requestPermission: vi.fn().mockResolvedValue(true),
        readSource: vi.fn().mockResolvedValue({ ok: true, dataUrl: 'data:image/png;base64,test' }),
        openImage: vi.fn().mockResolvedValue(true),
        makePattern: vi.fn().mockResolvedValue(undefined),
        isCurrent: vi.fn().mockReturnValue(true),
        onPermissionGranted: vi.fn(),
        onLoading: vi.fn(),
    };
}

describe('captured image import', () => {
    it('requests a new host grant in the click call stack, then loads and converts without another click', async () => {
        const steps = setup();
        const run = importCapturedSource(steps);
        expect(steps.requestPermission).toHaveBeenCalledOnce();
        expect(steps.readSource).not.toHaveBeenCalled();
        expect(await run).toBe('finished');
        expect(steps.openImage).toHaveBeenCalledWith('data:image/png;base64,test');
        expect(steps.makePattern).toHaveBeenCalledOnce();
    });

    it('automatically reads an already granted host without asking for permission again', async () => {
        const steps = setup(); steps.permissionGranted = true;
        await importCapturedSource(steps);
        expect(steps.requestPermission).not.toHaveBeenCalled();
        expect(steps.readSource).toHaveBeenCalledOnce();
        expect(steps.makePattern).toHaveBeenCalledOnce();
    });

    it('does not read an image after permission is declined', async () => {
        const steps = setup(); steps.requestPermission.mockResolvedValue(false);
        await expect(importCapturedSource(steps)).rejects.toMatchObject({ code: 'permission_denied' });
        expect(steps.readSource).not.toHaveBeenCalled();
        expect(steps.onPermissionGranted).not.toHaveBeenCalled();
        expect(steps.makePattern).not.toHaveBeenCalled();
    });

    it('does not read after the user changes their image or settings while the permission prompt is open', async () => {
        const grant = deferred<boolean>(), steps = setup();
        steps.requestPermission.mockReturnValue(grant.promise);
        const run = importCapturedSource(steps);
        steps.isCurrent.mockReturnValue(false); grant.resolve(true);
        expect(await run).toBe('cancelled');
        expect(steps.readSource).not.toHaveBeenCalled();
    });

    it('does not replace a newer image with a late network response', async () => {
        const response = deferred<{ ok: boolean; dataUrl: string }>(), steps = setup();
        steps.permissionGranted = true;
        steps.readSource.mockReturnValue(response.promise);
        const run = importCapturedSource(steps);
        steps.isCurrent.mockReturnValue(false);
        response.resolve({ ok: true, dataUrl: 'data:image/png;base64,old' });
        expect(await run).toBe('cancelled');
        expect(steps.openImage).not.toHaveBeenCalled();
        expect(steps.makePattern).not.toHaveBeenCalled();
    });

    it('does not auto-convert after the user changes settings while the image is decoding', async () => {
        const image = deferred<boolean>(), steps = setup();
        steps.permissionGranted = true;
        steps.openImage.mockReturnValue(image.promise);
        const run = importCapturedSource(steps);
        await vi.waitFor(() => expect(steps.openImage).toHaveBeenCalledOnce());
        steps.isCurrent.mockReturnValue(false); image.resolve(true);
        expect(await run).toBe('cancelled');
        expect(steps.makePattern).not.toHaveBeenCalled();
    });

    it('preserves the background failure reason and never converts a failed image', async () => {
        const steps = setup();
        steps.readSource.mockResolvedValue({ ok: false, error: 'fetch_timeout' });
        await expect(importCapturedSource(steps)).rejects.toMatchObject({ code: 'fetch_timeout' });
        expect(steps.openImage).not.toHaveBeenCalled();
        expect(steps.makePattern).not.toHaveBeenCalled();
    });

    it('remembers successful permission before a failed download so retry does not ask again', async () => {
        const steps = setup();
        steps.onPermissionGranted.mockImplementation(() => { steps.permissionGranted = true; });
        steps.readSource.mockResolvedValueOnce({ ok: false, error: 'fetch_timeout' });
        await expect(importCapturedSource(steps)).rejects.toMatchObject({ code: 'fetch_timeout' });
        expect(steps.permissionGranted).toBe(true);
        expect(steps.onPermissionGranted).toHaveBeenCalledOnce();
        expect(steps.openImage).not.toHaveBeenCalled();
        expect(await importCapturedSource(steps)).toBe('finished');
        expect(steps.requestPermission).toHaveBeenCalledOnce();
        expect(steps.readSource).toHaveBeenCalledTimes(2);
        expect(steps.makePattern).toHaveBeenCalledOnce();
    });

    it('does not auto-convert an image rejected by the decoder', async () => {
        const steps = setup(); steps.openImage.mockResolvedValue(false);
        expect(await importCapturedSource(steps)).toBe('cancelled');
        expect(steps.makePattern).not.toHaveBeenCalled();
    });

    it('gives a distinct next step for each supported failure', () => {
        const codes = ['permission_required', 'permission_denied', 'source_expired', 'unsupported_source',
            'fetch_timeout', 'fetch_failed', 'unsupported_image', 'image_too_large'];
        const messages = codes.map(code => sourceImportErrorMessage(new SourceImportError(code)));
        expect(new Set(messages).size).toBe(codes.length);
        expect(sourceImportErrorMessage(new SourceImportError('source_expired'))).toContain('Right-click');
        expect(sourceImportErrorMessage(new SourceImportError('image_too_large'))).toContain('8 MiB');
    });
});
