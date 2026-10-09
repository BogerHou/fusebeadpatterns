# Missing whole-library PDF translations

`build-localized-library-pdfs.py` evaluates `catalog.ts` and
`localized-content.ts` with the repository's TypeScript compiler in memory.
Names and assembly notes therefore match the public localized detail pages.
It does not maintain an independent list of invented localized character names.

The original Perler project and 29 × 29 PNG must agree byte for byte. The
printed color reference, original English manufacturer color name, symbol,
quantity and individual cell are validated against that source. Japanese Hama
variants additionally use the already reviewed explicit `hama.json` mapping and
unchanged `patterns-hama` project/PNG. No new color matching occurs.

The existing German eight, French six and Japanese twelve Perler PDFs are
excluded using their retained selection manifests. Six existing Hama originals
are selected only for Japanese. As of this implementation the missing totals
are DE 98, FR 100, JA 94 Perler PDFs, plus JA six Hama PDFs.

## Inspect and generate

Use the project's Node installation plus Python with `reportlab`, `Pillow`,
`pypdf` and `pdfplumber`. `fonttools` is required only for the explicit initial
font refresh. The ordinary build has no network calls.

```sh
python3 scripts/build-localized-library-pdfs.py --list

# Explicit stress samples. Choose an owned temporary directory, not public/.
python3 scripts/build-localized-library-pdfs.py \
  --id pokemon-gyarados-gen5 --id minecraft-netherite-sword-1-21-1 \
  --output-dir /tmp/fusebead-localized-pdf-review --refresh-font \
  --qa-report /tmp/fusebead-localized-pdf-review/acceptance.json
```

The samples cover a four-part motif and the existing 13-color motif. Inspect
all rendered sample pages with `pdftoppm -png` after every layout change.
The QA report proves pixels, symbols, counts, source hashes, geometry, text
boundaries and original-resource preservation; it cannot certify aesthetics or
physical beads. Do not call an unrendered batch visually accepted.

Writing the complete missing collection requires an explicit `--all-missing`
flag and output directory. Existing destination files are never overwritten;
new-version files are rebuilt in a temporary staging directory and compared byte
for byte before being marked verified. Retained legacy PDFs and fonts are
excluded entirely. A failed source/layout check leaves no new downloadable file.
`--check-only` verifies selected existing new files without publishing or
replacing any file. This script does not connect new
assets to the site's download resolver; that is a separately reviewed change.
On a later full-library build, render every generated page and retain its
acceptance record before changing the resolver.

## Print contract

The first A4 page retains a 145 × 145 mm grid with exactly 5 mm cell pitch,
29 numbered rows/columns, the real symbol/material key and a separate 50 mm
calibration line. Print scaling is set to `None`, with explicit 100%/actual-size
instructions. Users must measure the line and check their own Midi pegboard.
Mini/Maxi compatibility, physical color accuracy, assembly and ironing are not
claimed. Disconnected motifs and fragile one-bead connections retain their
reviewed localized instructions. Notes that cannot fit legibly continue on a
second material/instruction page; the grid is never shrunk to make room.

## New Japanese font

The generator uses `scripts/fonts/localized-library-jp/`, a distinct derivative
from the old static/editor Japanese font. The same pinned official Google Fonts
Noto Sans JP upstream revision and checksums are reused. The new subset covers
all current catalog names, assembly notes, fixed copy and original ASCII color
references/names; it is not an arbitrary-user-text font. `source.json` records
the upstream provenance, font and license hashes, derivative hash and character
set hash. The upstream complete font is fetched into memory only and never left
in the repository or Downloads. The SIL OFL license is preserved alongside the
renamed subset. No existing public font is changed or replaced.
