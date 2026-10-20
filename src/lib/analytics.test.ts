import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildBeadLoomExportEvent, buildPatternEvent, buildPixelGridExportEvent, buildToolEvent, createToolGenerationTracker, getPatternLinkEvent, isProductionAnalyticsHost, trackBeadLoomExport, trackPatternEvent, trackPixelGridExport, trackToolEvent } from './analytics';
import { startAnalytics, stopAnalytics } from './analytics-consent';

const grantedStorage = { getItem: () => 'granted' };

const download = {
    name: 'pattern_download',
    patternId: 'sdv-blue-chicken',
    paletteId: 'perler',
    entryPoint: 'pattern_detail',
    format: 'pdf',
};

afterEach(() => { stopAnalytics(); vi.unstubAllGlobals(); });

describe('new tool measurement privacy and action semantics', () => {
    const formats = {
        bead_letters: ['png', 'pdf', 'project'], block_shapes: ['png', 'pdf', 'project', 'layer_project'],
        qr_beads: ['png', 'grid_png', 'pdf', 'project'], sprite: ['png', 'sprite_sheet_png', 'gif', 'coordinates_json', 'project'],
        minecraft_banners: ['png', 'json', 'txt', 'project'], brick_mosaic: ['png', 'csv', 'pdf', 'project'],
    } as const;

    it('accepts only existing tool and supported export combinations', () => {
        for (const [tool, allowed] of Object.entries(formats)) {
            expect(buildToolEvent({ name: 'tool_generate', tool })).toEqual({ name: 'tool_generate', parameters: { entry_point: tool } });
            for (const format of allowed) expect(buildToolEvent({ name: 'tool_export', tool, format })).toEqual({ name: 'tool_export', parameters: { entry_point: tool, file_format: format } });
            expect(buildToolEvent({ name: 'tool_generate', tool, format: 'png' })).toBeNull();
            expect(buildToolEvent({ name: 'tool_export', tool })).toBeNull();
        }
        for (const tool of ['__proto__', 'constructor', 'private-project', 'https://example.com/secret.png', '']) expect(buildToolEvent({ name: 'tool_generate', tool })).toBeNull();
        expect(buildToolEvent({ name: 'private-action', tool: 'sprite' })).toBeNull();
        expect(buildToolEvent({ name: 'tool_export', tool: 'brick_mosaic', format: 'gif' })).toBeNull();
        expect(buildToolEvent({ name: 'tool_export', tool: 'sprite', format: 'private-file.png' })).toBeNull();
    });

    it('never reads caller image, text, URL, project or analytics overrides', () => {
        const input = {
            name: 'tool_export', tool: 'qr_beads', format: 'pdf', entry_point: 'private-value',
            get text() { throw new Error('Private QR contents must not be read'); },
            get image() { throw new Error('Private image must not be read'); },
            get url() { throw new Error('Private URL must not be read'); },
            get fileName() { throw new Error('Private filename must not be read'); },
            get project() { throw new Error('Private project must not be read'); },
        };
        const gtag = vi.fn(); measuredBrowser(gtag);
        expect(trackToolEvent(input)).toBe(true);
        expect(gtag).toHaveBeenCalledExactlyOnceWith('event', 'tool_export', { entry_point: 'qr_beads', file_format: 'pdf' });
    });

    it('counts the first successful creative action once, and never replays consent-denied work', () => {
        const gtag = vi.fn(); measuredBrowser(gtag);
        const tracker = createToolGenerationTracker('sprite');
        expect(gtag).not.toHaveBeenCalled();
        expect(tracker.record()).toBe(true);
        for (let n = 0; n < 100; n++) expect(tracker.record()).toBe(false);
        expect(gtag).toHaveBeenCalledExactlyOnceWith('event', 'tool_generate', { entry_point: 'sprite' });
        tracker.reset(); expect(gtag).toHaveBeenCalledTimes(1);
        expect(tracker.record()).toBe(true); expect(gtag).toHaveBeenCalledTimes(2);

        stopAnalytics(); vi.stubGlobal('window', { localStorage: { getItem: () => 'denied' }, location: { hostname: 'fusebeadpatterns.art' }, gtag });
        const denied = createToolGenerationTracker('bead_letters');
        expect(denied.record()).toBe(false); expect(denied.recorded).toBe(true);
        measuredBrowser(gtag);
        expect(denied.record()).toBe(false); expect(gtag).not.toHaveBeenCalled();
    });

    it('requires consent, a public host and an initialized matching page context', () => {
        const gtag = vi.fn();
        for (const hostname of ['localhost', '127.0.0.1', 'preview.fusebeadpatterns.art', 'fusebeadpatterns-git-preview.vercel.app']) {
            vi.stubGlobal('window', { localStorage: grantedStorage, location: { hostname }, gtag });
            expect(trackToolEvent({ name: 'tool_export', tool: 'brick_mosaic', format: 'png' })).toBe(false);
        }
        measuredBrowser(gtag);
        (window as Window).location.pathname = '/editor';
        expect(trackToolEvent({ name: 'tool_generate', tool: 'qr_beads' })).toBe(false);
        expect(gtag).not.toHaveBeenCalled();
    });

    it('keeps analytics failure outside a completed tool operation', () => {
        const gtag = vi.fn(); measuredBrowser(gtag);
        gtag.mockImplementation(() => { throw new Error('SDK blocked'); });
        expect(() => trackToolEvent({ name: 'tool_export', tool: 'minecraft_banners', format: 'txt' })).not.toThrow();
        expect(trackToolEvent({ name: 'tool_export', tool: 'minecraft_banners', format: 'txt' })).toBe(false);
        expect(() => trackToolEvent({ get name(): string { throw new Error('input denied'); }, tool: 'sprite' })).not.toThrow();
    });
});

function measuredBrowser(gtag: ReturnType<typeof vi.fn>, hostname = 'fusebeadpatterns.art') {
    stopAnalytics();
    vi.stubGlobal('window', { localStorage: grantedStorage, location: { hostname, pathname: '/patterns' }, gtag });
    vi.stubGlobal('document', {
        querySelector: () => ({ href: `https://${hostname}/patterns` }),
        createElement: () => ({ remove() {}, dataset: {} }),
        head: { appendChild() {} },
    });
    expect(startAnalytics()).toBe(true);
    gtag.mockClear();
}

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
            vi.stubGlobal('window', { localStorage: grantedStorage, location: { hostname }, gtag });
            expect(trackPatternEvent(download)).toBe(false);
        }
        expect(gtag).not.toHaveBeenCalled();
    });

    it('only sends approved product parameters to the existing GA instance', () => {
        const gtag = vi.fn();
        measuredBrowser(gtag);
        const withPrivateExtraFields = { ...download, fileName: 'private-client.png', image: 'data:image/png;secret', project: { name: 'secret' } };
        expect(trackPatternEvent(withPrivateExtraFields)).toBe(true);
        expect(gtag).toHaveBeenCalledExactlyOnceWith('event', 'pattern_download', {
            entry_point: 'pattern_detail', primary_palette_id: 'perler', pattern_id: 'sdv-blue-chicken', file_format: 'pdf',
        });
    });

    it('quietly drops events when analytics is blocked, late, or throws', () => {
        vi.stubGlobal('window', { localStorage: grantedStorage, location: { hostname: 'fusebeadpatterns.art' } });
        expect(trackPatternEvent(download)).toBe(false);
        vi.stubGlobal('window', { localStorage: grantedStorage, location: { hostname: 'fusebeadpatterns.art' }, gtag: () => { throw new Error('Blocked'); } });
        expect(() => trackPatternEvent(download)).not.toThrow();
        expect(trackPatternEvent(download)).toBe(false);
    });
});

describe('pixel grid export analytics', () => {
    it('only accepts the four pixel formats with a fixed entry point and independent event', () => {
        for (const format of ['png', 'grid_png', 'project', 'pdf']) {
            expect(buildPixelGridExportEvent({ format })).toEqual({
                name: 'pixel_grid_export', parameters: { entry_point: 'pixel_grid', file_format: format },
            });
        }
        for (const format of ['svg', 'jpg', '', 'PNG', 'PDF', 'private.png', 'private.pdf', 'https://example.com/private.png']) {
            expect(buildPixelGridExportEvent({ format })).toBeNull();
        }
        expect(buildPatternEvent({ ...download, name: 'pixel_grid_export' })).toBeNull();
    });

    it('drops caller-supplied content, dimensions, URLs and overrides without reading them', () => {
        const input = {
            format: 'pdf', entryPoint: 'private-work', name: 'pattern_export',
            width: 31, height: 47, fileName: 'private-client.png', url: 'https://example.com/private.png',
            get image() { throw new Error('Private image must not be read'); },
            project: { name: 'private-work', pixels: [1, 2, 3, 4] },
        };
        const gtag = vi.fn();
        measuredBrowser(gtag);
        expect(trackPixelGridExport(input)).toBe(true);
        expect(gtag).toHaveBeenCalledExactlyOnceWith('event', 'pixel_grid_export', {
            entry_point: 'pixel_grid', file_format: 'pdf',
        });
    });

    it('sends once per call on either production host and rejects unknown formats', () => {
        for (const hostname of ['fusebeadpatterns.art', 'www.fusebeadpatterns.art']) {
            const gtag = vi.fn();
            measuredBrowser(gtag, hostname);
            for (const format of ['png', 'grid_png', 'project', 'pdf']) {
                expect(trackPixelGridExport({ format })).toBe(true);
            }
            expect(trackPixelGridExport({ format: 'private-file.png' })).toBe(false);
            expect(gtag.mock.calls).toEqual(['png', 'grid_png', 'project', 'pdf'].map(format => [
                'event', 'pixel_grid_export', { entry_point: 'pixel_grid', file_format: format },
            ]));
        }
    });

    it('does not send on the server, local preview or nonproduction host', () => {
        expect(trackPixelGridExport({ format: 'png' })).toBe(false);
        const gtag = vi.fn();
        for (const hostname of ['localhost', '127.0.0.1', 'fusebeadpatterns-git-preview.vercel.app', 'preview.fusebeadpatterns.art', 'fusebeadpatterns.art.example.com']) {
            vi.stubGlobal('window', { localStorage: grantedStorage, location: { hostname }, gtag });
            expect(trackPixelGridExport({ format: 'project' })).toBe(false);
        }
        expect(gtag).not.toHaveBeenCalled();
    });

    it('keeps analytics absence, exceptions and blocked access out of the export flow', () => {
        const unavailable = [
            { localStorage: grantedStorage, location: { hostname: 'fusebeadpatterns.art' } },
            { localStorage: grantedStorage, location: { hostname: 'fusebeadpatterns.art' }, gtag: () => { throw new Error('Blocked'); } },
            { localStorage: grantedStorage, location: { hostname: 'fusebeadpatterns.art' }, get gtag() { throw new Error('Denied'); } },
        ];
        for (const browser of unavailable) {
            vi.stubGlobal('window', browser);
            expect(() => trackPixelGridExport({ format: 'project' })).not.toThrow();
            expect(trackPixelGridExport({ format: 'project' })).toBe(false);
        }
    });
});

describe('bead loom export analytics', () => {
    it('only accepts PDF, PNG and project with the fixed bead loom event and entry point', () => {
        for (const format of ['pdf', 'png', 'project']) {
            expect(buildBeadLoomExportEvent({ format })).toEqual({
                name: 'bead_loom_export', parameters: { entry_point: 'bead_loom', file_format: format },
            });
        }
        for (const format of ['grid_png', 'svg', 'jpg', 'xlsx', '', 'PDF', 'private.pdf', 'https://example.com/private.png']) {
            expect(buildBeadLoomExportEvent({ format })).toBeNull();
        }
        expect(buildPatternEvent({ ...download, name: 'bead_loom_export' })).toBeNull();
    });

    it('never reads or forwards caller content, dimensions, color information or event overrides', () => {
        const input = {
            format: 'png', name: 'pattern_export', entryPoint: 'private-chart', entry_point: 'private-chart',
            fileName: 'private-client.png', url: 'https://example.com/private.png', columns: 11, rows: 31, cellAspect: 1.5,
            get title() { throw new Error('Private title must not be read'); },
            get cells() { throw new Error('Private cells must not be read'); },
            get pixels() { throw new Error('Private pixels must not be read'); },
            get image() { throw new Error('Private image must not be read'); },
            get palette() { throw new Error('Private color names and codes must not be read'); },
            project: { title: 'private-chart', name: 'private-color', code: 'private-code' },
        };
        const expected = { entry_point: 'bead_loom', file_format: 'png' };
        expect(buildBeadLoomExportEvent(input)).toEqual({ name: 'bead_loom_export', parameters: expected });
        const gtag = vi.fn();
        measuredBrowser(gtag);
        expect(trackBeadLoomExport(input)).toBe(true);
        expect(gtag).toHaveBeenCalledExactlyOnceWith('event', 'bead_loom_export', expected);
    });

    it('sends each allowed format once per call on both production hosts and drops unknown formats', () => {
        for (const hostname of ['fusebeadpatterns.art', 'www.fusebeadpatterns.art']) {
            const gtag = vi.fn();
            measuredBrowser(gtag, hostname);
            for (const format of ['pdf', 'png', 'project']) expect(trackBeadLoomExport({ format })).toBe(true);
            for (const format of ['private-file.pdf', 'grid_png', 'PDF']) expect(trackBeadLoomExport({ format })).toBe(false);
            expect(gtag.mock.calls).toEqual(['pdf', 'png', 'project'].map(format => [
                'event', 'bead_loom_export', { entry_point: 'bead_loom', file_format: format },
            ]));
        }
    });

    it('does not access analytics from the server or any nonproduction host', () => {
        expect(trackBeadLoomExport({ format: 'pdf' })).toBe(false);
        const analyticsAccess = vi.fn();
        for (const hostname of ['localhost', '127.0.0.1', 'fusebeadpatterns-git-preview.vercel.app', 'preview.fusebeadpatterns.art', 'fusebeadpatterns.art.example.com']) {
            vi.stubGlobal('window', { localStorage: grantedStorage,
                location: { hostname },
                get gtag() { analyticsAccess(); throw new Error('Analytics must not be accessed'); },
            });
            for (const format of ['pdf', 'png', 'project']) expect(trackBeadLoomExport({ format })).toBe(false);
        }
        expect(analyticsAccess).not.toHaveBeenCalled();
    });

    it('keeps absent, blocked and throwing analytics from affecting the export flow', () => {
        const unavailable = [
            { localStorage: grantedStorage, location: { hostname: 'fusebeadpatterns.art' } },
            { localStorage: grantedStorage, location: { hostname: 'fusebeadpatterns.art' }, gtag: 'not a function' },
            { localStorage: grantedStorage, location: { hostname: 'fusebeadpatterns.art' }, gtag: () => { throw new Error('Blocked'); } },
            { localStorage: grantedStorage, location: { hostname: 'fusebeadpatterns.art' }, get gtag() { throw new Error('Denied'); } },
        ];
        for (const browser of unavailable) {
            vi.stubGlobal('window', browser);
            for (const format of ['pdf', 'png', 'project']) {
                expect(() => trackBeadLoomExport({ format })).not.toThrow();
                expect(trackBeadLoomExport({ format })).toBe(false);
            }
        }
    });
});
