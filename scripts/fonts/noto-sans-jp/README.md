# Japanese printable pattern font

The checked-in `FuseBeadJapanese-Regular.ttf` is a static weight-400 subset of
Google Fonts' Noto Sans JP. The derivative family is renamed **Fuse Bead Japanese**.
The upstream copyright and SIL Open Font License 1.1 are preserved in `OFL.txt`
and in the font's name records. The font is licensed for embedding and redistribution.
The offline PDF builder embeds it. The Japanese generator also lazily loads an
identical licensed copy from `public/fonts/fuse-bead-japanese/` when exporting a
PDF; it is not a general-purpose UI font. The subset only covers fixed print copy
and the characters used in the reviewed static patterns, not arbitrary user text.

Official source and immutable revision:

- [Google Fonts Noto Sans JP](https://github.com/google/fonts/tree/66a36c8c94b1a5d992ee4e7f392fccfe4945767c/ofl/notosansjp)
- `source.json` records the upstream URLs, SHA-256 checksums, revision, weight and license.

## Regenerate PDFs offline

From the repository root, with Python 3.12:

```sh
python3 -m venv /tmp/fusebead-japanese-pdf-venv
/tmp/fusebead-japanese-pdf-venv/bin/pip install reportlab==4.4.9 Pillow==12.3.0 pypdf==6.10.0 pdfplumber==0.11.9
/tmp/fusebead-japanese-pdf-venv/bin/python scripts/build-japanese-pattern-pdfs.py
/tmp/fusebead-japanese-pdf-venv/bin/python scripts/check-japanese-pattern-pdfs.py
```

Dependency installation needs network access; both scripts then run offline. They
read only the committed catalog, localization, original PNG/project files, and this
committed font. No private data, old study packs, system fonts or full upstream font
are needed. The builder creates only `public/patterns-ja/{id}/pattern.pdf`, embeds
the required font glyphs, uses deterministic PDF metadata, and does not alter any
original English library asset or the editor export. The checker independently
reads the resulting PDF geometry, symbols, materials and fonts against the original
pixels/catalog. Use `pdftoppm -png` for visual review after layout or content changes.

## Refresh the font subset when adding Japanese characters

The builder rejects text containing glyphs missing from the committed subset. To
add characters, update the localization or builder copy, then explicitly run:

```sh
/tmp/fusebead-japanese-pdf-venv/bin/pip install fonttools==4.60.1
/tmp/fusebead-japanese-pdf-venv/bin/python scripts/build-japanese-pattern-pdfs.py --refresh-font
```

This optional maintenance operation fetches the pinned official font and license,
verifies both checksums, instantiates weight 400, subsets the characters used by the
Japanese localization/copy plus ASCII, and renames the font. The full font is held
only in memory; no extra download is left behind. The regular offline build remains
self-contained. Re-run the acceptance checker and render all 12 pages before using
the refreshed PDFs. Keep this license with the font whenever redistributing it.

## Print contract

Each PDF is one A4 page. The 29 × 29 grid is 145 × 145 mm with a 5 mm pitch; a
separate calibration line is exactly 50 mm. Print at 100% / actual size. Physical
bead assembly and ironing have not been tested. The Japanese color names are
reading aids; the existing Perler brand/color numbers are the purchasing reference.
