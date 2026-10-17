# Brick mosaic PDF font

Separate, renamed static Regular subset of Noto Sans JP under SIL OFL 1.1.
Copyright and license notices remain in the font and OFL.txt. It covers the
four-language brick-mosaic copy and printable ASCII. No existing font is changed.
source.json pins the upstream revision, checksums, builder and exact characters.

Maintenance: run scripts/build-brick-mosaic-font.py with fonttools==4.60.1.
Use --check-only to verify; first creation requires --work-dir outside the repo.
Complete upstream font files are not shipped. This subset is fetched only when
the user requests a PDF, never by page text, a server function or Next Image.
