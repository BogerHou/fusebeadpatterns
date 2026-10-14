# Original strawberry source pack

`generate-original-strawberry-sourcepack.mjs` independently draws an ordinary
strawberry from explicit rows on one 29 × 29 Perler Midi board. No external image,
tracing, named character or generated raster is used. The red fruit narrows toward
the bottom; its green stem and leafy cap connect to the fruit, and twelve pale
yellow seed cells are filled beads, not holes.

The motif occupies columns 6–24 and rows 5–26 (one-based), 19 × 22 cells. It uses
296 beads: 216 Red `80-19005`, 68 Dark Green `80-19010`, and 12 Pastel Yellow
`80-19056`. Colors and RGB values come from the existing `public/palettes/perler.csv`.
Screen colors are approximate. A nominal 5 mm pitch gives a 95 × 110 mm motif
footprint, not the measured size of a fused object.

Preview first in an exclusively created task directory:

```sh
node scripts/generate-original-strawberry-sourcepack.mjs \
  --preview-output /tmp/original-strawberry-candidate-unique
```

After the root agent reviews that actual PNG, freeze `REVIEWED_ROWS_SHA256` to
the reviewed explicit row hash. The final generator refuses to proceed otherwise.
The canonical source pack is the main project's Git-ignored
`artifacts/pattern-samples/2026-10-13/original-strawberry-v1`; use an absolute path
when running from a worktree. It refuses existing directories and public paths,
including symlink aliases. The CLI also requires Git ignore coverage.

```sh
node scripts/generate-original-strawberry-sourcepack.mjs --output "$PACK"
node scripts/generate-original-strawberry-sourcepack.mjs --output "$PACK" --check-only
node --test scripts/generate-original-strawberry-sourcepack.test.mjs
```

The immutable pack contains native RGBA PNG, preview PNG, counting SVG/PNG,
editable project, manifest, editorial entry, candidate asset map, README and
digital QA receipt. Source-pack checks use the real editor project parser and
compare every native/preview pixel, materials, zeroed transparent pixels,
metadata and recorded hashes. Extra files and symlinks are rejected. PDF paths
in the source map are only pending filenames; the pack contains no PDF approval.

There is one four-neighbor component and no single-bead digital cut point.
These checks do not prove fused strength. Physical assembly and ironing have
not been tested; no hanging, wearable, durability, age or completion-time claim
is made. Keep publication and visual-review receipts separately in private
operational records, and remove disposable previews after acceptance.
