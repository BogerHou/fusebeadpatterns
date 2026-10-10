# Original Retro Diamond Coaster print charts

The ignored reviewed source pack is
`artifacts/pattern-samples/2026-10-10/original-coaster-v1`.
The independent drawing occupies 23 x 23 positions on one 29 x 29 Midi board:
517 beads, with Cheddar 217, Midnight 216 and White 84 in Perler Midi.
The source rows, native RGBA PNG and editable project must agree exactly.

These are digital construction charts. The coaster has not been physically
assembled, ironed or tested with a cup, backing, adhesive or heat. Follow the
localized detail page for the cork-backing workflow. Cut the cork to the actual
cooled outline and select suitable adhesive; the digital outline does not prove
physical fit, durability, heat resistance or table protection. The standalone
chart also states that assembly, ironing and use are untested, and that it is
not for hot cups or a dishwasher. This stays on the existing note line so the
US Letter chart retains both calibration axes without extra text rows.

## Independent font preparation

`build-coaster-font.py` creates only the separately named `coaster-jp` font.
It uses the Google Fonts Noto Sans JP source and SIL Open Font License pinned
by the existing library source lock, verifies both upstream checksums, and
retains the exact original OFL bytes. It never updates any old font directory.

Use the bundled Python PDF libraries. Only a font rebuild additionally needs
`fontTools==4.60.1`, installed in an isolated task environment; do not change
website or main Python dependencies.

```bash
python3 -B scripts/build-coaster-pdfs.py --pack /absolute/path/to/reviewed-pack --font-characters > /task/tmp/coaster-characters.json
python3 -B scripts/build-coaster-font.py --characters-file /task/tmp/coaster-characters.json
python3 -B scripts/build-coaster-font.py --characters-file /task/tmp/coaster-characters.json --check-only
```

Existing font directories are exclusive and must be checked rather than
overwritten. The font lock records the character inventory, checksums,
derivative family and fontTools version. PDF preflight checks every glyph and
all text widths; titles use the complete native name on their own line.

## Authoring and outputs

Run the required PDF artifact-operation marker exactly once before initial
authoring, with expected output count 8, in the authorized release workflow.
`--font-characters` and `--check-only` do not author PDFs.

```bash
python3 -B scripts/build-coaster-pdfs.py --pack /absolute/path/to/reviewed-pack
python3 -B scripts/build-coaster-pdfs.py --pack /absolute/path/to/reviewed-pack --check-only
```

The builder refuses existing PDFs and writes only these eight source charts:

- EN A4: `reference-pattern-library.pdf`
- EN US Letter: `reference-pattern-library-us-letter.pdf`
- DE/FR/JA A4: `localized-pdfs/{locale}/pattern.pdf`
- DE/FR/JA US Letter: `localized-pdfs/{locale}/pattern-letter.pdf`

Each retains a 5 mm pitch, a 145 mm square board grid and horizontal/vertical
50 mm calibration lines. Print at 100% / Actual size, disable Fit to page and
measure both lines against the actual Midi board. Manufacturer color names
remain English and are marked EN.

The offline validator checks the fixed reviewed row fingerprint, real CSV
color entries, each occupied/transparent pixel and default single-board
Perler project, one-page dimensions, PDF language, embedded font and Unicode
map, viewer print preference, native detail URL, materials, each colored cell
and its symbol at the exact position, all 60 grid lines and both rulers.
Numeric checks do not replace rendering and visually inspecting every final
page for titles, glyphs, whitespace, material rows, white beads and empty cells.

Promote only the reviewed PDF bytes to the new public pattern directories.
Do not redraw, rebuild or overwrite any published pattern or font asset.
Keep the reviewed source pack and minimum final QA evidence; recycle task
renders, downloaded copies and the isolated fontTools environment after use.
