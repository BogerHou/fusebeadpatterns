"""Apply a reviewed text-only correction to one published pattern PDF.

This is also imported by build-pattern-library.mjs so regeneration from the
unchanged source pack cannot restore internal study labels. The exact content
hash and five full PDF text operands form the allowlist; no drawing is rebuilt.
"""

import argparse
import hashlib
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject


PATTERN_ID = "ghost-cat-pumpkin"
ORIGINAL_CONTENT_SHA256 = "183355eaf4fadd81c1f73e47877f2485dbf6698f1c5b5d6e4db9399b809f9300"
PUBLIC_CONTENT_SHA256 = "cc573c4c16d0bbbc84c58ff911cebabdb8ed8ae37b704f6e375aa5fec0ddc5fb"
PUBLIC_SUBJECT = "Free printable Perler bead pattern with color key and actual-size grid"
REPLACEMENTS = (
    ("FUSE BEAD PATTERNS / STUDY 14", "FUSE BEAD PATTERNS / ORIGINAL DESIGN"),
    ("Original grid study. Not physically tested.", "Original design. Not physically assembled or iron-tested."),
    ("Original scene study. No named game or anime character depicted.", "Original design. No named game or anime character depicted."),
    ("Local source study / 2026-09-22 / Source provenance and editable projects included", "fusebeadpatterns.art | Pumpkin Hug Ghost Cat | Original design"),
    ("14 / 14", "1 / 1"),
)


def reviewed_public_content(pattern_id, contents):
    """Return approved content bytes; all other pattern IDs are unchanged."""
    if pattern_id != PATTERN_ID:
        return contents
    digest = hashlib.sha256(contents).hexdigest()
    if digest == PUBLIC_CONTENT_SHA256:
        return contents
    if digest != ORIGINAL_CONTENT_SHA256:
        raise ValueError("Unreviewed PDF drawing content for " + pattern_id)
    corrected = contents
    for old, new in REPLACEMENTS:
        old_operand = ("(" + old + ") Tj").encode("ascii")
        new_operand = ("(" + new + ") Tj").encode("ascii")
        if corrected.count(old_operand) != 1:
            raise ValueError("Expected exactly one reviewed PDF label: " + old)
        corrected = corrected.replace(old_operand, new_operand)
    if hashlib.sha256(corrected).hexdigest() != PUBLIC_CONTENT_SHA256:
        raise ValueError("Unexpected corrected PDF drawing content")
    return corrected


def clean_reviewed_pdf_page(page, pattern_id):
    """Replace content only for the allowlisted page and return its bytes."""
    original = page.get_contents().get_data()
    corrected = reviewed_public_content(pattern_id, original)
    if corrected != original:
        stream = DecodedStreamObject()
        stream.set_data(corrected)
        page.replace_contents(stream.flate_encode())
    return corrected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pattern-id", required=True, choices=[PATTERN_ID])
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    reader = PdfReader(args.source)
    if len(reader.pages) != 1:
        raise ValueError("Only the reviewed standalone one-page PDF is accepted")
    writer = PdfWriter()
    writer.add_page(reader.pages[0])
    expected = clean_reviewed_pdf_page(writer.pages[0], args.pattern_id)
    metadata = dict(reader.metadata or {})
    metadata["/Subject"] = PUBLIC_SUBJECT
    writer.add_metadata(metadata)
    # Validate before replacing an existing public download.
    import io
    buffer = io.BytesIO()
    writer.write(buffer)
    checked = PdfReader(io.BytesIO(buffer.getvalue()))
    if len(checked.pages) != 1 or checked.pages[0].get_contents().get_data() != expected:
        raise ValueError("Written PDF failed content verification")
    if list(checked.pages[0].mediabox) != list(reader.pages[0].mediabox):
        raise ValueError("Written PDF changed the page size")
    args.output.write_bytes(buffer.getvalue())
    print("Verified five public labels; all other drawing bytes preserved")


if __name__ == "__main__":
    main()
