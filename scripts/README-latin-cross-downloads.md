# Cross downloads

`original-latin-cross` is an independent plain Latin cross with a longer lower arm. Its fixed source is produced by `generate-original-latin-cross-sourcepack.mjs`. The 13 × 19 motif uses 87 Brown Perler Midi beads (80-19012) on one 29 × 29 board. Transparent pixels have zero RGB. Digital connectivity does not establish physical strength. Assembly, ironing and hanging remain untested.

Keep the canonical pack in the Git-ignored main project `artifacts/pattern-samples/2026-10-11/original-latin-cross-v1`. Do not append PDFs or approval records to the immutable pack. Record later review and publication separately in private operational evidence.

## Rebuild and check

Use explicit absolute arguments for `PACK`, a disposable staging root, and a Python with ReportLab, pypdf, pdfplumber and Pillow. The initial font build additionally needs fontTools **4.60.1**. The dedicated `latin-cross-labels` font, glyph outlines, license and source lock serve only this pattern; existing fonts stay unchanged.

```sh
node scripts/generate-original-latin-cross-sourcepack.mjs --output "$PACK" --check-only
node scripts/build-latin-cross-localized-charts.mjs --pack "$PACK" --output "$STAGING/generated-latin-cross-charts" --python "$PDF_PYTHON"
"$PDF_PYTHON" -B scripts/build-latin-cross-pdfs.py --pack "$PACK" --output "$STAGING/generated-latin-cross-pdfs"
```

The initial `--build-font` pins the official Google Fonts revision and source hashes, checks glyph coverage, and refuses to overwrite its dedicated font. Ordinary rebuilds reuse the committed font. Native chart and PDF character sets have separate hashes in the shared lock.

Each builder's `--check-only` checks existing staging outputs without rewriting them. `--font-characters` only reads the required print characters. PDF validation checks all 87 cell colors and symbols, every 5 mm grid line, both 50 mm rulers, page dimensions, glyphs, language, exact text and the localized detail link. The PDF adapter reuses the established coaster renderer without modifying its copy or outputs. Native charts preserve the original drawing pixels and use singular color labels.

Render and visually review all eight PDFs and all three native charts before promoting them. English PDFs map to `/patterns/original-latin-cross/{pattern.pdf,pattern-letter.pdf}`; native outputs map to `/patterns-{de,fr,ja}/original-latin-cross/{grid.png,grid.svg,pattern.pdf,pattern-letter.pdf}`. The five original non-PDF resources follow `candidate-assets.json`.

Promote only these 19 verified new resources. Protect existing URLs, indexed-page metadata, downloads, catalogue entries and sitemap records. Run project checks and browser download/editor/brand-switch checks. Keep the canonical pack, committed assets and minimal private QA evidence; remove staging copies and renders after review.
