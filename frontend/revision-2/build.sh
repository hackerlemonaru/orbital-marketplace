#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 restore-showcase.py
python3 generate-index.py
../node_modules/.bin/vite build --config vite.config.mjs
node prerender.mjs
python3 check-contrast.py
printf '\nBuild complete. Start the preview and run check-ui.mjs, check-interactions.mjs, and check-output.py separately.\n'
