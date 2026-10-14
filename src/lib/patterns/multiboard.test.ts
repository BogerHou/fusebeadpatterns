import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { patterns, getPatternById } from './catalog';
import { getLibraryProject } from './project-links';
import { getLocaleDestination } from '../i18n/routes';
import { loadLibraryEditorProject } from '../editor/library-project';
import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject } from '../editor/draft';
import { getLocalizedSubjectName, getLocalizedPatternIntro, localizePatternNote } from './localized-content';
import { getLocalizedPatternPdf, getLocalizedPatternLetterPdf, getLocalizedPatternGrid } from './localized-download';
import { isMultiboardPattern } from './multiboard';

const id = 'original-sunset-mountain-lake';
const locales = ['en', 'de', 'fr', 'ja'] as const;
const file = (href: string) => readFileSync(`public${href}`);
const sha = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
// Root reviewed the source rows and the transparent 58 × 58 image independently.
// Public fixtures keep this lock usable in CI without private packs or review notes.
const reviewedRowsSha = '8a86c6150760e276ca231a90f6d1312cdd4a7c2c67773dab35edc189490c3f60';
const reviewedRgbaSha = 'b584e0a93314eb2af32a18aac6c64ae3a0323b2d9843fbc0349c5d4190ee5c56';

describe('reviewed original four-board landscape', () => {
    it('preserves every complete preexisting catalog object and grants the geometry exception to this exact ID only', () => {
        const previous = patterns.filter(pattern => pattern.id !== id && pattern.id !== 'original-strawberry');
        expect(previous).toHaveLength(117);
        // Complete objects from deployed 9928ce0, including URLs, downloads and timestamps.
        expect(sha(JSON.stringify(previous))).toBe('79b62398b84f4ff3e5c0be0cb7fae32b2e6fc6f9ccf4af1543ce8884629cfad5');
        expect(patterns.filter(pattern => isMultiboardPattern(pattern.id)).map(pattern => pattern.id)).toEqual([id]);
        for (const unknown of ['original-sunset-mountain-lake-v2', 'unreviewed-large', 'original-rave-alien-head']) {
            expect(isMultiboardPattern(unknown)).toBe(false);
        }
    });

    it('keeps the reviewed 58 × 58 pixels and restores all four occupied boards without duplication or gaps', async () => {
        const pattern = getPatternById(id)!;
        expect([pattern.slug, pattern.beads, pattern.colorCount]).toEqual(['sunset-mountain-lake', 2496, 8]);
        expect([pattern.motifWidth, pattern.motifHeight]).toEqual([52, 48]);
        expect(pattern.source).toBeNull();
        expect(pattern.collectionId).toBeNull();
        const pixels = await sharp(`public${pattern.assets.pixels}`).ensureAlpha().raw().toBuffer();
        expect(pixels).toHaveLength(58 * 58 * 4);
        expect(sha(pixels)).toBe(reviewedRgbaSha);
        const draft = parseEditorProject(file(pattern.assets.project).toString())!;
        expect([draft.boardId, draft.boardWidth, draft.boardHeight]).toEqual(['midi', 2, 2]);
        expect([draft.editedPattern!.width, draft.editedPattern!.height]).toEqual([58, 58]);
        expect(draft.pdfScaleMode).toBe('midi-5mm');
        expect(Buffer.from(decodeEditorPatternDraft(draft.editedPattern)!)).toEqual(pixels);
        expect(parseEditorProject(serializeEditorProject(draft))).toEqual(draft);
        const palette = new Map(pattern.palette.map(color => [color.hex.slice(1), color.symbol]));
        const rows: string[] = [];
        for (let y = 0; y < 58; y++) {
            let row = '';
            for (let x = 0; x < 58; x++) {
                const cell = pixels.subarray((y * 58 + x) * 4, (y * 58 + x + 1) * 4);
                expect([0, 255]).toContain(cell[3]);
                if (!cell[3]) { expect([...cell]).toEqual([0, 0, 0, 0]); row += '.'; }
                else { expect(palette.has(cell.subarray(0, 3).toString('hex'))).toBe(true); row += palette.get(cell.subarray(0, 3).toString('hex')); }
            }
            rows.push(row);
        }
        expect(sha(rows.join('\n'))).toBe(reviewedRowsSha);
        // Explicit global origins, independent of the PDF builder's board list.
        const restored = Buffer.alloc(pixels.length);
        const coverage = new Uint8Array(58 * 58);
        const boardCounts: number[] = [];
        for (const [originX, originY] of [[0, 0], [29, 0], [0, 29], [29, 29]]) {
            let beads = 0;
            for (let row = 0; row < 29; row++) for (let column = 0; column < 29; column++) {
                const global = (originY + row) * 58 + originX + column;
                expect(coverage[global]).toBe(0);
                coverage[global]++;
                pixels.copy(restored, global * 4, global * 4, global * 4 + 4);
                if (pixels[global * 4 + 3]) beads++;
            }
            boardCounts.push(beads);
        }
        expect(boardCounts).toEqual([624, 624, 624, 624]);
        expect([...coverage].every(count => count === 1)).toBe(true);
        expect(restored).toEqual(pixels);
        // Both seams cut through occupied artwork; this is an actual four-board design.
        expect(rows.some(row => row[28] !== '.' && row[29] !== '.')).toBe(true);
        expect([...rows[28]].some((symbol, column) => symbol !== '.' && rows[29][column] !== '.')).toBe(true);
    });

    it.each(locales)('%s has a complete 58-cell native chart with outline labels and unchanged cell colors', async locale => {
        const pattern = getPatternById(id)!;
        const href = locale === 'en' ? pattern.assets.grid : getLocalizedPatternGrid(pattern, locale).href;
        const svg = file(href.replace('.png', '.svg')).toString();
        expect(svg).toContain(`xml:lang="${locale}"`);
        expect(svg).not.toMatch(/<(?:text|image|script|foreignObject)\b/);
        expect(svg).toContain('<path');
        const { data, info } = await sharp(`public${href}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        expect([info.width, info.height, info.channels]).toEqual([1484, 2003, 4]);
        const pixels = decodeEditorPatternDraft(parseEditorProject(file(pattern.assets.project).toString())!.editedPattern)!;
        const cells = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="24" height="24" fill="(#[a-f0-9]{6})"\/>/g)];
        expect(cells).toHaveLength(2496);
        const positions = new Map(cells.map(match => [`${(Number(match[1]) - 46) / 24},${(Number(match[2]) - 54) / 24}`, match[3]]));
        expect(positions.size).toBe(2496);
        for (let y = 0; y < 58; y++) for (let x = 0; x < 58; x++) {
            const source = pixels.subarray((y * 58 + x) * 4, (y * 58 + x + 1) * 4);
            const expected = source[3] ? [...source] : [255, 255, 255, 255];
            expect(positions.get(`${x},${y}`)).toBe(source[3] ? `#${Buffer.from(source.subarray(0, 3)).toString('hex')}` : undefined);
            const offset = ((54 + y * 24 + 4) * info.width + 46 + x * 24 + 4) * 4;
            expect([...data.subarray(offset, offset + 4)], `${locale} global row ${y + 1}, column ${x + 1}`).toEqual(expected);
        }
    });

    it.each(locales)('%s keeps five pages in both calibrated papers and round-trips the actual four-board editor project', async locale => {
        const pattern = getPatternById(id)!;
        const downloads = locale === 'en' ? [pattern.assets.pdf, pattern.assets.pdfLetter!] : [getLocalizedPatternPdf(pattern, locale).href, getLocalizedPatternLetterPdf(pattern, locale)!.href];
        for (const [index, href] of downloads.entries()) {
            const raw = file(href).toString('latin1');
            expect(raw.startsWith('%PDF-')).toBe(true);
            expect(raw.match(/\/Type\s*\/Page\b/g)).toHaveLength(5);
            expect(raw).toContain(`/Lang (${locale}-${{ en: 'US', de: 'DE', fr: 'FR', ja: 'JP' }[locale]})`);
            expect(raw).toContain('/PrintScaling /None');
            expect(raw).toContain(`${locale === 'en' ? '' : `/${locale}`}/patterns/sunset-mountain-lake`);
            if (index === 1) expect(raw).toMatch(/\/MediaBox\s*\[\s*0\s+0\s+612\s+792\s*\]/);
        }
        const contents = file(pattern.assets.project).toString();
        const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response(contents));
        const restored = await loadLibraryEditorProject(id, new AbortController().signal, fetchProject);
        expect(fetchProject).toHaveBeenCalledWith(pattern.assets.project, expect.objectContaining({ credentials: 'omit', redirect: 'error' }));
        expect([restored.boardId, restored.boardWidth, restored.boardHeight]).toEqual(['midi', 2, 2]);
        expect(restored.selectedPaletteIds).toEqual(['perler']);
        expect(sha(Buffer.from(decodeEditorPatternDraft(restored.editedPattern)!))).toBe(reviewedRgbaSha);
        expect(parseEditorProject(serializeEditorProject(restored))).toEqual(restored);
        expect(getLibraryProject(id, locale)?.projectUrl).toBe(pattern.assets.project);
        expect(getLocaleDestination('/patterns/sunset-mountain-lake', locale)).toEqual({ href: `${locale === 'en' ? '' : `/${locale}`}/patterns/sunset-mountain-lake`, isFallback: false });
    });

    it('preserves all five native instructions including four-board dimensions, print calibration and untested physical joins', () => {
        const pattern = getPatternById(id)!;
        expect(pattern.notes).toHaveLength(5);
        const translated = {
            de: [
                'Verwende vier Midi-Steckplatten mit je 29 × 29 Feldern in einer 2 × 2-Anordnung. Das gesamte Raster hat 58 Spalten und 58 Zeilen.',
                'Die Landschaft wurde als 52 × 48-Motiv gezeichnet und nicht aus einer Ein-Platten-Vorlage vergrößert.',
                'Die erste PDF-Seite zeigt eine verkleinerte Übersicht; Seiten 2–5 zeigen die Platten 1–4 mit 5 mm Rasterabstand. Drucke mit 100 % / tatsächlicher Größe und prüfe beide 50-mm-Messlinien.',
                'Leere Rasterfelder bleiben ohne Perle. Das PNG dient zum Zählen, nicht zum Auflegen in tatsächlicher Größe.',
                'Bau, Bügeln und Festigkeit der Verbindungen zwischen den Platten wurden nicht praktisch getestet. Die Perler-Farben am Bildschirm sind Näherungen.',
            ],
            fr: [
                'Utilisez quatre plaques Midi de 29 × 29 cases, disposées en 2 × 2. La grille complète compte 58 colonnes et 58 lignes.',
                'Ce paysage a été dessiné en 52 × 48 cases, sans agrandir un modèle prévu pour une seule plaque.',
                'La première page du PDF est une vue réduite ; les pages 2–5 montrent les plaques 1–4 avec un espacement de 5 mm. Imprimez à 100 % / taille réelle et vérifiez les deux repères de 50 mm.',
                'Les cases vides restent sans perle. Le PNG sert à compter, pas à placer les perles à taille réelle.',
                'Assemblage, repassage et solidité des jonctions entre plaques n’ont pas été testés avec de vraies perles. Les couleurs Perler à l’écran sont approximatives.',
            ],
            ja: [
                '29×29マスのミディ用プレート4枚を縦2枚・横2枚に並べます。図案全体は58列・58行です。',
                '横52×縦48マスの風景をこの大きさで描いています。プレート1枚用の図案を拡大したものではありません。',
                'PDFの1ページ目は縮小した全体図で、2〜5ページ目はプレート1〜4をマスの間隔5 mmで表示します。100％・実際のサイズで印刷し、縦横の50 mm目盛りを確認してください。',
                '空白のマスにはビーズを置きません。PNGはマスを数えるための画像で、実寸でビーズを重ねる型紙ではありません。',
                '実物の制作・アイロン仕上げ・プレートをまたぐ接合部の強度は検証していません。画面上のPerlerの色は目安です。',
            ],
        };
        const names = { de: 'Sonnenuntergang am Bergsee', fr: 'Lac de montagne au coucher du soleil', ja: '山と湖の夕景' };
        for (const locale of ['de', 'fr', 'ja'] as const) {
            expect(pattern.notes.map(note => localizePatternNote(note, locale))).toEqual(translated[locale]);
            expect(getLocalizedSubjectName(pattern, locale)).toBe(names[locale]);
            const intro = getLocalizedPatternIntro(pattern, locale);
            for (const value of ['52', '48', '2496', '8', '29', '2', 'A4', 'Letter']) expect(intro).toContain(value);
        }
    });

    it('executes the historical reader and authoring guard: only the exact reviewed ID may bypass its single-board input gate', () => {
        const payload = patterns.filter(pattern => pattern.id !== 'original-strawberry').map(pattern => ({ ...pattern, locales: Object.fromEntries(['de', 'fr', 'ja'].map(locale => [locale, { notes: pattern.notes.map(note => localizePatternNote(note, locale as 'de' | 'fr' | 'ja')) }])) }));
        const code = `
import argparse, ast, contextlib, copy, io, json, pathlib, re, shutil, sys, types
source = pathlib.Path('scripts/build-localized-library-pdfs.py').read_text()
tree = ast.parse(source)
functions = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in ('catalog', 'main')]
incoming = json.load(sys.stdin)
current = incoming
space = dict(json=json, re=re, ROOT=pathlib.Path.cwd(), NODE_LOADER='unused-memory-loader', LOCALES=('de','fr','ja'), argparse=argparse, shutil=shutil, Path=pathlib.Path, __doc__='Legacy input gate test')
space['subprocess'] = types.SimpleNamespace(run=lambda *args, **kwargs: types.SimpleNamespace(stdout=json.dumps(current)))
exec(compile(ast.Module(body=functions, type_ignores=[]), '<actual-legacy-reader>', 'exec'), space)
original = [p for p in incoming if p['id'] != '${id}']
assert len(original) == 117
current = copy.deepcopy(original)
assert space['catalog']('node') == original
current = copy.deepcopy(incoming)
assert space['catalog']('node') == original
rejected = []
for case in ('unknown-58', 'reviewed-id-wrong-size', 'old-bad-locale', 'old-wrong-size'):
    current = copy.deepcopy(incoming)
    if case == 'unknown-58': current[-1]['id'], current[-1]['slug'] = 'unreviewed-large-pattern', 'unreviewed-large-pattern'
    elif case == 'reviewed-id-wrong-size': current[-1]['gridWidth'], current[-1]['gridHeight'] = 29, 29
    elif case == 'old-bad-locale': current[0]['locales'] = {}
    else: current[0]['gridWidth'], current[0]['gridHeight'] = 58, 58
    try: space['catalog']('node')
    except AssertionError: rejected.append(case)
    else: raise AssertionError('Legacy gate admitted ' + case)
sys.argv = ['legacy-reader', '--id', '${id}', '--list']
errors = io.StringIO()
with contextlib.redirect_stderr(errors):
    try: space['main']()
    except SystemExit as error: assert error.code == 2
    else: raise AssertionError('Legacy authoring admitted the multiboard ID')
assert 'build-multiboard-pattern-downloads.py' in errors.getvalue()
print(json.dumps(dict(retained=len(original), rejected=rejected, authoringRejected=True)))
`;
        const result = JSON.parse(execFileSync('python3', ['-B', '-c', code], { input: JSON.stringify(payload), encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
        expect(result).toEqual({ retained: 117, rejected: ['unknown-58', 'reviewed-id-wrong-size', 'old-bad-locale', 'old-wrong-size'], authoringRejected: true });
    });
});
