# Original Christmas bauble print charts

`build-bauble-pdfs.py` creates eight independent English, German, French and Japanese A4 / US Letter charts from the reviewed private `original-bauble-v1` source pack. It never regenerates the pattern, writes public assets, changes the catalog or updates old fonts.

Use the bundled Python environment with Pillow, ReportLab, pypdf and pdfplumber:

```sh
python3 scripts/build-bauble-pdfs.py --pack "$BAUBLE_PACK" --preflight-only
python3 scripts/build-bauble-pdfs.py --pack "$BAUBLE_PACK"
python3 scripts/build-bauble-pdfs.py --pack "$BAUBLE_PACK" --check-only > "$BAUBLE_TASK/pdf-checks.json"
```

The first authoring operation requires the applicable PDF artifact approval marker. Generation uses exclusive output creation; existing charts are checked with `--check-only`, not overwritten. The original source manifest records its initial pending PDF placeholders; the actual eight files and current check report are the evidence of PDF delivery.

All eight charts retain the frozen 29 × 29 RGBA pattern, 362 beads, three Perler Midi colors and the nine empty cells at one-based columns 14–16 / rows 5–7. Validation checks individual cells, symbols, quantities, paper geometry, 5 mm pitch, both 50 mm rulers, text bounds, embedded Japanese glyphs, document language and `/PrintScaling /None`. Render and visually inspect every final PDF before copying it to a new public path. Compare each promoted file with its source bytes.

The Japanese labels use the separately named `scripts/fonts/bauble-jp` purpose subset with its pinned upstream source and license. Keep this font, the source pack and the maintenance scripts for rebuilding. Do not refresh another font directory or another pattern's downloads.

The top opening and frame are digitally checked only. Physical assembly, ironing, cooled opening size, cord fit and hanging strength remain untested. The chart includes cooling, threading and printing guidance without claiming tested physical dimensions.
