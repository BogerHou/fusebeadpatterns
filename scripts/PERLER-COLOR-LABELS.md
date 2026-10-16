# Perler Midi storage labels

The eight static PDFs in `public/downloads/color-labels/` use the same 103-entry
CSV as the existing color chart. Each has two pages (55 and 48 labels), original
English color names, exact codes, approximate swatches, 35 × 15 mm cut borders
and a 50 mm print-check ruler. They do not target pre-cut adhesive sheets.

The website and PDFs limit their scope to the editor palette. They do not claim
to cover the manufacturer's complete current catalog or physical bead colors.
All four existing chart canonicals, metadata, search and palette bytes remain.

## Maintenance

Application builds use the already generated files. They require no Python,
font download, server function or image conversion. The manifest pins the
palette, shared four-language copy and eight PDF hashes to prevent stale files.
The ordinary tests check these inputs and links; independent PDF geometry,
rendering and actual download acceptance are release gates.

To rebuild intentionally, use an isolated environment with reportlab 4.4.9,
fonttools 4.60.1 and pypdf. Obtain the Noto Sans JP font and OFL text from the
checksum-pinned URLs in `scripts/fonts/celestial-window-labels/source.json`.
Keep these full upstream files outside the checkout. Run the PDF authoring
marker once for eight PDFs, then:

```sh
python scripts/build-perler-color-labels.py \
  --font /absolute/task-directory/upstream-NotoSansJP.ttf \
  --font-license /absolute/task-directory/upstream-OFL.txt \
  --output /absolute/new-task-directory/generated \
  --authoring-confirmed
```

The script makes no network requests or existing-file replacements. It checks
the upstream font/license, subsets in memory and embeds the renamed derivative
in each PDF. Full MIT data and OFL font notices are retained in PDF metadata.
Review all 16 rendered pages and independently check every code/name/swatch,
label boundary, ruler, paper size, language and embedded font. After acceptance,
promote only the eight PDFs and `manifest.json` (as
`scripts/perler-color-labels-assets.json`). Do not publish upstream fonts,
temporary renders or private review records.
