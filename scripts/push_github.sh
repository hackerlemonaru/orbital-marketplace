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
# Keep the token OUT of .git/config. A hidden credential helper reads the secret
# file on demand; git only stores a path to the helper, never the credential.
HELPER="${GITHUB_CREDENTIAL_HELPER:-/home/user/.secrets/git-credential-github.sh}"
cat > "$HELPER" <<'EOF'
#!/usr/bin/env bash
# Git credential helper: emits the PAT stored outside the repo, on demand only.
set -euo pipefail
case "${1:-}" in
  get)
    set -a
    . /home/user/.secrets/github.env
    set +a
    printf 'username=x-access-token\npassword=%s\n\n' "$GITHUB_TOKEN"
    ;;
esac
EOF
chmod 700 "$HELPER"
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${GITHUB_REPO}.git"
git config --local "credential.https://github.com.helper" "!${HELPER}"
git branch -M main
git push -u origin main --force-with-lease
echo "pushed to github.com/${GITHUB_REPO} (token not stored in .git/config or printed)"
