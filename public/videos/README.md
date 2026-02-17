# Video Assets Directory

This directory contains video assets for the TradeHax AI platform.

## Required Videos

### Hero Background Video
- **File:** `hero-background.mp4` and `hero-background.webm`
- **Recommended specs:**
  - Resolution: 1920x1080 (1080p)
  - Duration: 10-30 seconds (looping)
  - File size: < 5MB (compressed)
  - Codec: H.264 (MP4), VP9 (WebM)
  - Frame rate: 30fps
  - Content: Abstract tech/blockchain animations, trading charts, or dark ambient scenes

### Game Trailer (Optional)
- **File:** `game-trailer.mp4`
- **Purpose:** Promotional video for Hyperborea game

### Promo Loop (Optional)
- **File:** `promo-loop.mp4`
- **Purpose:** General promotional content

## Video Optimization Tips

1. **Compress videos** using tools like HandBrake or FFmpeg:
   ```bash
   ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset slow output.mp4
   ```

2. **Create WebM versions** for better browser support:
   ```bash
   ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 output.webm
   ```

3. **Test loading** on slow connections to ensure good UX

4. **Add fallback images** in `/public/images/` directory

## Fallback Image
If video fails to load, the hero section will fall back to gradient backgrounds.
Optionally add `hero-fallback.jpg` in `/public/images/` for a static background.

## Current Status
⚠️ Video files not included in repository due to size. Add your own videos following the specs above.
