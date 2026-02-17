#!/usr/bin/env python3
"""Generate responsive WebP variants for images in `resume-images/`.

Creates files like `page-01-480.webp`, `page-01-800.webp`, `page-01-1200.webp`.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / 'resume-images'
SIZES = [480, 800, 1200]

def convert_image(p: Path):
    try:
        im = Image.open(p)
    except Exception as e:
        print(f"Unable to open {p}: {e}")
        return
    base = p.stem
    for w in SIZES:
        out = IMG_DIR / f"{base}-{w}.webp"
        # compute height preserving aspect ratio
        iw, ih = im.size
        if iw <= w:
            resized = im.copy()
        else:
            h = int(ih * (w / iw))
            resized = im.resize((w, h), Image.LANCZOS)
        try:
            resized.save(out, 'WEBP', quality=85, method=6)
            print(f"Wrote {out} ({w}px)")
        except Exception as e:
            print(f"Failed to write {out}: {e}")

def main():
    if not IMG_DIR.exists():
        print(f"No image directory: {IMG_DIR}")
        return 1
    # Prefer original PNG if present, otherwise use existing webp
    candidates = sorted(IMG_DIR.glob('page-*.png')) + sorted(IMG_DIR.glob('page-*.webp'))
    if not candidates:
        print("No source images found (page-*.png or page-*.webp)")
        return 1
    # Use unique base names
    seen = set()
    for p in candidates:
        base = p.stem
        # strip any -width suffix if present (e.g., page-01-480)
        base_no_size = base
        for s in SIZES:
            suffix = f"-{s}"
            if base_no_size.endswith(suffix):
                base_no_size = base_no_size[: -len(suffix)]
        if base_no_size in seen:
            continue
        seen.add(base_no_size)
        # find the primary file for this base (prefer PNG, then webp)
        primary = IMG_DIR / (base_no_size + '.png')
        if not primary.exists():
            primary = IMG_DIR / (base_no_size + '.webp')
        if primary.exists():
            convert_image(primary)
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
