"""Finds the gaps (____ and ........ lines) on the book pages and writes data/gaps.js.

Usage: python tools/find_gaps.py                      -> data/gaps.js
       python tools/find_gaps.py --debug g 17 out.png -> preview image with the gaps marked
Each gap is stored as fractions of the page width/height: [x, y, w] (y = position of the line).
"""
import json
import os
import sys

import numpy as np
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS = {
    "grammar": "Grammar for IELTS (with answers, Hopkins & Cullen).pdf",
    "vocabulary": "Vocabulary for IELTS (Pauline Cullen).pdf",
}
DPI = 100


def runs(mask_row):
    """[start, end) ranges of the True values."""
    d = np.diff(np.concatenate(([0], mask_row.astype(np.int8), [0])))
    return list(zip(np.flatnonzero(d == 1), np.flatnonzero(d == -1)))


def clear_above(dark, y, x0, x1, rows=10):
    """True if there is no text above the line (checks the densest row)."""
    band = dark[max(0, y - rows):max(0, y - 2), x0:x1]
    return band.size == 0 or band.mean(axis=1).max() < 0.12


def solid_lines(gray, dark, text, h, w, min_len):
    """Solid lines such as ____."""
    light = gray < 215
    found = []
    for y in range(int(h * 0.04), int(h * 0.965)):
        for x0, x1 in runs(dark[y]):
            if x1 - x0 < min_len or x1 - x0 > w * 0.62:
                continue
            # Must be thin, with no text above it
            if dark[y + 3:y + 6, x0:x1].mean() > 0.06 or not clear_above(text, y, x0, x1):
                continue
            # An underline between lines of text: there is text right below it too
            below = text[y + 3:y + 9, x0:x1]
            if below.size and below.mean(axis=1).max() > 0.12:
                continue
            # Drop it if it is part of a longer, lighter line (a box border)
            ext = [r for r in runs(light[y]) if r[0] <= x0 + 2 and r[1] >= x1 - 2]
            if ext and ext[0][1] - ext[0][0] > max(w * 0.62, (x1 - x0) + 40):
                continue
            # Drop it if it touches a vertical line (a table/box corner)
            up = dark[max(0, y - 14):y - 1, :]
            if any(up[:, c].mean() > 0.7 for c in range(max(0, x0 - 4), min(w, x0 + 5))) or \
               any(up[:, c].mean() > 0.7 for c in range(max(0, x1 - 5), min(w, x1 + 4))):
                continue
            found.append((y, x0, x1))
    return found


def dotted_lines(gray, text, h, w, min_len):
    """Dotted lines such as ........: a chain of small dots with nothing above or below them."""
    dark = gray < 185
    found = []
    for y in range(int(h * 0.04), int(h * 0.965)):
        dots = []
        for x0, x1 in runs(dark[y]):
            if x1 - x0 > 4:
                continue
            if dark[y - 5:y - 2, x0:x1].any() or dark[y + 3:y + 6, x0:x1].any():
                continue
            dots.append((x0, x1))
        chain = []
        for d in dots + [(10 ** 9, 10 ** 9)]:
            if chain and d[0] - chain[-1][1] > 9:
                x0, x1 = chain[0][0], chain[-1][1]
                # Don't mistake underlined text (pencil marks) for a dotted line
                below = text[y + 3:y + 7, x0:x1]
                if len(chain) >= 6 and x1 - x0 >= min_len and clear_above(text, y, x0, x1, rows=8) \
                        and (below.size == 0 or below.mean(axis=1).max() < 0.12):
                    found.append((y, x0, x1))
                chain = []
            chain.append(d)
    return found


def merge(found):
    found.sort()
    merged = []
    for y, x0, x1 in found:
        for m in merged:
            if abs(m[0] - y) <= 4 and min(m[2], x1) - max(m[1], x0) > 0.3 * min(m[2] - m[1], x1 - x0):
                m[1], m[2] = min(m[1], x0), max(m[2], x1)
                m[0] = max(m[0], y)
                break
        else:
            merged.append([y, x0, x1])
    return merged


def detect(gray):
    h, w = gray.shape
    dark = gray < 150
    text = gray < 185  # small print can come out light grey in the scan
    min_len = int(w * 0.045)
    lines = merge(solid_lines(gray, dark, text, h, w, min_len) + dotted_lines(gray, text, h, w, int(w * 0.03)))
    return [[round(x0 / w, 4), round(y / h, 4), round((x1 - x0) / w, 4)] for y, x0, x1 in lines]


def page_gray(doc, i):
    pix = doc[i].get_pixmap(dpi=DPI, colorspace=pymupdf.csGRAY)
    return np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.stride)[:, :pix.width]


def main():
    if "--debug" in sys.argv:
        key = "grammar" if sys.argv[2] == "g" else "vocabulary"
        doc = pymupdf.open(os.path.join(ROOT, BOOKS[key]))
        out = sys.argv[4] if len(sys.argv) > 4 else "debug.png"
        pno = int(sys.argv[3])
        page = doc[pno - 1]
        gaps = detect(page_gray(doc, pno - 1))
        r = page.rect
        for x, y, gw in gaps:
            page.draw_rect(pymupdf.Rect(x * r.width, y * r.height - 11, (x + gw) * r.width, y * r.height + 1), color=(1, 0, 0), width=1.2)
        page.get_pixmap(dpi=90).save(out)
        print(len(gaps), "gaps")
        return
    result = {}
    for key, name in BOOKS.items():
        doc = pymupdf.open(os.path.join(ROOT, name))
        pages = {}
        for i in range(doc.page_count):
            g = detect(page_gray(doc, i))
            if g:
                pages[i + 1] = g
            print(f"\r{key}: {i + 1}/{doc.page_count}", end="", flush=True)
        print()
        result[key] = pages
    path = os.path.join(ROOT, "data", "gaps.js")
    with open(path, "w", encoding="utf-8") as f:
        f.write("// Generated by tools/find_gaps.py. PDF page -> [[x, y, width], ...] (fractions of the page)\n")
        f.write("window.GAPS = " + json.dumps(result, separators=(",", ":")) + ";\n")
    total = sum(len(v) for b in result.values() for v in b.values())
    print("total gaps:", total, "->", path)


if __name__ == "__main__":
    main()
