import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import japaneseLibrary from '../patterns/japanese.json';
import { decodeEditorPatternDraft, parseEditorProject } from '../editor/draft';
import { getPaletteOption, parsePaletteCsv } from '../editor/config';
import { computeUsage } from '../core/utils/utils';
import { JapaneseRequestGate, remapJapanesePattern, serializeJapaneseProject } from './generator';
import { getJapaneseLibraryProject, loadJapaneseLibraryProject, selectJapaneseLibraryProject } from './library-projects';

const selected = japaneseLibrary.groups.flatMap(group => group.patterns);
const readPublic = (url: string) => readFileSync(path.join(process.cwd(), 'public', url), 'utf8');
const projectRaw = (id: string) => readPublic(getJapaneseLibraryProject(id)!.projectUrl);
function serveLocalFiles() {
    const fetcher = vi.fn(async (url: string) => new Response(readPublic(url), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    return fetcher;
}
afterEach(() => vi.unstubAllGlobals());

describe('Japanese library to editor', () => {
    it('accepts exactly the 12 visible Japanese IDs and never treats query values as URLs', async () => {
        expect(selected).toHaveLength(12);
        expect(new Set(selected.map(pattern => pattern.id)).size).toBe(12);
        for (const pattern of selected) {
            expect(selectJapaneseLibraryProject([pattern.id])).toEqual({ kind: 'project', project: getJapaneseLibraryProject(pattern.id) });
            expect(getJapaneseLibraryProject(pattern.id)!.name).toBe(pattern.name);
        }
        expect(selectJapaneseLibraryProject([])).toEqual({ kind: 'none' });
        const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
        for (const value of ['', 'constructor', '../pokemon-pikachu-gen5', 'pokemon-gengar-gen5', 'original-friendly-ghost', 'https://example.com/pattern.json', '//example.com/pattern.json', '/patterns/pokemon-pikachu-gen5/pattern.bead-pattern.json']) {
            expect(selectJapaneseLibraryProject([value])).toEqual({ kind: 'invalid' });
            await expect(loadJapaneseLibraryProject(value)).rejects.toThrow('図案リンクは開けません');
        }
        expect(selectJapaneseLibraryProject(['pokemon-pikachu-gen5', 'smb-small-mario'])).toEqual({ kind: 'invalid' });
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('restores all actual library drafts byte-for-byte instead of re-quantizing their preview images', async () => {
        const fetcher = serveLocalFiles();
        for (const { id } of selected) {
            const draft = parseEditorProject(projectRaw(id))!;
            const pattern = await loadJapaneseLibraryProject(id);
            expect(pattern.pixels).toEqual(decodeEditorPatternDraft(draft.editedPattern));
            expect([pattern.width, pattern.height, pattern.boardWidth, pattern.boardHeight]).toEqual([29, 29, 1, 1]);
            expect(pattern.imageSrc).toBe(draft.imageSrc);
            expect(pattern.fileName).toBe(draft.fileName);
            expect(pattern.usage).toEqual(computeUsage(pattern.pixels, [pattern.palette]));
            const saved = parseEditorProject(serializeJapaneseProject(pattern))!;
            expect(decodeEditorPatternDraft(saved.editedPattern)).toEqual(pattern.pixels);
        }
        const urls = fetcher.mock.calls.map(([url]) => url);
        expect(urls.every(url => url.endsWith('/pattern.bead-pattern.json') || url.startsWith('/palettes/'))).toBe(true);
        expect(urls).toHaveLength(24);
    });

    it('keeps the loaded Pikachu mask and a manual erasure when changing to Hama', async () => {
        serveLocalFiles();
        const original = await loadJapaneseLibraryProject('pokemon-pikachu-gen5');
        const occupied = Array.from({ length: 841 }, (_, index) => index * 4).find(offset => original.pixels[offset + 3] === 255)!;
        original.pixels.fill(0, occupied, occupied + 4);
        original.usage = computeUsage(original.pixels, [original.palette]);
        const before = new Uint8ClampedArray(original.pixels);
        const option = getPaletteOption('hama')!;
        const palette = parsePaletteCsv(readPublic(`/palettes/${option.file}`), option);
        const remapped = await remapJapanesePattern(original, 'hama', palette);
        for (let offset = 3; offset < before.length; offset += 4) expect(remapped.pixels[offset]).toBe(before[offset]);
        expect(remapped.pixels.slice(occupied, occupied + 4)).toEqual(new Uint8ClampedArray(4));
        expect(original.pixels).toEqual(before);
        expect(remapped.imageSrc).toBe(original.imageSrc);
        expect([remapped.width, remapped.height]).toEqual([29, 29]);
    });

    it('rejects failed, redirected and malformed project responses before requesting a palette', async () => {
        const redirected = new Response(projectRaw('smb-small-mario'));
        Object.defineProperty(redirected, 'redirected', { value: true });
        for (const response of [
            new Response('Missing', { status: 404 }),
            new Response('<html>Error page</html>', { status: 200 }),
            new Response('{}', { status: 200 }),
            redirected,
        ]) {
            const fetcher = vi.fn<typeof fetch>(async () => response); vi.stubGlobal('fetch', fetcher);
            await expect(loadJapaneseLibraryProject('smb-small-mario')).rejects.toThrow('現在の図案は残っています');
            expect(fetcher).toHaveBeenCalledTimes(1);
            expect(fetcher.mock.calls[0][0]).toBe('/patterns/smb-small-mario/pattern.bead-pattern.json');
        }
    });

    it('does not return an old selection when a newer request supersedes it, even if fetch ignores abort', async () => {
        const gate = new JapaneseRequestGate();
        let resolveOld!: (response: Response) => void;
        const oldResponse = new Promise<Response>(resolve => { resolveOld = resolve; });
        vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes('pokemon-pikachu-gen5') ? oldResponse : new Response(readPublic(url))));
        const first = gate.begin();
        const pending = loadJapaneseLibraryProject('pokemon-pikachu-gen5', first.signal);
        const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        const latest = gate.begin();
        const next = await loadJapaneseLibraryProject('smb-small-mario', latest.signal);
        resolveOld(new Response(projectRaw('pokemon-pikachu-gen5')));
        await rejected;
        expect(gate.isCurrent(first)).toBe(false);
        expect(gate.isCurrent(latest)).toBe(true);
        expect(next.pixels).toEqual(decodeEditorPatternDraft(parseEditorProject(projectRaw('smb-small-mario'))!.editedPattern));
    });
});
