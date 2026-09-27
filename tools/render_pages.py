"""Renders the PDF book pages to the JPG images the site displays.

Usage (from the project folder):  python tools/render_pages.py [--force]
Requires: pip install pymupdf
Images are saved as pages/<book>/NNN.jpg (numbered by PDF page).
"""
import os
import sys

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS = {
    "grammar": "Grammar for IELTS (with answers, Hopkins & Cullen).pdf",
    "vocabulary": "Vocabulary for IELTS (Pauline Cullen).pdf",
}
DPI = 130
QUALITY = 72


def main():
    for key, name in BOOKS.items():
        src = os.path.join(ROOT, name)
        if not os.path.exists(src):
            print(f"[!] Not found: {name}")
            continue
        out_dir = os.path.join(ROOT, "pages", key)
        os.makedirs(out_dir, exist_ok=True)
        doc = pymupdf.open(src)
        for i, page in enumerate(doc, start=1):
            out = os.path.join(out_dir, f"{i:03d}.jpg")
            if os.path.exists(out) and "--force" not in sys.argv:
                continue
            page.get_pixmap(dpi=DPI).save(out, jpg_quality=QUALITY)
            print(f"\r{key}: {i}/{doc.page_count}", end="", flush=True)
        print(f"\r{key}: {doc.page_count} pages ready.        ")


if __name__ == "__main__":
    main()
