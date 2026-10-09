# Original Santa Hat print charts

The reviewed v1 grid is an independent original drawing. It uses one 29 x 29
Midi board, 332 beads and three existing Perler Midi colors. A4 and US Letter
each retain a 5 mm pitch and a 145 mm board grid; this is not a physical build
or strength test. Manufacturer color names remain English and are labelled EN.

## Source and outputs

The ignored source pack is `artifacts/pattern-samples/2026-10-09/original-santa-hat-v1`.
Generate its PNG/SVG/project candidate with `generate-original-santa-hat-sourcepack.mjs`
and complete the visual review described in its sourcepack README first.

`build-santa-hat-pdfs.py` reads the reviewed rows, native PNG and project. It
checks the fixed v1 row fingerprint, counts, real Perler CSV entries and default
Perler Midi single-board project. It does not rematch colors or fetch content.
It creates these eight source charts, exclusively:

- English A4: `reference-pattern-library.pdf`
- English US Letter: `reference-pattern-library-us-letter.pdf`
- DE/FR/JA A4: `localized-pdfs/{locale}/pattern.pdf`
- DE/FR/JA US Letter: `localized-pdfs/{locale}/pattern-letter.pdf`

Only after every chart passes review, the promotion builder extracts the two
English charts to `public/patterns/original-santa-hat/`. Copy each native chart
without redrawing to `public/patterns-{locale}/original-santa-hat/`. Never rebuild
or overwrite old pattern assets to add this design. The builder requires all
12 source packs, the immutable published 100 identity lock and complete fe3ed49
106-object lock. Its output root must be new; it also emits the lightweight
language route map. A repeat recorded 107 catalog must match the same source
data exactly.

## Font preparation

Use a Python environment with ReportLab, Pillow, pypdf and pdfplumber. The font
creation step additionally needs `fontTools==4.60.1`; it is not a production or
website dependency. An isolated fontTools environment can be made visible to
the bundled Python through `PYTHONPATH` while preserving its PDF libraries.

```bash
python3 -B scripts/build-santa-hat-pdfs.py --pack /absolute/path/to/sourcepack --font-characters > /task/tmp/santa-characters.json
python3 -B scripts/build-santa-hat-font.py --characters-file /task/tmp/santa-characters.json
```

The separate `santa-hat-jp` font uses pinned, checksum-verified Google Fonts
Noto Sans JP and its SIL Open Font License. Its derivative name is distinct;
none of the existing font directories is rewritten. Existing fonts must be
checked with `--check-only`, never refreshed in place. Checksum, glyph coverage
and the exact 171-character inventory are validated before PDF authoring.

## Generate and review

```bash
python3 -B scripts/build-santa-hat-pdfs.py --pack /absolute/path/to/sourcepack
python3 -B scripts/build-santa-hat-pdfs.py --pack /absolute/path/to/sourcepack --check-only
```

Generation refuses an existing chart batch. The read-only mode verifies page
size, language, embedded font and Unicode map, printing preference, detail URL,
material text, each colored cell and each cell symbol at their exact positions,
all 60 grid lines and both 50 mm calibration axes. It does not substitute for
rendering all eight pages and checking text, white beads and empty cells visually.
The initial review also rejected deliberately shifted grids, equal-count swapped
symbols and a changed material count. Retain only the final source pack and
minimum acceptance evidence; recycle render pages and test downloads when done.

Published downloads retain the established image/editor workflow. Brand changes
continue through the editor; these static files describe Perler Midi only.
