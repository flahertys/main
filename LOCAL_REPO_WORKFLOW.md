# Local Repository Workflow (Canonical + Mirror)

This machine keeps two clones of the same project:

- Canonical (active coding): `C:\tradez\main`
- Mirror (backup/sync only): `C:\DarkModder33\main`

Use this model to prevent IDE and pipeline drift.

## Canonical Rules

- Open `C:\tradez\main` for coding, running, and deployments.
- Run pipeline tasks from the canonical repo.
- Push from canonical only.

## Mirror Rules

- Do not make feature edits in mirror.
- Keep mirror synchronized from canonical.
- Use mirror as rollback/reference copy.

## Commands

- Repo status across both paths:
  - `npm run repo:status`
- Sync mirror from canonical:
  - `npm run repo:sync-mirror`

Both commands are also available in VS Code Tasks:
- `TradeHax: Repo Status`
- `TradeHax: Sync Mirror`

## Suggested Daily Loop

1. Open canonical workspace.
2. `TradeHax: Local Pipeline` before commit.
3. Commit and push from canonical.
4. Run `TradeHax: Sync Mirror` to keep backup clone aligned.
