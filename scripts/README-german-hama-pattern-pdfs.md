# German Hama pattern PDFs

Run `python3 scripts/build-german-hama-pattern-pdfs.py` with `reportlab`,
`Pillow`, `pypdf` and `pdfplumber` available. `--check-only` verifies existing
outputs; `--qa-report PATH` optionally saves one private digital-check receipt.
Use the bundled Python runtime when those packages are unavailable elsewhere.
Output is deterministic; no network calls or downloaded fonts are needed.

The script reads the six German names from
`src/lib/patterns/german-hama.json`, the existing `patterns-hama` project/PNG
assets and `public/palettes/hama.csv`. It writes only
`public/patterns-de-hama/{id}/pattern.pdf` for the soccer ball, ghost, bat,
Christmas tree, snowman and gingerbread man. It does not generate a new
pattern, rematch colours or modify any existing public asset.

Each single-page A4 PDF has a numbered 29 x 29 grid with 5 mm cells,
per-cell symbols, German colour names, original English palette names and
material counts. Official Hama numbers are printed without the editor's
internal `H` prefix; the prefix is explained separately. Printing instructions
require actual size / 100%, no fit-to-page, both 50 mm reference rulers and
comparison with the user's physical pegboard. These are independent designs,
not official Hama products, and have not been assembled or ironed for testing.

The build checks the original project and PNG bytes, the already-published
Perler-to-Hama mapping, every PDF colour cell and symbol, material counts,
four-way connectivity, A4 geometry, all grid lines, both rulers, page bounds,
German glyphs, link destinations, metadata and preserved source/public files.
It uses built-in Helvetica and does not embed downloaded fonts. After any
layout or copy change, render all six PDFs with Poppler and inspect every page.
Digital checks do not establish physical bead colour, pegboard fit or strength.

Existing German Pokémon PDFs under `patterns-de` retain their own builder
and metadata. Do not rebuild those, French PDFs or English Hama PDFs as part
of this command. This command does not publish the new PDFs or their page.
