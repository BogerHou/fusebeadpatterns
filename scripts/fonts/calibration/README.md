# Fuse Bead Calibration fonts

These regular (400) and bold (700) TrueType files are small renamed derivatives
of the pinned Google Fonts Noto Sans JP source listed in `source.json`.
SIL Open Font License 1.1 permits embedding/subsetting; keep `OFL.txt` with source
copies. The reserved upstream family name is not used for these derivatives.

Only the German, French and Japanese calibration worksheet labels plus ASCII
are included. PDF files embed the required glyphs; SVG labels use vector outlines
and native accessible labels. No system Japanese fonts are needed for either.

Recreate only through `scripts/build-localized-print-calibration.py --prepare-font`,
which verifies source/license checksums, instantiates weights 400/700, subsets the
exact labels and renames the family. The complete source font is kept in memory;
normal builds/checks use these files offline. Do not replace the separate fonts
used by the existing pattern-library or editor PDF exports.
