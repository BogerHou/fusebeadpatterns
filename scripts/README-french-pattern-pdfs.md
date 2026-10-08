# French pattern PDFs

Run `python3 scripts/build-french-pattern-pdfs.py` with `reportlab`, `Pillow`,
`pypdf` and `pdfplumber` available. `--check-only` reads existing outputs;
`--qa-report PATH` optionally saves a digital-check receipt outside tracked source.
Output is deterministic. No fonts are downloaded or embedded.

The script reads French names from `src/lib/patterns/french-patterns.json` and
the already-reviewed project/pixel assets. It writes exactly nine A4 PDFs:

- `public/patterns-fr/{id}/pattern.pdf` for football, ghost and bat.
- `public/patterns-fr-hama/{id}/pattern.pdf` for the six IDs in `hama.json`.

It does not generate new colour matches, modify project data or replace any
other public asset. Hama numbers and symbols come from the existing Hama
projects and palette CSV. The `H` in editor IDs is explained separately from
the printed Hama colour number. Perler references remain unchanged.

The three previously published French Christmas PDFs under `patterns-fr`
remain byte-for-byte intact. Their independent rebuild command is the older
`build-french-christmas-pdfs.py`; do not run it as part of this nine-file build.
Those older files retain their original single scale line and Christmas URL.

Every new PDF has a 29×29 grid at 5 mm, two 50 mm scales, French printing
instructions, material counts and a non-official/unassembled notice. A build
checks grid cells, RGB, symbols, counts, geometry, text bounds, source project
and PNG agreement, four-way connectivity, and unchanged existing public files.
Render all nine PDFs with Poppler and inspect the pages after layout or copy
changes. Digital checks do not establish physical pegboard fit or ironed
strength. Publishing remains a separate step.
