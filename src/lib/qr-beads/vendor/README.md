# QR Code generator source

Source: Project Nayuki, `QR-Code-generator`.

- Official project: https://www.nayuki.io/page/qr-code-generator-library
- Commit: `3c6d0b3cefb4e049dc337e82237c9644399716a8` (2026-08-31).
- Original file: https://raw.githubusercontent.com/nayuki/QR-Code-generator/3c6d0b3cefb4e049dc337e82237c9644399716a8/typescript-javascript/qrcodegen.ts
- Original SHA256: `1dc03fb5a10e0e2318ea162755bbdb9977ca6ce52cff959e9c9b6deafdccda9c`.
- Original UTF-8 size: 41,022 bytes; 990 lines.
- License: MIT. The complete upstream notice remains in `qrcodegen.ts`; `LICENSE` is an exact copy of that source notice.

The algorithm is preserved. `UPSTREAM.patch` contains the exact complete unified diff from the pinned upstream file. Its adaptations are one ESLint comment and `export` on all three declarations of the merged namespace:

```diff
+/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-unused-vars, prefer-const -- Preserve the upstream MIT-licensed QR implementation. */
 /*
  * QR Code generator library (TypeScript)
-namespace qrcodegen {
+export namespace qrcodegen {
-namespace qrcodegen.QrCode {
+export namespace qrcodegen.QrCode {
-namespace qrcodegen.QrSegment {
+export namespace qrcodegen.QrSegment {
```

The added ESLint comment applies only to this vendored file. It preserves the upstream namespace, mutable-array declarations, and unused callback argument rather than restyling the algorithm or weakening project rules. Exporting each declaration of the merged namespace allows normal local TypeScript imports without changing its structure. No QR encoding logic is changed, and there are no imports or runtime dependencies in this file.

`core.ts` selects UTF-8 ECI assignment 26, byte segments, the requested error-correction level without boosting, and automatic mask/version selection across versions 1–40. Geometry, bead colors, editor projects and exports are maintained outside the vendor file.

Verification uses the separate `jsqr` decoder on rendered RGBA data, not an encoder echo. Digital decoding does not prove a printed or fused-bead object can be scanned by a phone.
