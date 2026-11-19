#!/usr/bin/env python3
"""Upload the generated storefront + public agent files to R2 under site/."""
import os, json, urllib.request, urllib.parse, mimetypes

ROOT = "/home/user/orbital-marketplace"
WEB, PUB = f"{ROOT}/website", f"{ROOT}/website/public"
cfg = {}
p = "/home/user/.secrets/cloudflare.env"
if os.path.exists(p):
    for l in open(p):
        if "=" in l and not l.strip().startswith("#"):
            k, v = l.strip().split("=", 1); cfg[k] = v
TOKEN = os.environ.get("CF_API_TOKEN") or cfg.get("CF_API_TOKEN")
ACC = os.environ.get("CF_ACCOUNT_ID") or cfg.get("CF_ACCOUNT_ID") or "1a2030ca3dfe1fd958c4fbf941b45192"
BUCKET = os.environ.get("CF_R2_BUCKET") or cfg.get("CF_R2_BUCKET") or "jc-bose"
API = f"https://api.cloudflare.com/client/v4/accounts/{ACC}/r2/buckets/{BUCKET}/objects/"

def ctype(p):
    return {".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8", ".txt": "text/plain; charset=utf-8",
            ".md": "text/markdown; charset=utf-8"}.get(os.path.splitext(p)[1].lower(), "application/octet-stream")

jobs = []
for src, key in [(f"{WEB}/index.html", "site/index.html"), (f"{WEB}/classic.html", "site/classic.html"), (f"{WEB}/catalog-data.js", "site/catalog-data.js")]:
    if os.path.exists(src): jobs.append((src, key))
for base, _, fs in os.walk(PUB):
    for f in fs:
        full = os.path.join(base, f)
        rel = os.path.relpath(full, PUB)
        jobs.append((full, "site/" + rel.replace(os.sep, "/")))
# GitHub is preferred for new small assets; mirror only tiny hero GLBs/GLSL used by the live site.
for sub in ("models", "shaders"):
    d = f"{WEB}/{sub}"
    if not os.path.isdir(d):
        continue
    for base, _, fs in os.walk(d):
        for f in fs:
            full = os.path.join(base, f)
            if os.path.getsize(full) > 500_000:
                continue
            key = "site/" + os.path.relpath(full, WEB).replace(os.sep, "/")
            jobs.append((full, key))

ok = fail = 0
for src, key in jobs:
    data = open(src, "rb").read()
    req = urllib.request.Request(API + urllib.parse.quote(key, safe="/"), data=data, method="PUT",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": ctype(src),
                 "User-Agent": "orbital-site-sync/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            d = json.loads(r.read().decode())
        if d.get("success"): ok += 1
        else: fail += 1; print("fail", key, d.get("errors"))
    except Exception as e:
        fail += 1; print("fail", key, str(e)[:120])
print(f"site sync: {ok} ok, {fail} failed, {len(jobs)} objects -> r2://{BUCKET}/site/")
