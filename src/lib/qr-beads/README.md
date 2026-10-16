# QR code bead patterns

This tool is isolated from the existing editor's import, palette matching and printer.
All payload encoding, image rendering, decoding, project files and PDF generation run
in the browser. Text, URLs and file names must never be added to telemetry or links.

## Sources and limits

- Model 2 QR encoding: Project Nayuki, pinned upstream source in `vendor/` (MIT).
- Independent image decoding: `jsqr@1.4.0` (Apache-2.0), pinned in package-lock.
  It receives the decoded pixels of the actual rendered PNG, not the encoder matrix.
  Its upstream default branch was last updated in 2021; a decode failure is reported,
  and no scan result is a promise about an ironed bead object or every phone.
- QR standard guidance: DENSO WAVE,
  https://www.qrcode.com/en/howto/code.html/index.html and
  https://www.qrcode.com/en/about/version.html/versionPage/error_correction.html .
  A minimum four-module quiet zone is included on every edge and counted as light
  beads. Error correction levels describe codeword recovery, not a permission to
  remove a percentage of arbitrary beads.
- Palettes are existing editor RGB approximations. Artkal S (5 mm) uses the existing
  50-by-50 reference board; Perler and Hama Midi use 29-by-29 boards.

An image for scanning has opaque, flat cells at an integer pixel scale, with no grid
or symbols. The separate counting chart and PDF board pages are construction aids.
The project file contains the QR generator state as well as the editor draft.
Reopening generator metadata must reject a file whose draft has since been edited.

Test digital exports independently. A phone scan of an actual ironed object and a
physical print calibration remain separate checks; do not claim them from unit tests.
There are no new runtime APIs, server image conversions, camera permissions or
third-party QR services.
