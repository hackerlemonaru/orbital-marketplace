#!/usr/bin/env bash
# Push this repo to GitHub. Requires a fine-grained PAT stored OUTSIDE the repo.
#   /home/user/.secrets/github.env  ->  GITHUB_TOKEN=...  GITHUB_REPO=owner/repo
# Never echo the token, never commit .secrets/, never put the token in a file inside this repo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRET_FILE="${GITHUB_SECRET_FILE:-/home/user/.secrets/github.env}"
if [[ -f "$SECRET_FILE" ]]; then set -a; . "$SECRET_FILE"; set +a; fi
: "${GITHUB_TOKEN:?set GITHUB_TOKEN in $SECRET_FILE or env}"
: "${GITHUB_REPO:?set GITHUB_REPO as owner/repo in $SECRET_FILE or env}"
cd "$ROOT"
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
git branch -M main
git push -u origin main --force-with-lease
echo "pushed to github.com/${GITHUB_REPO} (token not printed)"
