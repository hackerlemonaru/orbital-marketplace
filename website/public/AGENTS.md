# AGENTS.md

## Project
ORBITAL — web-native 3D / motion / UI-decoration asset marketplace.

## Layout
- `catalog/catalog.json` — source of truth for every asset (licence, sha256, R2 key)
- `catalog/taxonomy.json` — 8 families / 66 subcategories / required asset fields
- `seed-assets/` — 36 licence-vetted sample files
- `website/` — Next.js target; `website/index.html` is a zero-dependency design proof
- `website/public/` — files served at root (llms.txt, robots.txt, .well-known/*, openapi.json)
- `scripts/` — import_github.py, r2_upload.py, build_website.py

## Conventions
- Never commit `.secrets/`, `.env`, or any token.
- Large binaries go to Cloudflare R2, not git. `asset-corpus/` is git-ignored.
- Licence gate: allow CC0-1.0, MIT, MIT-0, CC-BY-4.0, Apache-2.0. Reject NC / Commons Clause / NOASSERTION / GPL-3.0.
- CC-BY rows require `attribution_text` in the listing, bundle manifest and `.md` mirror.
- All 3D assets need a WebGL2 fallback, a 2D poster and a reduced-motion variant.
