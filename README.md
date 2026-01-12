# tradehax.net

Professional website and portfolio for ShamrockStocks, featuring an interactive resume viewer and project showcase.

## 🚀 Quick Start

This site is deployed automatically to **https://tradehax.net** via GitHub Pages when changes are pushed to the `main` branch.

**For detailed deployment instructions**, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 📋 Site Structure

- **Homepage** (`index.html`) - Interactive resume viewer with PDF download
- **About** (`about.html`) - About page placeholder
- **Projects** (`projects.html`) - Project showcase placeholder
- **Blog** (`blog/index.html`) - Blog section placeholder

## 🔧 Local Development

To test the site locally:

```bash
# Start a local web server
python3 -m http.server 8080

# Visit http://localhost:8080 in your browser
```

## 📦 Assets

- `/assets/` - CSS styles and logo
- `/resume-images/` - Optimized responsive resume images
- `MichaelSFlahertyResume.pdf` - Resume PDF file

## Developer setup: Git hooks

This repository includes a `.githooks` directory with a sample `pre-commit` hook used to regenerate image assets before committing.

To enable hooks for your local clone, run the appropriate installer below from the repository root:

- Windows / PowerShell:

```powershell
pwsh .\scripts\install-hooks.ps1
```

- POSIX (macOS / Linux / WSL):

```bash
sh ./scripts/install-hooks.sh
```

Or set the config manually:

```bash
git config core.hooksPath .githooks
git add .githooks/pre-commit
git update-index --chmod=+x .githooks/pre-commit
```

The installer scripts are idempotent and safe to re-run.
