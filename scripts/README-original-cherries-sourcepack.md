# Original cherries source pack

`generate-original-cherries-sourcepack.mjs` independently draws a pair of ordinary
cherries from explicit rows on one 29 × 29 Perler Midi board. The left fruit sits
higher than the right; separate thick curved stems join near one pointed leaf.
Eight coral highlight beads and darker lower-right shading remain filled cells.
No third-party image, tracing, named character or generated raster is used.

The motif occupies columns 4–27 and rows 4–26 (one based), 24 × 23 cells.
There are 284 beads in five existing Perler Midi colors:

| Symbol | Color | Code | Beads |
| --- | --- | --- | --- |
| R | Red | 80-19005 | 133 |
| D | Cherry | 80-15961 | 41 |
| H | Hot Coral | 80-19059 | 8 |
| G | Dark Green | 80-19010 | 73 |
| L | Green | 80-19080 | 29 |

Names and RGB values are checked against `public/palettes/perler.csv`. These are
screen approximations. A nominal 5 mm pitch gives a 120 × 115 mm footprint, not
the measured size of a cooled object. This is a Midi-board design; it is neither
a Mini-bead design nor a motif within 16 × 16 cells.

Render a preview into an exclusive task directory first:

```sh
node scripts/generate-original-cherries-sourcepack.mjs \
  --preview-output /tmp/original-cherries-candidate-unique
```

Only after root reviews the actual PNG may `REVIEWED_ROWS_SHA256` be set to the
reviewed row hash. The final generator refuses to run without that exact match.
The canonical final pack is the main project's Git-ignored
`artifacts/pattern-samples/2026-10-16/original-cherries-v1`. Pass an absolute path
when running from a worktree. Existing outputs are preserved; public locations,
symlink aliases into public, nonignored CLI outputs and unexpected files fail.

```sh
node scripts/generate-original-cherries-sourcepack.mjs --output "$PACK"
node scripts/generate-original-cherries-sourcepack.mjs --output "$PACK" --check-only
node --test scripts/generate-original-cherries-sourcepack.test.mjs
```

The immutable pack contains native RGBA PNG, preview PNG, counting SVG/PNG,
editable editor project, manifest, editorial entry, candidate asset map, README
and digital QA receipt. PNG pixels, transparent zeros, color counts and exact
metadata are checked on readback. A separate test derives all RGBA and material
counts directly from the current CSV and parses the file with the real editor.
Independent union-find tests confirm two fruit bodies, one combined four-neighbor
component and no single-bead digital cut point.

These topology checks do not prove fused strength. Physical assembly and ironing
remain untested; no hanging, wearable, durability, age or completion-time claim
is made. The counting PNG is not an actual-size placement template. A4/Letter PDF
filenames are pending references only; PDF generation and acceptance are separate.
Keep visual/publication receipts in private operations records, and clean the
disposable preview after acceptance.
