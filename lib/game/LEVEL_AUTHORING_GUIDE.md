# Hyperborea Level Authoring Guide

## Purpose
Use this guide to create puzzle-forward first-person levels with clear onboarding and monetization-ready artifact rewards.

## File Location and Naming
- Store level JSON files in `public/levels/`.
- Recommended naming:
`level-00x-short-slug.json`
- Keep `id` aligned to file name for analytics consistency.

## Required Top-Level Fields
- `id`, `name`, `seed`, `difficulty`
- `size.width`, `size.height`
- `start`, `exit`
- `layout` (array of equal-length strings)
- `objective`
- `puzzleNodes`
- `artifacts`
- `spawnProfile`
- `tokenConfig`
- `theme`

## Layout Rules
- `#` = wall, `.` = walkable cell.
- `start` and `exit` must point to walkable cells.
- All puzzle and artifact positions must be on walkable cells.
- Keep maze fully enclosed with wall borders.

## Tutorial Flow Pattern (Recommended)
1. Teach movement and interaction with visible `key` node near spawn.
2. Gate first branch with `lock` requiring that key.
3. Introduce one `switch` and one `pressure_plate`.
4. Gate deeper corridor with `rune_gate` requiring both.
5. Require a mixed pantheon relic pair at `artifact_pedestal`.
6. Open final portal route to `exit`.

## Puzzle Node Design Tips
- Keep labels short and readable; hints should be direct.
- Avoid forcing long backtracking in tutorial difficulty.
- Use `requires` for dependencies and `controls` for semantic linking.
- Reserve `secret_wall` for optional challenge routes.

## Artifact Economy Guidance
- Mix pantheons to reinforce collection objectives.
- Rarity defaults:
  - `common`: 25 units
  - `rare`: 45 units
  - `epic`: 75 units
  - `mythic`: 120 units
- Set `puzzleRequirementIds` to prevent sequence breaks.

## Token Config Notes
- Keep Devnet/staging default in development:
  - `l2Network`: `"staging"`
  - `claimEndpoint`: `"/api/game/claim-artifact"`
- Do not expose private keys in level files.

## QA Checklist Before Shipping
- JSON validates via `isHyperboreaLevelDefinition`.
- Player can complete level without dead-ends.
- At least one hint appears near each progression lock.
- Mobile and desktop controls can finish level.
- Artifact collection emits claim events and score updates.
