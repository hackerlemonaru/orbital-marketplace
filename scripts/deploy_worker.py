#!/usr/bin/env python3
"""Deploy the R2 proxy Worker via Cloudflare REST API. Secrets stay in ~/.secrets."""
import json, os, requests

ROOT = "/home/user/orbital-marketplace"
SCRIPT = "orbital-assets-proxy"

def read_env(path):
    out = {}
    if os.path.exists(path):
        for line in open(path):
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                out[k] = v
    return out

cf = read_env("/home/user/.secrets/cloudflare.env")
wk = read_env("/home/user/.secrets/cloudflare-worker.env")
TOKEN = os.environ.get("CF_API_TOKEN") or cf["CF_API_TOKEN"]
ACC = os.environ.get("CF_ACCOUNT_ID") or cf["CF_ACCOUNT_ID"]
BUCKET = os.environ.get("CF_R2_BUCKET") or cf["CF_R2_BUCKET"]
SIGNING = os.environ.get("CF_WORKER_SIGNING_KEY") or wk.get("CF_WORKER_SIGNING_KEY")
ADMIN = os.environ.get("CF_WORKER_ADMIN_TOKEN") or wk.get("CF_WORKER_ADMIN_TOKEN")

if not (TOKEN and ACC and BUCKET and SIGNING and ADMIN):
    raise SystemExit("missing Cloudflare/Worker environment variables")
h = {"Authorization": f"Bearer {TOKEN}"}
base = f"https://api.cloudflare.com/client/v4/accounts/{ACC}"
sub = requests.get(base + "/workers/subdomain", headers=h, timeout=20).json()["result"]["subdomain"]
public = f"https://{SCRIPT}.{sub}.workers.dev"

meta = {
    "main_module": "worker.js",
    "compatibility_date": "2026-11-19",
    "bindings": [
        {"type": "r2_bucket", "name": "ASSETS", "bucket_name": BUCKET},
        {"type": "secret_text", "name": "ASSET_SIGNING_KEY", "text": SIGNING},
        {"type": "secret_text", "name": "ADMIN_TOKEN", "text": ADMIN},
    ],
}
src = open(f"{ROOT}/worker/src/worker.js", "rb").read()
files = {
    "metadata": (None, json.dumps(meta), "application/json"),
    "worker.js": ("worker.js", src, "application/javascript+module"),
}
r = requests.put(f"{base}/workers/scripts/{SCRIPT}", headers=h, files=files, timeout=90)
print("upload status:", r.status_code, "success:", r.json().get("success"))
if not r.ok:
    print("errors:", r.json().get("errors"))
    raise SystemExit(1)

s = requests.post(f"{base}/workers/scripts/{SCRIPT}/subdomain", headers=h,
                  json={"enabled": True, "previews_enabled": True}, timeout=30)
print("subdomain enable:", s.status_code, s.json().get("success"))

with open(f"{ROOT}/worker/url.txt", "w") as f:
    f.write(public + "\n")
secret_dir = os.path.dirname("/home/user/.secrets/cloudflare-worker.env")
if os.path.isdir(secret_dir):
    with open("/home/user/.secrets/cloudflare-worker.env", "a") as f:
        if "CF_WORKER_URL" not in wk:
            f.write("CF_WORKER_URL=" + public + "\n")
    os.chmod("/home/user/.secrets/cloudflare-worker.env", 0o600)

try:
    health = requests.get(public + "/health", timeout=20)
    print("health:", health.status_code, health.json().get("ok"))
except Exception as e:
    print("health check pending:", type(e).__name__)
print("public URL:", public)
