# Deployment Quickstart (Precision Guide)

## Purpose

Use this guide to deploy the latest `main` changes with minimal ambiguity.

**Current production objective:** `https://tradehax.net`

---

## 1) Choose exactly one production path

Do **not** mix these in the same release window.

- **Path A — Vercel**: managed hosting and dashboard-driven deploys.
- **Path B — Namecheap VPS**: script-driven deploy workflow from this repository.

If you are migrating from one path to the other, complete migration checklist steps first before expecting route changes to appear live.

---

## 2) Preflight checks (always)

Run local quality + structure checks before deploy:

- `npm run check:links`
- `npm run lint`
- `npm run type-check`
- `npm run build`

If these fail, fix locally before deployment.

---

## 3) Path A — Vercel deployment

### Required repository secrets

Set in GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Required platform setup

- Vercel project linked to this repository.
- Domain(s) configured in Vercel dashboard.
- Required environment variables present in Vercel.

### Trigger deploy

- Push to `main` **or** run your selected CI deploy workflow.

### Verify live

- Visit `https://tradehax.net`.
- Validate expected route removals/additions.
- Confirm deployment status is `Ready` in Vercel.

---

## 4) Path B — Namecheap VPS deployment

### Required repository secrets

Set in GitHub Actions secrets:

- `NAMECHEAP_VPS_HOST`
- `NAMECHEAP_VPS_USER`
- `NAMECHEAP_VPS_SSH_KEY`

Optional but recommended:

- `NAMECHEAP_VPS_PORT`
- `NAMECHEAP_APP_ROOT`
- `NAMECHEAP_APP_PORT`

### Trigger deploy from repo scripts

- Run: `npm run deploy:launch`

If deploy fails on `deploy:namecheap:check`, it means required Namecheap secrets are still missing.

### Verify live

- Visit `https://tradehax.net`.
- Validate route behavior (e.g., removed routes return 404/redirect as intended).
- Confirm server logs/health checks for successful rollout.

---

## 5) Definition of "deployed"

A commit is considered deployed only when **all** are true:

1. Commit exists on `origin/main`.
2. Selected deploy path completed successfully.
3. Live site behavior matches the commit.

---

## 6) Fast troubleshooting

- **Code pushed but live unchanged:** deploy path did not run or failed.
- **Namecheap deploy check fails:** missing required Namecheap secrets.
- **Vercel deploy succeeds but old content appears:** check project/domain mapping and cache.
- **Broken routes after cleanup:** run `npm run check:links` and fix stale links.

---

## 7) Recommended operating cadence

For precise change control:

1. Make scoped changes.
2. Run local quality checks.
3. Commit and push.
4. Trigger one deploy path.
5. Verify live URLs immediately.

---

**Last Updated:** 2026-03-05
**Repository:** `DarkModder33/main`
**Canonical Production URL:** `https://tradehax.net`
