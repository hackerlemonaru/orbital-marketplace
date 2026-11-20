#!/usr/bin/env python3
"""Measure exact R2 usage and enforce the 9.8 GiB free-tier guardrail."""
import os, json, sys, collections, requests

ROOT = str(__import__("pathlib").Path(__file__).resolve().parent.parent)
CAP_GIB = float(os.environ.get("R2_CAP_GIB", "9.8"))
CAP = int(CAP_GIB * 1024 ** 3)

def env(path):
    return dict(l.split("=", 1) for l in open(path).read().splitlines() if "=" in l and not l.startswith("#"))

cf = env("/home/user/.secrets/cloudflare.env") if os.path.exists("/home/user/.secrets/cloudflare.env") else {}
TOKEN = os.environ.get("CF_API_TOKEN") or cf.get("CF_API_TOKEN")
ACC = os.environ.get("CF_ACCOUNT_ID") or cf.get("CF_ACCOUNT_ID")
BUCKET = os.environ.get("CF_R2_BUCKET") or cf.get("CF_R2_BUCKET")
API = f"https://api.cloudflare.com/client/v4/accounts/{ACC}/r2/buckets/{BUCKET}/objects"
h = {"Authorization": f"Bearer {TOKEN}"}

cursor, total, count, pages = None, 0, 0, 0
by_prefix = collections.Counter()
while True:
    params = {"per_page": 1000}
    if cursor:
        params["cursor"] = cursor
    j = requests.get(API, headers=h, params=params, timeout=30).json()
    objects = j.get("result") or []
    if not isinstance(objects, list):
        print("unexpected R2 response:", j.get("errors"))
        sys.exit(2)
    for o in objects:
        size = int(o.get("size") or 0)
        total += size
        count += 1
        key = o.get("key") or ""
        by_prefix[key.split("/")[0] if "/" in key else "(root)"] += size
    ri = j.get("result_info") or {}
    pages += 1
    if not ri.get("is_truncated"):
        break
    cursor = ri.get("cursor")
    if not cursor or pages > 30:
        break

report = {
    "cap_gib": CAP_GIB,
    "cap_bytes": CAP,
    "used_bytes": total,
    "used_gib": round(total / 1024 ** 3, 4),
    "headroom_bytes": CAP - total,
    "headroom_gib": round((CAP - total) / 1024 ** 3, 4),
    "objects": count,
    "pages": pages,
    "by_first_segment_gib": {k: round(v / 1024 ** 3, 4) for k, v in by_prefix.most_common()},
    "ok": total < CAP,
}
os.makedirs(f"{ROOT}/catalog", exist_ok=True)
json.dump(report, open(f"{ROOT}/catalog/r2-quota.json", "w"), indent=2)
print(f"R2 {total/1024**3:.4f} GiB / {CAP_GIB} GiB cap · headroom {(CAP-total)/1024**3:.4f} GiB · {count:,} objects")
if not report["ok"]:
    print("R2 QUOTA EXCEEDED")
    sys.exit(1)
