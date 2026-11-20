# ORBITAL — asset marketplace

**Live:** https://orbital-assets-proxy.jc-bose.workers.dev

**Repository:** https://github.com/hackerlemonaru/orbital-marketplace

A React/Vite storefront for a licence-aware catalogue of 3D, motion and UI assets. Search, filters and asset passports use the existing catalogue; the Cloudflare Worker and its signing, preview and download routes are unchanged.

## Current storefront

- `frontend/` contains the source, pinned dependencies and locally hosted fonts, posters, product shots and generated monolith GLB. `frontend/dist/` is the production output and is not committed.
- The catalogue starts with verified free/OSS records selected. Asset passports show available licence, source, hash, format, size and delivery details. Link-only records link upstream rather than claiming a download. Fallback editorial imagery is labelled when a real preview is unavailable.
- The 6,791 displayed product count is derived from 8,692 catalogue rows after preview/fixture handling. Storage values are generated from the most recent measured quota report, not live billing; the Worker health indicator is fetched at runtime.
- The Studio waitlist is **local to the browser**. No email is sent, no account is created, and checkout is not live. Planned prices are not purchase functionality.
- Reduced-motion and static/poster fallbacks are provided. Review screenshots for each phase and width are in `screenshots/phase-{1,2,3}-review.html`.

## Build and verify

Requires Node 20.19+ or 22.12+, Python 3 and the pinned npm dependencies. The data step reads `catalog/catalog.json`, `catalog/r2-quota.json` and source media; the initial generation of render inputs can require network access.

```bash
cd frontend
npm ci
npm run typecheck
npm run build
npm run preview -- --port 4173
cd ..
python3 scripts/validate_assets.py
python3 scripts/check_frontend.py
```

`npm run build` generates the data and hero GLB, reuses the five checked-in product shots and prerenders the production site. To intentionally regenerate product shots, install Playwright Chromium and its system dependencies, then run `npm run products:force` in `frontend/`. Screenshot capture also requires Playwright Chromium; `npm run screenshots -- 3 http://127.0.0.1:4173/` captures a phase at 1440, 1920 and 390 pixels.

## Deployment and quota

`scripts/r2_quota.py` measures usage and `scripts/r2_sync_site.py` uploads the built `frontend/dist/` to `site/`, publishing the index last. The sync refuses missing builds, oversized files and a projected breach of the 9.8 GiB guardrail. Credentials belong in environment variables or `/home/user/.secrets/cloudflare.env`, not in the repository. The GitHub workflow builds and checks the frontend; it syncs only when the three Cloudflare repository secrets are configured. It does not deploy or modify the Worker.

Latest post-deployment measurement: **4.3679 GiB used / 9.8 GiB cap**, **5.4321 GiB headroom**, **14,581 objects**. Refresh the report for current values. R2 site sync uploaded 62 objects with no failures.

## Provenance and limitations

Licence and source data remain in `catalog/catalog.json`; `docs/asset-source-deep-dive.md` describes source decisions and exclusions. Frontend dependencies and licences are documented in `docs/frontend-licences.md`. The catalogue licence gate is `scripts/validate_assets.py`. The Worker serves `/health`, `/sign`, `/preview/<key>`, `/download/<key>` and static `site/` paths; no backend changes were made for this redesign.

The project does not yet provide Stripe checkout, live paid ecommerce, a live MCP server, quota middleware, a database-backed account system or a Vercel deployment. Agent discovery and contract files describe the current read-only foundation; they are not a substitute for those services. Older `website/` files and historical design/video documentation are retained as prior work, not the default storefront.
