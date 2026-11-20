# ORBITAL revision 2 (pre-production)

This is the separate revision-2 Vite multi-page app. It has not replaced the production frontend. Pre-production: https://orbital-assets-preprod.jc-bose.workers.dev/

## Build

Node and Python dependencies are installed in the parent frontend:

```sh
cd frontend
npm ci
python3 -m pip install requests pillow
cd revision-2
bash build.sh
../node_modules/.bin/vite preview --config vite.config.mjs --port 4174
```

`restore-showcase.py` retrieves the full-resolution files from the exact URLs in `featured.json` and checks each SHA-256 before using it. Full models are deliberately not committed to git. Smaller previews, original renders, metadata and licence files are committed. `generate-index.py` reads the existing catalogue without modifying it and builds a presentation index; archive entries are extracted client-side and their checksums verified before a ZIP with `CREDITS.txt` and available licence text is offered.

## Verification

```sh
node check-ui.mjs http://127.0.0.1:4174
node check-interactions.mjs http://127.0.0.1:4174
python3 check-output.py
```

The first two scripts require Playwright Chromium and system dependencies. `check-output.py` intentionally fails until the requested literal banned-byte rule is resolved. Short strings such as `R2`, and even the other byte sequences in the prescribed grep, occur incidentally in original binary assets and third-party encoded JS; they are not necessarily UI copy. The full byte-level result must not be represented as passing.

Most recent local mobile Lighthouse measurements and other remaining acceptance issues are in `PLAN.md`. Do not promote this version until the outstanding checks are resolved. The isolated pre-production deploy script is `scripts/deploy_preproduction.py`; it uploads to a separate object prefix and separate Worker with independent secrets. It does not modify production Worker code or publish to production.
