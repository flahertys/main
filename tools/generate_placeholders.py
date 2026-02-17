#!/usr/bin/env python3
"""Generate tiny low-res WebP placeholders for resume images.

Creates files like `page-01-40.webp` in `resume-images/`.
"""
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / 'resume-images'
PLACEHOLDER_WIDTH = 40

def make_placeholder(p: Path):
    try:
        im = Image.open(p)
    except Exception as e:
        print(f"Unable to open {p}: {e}")
        return
    iw, ih = im.size
    if iw <= PLACEHOLDER_WIDTH:
        small = im.copy()
    else:
        h = int(ih * (PLACEHOLDER_WIDTH / iw))
        small = im.resize((PLACEHOLDER_WIDTH, h), Image.LANCZOS)
    # apply slight blur to hide artifacts
    small = small.filter(ImageFilter.GaussianBlur(radius=1))
    out = IMG_DIR / (p.stem + f'-{PLACEHOLDER_WIDTH}.webp')
    try:
        small.save(out, 'WEBP', quality=50, method=6)
        print(f"Wrote placeholder {out}")
    except Exception as e:
        print(f"Failed to write {out}: {e}")

def main():
    if not IMG_DIR.exists():
        print(f"No image directory: {IMG_DIR}")
        return 1
    candidates = sorted(IMG_DIR.glob('page-*.png')) + sorted(IMG_DIR.glob('page-*.webp'))
    if not candidates:
        print("No source images found")
        return 1
    seen = set()
    for p in candidates:
        base = p.stem
        # strip any -size suffix
        for s in ['-480','-800','-1200','-40']:
            if base.endswith(s):
                base = base[: -len(s)]
        if base in seen:
            continue
        seen.add(base)
        primary_png = IMG_DIR / (base + '.png')
        primary_webp = IMG_DIR / (base + '.webp')
        primary = primary_png if primary_png.exists() else primary_webp if primary_webp.exists() else p
        make_placeholder(primary)
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
