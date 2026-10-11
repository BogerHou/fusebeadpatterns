# Black Cat downloads

`original-black-cat` is an independent ordinary sitting cat, not a named character. Its fixed source is produced by `generate-original-black-cat-sourcepack.mjs`. The 16 × 16 motif uses 181 Perler Midi beads (177 Black 80-19018, 4 ordinary Yellow 80-19003) on one 29 × 29 board. All transparent pixels have zero RGB. Digital connectivity is not proof of fused strength. Physical assembly and ironing remain untested.

Keep the canonical pack in the Git-ignored main project `artifacts/pattern-samples/2026-10-11/original-black-cat-v1`. Its original manifest, README and source QA describe the candidate when generated. Do not change them to record approval or add rendered PDF files inside it: its source check rejects additional files. Later publication and root image review are recorded separately in private operational evidence.

## Rebuild and check

Use explicit absolute arguments for `PACK`, a disposable staging root, and a Python with ReportLab, pypdf, pdfplumber and Pillow. The initial font build additionally needs fontTools **4.60.1**. The dedicated `black-cat-labels` font, glyph outlines, license and source lock serve only this pattern; old fonts stay unchanged.

```sh
node scripts/generate-original-black-cat-sourcepack.mjs --output "$PACK" --check-only
node scripts/build-black-cat-localized-charts.mjs --pack "$PACK" --output "$STAGING/generated-black-cat-charts" --python "$PDF_PYTHON"
"$PDF_PYTHON" -B scripts/build-black-cat-pdfs.py --pack "$PACK" --output "$STAGING/generated-black-cat-pdfs"
```

The font builder pins the Google Fonts source revision and both original file hashes, checks all glyphs, and refuses to overwrite its dedicated font. `--build-font` is only for the first reviewed inventory; ordinary rebuilds reuse the committed font. The shared inventory locks the native chart and PDF character sets independently. Changed copy requires a reviewed, separately named new font inventory.

Use each builder's `--check-only` against its existing staging output for immutable checks. `--font-characters` is read-only. PDF validation checks all 181 cell colors and symbols, every 5 mm grid line, both 50 mm rulers, page dimensions, embedded glyphs, language, exact text and the correct localized detail link. The black-cat adapter reuses the established coaster renderer without changing the coaster copy or assets. Native chart validation preserves the source drawing and its pixels exactly.

Render and visually review **all eight PDFs** and **all three native charts** before promoting them. The English outputs map to `/patterns/original-black-cat/{pattern.pdf,pattern-letter.pdf}`. German, French and Japanese outputs map to `/patterns-{de,fr,ja}/original-black-cat/{grid.png,grid.svg,pattern.pdf,pattern-letter.pdf}`. The five original non-PDF resources follow `candidate-assets.json`.

Only promote explicitly verified new files. Protect all old indexed-page metadata, downloads, catalogue entries and sitemap records. Run the full project checks and browser download/editor/brand-switch checks. Keep only the canonical source pack, committed assets and one private QA receipt; remove disposable staging copies and renders after review.
