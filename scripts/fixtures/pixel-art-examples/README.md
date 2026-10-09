# Real image-to-pixel examples

The twelve files under `public/guides/pixel-art-examples/` are actual browser
exports from the existing Pixel Grid tool, made on 9 October 2026 from commit
`b76a1420e5f48ef46bc5c5a1e5747e5b8a98a639`. They are digital pixel images,
not bead-palette conversions, printable pegboard charts, or AI restylings.

Sources are reused from `public/guides/photo-to-pattern/`; do not duplicate them:

- `rocket-source.png`: original AI-generated tutorial illustration, 1254 × 1254,
  SHA-256 `1217178b1fd4c61f32639309fac3f84636f1e945d8defa3f011ae596d1187059`.
- `cat-source.jpg`: unmodified 792 × 960 photograph by Anjeagotilla0920,
  Wikimedia Commons, CC0 1.0. Source, license and original hash are documented
  in `../photo-to-pattern/README.md`.

## Reproduce

Use **Keep proportions** and **Original colors**. Import the original source at
32 × 32, then use **64 × 64** to reconvert the same original source. Export
**Save original-size PNG** and **Save editable project** for both sizes.
At 64 × 64 choose **Up to 16 colors**, then **Reconvert original image** and save
both formats again. Do not crop, retouch, paint, apply a bead palette, or resize
the 64-pixel result to manufacture the 32-pixel example.

Rename the downloads to `{rocket|cat}-32-original`, `-64-original`, and
`-64-16-colors`, with `.png` and `.pixel-grid.json` extensions. The four language
pages share these same six pairs; JSON contains no prose or locale metadata.

Browser image decoding is part of the result. The photo has an embedded color
profile and the illustration has partial transparency. An offline image decoder
must not be substituted and described as byte-identical to the real tool.

## Verified output

| Example | Size | Visible RGB colors | Transparent cells | Partly transparent cells |
| --- | --- | ---: | ---: | ---: |
| rocket-32-original | 32 × 32 | 163 | 691 | 330 |
| rocket-64-original | 64 × 64 | 406 | 2774 | 1316 |
| rocket-64-16-colors | 64 × 64 | 16 | 2774 | 1316 |
| cat-32-original | 32 × 32 | 538 | 192 | 0 |
| cat-64-original | 64 × 64 | 1622 | 704 | 0 |
| cat-64-16-colors | 64 × 64 | 16 | 704 | 0 |

Each PNG is RGBA8 at the grid's original size, with no grid lines. Independent
PNG decompression, CRC checks and every RGBA byte match its paired v1 project.
Actual `parseProject` / `serializeProject` round trips are exact. Both reduced
projects match `reducePixelGridColors(original64, 16)` exactly; every alpha
channel and fully transparent pixel's hidden RGB remain unchanged. A color cap
means **at most** that many visible RGB colors, not a promised fixed count.

The cat's fitted image occupies 26 × 32 or 53 × 64 cells; transparent margins
are 3 + 3 or 5 + 6 columns. Its photographed background remains. Projects contain
only `format`, `version`, `width`, `height`, and `pixels`, without original images,
conversion settings, or editing history. Page previews enlarge the true PNGs
with CSS `image-rendering: pixelated`.
