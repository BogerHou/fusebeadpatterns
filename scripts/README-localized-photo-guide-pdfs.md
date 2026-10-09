# Photo guide PDF downloads

`build-localized-photo-guide-pdfs.py` creates nine A4 downloads at
`public/guides/photo-to-pattern/{de,fr,ja}/{stem}.pdf` for these unchanged projects:

- `cat-perler-29`: 667 beads, 11 colors, 2 pages.
- `cat-perler-58`: 2,726 beads, 13 colors, 6 pages: reduced overview, materials,
  then four 29 × 29 board pages in top-left, top-right, bottom-left, bottom-right order.
- `rocket-perler-29-cleanup`: 337 beads, 31 colors, 3 pages: two material pages
  and one board. The existing sixteen Midnight outline corrections remain exact.

Every board page has vector 5 mm cells, original Perler symbols, continuous
global row/column numbers and a 50 mm check line. Empty RGBA positions remain
empty; occupied photo background positions count as beads. Materials retain
the manufacturer's original references and English product names. Labels and
printing directions are in German, French or Japanese. New PDFs use A4 at 100%,
with print scaling disabled in viewer preferences; users must measure the line
and compare their physical board. These practice conversions have not been
assembled or ironed. The old English counting PDFs, projects and grid PNGs are
protected by pinned hashes and are never modified by this script.

Ordinary build (offline) and independent file checks:

```sh
python3 scripts/build-localized-photo-guide-pdfs.py
python3 scripts/build-localized-photo-guide-pdfs.py --check-only --qa-report /private/task/path/data-checks.json
```

Requires `reportlab`, `pypdf`, and `pdfplumber`. Verification checks all source
RGBA cells, per-color counts and symbols, every board grid and check line,
paper dimensions, page language, text bounds, material rows and original asset
hashes. It does not replace rendering every resulting page for visual review.

The small, independently named `scripts/fonts/photo-guide-jp` subset embeds
selectable Japanese text and the original Perler symbols. The original OFL
license and immutable upstream checksums are included. To refresh explicitly:

```sh
python3 scripts/build-localized-photo-guide-pdfs.py --refresh-font
```

This additionally requires `fonttools==4.60.1` and network access. The full
checksum-verified original font remains in memory. No user text or project
pixels are sent externally. The derivative family is renamed and does not
modify the existing Japanese editor, library or website fonts.

Use the language switch on the same guide to access the retained English
counting PDFs; their enlarged geometry remains distinct from these new 5 mm
board pages. Existing Japanese lesson PDFs are also unaffected.
