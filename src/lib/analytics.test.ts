import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildPatternEvent, buildPixelGridExportEvent, getPatternLinkEvent, isProductionAnalyticsHost, trackPatternEvent, trackPixelGridExport } from './analytics';

const download = {
    name: 'pattern_download',
    patternId: 'sdv-blue-chicken',
    paletteId: 'perler',
    entryPoint: 'pattern_detail',
    format: 'pdf',
};

afterEach(() => vi.unstubAllGlobals());

describe('pattern analytics', () => {
    it('only permits the public production hosts', () => {
        expect(isProductionAnalyticsHost('fusebeadpatterns.art')).toBe(true);
        expect(isProductionAnalyticsHost('www.fusebeadpatterns.art')).toBe(true);
        for (const hostname of ['localhost', '127.0.0.1', 'fusebeadpatterns.vercel.app', 'preview.fusebeadpatterns.art', 'fusebeadpatterns.art.example.com']) {
            expect(isProductionAnalyticsHost(hostname)).toBe(false);
        }
    });

    it('routes explicitly marked links and drops text or unknown identifiers', () => {
        expect(getPatternLinkEvent({
            patternEvent: 'pattern_download', patternId: 'sdv-blue-chicken',
            patternPalette: 'perler', patternEntry: 'pattern_detail', patternFormat: 'pdf',
            fileName: 'private-client-work.pdf', textContent: 'Private photo',
        })).toEqual(download);
        expect(getPatternLinkEvent({ patternEvent: 'file_download' })).toBeNull();
        expect(getPatternLinkEvent({
            patternEvent: 'pattern_download', patternId: 'private-client-work',
            patternPalette: 'perler', patternEntry: 'pattern_detail', patternFormat: 'pdf',
        })).toBeNull();
    });

    it('does not add a format to editor entry events', () => {
        expect(buildPatternEvent({ ...download, name: 'pattern_editor_open' })).toEqual({
            name: 'pattern_editor_open',
            parameters: { entry_point: 'pattern_detail', primary_palette_id: 'perler', pattern_id: 'sdv-blue-chicken' },
        });
    });

    it('permits exports without a library identity and records the target palette', () => {
        expect(buildPatternEvent({ name: 'pattern_export', paletteId: 'artkal_c', format: 'grid_png', entryPoint: 'editor' })).toEqual({
            name: 'pattern_export',
            parameters: { entry_point: 'editor', primary_palette_id: 'artkal_c', file_format: 'grid_png' },
        });
        expect(buildPatternEvent({ ...download, patternId: undefined })).toBeNull();
        expect(buildPatternEvent({ ...download, paletteId: 'private custom palette' })).toBeNull();
        expect(buildPatternEvent({ ...download, entryPoint: 'private-project-name' })).toBeNull();
        expect(buildPatternEvent({ ...download, format: 'private-project-name' })).toBeNull();
    });

    it('does not send from a server, localhost, or preview build even with gtag present', () => {
        expect(trackPatternEvent(download)).toBe(false);
        const gtag = vi.fn();
        for (const hostname of ['localhost', '127.0.0.1', 'fusebeadpatterns-git-preview.vercel.app']) {
            vi.stubGlobal('window', { location: { hostname }, gtag });
            expect(trackPatternEvent(download)).toBe(false);
        }
        expect(gtag).not.toHaveBeenCalled();
    });

    it('only sends approved product parameters to the existing GA instance', () => {
        const gtag = vi.fn();
        vi.stubGlobal('window', { location: { hostname: 'fusebeadpatterns.art' }, gtag });
        const withPrivateExtraFields = { ...download, fileName: 'private-client.png', image: 'data:image/png;secret', project: { name: 'secret' } };
        expect(trackPatternEvent(withPrivateExtraFields)).toBe(true);
        expect(gtag).toHaveBeenCalledExactlyOnceWith('event', 'pattern_download', {
            entry_point: 'pattern_detail', primary_palette_id: 'perler', pattern_id: 'sdv-blue-chicken', file_format: 'pdf',
        });
    });

    it('quietly drops events when analytics is blocked, late, or throws', () => {
        vi.stubGlobal('window', { location: { hostname: 'fusebeadpatterns.art' } });
        expect(trackPatternEvent(download)).toBe(false);
        vi.stubGlobal('window', { location: { hostname: 'fusebeadpatterns.art' }, gtag: () => { throw new Error('Blocked'); } });
        expect(() => trackPatternEvent(download)).not.toThrow();
        expect(trackPatternEvent(download)).toBe(false);
    });
});

describe('pixel grid export analytics', () => {
    it('only accepts the three pixel formats with a fixed entry point and independent event', () => {
        for (const format of ['png', 'grid_png', 'project']) {
            expect(buildPixelGridExportEvent({ format })).toEqual({
                name: 'pixel_grid_export', parameters: { entry_point: 'pixel_grid', file_format: format },
            });
        }
        for (const format of ['pdf', 'svg', 'jpg', '', 'PNG', 'private.png', 'https://example.com/private.png']) {
            expect(buildPixelGridExportEvent({ format })).toBeNull();
        }
        expect(buildPatternEvent({ ...download, name: 'pixel_grid_export' })).toBeNull();
    });

    it('drops caller-supplied content, dimensions, URLs and overrides without reading them', () => {
        const input = {
            format: 'png', entryPoint: 'private-work', name: 'pattern_export',
            width: 31, height: 47, fileName: 'private-client.png', url: 'https://example.com/private.png',
            get image() { throw new Error('Private image must not be read'); },
            project: { name: 'private-work', pixels: [1, 2, 3, 4] },
        };
        const gtag = vi.fn();
        vi.stubGlobal('window', { location: { hostname: 'fusebeadpatterns.art' }, gtag });
        expect(trackPixelGridExport(input)).toBe(true);
        expect(gtag).toHaveBeenCalledExactlyOnceWith('event', 'pixel_grid_export', {
            entry_point: 'pixel_grid', file_format: 'png',
        });
    });

    it('sends once per call on either production host and rejects unknown formats', () => {
        for (const hostname of ['fusebeadpatterns.art', 'www.fusebeadpatterns.art']) {
            const gtag = vi.fn();
            vi.stubGlobal('window', { location: { hostname }, gtag });
            for (const format of ['png', 'grid_png', 'project']) {
                expect(trackPixelGridExport({ format })).toBe(true);
            }
            expect(trackPixelGridExport({ format: 'private-file.png' })).toBe(false);
            expect(gtag.mock.calls).toEqual(['png', 'grid_png', 'project'].map(format => [
                'event', 'pixel_grid_export', { entry_point: 'pixel_grid', file_format: format },
            ]));
        }
    });

    it('does not send on the server, local preview or nonproduction host', () => {
        expect(trackPixelGridExport({ format: 'png' })).toBe(false);
        const gtag = vi.fn();
        for (const hostname of ['localhost', '127.0.0.1', 'fusebeadpatterns-git-preview.vercel.app', 'preview.fusebeadpatterns.art', 'fusebeadpatterns.art.example.com']) {
            vi.stubGlobal('window', { location: { hostname }, gtag });
            expect(trackPixelGridExport({ format: 'project' })).toBe(false);
        }
        expect(gtag).not.toHaveBeenCalled();
    });

    it('keeps analytics absence, exceptions and blocked access out of the export flow', () => {
        const unavailable = [
            { location: { hostname: 'fusebeadpatterns.art' } },
            { location: { hostname: 'fusebeadpatterns.art' }, gtag: () => { throw new Error('Blocked'); } },
            { location: { hostname: 'fusebeadpatterns.art' }, get gtag() { throw new Error('Denied'); } },
        ];
        for (const browser of unavailable) {
            vi.stubGlobal('window', browser);
            expect(() => trackPixelGridExport({ format: 'project' })).not.toThrow();
            expect(trackPixelGridExport({ format: 'project' })).toBe(false);
        }
    });
});
