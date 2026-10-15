# Original Black Cat: fixed Hama Midi downloads

`build-black-cat-hama-downloads.py` builds only the Hama Midi variant of the existing original Black Cat. It does not refresh the six older Hama designs, their manifest, the Perler downloads, fonts, catalog, page metadata, or sitemap. It uses local inputs only and never writes directly to `public`.

## Frozen inputs and matching

The script pins the reviewed source assets, palettes, matching modules, and reused fonts with SHA-256 in its `PINS` table. This is a reviewed input set, not a pin of the entire transitive Node dependency graph. It invokes the product's `parsePaletteCsv`, `remapPatternPalette`, and editor-project parse/serialize functions through Node, using the complete 92-entry Hama Midi palette, `delta_e_cie2000`, and the source palette's neutral-color names. There is no dithering or resampling. The resulting two entries are frozen and checked:

| Manufacturer number | Editor reference | Color name in the palette | RGB approximation | Symbol | Count |
| --- | --- | --- | --- | --- | --- |
| 18 | H18 | Black | 20, 19, 21 | 4 | 177 |
| 03 | H03 | Yellow | 233, 199, 4 | $ | 4 |

`H` is the editor's reference prefix. The PDF and counting PNG show the manufacturer's `18` and `03`; the editable project retains `H18` and `H03`. Hama's [official color-chart page](https://hama.dk/en/pages/colour-chart) and [numbered chart](https://cdn.shopify.com/s/files/1/0726/3771/0492/files/colour-chart-number.pdf?v=1777215620) identify these as black and ordinary yellow. The CSV's RGB values are screen approximations, not manufacturer color measurements. Physical assembly, ironing, and fit to a real pegboard have not been tested.

The 29 × 29 grid contains the same 16 × 16 motif, 181 occupied cells and 660 empty cells. Positions and alpha are unchanged. The decoded source RGBA hash is `fbf706e0c20bde55d98825408c5f2e1b94bc4be7a8ab298c1d8b248b99accb2d`; the Hama RGBA hash is `90a8705723b8021d46d5ccc7fc3a58fde5291a970e089e2f28348a36f0c01c5e`. A change to any pinned input or output expectation must be investigated rather than bypassed by updating hashes alone.

## Fonts

No new font is added. The unchanged OFL fonts and their existing provenance/license files are reused:

- `scripts/fonts/black-cat-labels/FuseBeadBlackCatLabels-Regular.ttf`, SHA-256 `1e1b515afb44ba2e56a14523e05813385bef8a9795802e318e7586b5a43eddf8`.
- `scripts/fonts/hama-letter-jp/FuseBeadHamaLetterJapanese-Regular.ttf`, SHA-256 `2128e344112cad3dc7ca53a95bde83bf87a2956709ed7185221dec56ffa4ce8b`.

The first font supplies all required text except `$` and `=`, which use the second font. `--font-characters` checks actual TTF character maps, all four languages, both paper sizes, symbols, and text widths. The current inventory contains 177 distinct characters with no missing glyphs; its UTF-8 character-list SHA-256 is `b30786b0db1befd85c02c5d5eecfbb01c811fd28656e0d52914863c2e59a4585`. PDFs embed the used TrueType fonts with Unicode maps.

## Rebuild and read-only checks

Run from the repository root with Node and Python containing `Pillow`, `reportlab`, `pypdf`, and `pdfplumber`. The Node bridge uses the repository's installed TypeScript package. Set `STAGE` to the absolute path of `artifacts/black-cat-hama-oct15/generated-black-cat-hama-downloads` in the current worktree. This exact ignored staging location is required; its ancestors and prepared descendants must not be symlinks.

```sh
python3 -B scripts/build-black-cat-hama-downloads.py --font-characters
python3 -B scripts/build-black-cat-hama-downloads.py --prepare-only --output "$STAGE"
```

Preparation requires a nonexistent output directory. It creates eight non-PDF resources and a private `source-lock.json`, without creating or editing a PDF. Before running the author command, follow the PDF skill's authoring-marker requirement for eight PDFs. Record that marker immediately before authoring; the script itself does not create the marker.

```sh
python3 -B scripts/build-black-cat-hama-downloads.py --author-pdfs --output "$STAGE"
python3 -B scripts/build-black-cat-hama-downloads.py --check-only --output "$STAGE"
```

Authoring refuses to replace any existing PDF. `--check-only` is read-only: it reruns product matching, recomputes the prepared resources in memory, verifies their bytes and source pins, then inspects all eight existing PDFs. The checks cover page size, language, print-scaling preference, Unicode text, font embedding, existing detail-page links, every occupied cell/color/symbol, all grid lines, and horizontal/vertical 50 mm rulers. Render and visually inspect all eight pages separately before promoting assets. These digital checks do not prove real printing or pegboard fit.

`source-lock.json` is the preparation-time snapshot: its `pdfsAuthored: false` means the prepare step created no PDF, not that later authoring did not occur. Actual PDF authoring and inspection results belong in the private release receipt. Keep the snapshot and `materials.json` in ignored staging; neither is a public download.

## Promotion boundary

After successful checks and visual review, promote exactly 15 files under `public/patterns-hama/original-black-cat/`:

- Shared `pattern.bead-pattern.json`, `pixels.png`, and `preview.png`.
- `en`, `de`, `fr`, and `ja`, each containing `grid.png`, `pattern.pdf` (A4), and `pattern-letter.pdf` (US Letter).

The shared pixels are 29 × 29 RGBA. The preview is a 580 × 580 nearest-neighbor enlargement composited on `#faf8f3`, with no smoothing. Each 760 × 1040 counting PNG includes symbols and materials; it is not an actual-size placement template. Each one-page PDF has a 145 × 145 mm grid at 5 mm pitch and two 50 mm calibration lines. The download set adds no fonts or Vercel image transformations; it consists of ordinary static files. Keep all existing downloads unchanged and use the existing localized `/patterns/black-cat#hama-midi` detail-page links.
