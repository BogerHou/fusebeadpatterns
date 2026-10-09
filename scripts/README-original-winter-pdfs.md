# Original winter print charts

`build-original-winter-pdfs.py` reads the separately reviewed, private winter
source pack. It never recolours a pattern or changes a previously published
download. Before authoring, it requires independent row hashes, material counts,
bounds and Perler colour references for both original designs.

The batch contains sixteen one-page downloads: Christmas Stocking and Snowflake,
each in English, German, French and Japanese, on A4 and US Letter. English files
are written under the source pack's `pdfs` directory; other languages use
`localized-pdfs/<locale>/<id>`. Two English reference bundles retain manifest
order for the incremental library promotion script. The bundles are private
build inputs, rather than additional public download formats.

Every chart uses a 29 × 29 grid with 5 mm pitch, row and column numbers, a symbol
for each occupied cell, material quantities and horizontal/vertical 50 mm print
checks. Empty cells and white beads are distinguished explicitly. The PDF links
to the corresponding language's detail page and records its language and
`PrintScaling=None`. These are digital printing checks; physical assembly,
ironing and hanging have not been tested.

## Rebuild

Use the source-pack generator described in `README-original-winter-sourcepack.md`
first. Keep the private source pack out of Git. Set `PACK` to its absolute path
and use a task-owned temporary directory for `winter-characters.json`.

```sh
python3 scripts/build-original-winter-pdfs.py --pack "$PACK" --font-characters > "$TASK_TMP/winter-characters.json"
python3 scripts/build-original-winter-font.py --characters-file "$TASK_TMP/winter-characters.json"
python3 scripts/build-original-winter-pdfs.py --pack "$PACK"
python3 scripts/build-original-winter-pdfs.py --pack "$PACK" --check-only
```

Run the applicable PDF artifact-operation marker immediately before the first
PDF authoring command. Inspect rendered pages before recording approval. Clear
the pack's pending-PDF state only after authoring, independent checks and visual
review are complete; a successful preflight alone is not approval.

The separate `winter-patterns-jp` font is built from pinned upstream font/OFL
bytes, with a separately named derivative and a checksum of the complete text
inventory. Rebuilding it requires fontTools 4.60.1. Normal PDF checks require
Pillow, ReportLab, pypdf and pdfplumber. Existing font directories are never
overwritten; use the font builder's `--check-only` after the first build.

Creation refuses any existing output PDF. PDF `--check-only` is read-only: it
checks cells, colours, symbols, paper dimensions, calibration lines, text bounds,
embedded glyphs, language, title and links. Reference bundles must also preserve
the corresponding single-page drawing streams, embedded font resources and
links. None of these scripts runs in the website build or at request time.
