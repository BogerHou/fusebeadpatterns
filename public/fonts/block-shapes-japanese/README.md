# Block-shape planner Japanese PDF font

This separate static Regular subset is derived from Noto Sans JP, distributed
under SIL Open Font License 1.1. The derivative is renamed **Fuse Bead Block Shapes Japanese**.
The original copyright and license notices are retained in the font and OFL.txt.
It does not replace or alter any existing website font.

- Upstream: https://github.com/google/fonts
- Fixed revision: `66a36c8c94b1a5d992ee4e7f392fccfe4945767c`
- Upstream font SHA-256: `c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f`
- OFL SHA-256: `1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9`
- Derivative SHA-256: `41855358072d9eec7116df9705eb2897328cdf2e3f0981eced22faf6ef062cbe`
- fontTools: `4.60.1`; static weight 400; original source timestamps retained.
- Inventory: all 107 Japanese copy fields, including steps and
  notes, plus printable ASCII U+0020 through U+007E: 386 characters.
- Inventory source: `src/lib/block-shapes/copy.ts`; source.json records the
  exact sorted character set and its SHA-256.

Use an isolated environment with `fonttools==4.60.1`. From the repository:

```sh
python scripts/build-block-shapes-japanese-font.py --check-only
python scripts/build-block-shapes-japanese-font.py --work-dir /absolute/task-temp-directory --verify-rebuild
```

The second command downloads checksum-pinned upstream files into the explicit
temporary directory and reproduces the subset in memory without replacing it.
For an intentional reviewed inventory change, use `--rebuild --work-dir ...`.
First creation uses `--work-dir ...` without either verification/rebuild flag.
No complete upstream font is shipped. Clean up the task temporary directory
after verification; keep this subset, its source record and OFL license.

The font is fetched only for Japanese block-shape PDF generation. It is not
used for ordinary page text, other tools, server image processing or Next Image.
