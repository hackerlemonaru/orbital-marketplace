#!/usr/bin/env python3
"""Upload the licence-vetted corpus to Cloudflare R2 via the REST API.

Auth: CF_API_TOKEN / CF_ACCOUNT_ID / CF_R2_BUCKET from .secrets/cloudflare.env or env.
Resumable: already-uploaded keys in catalog/r2-upload-log.json are skipped.
Throttled to <4 req/s to stay under the Cloudflare API 1200 req / 5 min limit.
"""
import os, json, zipfile, time, threading, urllib.request, urllib.parse, concurrent.futures, mimetypes

ROOT = "/home/user/orbital-marketplace"
CAT = f"{ROOT}/catalog/catalog.json"
LOG = f"{ROOT}/catalog/r2-upload-log.json"
ENV_PATH = "/home/user/.secrets/cloudflare.env"

cfg = {}
if os.path.exists(ENV_PATH):
    for line in open(ENV_PATH):
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.strip().split("=", 1)
            cfg[k] = v
TOKEN = os.environ.get("CF_API_TOKEN") or cfg.get("CF_API_TOKEN")
ACC = os.environ.get("CF_ACCOUNT_ID") or cfg.get("CF_ACCOUNT_ID") or "1a2030ca3dfe1fd958c4fbf941b45192"
BUCKET = os.environ.get("CF_R2_BUCKET") or cfg.get("CF_R2_BUCKET") or "jc-bose"
if not TOKEN:
    raise SystemExit("missing CF_API_TOKEN")

API = f"https://api.cloudflare.com/client/v4/accounts/{ACC}/r2/buckets/{BUCKET}/objects/"
doc = json.load(open(CAT))
log = json.load(open(LOG)) if os.path.exists(LOG) else {"uploaded": {}, "failed": {}}
uploaded, failed = log["uploaded"], log["failed"]

# rate limiter: 3.5 requests / second
class Limiter:
    def __init__(self, rate=3.5):
        self.rate, self.lock, self.next_t = rate, threading.Lock(), time.time()
    def wait(self):
        with self.lock:
            now = time.time()
            if now < self.next_t:
                time.sleep(self.next_t - now)
            self.next_t = max(time.time(), self.next_t) + 1.0 / self.rate
lim = Limiter()

def ctype(path):
    ext = os.path.splitext(path)[1].lower()
    return {".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".bin": "application/octet-stream",
            ".lottie": "application/zip+dotlottie", ".json": "application/json", ".ts": "text/plain",
            ".html": "text/html", ".css": "text/css", ".webp": "image/webp", ".png": "image/png",
            ".jpg": "image/jpeg", ".spz": "application/octet-stream", ".sog": "application/octet-stream",
            ".zip": "application/zip", ".md": "text/markdown", ".txt": "text/plain",
            ".fbx": "application/octet-stream", ".obj": "text/plain", ".blend": "application/octet-stream"}.get(ext, mimetypes.guess_type(path)[0] or "application/octet-stream")

def put(local, key, attempts=4):
    if key in uploaded:
        return ("skip", key)
    url = API + urllib.parse.quote(key, safe="/")
    data = open(local, "rb").read()
    for i in range(attempts):
        lim.wait()
        req = urllib.request.Request(url, data=data, method="PUT", headers={
            "Authorization": f"Bearer {TOKEN}", "Content-Type": ctype(local),
            "User-Agent": "orbital-r2-uploader/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                body = json.loads(r.read().decode())
            if body.get("success"):
                res = body.get("result") or {}
                return ("ok", key, {"etag": res.get("etag"), "size": len(data), "key": key})
            err = body.get("errors") or []
            raise RuntimeError(f"api error {err}")
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = int(e.headers.get("Retry-After", "20"))
                time.sleep(min(wait, 60))
                continue
            if e.code >= 500:
                time.sleep(3 * (i + 1)); continue
            return ("fail", key, f"HTTP {e.code}: {e.read()[:180]}")
        except Exception as e:
            if i == attempts - 1:
                return ("fail", key, str(e)[:220])
            time.sleep(2 * (i + 1))
    return ("fail", key, "retries exhausted")

def save_log():
    json.dump({"uploaded": uploaded, "failed": failed}, open(LOG, "w"), indent=2)

# ---- 1. build archives for the two high-file-count MIT sources ----
ARCHIVES = [
    ("assets/uiverse/uiverse-galaxy.zip", "/tmp/galaxy", "**/*.html", "/tmp/orbital-uiverse.zip"),
    ("assets/useanim/useanimations-json.zip", "/tmp/useanim", "icons/*.json", "/tmp/orbital-useanim.zip"),
]
import glob
for key, src, pattern, out in ARCHIVES:
    if key in uploaded:
        continue
    files = sorted(glob.glob(os.path.join(src, pattern), recursive=True))
    if not files:
        print("archive empty", key); continue
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for p in files:
            z.write(p, os.path.relpath(p, src))
    print("built", key, len(files), "files", os.path.getsize(out), "bytes", flush=True)
    status = put(out, key)
    if status[0] == "ok":
        uploaded[key] = status[2]
    else:
        failed[key] = str(status)
    save_log()

# ---- 2. individual objects ----
jobs = []
for a in doc["assets"]:
    if a["mode"] != "r2" or not a.get("local_path"):
        continue
    p = a["local_path"]
    if not os.path.exists(p):
        failed[a["r2_key"]] = "local file missing at upload time"
        continue
    jobs.append((p, a["r2_key"]))
print("individual objects to upload:", len(jobs), "already done:", sum(1 for _, k in jobs if k in uploaded), flush=True)

done = 0
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    futures = {ex.submit(put, p, k): k for p, k in jobs if k not in uploaded}
    for fut in concurrent.futures.as_completed(futures):
        k = futures[fut]
        try:
            s = fut.result()
            if s[0] == "ok":
                uploaded[k] = s[2]
            elif s[0] == "fail":
                failed[k] = s[2]
        except Exception as e:
            failed[k] = str(e)[:220]
        done += 1
        if done % 250 == 0:
            save_log(); print(f"  {done}/{len(futures)} ok={len(uploaded)} fail={len(failed)}", flush=True)
save_log()

# ---- 3. annotate catalog ----
now = "2026-11-19"
for a in doc["assets"]:
    k = a.get("r2_key")
    if not k:
        continue
    if k in uploaded:
        a["r2_etag"] = uploaded[k].get("etag")
        a["r2_uploaded_at"] = now
        a["r2_url"] = f"r2://{BUCKET}/{k}"
        if a["mode"] == "archive":
            a["r2_archive_uploaded"] = a.get("archive") in uploaded
    elif a["mode"] == "archive" and a.get("archive") in uploaded:
        a["r2_archive_uploaded"] = True
        a["r2_url"] = f"r2://{BUCKET}/{a['archive']}#{a['archive_member']}"
doc["r2"]["upload_summary"] = {"uploaded": len(uploaded), "failed": len(failed), "generated": now}
json.dump(doc, open(CAT, "w"), indent=2)
print("DONE uploaded=", len(uploaded), "failed=", len(failed), flush=True)
