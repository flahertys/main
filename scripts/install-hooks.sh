#!/usr/bin/env sh
#
# Install git hooks for POSIX clones (macOS / Linux / WSL)
# Usage: sh ./scripts/install-hooks.sh
#
set -eu

ROOT_DIR="$(pwd)"
HOOKS_DIR=".githooks"
HOOK_PATH="$HOOKS_DIR/pre-commit"

echo "Setting git config: core.hooksPath -> $HOOKS_DIR"
git config core.hooksPath "$HOOKS_DIR"

if [ $? -ne 0 ]; then
  echo "[WARN] git config failed"
  exit 1
fi

if [ ! -d "$HOOKS_DIR" ]; then
  echo "Creating $HOOKS_DIR"
  mkdir -p "$HOOKS_DIR"
fi

if [ -f "$HOOK_PATH" ]; then
  echo "Adding $HOOK_PATH to git index and marking executable"
  git add "$HOOK_PATH"
  git update-index --chmod=+x "$HOOK_PATH" || echo "[WARN] could not update index chmod"
  echo "Marked $HOOK_PATH executable in git index"
else
  echo "[WARN] no pre-commit hook found at $HOOK_PATH; create it and re-run this script"
fi

cat <<'EOF'
Done.
To enable hooks manually in other clones:

  git config core.hooksPath .githooks
  git add .githooks/pre-commit
  git update-index --chmod=+x .githooks/pre-commit

EOF

exit 0
