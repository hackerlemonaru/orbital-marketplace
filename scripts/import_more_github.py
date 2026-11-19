#!/usr/bin/env python3
"""Second-wave GitHub ingest: NASA GLBs, Polygonal Mind CC0 GLBs+previews, extra Khronos CC-BY GLBs."""
import os, re, json, hashlib, datetime, collections, concurrent.futures, urllib.parse, requests

ROOT = "/home/user/orbital-marketplace"
CAT = f"{ROOT}/catalog/catalog.json"
LOG = f"{ROOT}/catalog/r2-upload-log.json"

def env(path):
    return dict(l.split("=", 1) for l in open(path).read().splitlines() if "=" in l and not l.startswith("#"))

GH = env("/home/user/.secrets/github.env")["GITHUB_TOKEN"]
CF = env("/home/user/.secrets/cloudflare.env")
GH_H = {"Authorization": f"Bearer {GH}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
ACC, BUCKET, TOKEN = CF["CF_ACCOUNT_ID"], CF["CF_R2_BUCKET"], CF["CF_API_TOKEN"]
API = f"https://api.cloudflare.com/client/v4/accounts/{ACC}/r2/buckets/{BUCKET}/objects/"
TODAY = datetime.date.today().isoformat()

def tree(repo, branch):
    r = requests.get(f"https://api.github.com/repos/{repo}/git/trees/{branch}", headers=GH_H, params={"recursive": 1}, timeout=60)
    r.raise_for_status()
    return {x["path"]: x for x in r.json().get("tree", []) if x.get("type") == "blob"}

def raw(repo, branch, path):
    u = f"https://raw.githubusercontent.com/{repo}/{branch}/" + urllib.parse.quote(path)
    r = requests.get(u, headers=GH_H, timeout=90)
    r.raise_for_status()
    return r.content

def blob_url(repo, branch, path):
    return f"https://github.com/{repo}/blob/{branch}/" + urllib.parse.quote(path)

def slug(path, prefix):
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", path).strip("_")
    digest = hashlib.sha1(path.encode()).hexdigest()[:8]
    ext = os.path.splitext(path)[1].lower()
    return f"assets/{prefix}/{digest}_{stem[-90:]}{ext}"

def ctype(key):
    e = os.path.splitext(key)[1].lower()
    return {
        ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp",
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".json": "application/json",
        ".html": "text/html; charset=utf-8", ".md": "text/markdown; charset=utf-8",
    }.get(e, "application/octet-stream")

def r2_put(key, data):
    u = API + urllib.parse.quote(key, safe="/")
    r = requests.put(u, data=data, headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": ctype(key)}, timeout=90)
    r.raise_for_status()
    d = r.json()
    if not d.get("success"):
        raise RuntimeError(str(d.get("errors")))
    res = d.get("result") or {}
    return res.get("etag") or res.get("ETag") or ""

def base_row(repo, branch, path, r2_key, data, **kw):
    row = {
        "id": kw.pop("id"), "name": kw.pop("name"), "category_path": kw.pop("category_path"),
        "format": kw.pop("format"), "license": kw.pop("license"), "attribution": kw.pop("attribution"),
        "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "local_path": None,
        "r2_key": r2_key, "r2_url": f"r2://{BUCKET}/{r2_key}",
        "source_url": blob_url(repo, branch, path), "ai_generated": False,
        "allow_ai_training": kw.pop("allow_ai_training", False),
        "license_permits_ai_training": kw.pop("license_permits_ai_training", False),
        "reduced_motion_variant": False, "archive": None, "archive_member": None,
        "mode": "r2", "note": kw.pop("note", ""), "local_path_note": "streamed to R2 during import",
    }
    row.update(kw)
    return row

jobs = []

# 1) NASA: small, insignia-screened GLBs under NASA media guidelines.
NASA = "nasa/NASA-3D-Resources"
nt = tree(NASA, "master")
BAD = ["astronaut", "gateway", "global hawk", "habitat demonstration", "insight", "ingenuity",
       "iss (d)", "mark iii", "mars 2020", "pistol grip", "space shuttle (d)",
       "vehicle assembly", "z2", "cubesat", "insignia", "meatball", "worm", "logo"]
nasa_glbs = sorted(
    [(v.get("size", 0), p) for p, v in nt.items()
     if p.lower().endswith(".glb") and v.get("size", 0) <= 3_000_000
     and not any(b in p.lower() for b in BAD)],
    key=lambda x: x[0]
)[:80]
for _, p in nasa_glbs:
    key = slug(p, "nasa")
    jobs.append((NASA, "master", p, key, {
        "id": "nasa/" + hashlib.sha1(p.encode()).hexdigest()[:10],
        "name": os.path.splitext(os.path.basename(p))[0],
        "category_path": "3D Objects & Models / Science, space & educational models",
        "format": "GLB", "license": "Public domain + NASA usage guidelines",
        "attribution": "NASA / NASA 3D Resources; acknowledge NASA as source; no endorsement; insignia and third-party marks excluded",
        "allow_ai_training": False, "license_permits_ai_training": False,
        "license_url": "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        "note": "NASA media guidelines apply; selective GLB ingest, no insignia/logos or screened third-party models; WebGL2/poster fallback required",
    }))

# 2) Polygonal Mind / ToxSam CC0: round-robin small GLBs across projects + matching PNG previews.
PM = "ToxSam/cc0-models-Polygonal-Mind"
pt = tree(PM, "main")
by_project = collections.defaultdict(list)
for p, v in pt.items():
    if p.lower().endswith(".glb") and v.get("size", 0) <= 1_500_000:
        parts = p.split("/")
        project = parts[1] if len(parts) > 2 and parts[0] == "projects" else "misc"
        by_project[project].append((v.get("size", 0), p))
for k in by_project:
    by_project[k].sort()
selected = []
while len(selected) < 120 and any(by_project.values()):
    for k in list(by_project):
        if by_project[k] and len(selected) < 120:
            selected.append(by_project[k].pop(0))
for _, p in selected:
    key = slug(p, "polygonal-mind")
    png = os.path.splitext(p)[0] + ".png"
    preview_key = slug(png, "polygonal-mind") if png in pt else None
    jobs.append((PM, "main", p, key, {
        "id": "polygonal-mind/" + hashlib.sha1(p.encode()).hexdigest()[:10],
        "name": os.path.splitext(os.path.basename(p))[0],
        "category_path": "3D Objects & Models / Low-poly & stylised packs",
        "format": "GLB", "license": "CC0-1.0",
        "attribution": "Polygonal Mind / ToxSam GLB conversion (CC0-1.0)",
        "allow_ai_training": True, "license_permits_ai_training": True,
        "preview_r2_key": preview_key,
        "note": "Polygonal Mind metaverse project converted to GLB by ToxSam; CC0-1.0; static poster fallback required",
    }))
    if preview_key:
        jobs.append((PM, "main", png, preview_key, {
            "id": "polygonal-mind-preview/" + hashlib.sha1(png.encode()).hexdigest()[:10],
            "name": os.path.splitext(os.path.basename(png))[0] + " preview",
            "category_path": "3D Objects & Models / Low-poly & stylised packs",
            "format": "PNG", "license": "CC0-1.0",
            "attribution": "Polygonal Mind / ToxSam (CC0-1.0)",
            "allow_ai_training": True, "license_permits_ai_training": True,
            "is_preview": True, "note": "Matching preview image for a Polygonal Mind CC0 GLB",
        }))

# 3) Additional Khronos CC-BY models, excluding NC variants and already-imported ids.
KH = "KhronosGroup/glTF-Sample-Assets"
kt = tree(KH, "main")
metas = [p for p in kt if p.startswith("Models/") and p.endswith("metadata.json")]
def meta(p):
    try:
        return p, requests.get(f"https://raw.githubusercontent.com/{KH}/main/" + urllib.parse.quote(p), headers=GH_H, timeout=30).json()
    except Exception:
        return p, None
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
    md = dict(ex.map(meta, metas))
cat = json.load(open(CAT))
existing = {a["id"] for a in cat["assets"]}
ccby = []
for mp, m in md.items():
    if not isinstance(m, dict):
        continue
    legal = [x for x in (m.get("legal") or []) if isinstance(x, dict)]
    spdx = [x.get("spdx") for x in legal if x.get("spdx")]
    if not any(s == "CC-BY-4.0" for s in spdx):
        continue
    if any("NC" in (s or "").upper() for s in spdx):
        continue
    model = mp.split("/")[1]
    if f"khronos/{model}" in existing:
        continue
    glbs = [(v.get("size", 0), p) for p, v in kt.items()
            if p.startswith(f"Models/{model}/glTF-Binary/") and p.lower().endswith(".glb")]
    if not glbs:
        continue
    sz, gp = min(glbs)
    if sz > 1_500_000:
        continue
    credit = "; ".join(f"{x.get('artist') or x.get('owner')} ({x.get('what')}, {x.get('spdx')})" for x in legal if x.get("spdx"))
    ccby.append((sz, model, gp, mp, credit, legal[0].get("licenseUrl", "")))
ccby.sort()
for sz, model, gp, mp, credit, lurl in ccby[:30]:
    key = f"assets/khronos-ccby/{re.sub(r'[^A-Za-z0-9_-]+', '_', model)}.glb"
    jobs.append((KH, "main", gp, key, {
        "id": "khronos-ccby/" + model,
        "name": model, "category_path": "3D Objects & Models / glTF conformance & test models",
        "format": "GLB", "license": "CC-BY-4.0",
        "attribution": (credit or "Khronos glTF Sample Assets") + " / Khronos glTF Sample Assets",
        "allow_ai_training": True, "license_permits_ai_training": True,
        "license_url": lurl or "https://creativecommons.org/licenses/by/4.0/legalcode",
        "metadata_url": blob_url(KH, "main", mp),
        "note": "Per-model Khronos metadata CC-BY-4.0; attribution required in listing, bundle and .md mirror",
    }))

# Deduplicate against current catalogue keys.
existing_keys = {(a.get("r2_key") or "") for a in cat["assets"]}
jobs = [j for j in jobs if j[3] not in existing_keys]

def process(job):
    repo, branch, path, key, meta_row = job
    data = raw(repo, branch, path)
    etag = r2_put(key, data)
    row = base_row(repo, branch, path, key, data, **meta_row)
    row["r2_etag"] = etag
    row["r2_uploaded_at"] = TODAY
    return key, row, etag, len(data)

results, failures = [], []
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    futs = {ex.submit(process, j): j for j in jobs}
    for fut in concurrent.futures.as_completed(futs):
        try:
            results.append(fut.result())
        except Exception as e:
            failures.append((futs[fut][3], type(e).__name__ + ": " + str(e)[:100]))

log = json.load(open(LOG))
for key, row, etag, size in results:
    log["uploaded"][key] = {"etag": etag, "size": size, "key": key}
    cat["assets"].append(row)
for key, err in failures:
    if isinstance(log.get("failed"), dict):
        log["failed"][key] = {"key": key, "error": err}
    else:
        log["failed"].append({"key": key, "error": err})

# Add source notes.
src_ids = {s["id"] for s in cat["sources"]}
for s in [
    {"id": "nasa-3d-resources", "license": "Public domain + NASA usage guidelines", "url": "https://github.com/nasa/NASA-3D-Resources", "mode": "selected", "note": "80 small GLBs; insignia/third-party-screened subset; NASA media guidelines apply"},
    {"id": "polygonal-mind-cc0", "license": "CC0-1.0", "url": "https://github.com/ToxSam/cc0-models-Polygonal-Mind", "mode": "selected", "note": "120 project-diverse GLBs + matching PNG previews; CC0-1.0 verbatim licence in repo"},
    {"id": "khronos-ccby-extra", "license": "CC-BY-4.0", "url": "https://github.com/KhronosGroup/glTF-Sample-Assets", "mode": "selected", "note": "30 additional per-model CC-BY-4.0 GLBs; NC variants excluded; attribution required"},
]:
    if s["id"] not in src_ids:
        cat["sources"].append(s)

# Recompute counts.
assets = cat["assets"]
cat["generated"] = datetime.datetime.now().isoformat(timespec="seconds") + "Z"
cat["counts"] = {
    "total": len(assets),
    "by_mode": dict(collections.Counter(a.get("mode") for a in assets)),
    "by_license": dict(collections.Counter(a.get("license") for a in assets)),
    "by_category_top": dict(collections.Counter((a.get("category_path") or "").split(" / ")[0] for a in assets)),
}
json.dump(cat, open(CAT, "w"), indent=2, ensure_ascii=False)
json.dump(log, open(LOG, "w"), indent=2)
print("second-wave ingest:", len(results), "ok,", len(failures), "failed")
print("catalogue rows:", len(assets), "R2 objects logged:", len(log["uploaded"]))
if failures:
    print("failures sample:", failures[:5])
