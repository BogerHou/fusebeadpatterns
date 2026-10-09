# Original bead loom pattern assets

`src/lib/bead-loom/patterns.json` is the canonical source for both the TypeScript
library and this generator. It contains three original rectangular charts:
`heart-band`, `chevron-band`, and `diamond-band`. Each has 11 columns, 61 rows,
671 occupied cells, a square cell ratio, a bottom-left start and alternating
row directions. `symbolRows` stores screen order, top to bottom and left to
right. A background-colored cell is still one bead.

Its `libraryPaths` and `makerPaths` hold the native EN/DE/FR/JA page paths.
TypeScript exports `loomPatternLibraryPaths` and `loomPatternMakerPaths`; the
PDF generator reads the same fields. Public-asset tests also compare every
PDF's URLs with the current site route registry.
The PDF's edit link appends `?pattern={id}` so the current pattern opens in the
native maker rather than a blank chart.
The four native gallery paths must resolve to actual app page files that render
`LoomPatternLibrary` with their expected locale; this check is independent of
the shared path data and catches guessed URLs even when all exporters agree.

The palettes are custom approximations without manufacturer codes. These
downloads are reading charts; they do not claim finished dimensions, a bead
size, a physically woven sample or an official bead-color match.

## Rebuild and check

Use Python with `reportlab`, `Pillow`, `pypdf` and `pdfplumber` installed. Normal
rebuilds run offline with the checked-in font subset:

```sh
python3 scripts/build-bead-loom-patterns.py
python3 scripts/build-bead-loom-patterns.py --check-only
npx vitest run src/lib/bead-loom/patterns.test.ts
```

An optional `--qa-report /absolute/private/path/report.json` writes a compact
acceptance receipt. Keep private operation receipts outside Git.

Each pattern produces:

- One horizontal, language-neutral `preview.svg` (`768 x 180`) for a card.
- One vertical, language-neutral `chart.png` (`490 x 2140`) with symbols,
  column numbers, row numbers, direction arrows and color/count keys.
- Four current `bead-loom-project` version-1 editor projects, with localized
  titles and palette labels. Geometry and color IDs stay identical.
- Eight native vector PDFs: EN/DE/FR/JA in A4 and US Letter. Each is two pages:
  complete vertical chart and materials, then all 61 row instructions.

Paths are `/bead-loom-patterns/{id}/preview.svg`, `chart.png`, and
`/{locale}/pattern.bead-loom.json`, `pattern-a4.pdf`, `pattern-us-letter.pdf`.
PDF cells remain square on both paper sizes. Row 1 is at the bottom, reads
left to right, and row 2 reads right to left. The instructions show run lengths
in reading order: `3A 2B` means three A beads followed by two B beads.
Read each printed instruction list from left to right in its displayed order;
arrows describe movement across the chart, not the order of the text tokens.
Japanese paragraph wrapping keeps closing punctuation off line starts and
opening brackets off line ends.

The generator checks all 671 PDF rectangles and symbols, numbered columns
and rows, materials, page geometry, PDF language and font embedding, all
required glyphs, extractable localized text, every PNG cell, every SVG cell
and every project. It independently expands PDF row instructions to
reconstruct the canonical grid. The TypeScript tests additionally parse the
actual public project files with the current editor parser, verify counts,
locale consistency and complete row reconstruction. Rendered PDF review is
also required before publishing; data checks do not prove visual quality.

## Font refresh

`scripts/fonts/loom-patterns-jp` contains a renamed static weight-400 subset of
the official Noto Sans JP. It includes the fixed EN/DE/FR/JA copy and numeric
symbols. Every PDF uses this embedded font with a Unicode mapping. The
official font and original OFL license are pinned to immutable revision
`66a36c8c94b1a5d992ee4e7f392fccfe4945767c`; SHA-256 checks run before any derivative
is saved. The license bytes remain unchanged.

After changing titles, labels or fixed copy, explicitly refresh and review:

```sh
python3 scripts/build-bead-loom-patterns.py --refresh-font
```

Only this mode needs `fonttools` and network access to the official pinned
source. Source downloads stay in memory. The derivative family is **Fuse Bead
Loom Patterns**, and `source.json` records the upstream and subset hashes,
character-set hash and fonttools version. Normal builds neither fetch fonts
nor change the existing site/editor font assets.
