# ORBITAL — 3D / motion / UI-decoration asset marketplace

> Placeholder brand. Greenfield build, started 19 Nov 2026.

**Live:** [https://orbital-assets-proxy.jc-bose.workers.dev](https://orbital-assets-proxy.jc-bose.workers.dev) · **Classic showpiece:** [/classic.html](https://orbital-assets-proxy.jc-bose.workers.dev/classic.html) · **Repo:** [https://github.com/hackerlemonaru/orbital-marketplace](https://github.com/hackerlemonaru/orbital-marketplace) · **Local preview:** port 3000 (`website/`).

A web-native marketplace with a machine-readable catalogue, agent discovery files, Cloudflare R2 storage, GitHub-served small hero assets, and an R2 Worker proxy. Free read-only agents get search, metadata, licence, preview and install-snippet access; `assets/premium/` downloads are entitlement-gated with short-lived HMAC tokens.

## What is live now

| Thing | Status |
|---|---|
| `https://github.com/hackerlemonaru/orbital-marketplace` | Public repo on `main`, pushed with a hidden fine-grained PAT credential helper |
| `catalog/catalog.json` | **8,692 rows**; r2 4,536, archive 4,104, GitHub-served 30, link_only 22; SPDX, SHA-256, source URL, provenance and public HTTPS URL |
| Cloudflare R2 `jc-bose` | **4,538 asset objects**, 0 failures; **51 `site/` objects** synced |
| R2 free-tier guardrail | **4.3629 GiB used / 9.8 GiB cap · 5.4371 GiB headroom · 14,528 total bucket objects**; `scripts/r2_quota.py` fails the build if the cap is reached |
| Worker proxy | `https://orbital-assets-proxy.jc-bose.workers.dev` — public `site/`, `/preview/<key>`, free `/download/<key>`, gated premium `/download/<key>?token=…` |
| Dynamic storefront | `website/index.html`: Vercel-inspired black/white system, WebGL2 animated shader, CSS-3D orb, kinetic type, optional pinned `three@0.187.0` GLB viewer, live catalogue browser |
| Classic storefront | `website/classic.html`: earlier neon cosmic showpiece preserved |
| Agent files | `llms.txt`, Content Signals `robots.txt`, `agent-card.json`, `server.json`, `openapi.json`, `AGENTS.md`, `SKILL.md`, docs, product feed |
| Licence gate | `scripts/validate_assets.py` passes: **8,692 assets approved** |

Licences: CC0-1.0 4,394, MIT 4,142, Public domain + NASA usage guidelines 81, CC-BY-4.0 / CC BY 4.0 32, MIT-0 7, seed-manifest 36. NASA rows follow NASA media guidelines (credit, no endorsement, insignia/logo and screened third-party models excluded). Khronos CC-BY rows carry per-model attribution and metadata URLs. KayKit CC0 stays free; author asks not to resell unmodified copies.

## New deep-source / GitHub-serving wave

Small, licence-clear models and shaders are committed under `website/models/` and `website/shaders/`, served from `raw.githubusercontent.com`, and mirrored to `site/` only when ≤500 KB for the live Worker preview. The exact manifest with SHA-256 and source paths is `catalog/model-source-manifest.json`. Details and legal exclusions are in `docs/asset-source-deep-dive.md`.

- `pmndrs/assets` — 3 optimized CC0 GLBs (`bunny`, `pmndrs`, `suzi`) + licence text.
- `mrdoob/three.js` — `RobotExpressive.glb` + README, CC0 per model README.
- `KhronosGroup/glTF-Sample-Assets` — 12 small per-model **CC0-1.0** GLBs + metadata JSON.
- `javagl/gltfTutorialModels` — 9 embedded glTF tutorial primitives, CC0 per README.
- `erichlof/THREE.js-PathTracing-Renderer` — 5 CC0 GLSL fragment shaders.
- Poly Haven — 12 **link-only** CC0 model records; no bulk API scrape. Live API use requires a unique UA/Referer and a visible “Powered by Poly Haven” credit.
- Smithsonian Open Access — 3 **link-only** CC0-marked museum scans.
- **Not stocked:** Adobe Substance 3D Assets / Mixamo / Substance materials as standalone downloads. Commercial use inside a larger/modified work is allowed, but Adobe's product-specific licence forbids standalone distribution or third-party extraction. Mixed-licence three.js examples and Google model-viewer sample assets were also not bulk-imported.

The new GitHub-served rows prefer `github_raw_url`; existing R2 rows keep `public_url` through the Worker. GitHub's <1 GB repo guidance and 100 MiB single-object limit are respected by keeping this wave tiny and putting large binaries only in R2 / external links.

## Earlier waves

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

`.github/workflows/deploy.yml` validates, rebuilds, enforces the R2 quota guard, and syncs on every push. Add these **repository secrets** manually (the supplied fine-grained PAT lacks the Actions-secrets permission):

`CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_R2_BUCKET`, `CF_WORKER_SIGNING_KEY`, `CF_WORKER_ADMIN_TOKEN`.

Steps are guarded so CI still passes until those secrets exist; R2 asset/site sync and Worker deployment were already run locally with the hidden env files.

## Scripts

`import_github.py` · `r2_upload.py` · `import_more_github.py` · `import_model_sources.py` · `r2_quota.py` · `build_website.py` · `validate_assets.py` · `r2_sync_site.py` · `deploy_worker.py` · `push_github.sh`.

Local loop:

```bash
python3 scripts/validate_assets.py
python3 scripts/r2_quota.py
python3 scripts/build_website.py
python3 scripts/r2_sync_site.py
python3 scripts/deploy_worker.py
bash scripts/push_github.sh
```

## Still not built

Real Next.js App Router app, Postgres/Drizzle, Stripe checkout, Auth.js/Clerk, live `/mcp` server on spec `2026-07-28`, Redis quota middleware and paid ecommerce UI. Those contracts exist in `docs/`, `openapi.json`, `agent-card.json` and `server.json`; the current build is the static storefront + catalogue + R2/agent foundation. No actual Vercel deployment is configured; "Vercel type" here refers only to the visual language.
