# Native Hama Midi US Letter downloads

`build-localized-hama-letter-pdfs.py` creates exactly six reviewed original
motifs in German, French and Japanese: 18 new one-page US Letter downloads.
It never changes the original Perler assets, English Hama assets, existing A4
PDFs, mappings or fonts. There are no network calls and no new colour matching.

The generator calls `build-hama-patterns.py`'s reviewed `load_variants()`.
Original RGBA hashes and the explicit Hama mapping are checked against the
unchanged Hama CSV. Published Hama project JSON, raw PNG and preview are also
compared with that result. German names come from `german-hama.json` through
the actual card helper; French and Japanese names come from the existing
localized Hama cards. A translated subject name is never invented here.

## Font preparation and read-only inspection

Use Python with reportlab, Pillow, pypdf and pdfplumber, plus the repository's
Node and TypeScript. Character discovery is read-only and does not require the
new font to exist:

```sh
python3 scripts/build-localized-hama-letter-pdfs.py --font-characters
```

The JSON `characters` value covers all three languages, the six actual names,
manufacturer colour names, symbols, numbers and printed URLs. Use it to build
the separately reviewed static Noto Sans JP subset at
`scripts/fonts/hama-letter-jp/FuseBeadHamaLetterJapanese-Regular.ttf`.
Its adjacent `source.json` must record `subsetSha256`, `licenseSha256`,
`charactersSha256` and `characterCount`; preserve `OFL.txt` and the pinned
upstream provenance. The generator itself cannot create or refresh a font.
Every text glyph must exist in its cmap. All three languages use this embedded
font with a ToUnicode map, so extraction and printed text can be checked without
depending on locally installed fonts. Old Japanese fonts remain untouched.

The separate font helper requires fontTools 4.60.1 for creation. Capture the
read-only character inventory in the task-owned temporary directory, then run:

```sh
python3 scripts/build-localized-hama-letter-pdfs.py --font-characters \
  > /tmp/fusebead-hama-letter-characters.json
python3 scripts/build-hama-letter-jp-font.py \
  --characters-file /tmp/fusebead-hama-letter-characters.json --check-only
```

Only when the new font directory does not exist, omit `--check-only` to create
it. The helper verifies pinned upstream font and OFL checksums, produces a
renamed static weight-400 subset, and refuses to replace an existing directory.
Remove the task-owned character inventory after verification. PDF generation
uses the checked-in subset and does not need fontTools or a network connection.

## Generate and inspect the entire batch

Before the first PDF authoring command, complete the PDF skill's operation
marker for 18 created PDF outputs. The marker is not needed for editing this
script, character discovery or checking existing PDFs.

```sh
# Choose a task-owned temporary root first. No existing PDF is overwritten.
python3 scripts/build-localized-hama-letter-pdfs.py \
  --output-dir /tmp/fusebead-hama-letter-review \
  --qa-report /tmp/fusebead-hama-letter-acceptance.json
```

The output root contains
`patterns-{de,fr,ja}-hama/{original-id}/pattern-letter.pdf`.
Without `--output-dir`, the root is `public/`. All 18 PDFs are built and digitally
checked in temporary staging before any destination is added. Publication uses
an exclusive hard link; a destination created concurrently is not replaced.
An interrupted publication rolls back only files created by this invocation.
A QA report is a new file and is never silently overwritten.

After each layout change, render **all 18 final pages** using Poppler and inspect
them. The report covers source/palette identity, embedded text and glyphs,
individual RGB cells, symbols, material quantities, numbered rows and columns,
page bounds, calibration geometry, page language and real localized links. It
does not prove that the rendered page is beautiful, that physical beads match
screen RGB, or that a motif has been physically assembled or iron-tested.

```sh
python3 scripts/build-localized-hama-letter-pdfs.py \
  --output-dir /tmp/fusebead-hama-letter-review --check-only
```

`--check-only` is strictly read-only: it does not create a candidate PDF, font,
directory, bytecode cache or report. It validates the existing 18 PDFs directly
and emits the complete acceptance JSON to stdout. `--qa-report` is therefore
rejected in this mode; a caller may deliberately capture stdout in its own
task-owned location. `--font-characters` has the same read-only contract.

## Printing contract

Each file has a genuine 612 × 792 pt US Letter page, a 145 × 145 mm grid with
29 × 29 cells, exactly 5 mm pitch and numbered coordinates. The grid is never
shrunk to fit translated instructions. Independent horizontal and vertical
50 mm references detect unequal scaling. `PrintScaling` is `None`; all three
languages say to print at 100% / actual size and disable fit-to-page, measure
both references, and check the spacing against the user's Midi pegboard.

Hama colour numbers are printed without our editor's `H` prefix, alongside
the CSV's original English product names in a column marked EN. The native instructions explain that
01 is H01 in the editor and H is only a software prefix. Empty cells require no
bead; symbol-bearing white cells require white beads. Counts do not include
spares. The original, independent motifs are not official Hama templates and
have not been physically assembled or iron-tested. Screen and paper colours
are approximations. Mini and Maxi compatibility is not claimed.

Each page links to its actual language's Hama collection and motif anchor:
German `/de/hama-perlen-vorlagen`, French `/fr/patterns/hama`, Japanese
`/ja/patterns/hama`. Connecting the new downloads to those public cards is a
separate UI change; this generator never edits pages or metadata.
