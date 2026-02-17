#!/usr/bin/env python3
"""Convert PNGs in `resume-images/` to WebP.

Creates `resume-images/*.webp` next to existing PNGs.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / 'resume-images'

def main():
    if not IMG_DIR.exists():
        print(f"No resume-images directory at {IMG_DIR}")
        return 1
    files = sorted(IMG_DIR.glob('*.png'))
    if not files:
        print("No PNG files found to convert.")
        return 1
    for p in files:
        out = p.with_suffix('.webp')
        try:
            im = Image.open(p)
            im.save(out, 'WEBP', quality=85, method=6)
            print(f"Wrote {out}")
        except Exception as e:
            print(f"Failed {p}: {e}")
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
