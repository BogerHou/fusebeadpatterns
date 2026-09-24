import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildPatternEvent, getPatternLinkEvent, isProductionAnalyticsHost, trackPatternEvent } from './analytics';

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
