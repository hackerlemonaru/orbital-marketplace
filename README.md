# ORBITAL — 3D / motion / UI-decoration asset marketplace

> Placeholder brand name. Greenfield build, started 19 Nov 2026.

A **web-native** marketplace: browser-ready 3D, Gaussian splats, shaders, motion and UI decoration, with a machine-readable catalogue, an agent-facing API and a rate limit on every door.

## What exists right now

| Thing | Status |
|---|---|
| `catalog/catalog.json` | **8,435 catalogue rows** with SPDX licence, attribution, SHA-256, source URL and R2 key |
| Cloudflare R2 bucket `jc-bose` | **4,326 objects uploaded, 0 failures** (`catalog/r2-upload-log.json`) |
| `seed-assets/` | 36 hand-verified sample files + `seed-manifest.json` |
| `website/index.html` | Zero-dependency "crazy" storefront: WebGL2 shader, CSS-3D orb, kinetic type, tilt bento, **live catalogue browser** |
| `website/public/` | `llms.txt` v2, `robots.txt` + Content Signals, `.well-known/agent-card.json`, `.well-known/mcp/server.json`, `openapi.json`, `product-feed.json`, `AGENTS.md`, `SKILL.md`, docs |
| `scripts/` | `import_github.py`, `r2_upload.py`, `build_website.py`, `r2_sync_site.py`, `validate_assets.py`, `push_github.sh` |
| Git | Local repo initialised and committed |
| GitHub remote | ⏳ **Pending** — Arena has no GitHub connector in this session; a fine-grained PAT + repo name are needed (see below) |

## Research behind it

- `docs/marketplace-scope-2026.md` — 2026 market + standards research (WebGPU, MCP 2026-07-28, glTF ratified extensions, agentic commerce, rate-limit headers).
- `docs/github-seed-assets-stack-plan.md` — licence-vetted GitHub shortlist, **banned list** (React Bits / GSAP / Quaternius / Mixamo / Megascans / NC datasets…), stack decision, monetisation and rate limits.
- `catalog/taxonomy.json` — 8 families / 66 subcategories / required asset fields.

## Secrets — read this

- The Cloudflare API token is stored at **`/home/user/.secrets/cloudflare.env`**, mode `600`, **outside this repo**, and `.secrets/` / `.env` are git-ignored.
- It is **never** printed, committed, or placed in `website/public/`.
- Recommended: this token is broad; rotate it in the Cloudflare dashboard after setup and replace it with a scoped token limited to `R2:Edit` on `jc-bose` + the account read needed by the scripts.
- `.env.example` lists variable names only. No real values.

## Setup (local)

```bash
cd /home/user/orbital-marketplace
cp .env.example .env            # fill locally; .env is git-ignored
python3 scripts/validate_assets.py
python3 scripts/build_website.py
python3 scripts/r2_sync_site.py  # needs CF_API_TOKEN / CF_ACCOUNT_ID / CF_R2_BUCKET
```

Static preview of the site (no build step): `python3 -m http.server 3000 --bind 0.0.0.0 -d website`.

## R2 public serving

Objects are in `r2://jc-bose/assets/…` and `r2://jc-bose/site/…`. The bucket currently has **no public `r2.dev` domain** exposed through the API token, so the storefront uses local/inline previews until you either:

1. Enable **Public access (r2.dev)** for `jc-bose` in the Cloudflare dashboard, or
2. Attach a custom domain, or
3. Deploy a Worker with an R2 binding and serve signed URLs.

Then set the public base URL in `scripts/build_website.py` (`BASE`) and regenerate; `catalog.json` R2 keys become real HTTPS URLs.

## GitHub push (what I need from you)

Arena reports the `github` connector as **unsupported** in this conversation, and there is no `gh`/PAT configured locally. To push:

1. Create a repo (or tell me the `owner/repo` name).
2. Create a **fine-grained PAT** with `Contents: read/write` on that repo only.
3. Store it outside the repo:
   ```bash
   cat > /home/user/.secrets/github.env <<'EOF'
   GITHUB_TOKEN=<fine-grained-pat>
   GITHUB_REPO=owner/repo
   EOF
   chmod 600 /home/user/.secrets/github.env
   ```
4. `bash scripts/push_github.sh`

`.github/workflows/deploy.yml` then validates the licence gate, regenerates the site and syncs to R2 on every push — add `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_R2_BUCKET` as GitHub Actions **secrets**, never as repo files.

## Licence policy

Allowlist: `CC0-1.0`, `MIT`, `MIT-0`, `CC-BY-4.0`, `Apache-2.0`. CC-BY requires `attribution_text` in the listing, bundle manifest and `.md` mirror. Rejected: Commons Clause, NC, NC-SA, `NOASSERTION` mirrors, GPL-3.0, proprietary no-redistribution licences. `scripts/validate_assets.py` enforces this in CI.

## Monetisation

Free items (OSS-seeded + donations) · per-item one-time licences (Personal / Commercial / Extended) · plans (Explorer free, Studio $29/mo credits, Team, Enterprise). **Free read-only for agents**: search, metadata, licence, watermarked previews, install snippets; paid downloads require an entitlement. See `docs/github-seed-assets-stack-plan.md` §5–6.

## Next

1. Give me `owner/repo` + a fine-grained PAT so I can create/push the remote.
2. Enable public R2 access (or approve a Worker proxy).
3. Scaffold the real Next.js app (R3F/WebGPU hero, Postgres, Stripe, MCP server with quota middleware) using `stack/package.json` as the dependency list.
