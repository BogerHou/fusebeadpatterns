# Localized digital print-calibration sheets

`build-localized-print-calibration.py` creates the German, French and Japanese
versions of the existing English 29 x 29 / nominal 5 mm calibration worksheet.
Each language has one A4 and one US Letter PDF with a matching vector SVG:

`public/printables/calibration/{de,fr,ja}/29x29-5mm-{a4,us-letter}.{pdf,svg}`

The original four English downloads and original generator are never overwritten.
The localized generator imports the original drawing calls, changes labels/fonts
and metadata, then compares the resulting 84 vector lines against the original
PDF and SVG for the same paper size. This includes all 60 grid boundaries, both
50 mm rulers and every ruler tick. Grid pitch stays 5 mm; the full outer grid is
145 x 145 mm, with 140 mm between first and last cell centres.

## Rebuild and verify

Requires Python with `reportlab`, `pypdf`, `pdfplumber` and `fonttools`.
The checked-in font subsets make a normal rebuild completely offline:

```bash
python3 scripts/build-localized-print-calibration.py
python3 scripts/build-localized-print-calibration.py --check-only
python3 scripts/build-localized-print-calibration.py --check-only --qa-report /absolute/private/qa.json
```

The optional report belongs in an ignored private operations directory, not Git.
The checker validates one page, the exact original MediaBox, PDF language,
`PrintScaling=None`, all vector-line coordinates/weights/colours, SVG physical
units/viewBox, native instructions, full glyph coverage and a 15 mm text inset.
It also verifies that the original English file hashes remain unchanged.

## Font source and text

The two small fonts in `scripts/fonts/calibration/` are SIL Open Font License
subsets of the same pinned Google Fonts Noto Sans JP source already used by this
project. They cover only these DE/FR/JA labels and ASCII; the family was renamed
Fuse Bead Calibration. Source URL, revision, source/license/subset checksums and
preparation tool version are recorded in `source.json`; `OFL.txt` is retained.
PDF text remains searchable and extractable. SVG text is converted to vector
outlines with native accessible labels, so rendering does not depend on a local
Japanese font installation. The grid remains editable vector geometry.

After a label change, explicitly prepare new subsets using the pinned source:

```bash
python3 scripts/build-localized-print-calibration.py --prepare-font
```

Only that opt-in command accesses the network. It verifies the full source and
license hashes before writing derivatives; the full downloaded font remains in
memory. Changing any source hash requires a separate source/visual review.

## Visual acceptance and physical limitations

Render all six PDF pages with Poppler after meaningful changes and inspect them:

```bash
pdftoppm -png -r 150 INPUT.pdf /task-temporary/render-prefix
```

Inspect all six SVGs too, for example using the project's existing Sharp/librsvg
renderer or a browser. A renderer's DPI/pixel count is not the print size: preserve
SVG `width`/`height` in millimetres and its matching viewBox. Remove test rasters
and temporary dependency directories after inspection; keep only minimum evidence.

Digital geometry has been verified. Physical printing, physical pegboard fit and
finished bead projects have not been tested. Print with the correct paper,
portrait, one page per sheet, actual size / 100%; turn off scaling and borderless
enlargement. Measure both 50 mm rulers on paper, then compare the complete grid
with the actual board. If the pitch differs, count rows/columns rather than using
the sheet as an under-board template. The 15 mm layout inset is not a guarantee
about every printer's printable area. These instructions do not change old editor
exports, establish Mini/Maxi sizing, or promise universal brand compatibility.
