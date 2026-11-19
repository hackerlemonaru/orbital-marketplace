#!/usr/bin/env bash
# Rebuild the self-contained three.js scene bundle without touching the repo's dependency skeleton.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="/tmp/orbital-build"
mkdir -p "$BUILD_DIR"
if [ ! -f "$BUILD_DIR/package.json" ]; then npm --prefix "$BUILD_DIR" init -y >/dev/null 2>&1; fi
npm --prefix "$BUILD_DIR" install --no-audit --no-fund geist@latest three@0.187.0 esbuild@latest >/dev/null
cp "$BUILD_DIR/node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2" "$ROOT/website/fonts/Geist-Variable.woff2"
cp "$BUILD_DIR/node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2" "$ROOT/website/fonts/GeistMono-Variable.woff2"
cp "$BUILD_DIR/node_modules/geist/LICENSE.txt" "$ROOT/website/fonts/LICENSE-geist.txt"
cp "$BUILD_DIR/node_modules/three/LICENSE" "$ROOT/website/vendor/THREE-LICENSE.txt"
ln -sfn "$BUILD_DIR/node_modules" "$ROOT/node_modules"
"$BUILD_DIR/node_modules/.bin/esbuild" "$ROOT/website/js/src/orbital-scene.js" \
  --bundle --format=esm --target=es2022 --minify --legal-comments=none \
  --outfile="$ROOT/website/js/orbital-scene.js"
rm -f "$ROOT/node_modules"
echo "built website/js/orbital-scene.js"
