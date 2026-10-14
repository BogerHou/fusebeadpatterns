# Strawberry downloads

The strawberry's independently reviewed source pack is documented in
`README-original-strawberry-sourcepack.md`. Only its new resources are added;
old catalog objects, indexed metadata, fonts and downloads remain unchanged.

The four subject names are Strawberry, Erdbeere, Fraise and いちご. All four
languages have A4 and US Letter PDFs with the same 29 × 29 grid at a nominal
5 mm pitch, all 296 bead symbols, color references and counts, and horizontal
and vertical 50 mm print checks. Empty cells need no bead. These are digital
printing checks, not a physical assembly or ironing test.

Use an explicit canonical private `PACK`, an exclusive disposable `STAGING`
root and Python with ReportLab, pypdf, pdfplumber and Pillow. Initial font creation
also needs fontTools 4.60.1. The dedicated `strawberry-labels` font and glyph
outlines are renamed OFL derivatives from pinned upstream bytes. They do not
replace any previously published font.

```sh
node scripts/generate-original-strawberry-sourcepack.mjs --output "$PACK" --check-only
node scripts/build-strawberry-localized-charts.mjs --pack "$PACK" \
  --output "$STAGING/generated-strawberry-charts" --python "$PDF_PYTHON" --build-font
"$PDF_PYTHON" -B scripts/build-strawberry-pdfs.py --pack "$PACK" \
  --output "$STAGING/generated-strawberry-pdfs"
```

Run the PDF skill's artifact-operation marker before the first PDF authoring
command. `--font-characters` does not author PDFs. The initial font builder
refuses an existing font directory; omit `--build-font` for later reconstruction.
Use `--check-only` on each existing staging output for immutable verification.
Changed copy requires an explicitly reviewed font inventory instead of silently
reusing stale glyph coverage.

Inspect all eight PDFs and all three translated counting charts before
promotion. Each PDF is checked for exact native cell colors and symbols,
grid spacing, calibration, paper size, language, glyphs, text bounds and link.
Translated PNGs retain the source drawing pixels and add outlined native labels.
Their SVG counterparts remain rebuildable; PNGs are counting references rather
than actual-size placement templates.

Publish only 19 reviewed new files: five source assets and two English PDFs at
`public/patterns/original-strawberry`, plus PNG/SVG and A4/Letter PDF pairs at
each `public/patterns-{de,fr,ja}/original-strawberry`. Add one catalog entry,
editor allowlist entry, language-route slug and three chart-manifest entries.
Do not run the historical whole-library generator or refresh its frozen locks.
Protect all 118 earlier entries and every earlier resource and URL. Remove
staging copies, test downloads and renders once their necessary acceptance
evidence and committed outputs have been retained.
