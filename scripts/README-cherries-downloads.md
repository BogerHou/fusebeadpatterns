# Original Cherries downloads

This isolated builder serves only `original-cherries`, slug `cherry`, with the
subjects Cherries, Kirschen, Cerises and さくらんぼ. It does not change any old
catalog entry, renderer, font or published download. Input is the immutable,
Git-ignored source pack at `artifacts/pattern-samples/2026-10-16/original-cherries-v1`.
The root independently reviews the actual drawing and supplies a JSON lock
containing only `original-cherries: {rowsSha256, rgbaSha256}`; a source pack's own
claims are not that independent approval. A separate Hama review lock contains
`original-cherries-hama: {rowsSha256, rgbaSha256, excludedRefs}`: original source
row hash, independently approved actual Hama RGBA, and all excluded color refs.

The builder reads the real Perler CSV, exact project pixels and actual editor
parser. It derives Hama by calling the real `remapPatternPalette` with
`delta_e_cie2000`, the actual 92-entry Hama CSV and original source palette.
This is an explicitly **fixed opaque Hama selection**: actual entries whose
product names contain Transparent, Translucent or Clear (case-insensitive) are
retained but disabled before that conversion. The exclusion list is recorded.
Ordinary automatic switching with the complete Hama palette can select different
colors; this builder changes neither that editor behavior nor the shared CSV.
Hama codes, symbols, RGB and counts are read from that result and verified again
against the CSV. A color merge is represented as a lower actual color count;
the drawing's alpha mask, dimensions and bead total must remain unchanged.
It never relabels Perler RGB or product codes as Hama.

Use an existing Python with ReportLab, Pillow, pypdf and pdfplumber, and the
existing Node/TypeScript/Sharp installation. No command installs dependencies or
uses a network, API, external font service, Vercel function or image conversion.
The frozen helper `build-multiboard-pattern-downloads.py` is checked against
SHA-256 `a3d52c7793d0d260e53dae5d86e8800fe6d78a596628584195e2f91d9f9cc8b5`;
only its generic safety, glyph paths, wrapping and local SVG rasterizer are used.
Its main, old source loaders, font downloader and PDF generator are never run.

```sh
python3 -B scripts/build-cherries-downloads.py --font-audit
python3 -B scripts/build-cherries-downloads.py --pack "$CHERRIES_PACK" --font-audit
```

These modes are read-only, including TypeScript transpilation in memory. Before
preparing any new font, inspect actual cmap coverage. Only if necessary, use the
existing offline full Noto Sans JP TTF and OFL and pinned fontTools 4.60.1:

```sh
python3 -B scripts/build-cherries-downloads.py --pack "$CHERRIES_PACK" \
  --prepare-font --source-font "$CHERRIES_OFFLINE_TTF" \
  --source-license "$CHERRIES_OFFLINE_OFL"
python3 -B scripts/build-cherries-downloads.py --pack "$CHERRIES_PACK" --check-only
```

The full TTF SHA-256 must be
`c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f`;
OFL SHA-256 must be
`1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9`.
The derivative has the distinct internal family Fuse Bead Cherries Labels and
is written only into a previously nonexistent `scripts/fonts/cherries-labels`.
The original font, source environment and all earlier subsets remain read-only.
Normal checks/builds need no fontTools, download or system fallback font.

The source pack's exact file inventory remains immutable. Never create a
generated subdirectory inside it: source-pack `--check-only` must continue to
reject any unexpected file. Use an exclusive external private `$CHERRIES_STAGING`
directory, for example the root's task temporary directory, and the fixed child
basename `generated-cherries-downloads`. The adapter explicitly rejects output
equal to or descending from the resolved source-pack path.

The first PDF authoring command must wait for the root's successful PDF-skill
marker for **16 PDF files** and its independently reviewed source lock. The
child agent does not run that marker. A flag acknowledges the root's confirmed
operation; it is not a replacement for the actual marker.

```sh
python3 -B scripts/build-cherries-downloads.py --pack "$CHERRIES_PACK" \
  --review-lock "$CHERRIES_REVIEW_LOCK" \
  --hama-review-lock "$CHERRIES_HAMA_REVIEW_LOCK" \
  --output "$CHERRIES_STAGING/generated-cherries-downloads" --pdf-marker-confirmed
python3 -B scripts/build-cherries-downloads.py --pack "$CHERRIES_PACK" \
  --review-lock "$CHERRIES_REVIEW_LOCK" \
  --hama-review-lock "$CHERRIES_HAMA_REVIEW_LOCK" \
  --output "$CHERRIES_STAGING/generated-cherries-downloads" --check-only
```

Outputs are exclusively created; existing directories, symlinks and public/src
paths are refused. Each brand has four languages × A4/US Letter: 16 one-page
PDFs, each with all 29 × 29 cells at nominal 5 mm pitch, exact per-cell symbols
and brand RGB, real material counts, native `/Lang`, embedded fonts,
`PrintScaling=None`, canonical localized detail link and two 50 mm print checks.
The entire PDF grid is independently reconstructed to native RGBA. A two-column
material table has room for eight actual colors without overlaying instructions.

Eight counting charts each have SVG and PNG forms, with outlined native text,
no external images/fonts and all 841 cell colors checked against source data.
Counting PNGs are **not** actual-size placement templates. Hama additionally has
native transparent pixels, an opaque nearest-neighbor preview and an actual editor
project. Actual materials remain in the private manifest. Existing source-pack Perler pixels, preview and
project are promoted separately after review. `downloads-manifest.json` lists
only the exact newly generated promotable assets with their actual hashes and
sizes, plus checks; the manifest itself remains private.

Before promotion, the root renders and checks all 16 PDF pages, both brands'
four-language charts, actual browser downloads and editor project reloads.
Digital checks do not establish physical assembly, ironing, strength, hanging,
wearability or age suitability. Retain the unique source, final assets, font
license/lock and minimal acceptance evidence; remove confirmed disposable
renders and downloads, leaving other agents' files untouched.
