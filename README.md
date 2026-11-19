# ORBITAL — 3D / motion / UI-decoration asset marketplace

> Placeholder brand. Greenfield build, started 19 Nov 2026.

**Live:** [https://orbital-assets-proxy.jc-bose.workers.dev](https://orbital-assets-proxy.jc-bose.workers.dev) · **Repo:** [https://github.com/hackerlemonaru/orbital-marketplace](https://github.com/hackerlemonaru/orbital-marketplace) · **Local preview:** port 3000 (`website/`).

A web-native marketplace with a machine-readable catalogue, agent discovery files, Cloudflare R2 storage, and an R2 Worker proxy. Free read-only agents get search, metadata, licence, preview and install-snippet access; `assets/premium/` downloads are entitlement-gated with short-lived HMAC tokens.

## What is live now

| Thing | Status |
|---|---|
| `https://github.com/hackerlemonaru/orbital-marketplace` | Public repo on `main`, pushed with a hidden fine-grained PAT credential helper |
| `catalog/catalog.json` | **8,647 rows**; r2 4,536, archive 4,104, link_only 7; SPDX, SHA-256, source URL, R2 key and public HTTPS URL |
| Cloudflare R2 `jc-bose` | **4,538 asset objects**, 0 failures; **16 `site/` objects** synced |
| Worker proxy | `https://orbital-assets-proxy.jc-bose.workers.dev` — public `site/`, `/preview/<key>`, free `/download/<key>`, gated premium `/download/<key>?token=…` |
| Storefront | `website/index.html`: WebGL2 shader hero, CSS-3D orb, kinetic type, live catalogue browser |
| Agent files | `llms.txt`, Content Signals `robots.txt`, `agent-card.json`, `server.json`, `openapi.json`, `AGENTS.md`, `SKILL.md`, docs, product feed |
| Licence gate | `scripts/validate_assets.py` passes: 8,647 assets approved |

Licences: CC0-1.0 4,349, MIT 4,142, Public domain + NASA usage guidelines 81, see seed-manifest.json 36, CC-BY-4.0 31, MIT-0 7. NASA rows follow NASA media guidelines (credit, no endorsement, insignia/logo and screened third-party models excluded). Khronos CC-BY rows carry per-model attribution and metadata URLs. KayKit CC0 stays free; author asks not to resell unmodified copies.

## Second-wave sources

- `nasa/NASA-3D-Resources` — 80 small, insignia-screened GLBs under NASA usage guidelines.
- `ToxSam/cc0-models-Polygonal-Mind` — 120 project-diverse CC0 GLBs + matching PNG previews.
- `KhronosGroup/glTF-Sample-Assets` — 12 additional per-model CC-BY-4.0 GLBs; NC variants, duplicates and >1.5 MB models excluded.
- Already in wave 1: Kenney/tge, Uiverse, useAnimations, TSLFX, Magic UI, AWS splats, KayKit, 50 Khronos, seed pack.

## Secrets — hidden, never committed

- `/home/user/.secrets/cloudflare.env` — `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_R2_BUCKET`, mode `600`.
- `/home/user/.secrets/cloudflare-worker.env` — `CF_WORKER_SIGNING_KEY`, `CF_WORKER_ADMIN_TOKEN`, `CF_WORKER_URL`, mode `600`.
- `/home/user/.secrets/github.env` — `GITHUB_TOKEN`, `GITHUB_REPO`, mode `600`.
- `/home/user/.secrets/git-credential-github.sh` — on-demand helper; the PAT is **not** in `.git/config`.
- `.env.example` lists names only. No real values are tracked. `git` scans clean.

## GitHub Actions

`.github/workflows/deploy.yml` validates, rebuilds and syncs on every push. Add these **repository secrets** manually (the supplied fine-grained PAT lacks the Actions-secrets permission):

`CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_R2_BUCKET`, `CF_WORKER_SIGNING_KEY`, `CF_WORKER_ADMIN_TOKEN`.

Steps are guarded so CI still passes until those secrets exist; R2 asset/site sync and Worker deployment were already run locally with the hidden env files.

## Scripts

`import_github.py` · `r2_upload.py` · `import_more_github.py` · `build_website.py` · `validate_assets.py` · `r2_sync_site.py` · `deploy_worker.py` · `push_github.sh`.

Local loop:

```bash
python3 scripts/validate_assets.py
python3 scripts/build_website.py
python3 scripts/r2_sync_site.py
python3 scripts/deploy_worker.py
bash scripts/push_github.sh
```

## Still not built

Real Next.js App Router app, Postgres/Drizzle, Stripe checkout, Auth.js/Clerk, live `/mcp` server on spec `2026-07-28`, Redis quota middleware and paid ecommerce UI. Those contracts exist in `docs/`, `openapi.json`, `agent-card.json` and `server.json`; the current build is the static storefront + catalogue + R2/agent foundation.
