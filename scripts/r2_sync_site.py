#!/usr/bin/env python3
"""Upload the generated static storefront to R2 under the existing site/ prefix.

The Worker routes are unchanged: it continues to map public paths to site/<path>.
Only the static bundle source changes, from generated website/ files to the
Vite production output in frontend/dist.
"""
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "frontend" / "dist"
QUOTA = ROOT / "catalog" / "r2-quota.json"
CAP_GIB = 9.8
GIB = 1024 ** 3

cfg = {}
secret_path = "/home/user/.secrets/cloudflare.env"
if os.path.exists(secret_path):
    for line in open(secret_path):
        if "=" in line and not line.strip().startswith("#"):
            key, value = line.strip().split("=", 1)
            cfg[key] = value
TOKEN = os.environ.get("CF_API_TOKEN") or cfg.get("CF_API_TOKEN")
ACC = os.environ.get("CF_ACCOUNT_ID") or cfg.get("CF_ACCOUNT_ID") or "1a2030ca3dfe1fd958c4fbf941b45192"
BUCKET = os.environ.get("CF_R2_BUCKET") or cfg.get("CF_R2_BUCKET") or "jc-bose"
API = f"https://api.cloudflare.com/client/v4/accounts/{ACC}/r2/buckets/{BUCKET}/objects/"

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".wasm": "application/wasm",
    ".json": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".otf": "font/otf",
    ".mp4": "video/mp4",
    ".m4v": "video/mp4",
    ".webm": "video/webm",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".lottie": "application/zip",
    ".zip": "application/zip",
    ".glsl": "text/plain; charset=utf-8",
}


def content_type(path: Path) -> str:
    return CONTENT_TYPES.get(path.suffix.lower(), "application/octet-stream")


if not DIST.exists() or not (DIST / "index.html").exists():
    raise SystemExit("frontend/dist/index.html is missing; run the production build first")

jobs = []
for path in sorted(DIST.rglob("*")):
    if not path.is_file():
        continue
    if path.stat().st_size > 25_000_000:
        raise SystemExit(f"Refusing incomplete sync: {path} exceeds the 25 MB upload limit")
    rel = path.relative_to(DIST).as_posix()
    jobs.append((path, "site/" + rel))

# Publish the entry point only after its hashed assets and data are available.
jobs.sort(key=lambda job: job[1] == "site/index.html")

total_bytes = sum(path.stat().st_size for path, _ in jobs)
quota = json.load(open(QUOTA))
used_bytes = int(quota.get("used_bytes", 0))
if (used_bytes + total_bytes) / GIB >= CAP_GIB:
    raise SystemExit(
        f"Refusing sync: measured bucket usage plus {total_bytes / GIB:.4f} GiB "
        f"would reach or exceed the {CAP_GIB} GiB cap"
    )

ok = fail = 0
for source, key in jobs:
    if key == "site/index.html" and fail:
        print("not publishing index: one or more prerequisite uploads failed")
        break
    data = source.read_bytes()
    request = urllib.request.Request(
        API + urllib.parse.quote(key, safe="/"),
        data=data,
        method="PUT",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": content_type(source),
            "User-Agent": "orbital-vite-site-sync/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.loads(response.read().decode())
        if payload.get("success"):
            ok += 1
        else:
            fail += 1
            print("fail", key, payload.get("errors"))
    except Exception as error:
        fail += 1
        print("fail", key, str(error)[:160])

print(f"site sync: {ok} ok, {fail} failed, {len(jobs)} objects, {total_bytes / 1024 / 1024:.2f} MiB -> r2://{BUCKET}/site/")
if fail:
    raise SystemExit(1)
