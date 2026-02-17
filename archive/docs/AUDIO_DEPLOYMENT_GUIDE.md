# Audio Deployment Guide for TradeHax

## Overview
This guide explains how audio files are managed and deployed across the TradeHax site and Hyperborea game.

## Audio Files Structure

### Main Repository
```
shamrockstocks.github.io/
├── Untitled.mp3                    # Source audio file (12MB)
├── tradehax-frontend/
│   └── public/
│       └── audio/
│           └── nordic-ambience.mp3 # Game audio source (12MB)
└── games/
    └── hyperborea/                 # Deployed game
        └── audio/
            └── nordic-ambience.mp3 # Deployed audio (12MB)
```

### Audio File Details
- **File Name**: `nordic-ambience.mp3` / `Untitled.mp3`
- **Size**: ~12MB
- **Format**: MP3 (MPEG ADTS, layer III, v1, 64 kbps, 48 kHz, Stereo)
- **Purpose**: Background ambient music for Hyperborea game
- **Style**: Nordic/Celtic atmospheric ambient

## Deployment Process

### 1. Updating Audio Files

When updating the game's background music:

```bash
# 1. Update the source audio in tradehax-frontend
cp /path/to/new-audio.mp3 tradehax-frontend/public/audio/nordic-ambience.mp3

# 2. Verify file is in place
ls -lh tradehax-frontend/public/audio/nordic-ambience.mp3

# 3. Build the frontend (Vite will automatically copy public/ folder to dist/)
cd tradehax-frontend
npm run build

# 4. Deploy to games/hyperborea/
cd ..
cp -r tradehax-frontend/dist/* games/hyperborea/

# 5. Commit and push changes
git add games/hyperborea/audio/
git commit -m "Update Hyperborea game audio"
git push origin main
```

### 2. Using Deployment Scripts

The repository includes automated deployment scripts:

#### Bash (Linux/Mac)
```bash
./deploy-hyperborea.sh
```

#### PowerShell (Windows)
```powershell
./deploy-hyperborea.ps1
```

These scripts will:
1. Deploy backend to Vercel
2. Configure frontend environment
3. Build frontend (including audio files from public/)
4. Deploy frontend to `games/hyperborea/`
5. Commit and push changes

**Note**: The scripts have been updated to correctly deploy to `games/hyperborea/` instead of the previous incorrect path `docs/game/`.

## Audio Integration in Hyperborea Game

### Code Reference
File: `tradehax-frontend/src/App.jsx`

```javascript
// Audio is loaded at line 404
const audioPath = '/audio/nordic-ambience.mp3';

const asmr = new Howl({
  src: [audioPath],
  loop: true,
  volume: 0.15,
  html5: true,
  onloaderror: (id, error) => {
    console.log('🎵 Background music not found (optional).');
  },
  onload: () => {
    console.log('🎵 Background music loaded successfully');
  }
});

asmr.play();
```

### Path Resolution
When the game is deployed to `games/hyperborea/`:
- Code requests: `/audio/nordic-ambience.mp3`
- Browser resolves to: `https://tradehax.net/games/hyperborea/audio/nordic-ambience.mp3`

## Landing Page Video Audio

### Issue Fixed
The main landing page (`index.html`) had a potential issue where the intro video could play audio despite being muted.

### Solution Applied
```javascript
// Force mute and zero volume
introVideo.muted = true;
introVideo.volume = 0;

// Monitor for volume changes and re-enforce mute
introVideo.addEventListener('volumechange', () => {
  if (!introVideo.muted || introVideo.volume > 0) {
    introVideo.muted = true;
    introVideo.volume = 0;
  }
});
```

This ensures:
- Video is always muted on load
- Volume is set to 0
- Any attempts to unmute are immediately reverted
- Prevents "squeal noise" issues

## Troubleshooting

### Audio Not Playing in Game
1. Check browser console for audio loading errors
2. Verify file exists: `https://tradehax.net/games/hyperborea/audio/nordic-ambience.mp3`
3. Check file size is ~12MB (not corrupted)
4. Verify browser allows audio playback (check for autoplay restrictions)
5. Try clicking on the page to trigger user interaction (required on some browsers)

### Audio File Missing After Deployment
1. Verify file is in `tradehax-frontend/public/audio/`
2. Run `npm run build` to ensure Vite copies public assets
3. Check that `dist/audio/` folder exists after build
4. Ensure deployment script copies audio folder: `cp -r tradehax-frontend/dist/* games/hyperborea/`

### "Squeal Noise" on Landing Page
1. Check browser console for errors
2. Verify video element has `muted` attribute
3. Check JavaScript enforces muting (see fix above)
4. Clear browser cache and reload
5. Test in incognito mode to rule out extensions

## Best Practices

### Audio File Requirements
- **Format**: MP3 or OGG (MP3 recommended for compatibility)
- **Bitrate**: 128-192 kbps (balance quality/file size)
- **Sample Rate**: 44.1 kHz
- **Channels**: Stereo or Mono
- **Max Size**: 5-15 MB (for web performance)
- **Loop**: Ensure audio loops smoothly without gaps

### Deployment Checklist
- [ ] Update audio file in `tradehax-frontend/public/audio/`
- [ ] Test audio file plays correctly locally
- [ ] Build frontend (`npm run build`)
- [ ] Verify audio in `dist/audio/` folder
- [ ] Deploy to `games/hyperborea/`
- [ ] Test deployed audio at `https://tradehax.net/games/hyperborea/`
- [ ] Commit and push changes

### Git Ignore Considerations
Audio files are currently tracked in Git. For large audio files, consider:
- Using Git LFS (Large File Storage)
- Hosting audio on CDN
- Adding `*.mp3` to `.gitignore` and documenting external hosting

## Recent Fixes Applied

### Fix 1: Missing Audio in Deployed Game (Jan 2025)
**Issue**: Updated `Untitled.mp3` was not appearing in the deployed Hyperborea game.

**Root Cause**: Audio files from `tradehax-frontend/public/audio/` were not being deployed to `games/hyperborea/audio/`.

**Solution**: 
1. Created `games/hyperborea/audio/` directory
2. Copied `Untitled.mp3` to `games/hyperborea/audio/nordic-ambience.mp3`
3. Verified file size matches source (12MB)

### Fix 2: Incorrect Deployment Script Paths (Jan 2025)
**Issue**: Deployment scripts referenced wrong path (`docs/game/` instead of `games/hyperborea/`).

**Solution**:
1. Updated `deploy-hyperborea.sh` to use `games/hyperborea/`
2. Updated `deploy-hyperborea.ps1` to use `games/hyperborea/`
3. Fixed game URLs in script output messages

### Fix 3: Squeal Noise on Landing Page (Jan 2025)
**Issue**: Intro video on main landing page potentially playing audio despite muted attribute.

**Solution**:
1. Added explicit `introVideo.muted = true` in JavaScript
2. Added explicit `introVideo.volume = 0` in JavaScript
3. Added `volumechange` event listener to enforce muting
4. Ensured mute is re-applied on any user interaction attempts to play video

## Related Files
- `/home/runner/work/shamrockstocks.github.io/shamrockstocks.github.io/tradehax-frontend/public/audio/README.md` - Audio requirements and sources
- `/home/runner/work/shamrockstocks.github.io/shamrockstocks.github.io/TESTING_GUIDE.md` - Deployment instructions
- `/home/runner/work/shamrockstocks.github.io/shamrockstocks.github.io/deploy-hyperborea.sh` - Bash deployment script
- `/home/runner/work/shamrockstocks.github.io/shamrockstocks.github.io/deploy-hyperborea.ps1` - PowerShell deployment script

## Support
For audio-related issues, check:
- Browser console for Howler.js errors
- Network tab for 404 errors on audio files
- Browser autoplay policies (may block audio without user interaction)
- File permissions and CORS headers

---

**Last Updated**: January 7, 2025  
**Maintainer**: TradeHax Development Team
