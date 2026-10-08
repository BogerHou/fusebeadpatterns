# 29 x 29 print calibration and practice grid

Choose the file that matches your paper:

- `29x29-5mm-a4.pdf` / `.svg`: A4, 210 x 297 mm.
- `29x29-5mm-us-letter.pdf` / `.svg`: US Letter, 215.9 x 279.4 mm (8.5 x 11 in).

The PDF is the preferred print version. SVG is a vector alternative with its physical
width and height set in millimetres; applications may still resize it when opening,
placing or printing. Do not print a screenshot or resize the SVG to a selection.

## Print, then measure

1. Select the matching paper size, portrait orientation and one page per sheet.
2. Print at **Actual size / 100%**. Turn off Fit, Shrink, automatic scaling and
   borderless enlargement. Check both the viewer settings and the printer settings.
3. Use a separate physical ruler to measure the printed horizontal and vertical
   references. Each must be **50 mm from the centre of its first end tick to the
   centre of its last end tick**. Do not measure this file on a screen.
4. If either reference is wrong, correct the paper/scaling settings and print again.
   If only one axis is wrong, investigate skewing or unequal scaling rather than
   using a single enlargement percentage.
5. If the file is clipped at 100%, use a printer with a suitable printable area.
   Do not choose Fit just to make the clipping disappear.
6. When both references measure correctly, compare the cell centres with the actual
   pegs in both directions. Check alignment across the whole board, not only at one
   corner. If the spacing does not match, use the row and column numbers as a
   counting reference instead of an under-board template.

## What the measurements mean

There are **29 cells and 30 boundary lines** in each direction. The nominal cell
pitch is **5 mm**. Ten cell widths span 50 mm; the complete grid spans
145 x 145 mm. The distance between the first and last of the 29 cell centres is
28 x 5 = **140 mm**. Beads, when planning with this grid, correspond to cell centres,
not the intersections of the boundary lines.

The worksheet is a blank planning and counting aid. Shade cells to draft your own
design, record a row/column, or practise counting before selecting bead colours.
It contains no character artwork or finished project instructions.

All content is inside a designed **15 mm inset**: 180 x 267 mm on A4 and
185.9 x 249.4 mm on US Letter. That is a file-layout choice, not a guarantee of a
printer's printable area. The PDF also requests `PrintScaling=None`, but the print
application or driver may ignore this preference; the ruler check remains required.

The file geometry has been checked digitally. **Physical printing, pegboard fit,
and finished bead projects have not been tested.** A nominal 5 mm grid is not a
promise of compatibility with any brand, size, board or printer. Follow your bead
manufacturer's instructions separately for handling and ironing.

## Use and source

Original worksheet by Fuse Bead Patterns team, https://fusebeadpatterns.art/.
You may print and share the worksheet for personal, classroom and library use.
Keep the source and measurement notes with shared copies. This permission covers
these worksheets only, not unrelated designs, logos or third-party artwork.

The generator is `scripts/build-print-calibration.py` in the project source.
It uses ReportLab's core PDF fonts and no downloaded artwork or distributed font
files. No registration, tracking link or paid material is required to use the files.
