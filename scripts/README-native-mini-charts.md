# Native Mini Ghost counting PNGs

`build-localized-mini-ghost-charts.mjs` produces only three DE/FR/JA PNG candidates in a new, explicitly supplied task-staging directory named `localized-mini-charts`. It never writes `public`, guide data, PDFs, editor projects or existing fonts. Root review and promotion remain separate.

```sh
node scripts/build-localized-mini-ghost-charts.mjs --output /absolute/task-staging/localized-mini-charts
node scripts/build-localized-mini-ghost-charts.mjs --output /absolute/task-staging/localized-mini-charts --check-only
```

The locked English PNG is 788×930. Its complete 29×29 reading grid, coordinate labels and W/B symbols remain pixel-identical through row 753. Only the English footer is replaced with vector-rendered native labels. The editable Mini project remains 57×57, with the original 29×29 Ghost centered by 14 empty cells on each edge. Its native-size pixel PNG remains 57×57. The script verifies both the project and the underlying original Ghost pixels, all 841 reading-grid cell colors, White 293 + Black 18 = 311 beads, and all twelve retained Mini resources by byte hash, including eight PDFs.

The labels distinguish the manufacturer’s 2.6 mm bead size from a PNG’s grid spacing. These are counting images, not calibrated actual-size placement templates. Mini pegboard fit, physical assembly and ironing remain unverified. White and Black retain their official color names; W/B are reading symbols.

Rendering uses the existing licensed Noto Sans JP derivative outline inventory in `scripts/fonts/native-chart-labels`. Eight missing outlines are extracted from the existing Mini Ghost, calibration and photo-guide TTFs and kept in `scripts/fonts/native-mini-chart-labels`. No new TTF is created or downloaded, and no old font or source lock is replaced. The supplemental source lock records each existing font hash, its retained SIL OFL license and the source of each outline. Ordinary chart generation requires only the installed Node dependencies and frozen glyph JSON, with no Python or system-font fallback.

Rebuilding just the new supplemental outline inventory, if deliberately reviewed, requires a separately provisioned Python with `fontTools==4.60.1`. The command refuses to replace an existing supplemental directory:

```sh
node scripts/build-localized-mini-ghost-charts.mjs --font-characters
node scripts/build-localized-mini-ghost-charts.mjs --build-glyphs --python /absolute/python-with-fonttools-4.60.1
```

`mini-chart-checks.json` in staging records PNG hashes and dimensions, full native labels, exact wrapping, pixel preservation, counts and limits. `--check-only` regenerates in memory and compares the three PNG hashes and this report without writing. Glyph-bound checks reject clipping; decoded RGBA checks prove lossless opaque RGB encoding. Visual approval is an independent root check, not a claim made by this report.
