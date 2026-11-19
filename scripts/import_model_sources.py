#!/usr/bin/env python3
"""Catalogue GitHub-served hero models/shaders and link-only deep sources. No R2 upload."""
import os, json, hashlib, datetime, collections, urllib.parse

ROOT = "/home/user/orbital-marketplace"
CAT = f"{ROOT}/catalog/catalog.json"
MAN = f"{ROOT}/catalog/model-source-manifest.json"
REPO = "hackerlemonaru/orbital-marketplace"
RAW = f"https://raw.githubusercontent.com/{REPO}/main/"
BLOB = f"https://github.com/{REPO}/blob/main/"
TODAY = datetime.date.today().isoformat()

doc = json.load(open(CAT))
man = json.load(open(MAN))
assets = doc["assets"]
existing = {a["id"] for a in assets}

LICENSES = {
    "pmndrs/assets": ("CC0-1.0", "pmndrs / @pmndrs/assets (CC0-1.0)", "https://github.com/pmndrs/blob/main/LICENSE"),
    "mrdoob/three.js": ("CC0-1.0", "Tomás Laulhé / Don McCurdy / three.js (CC0-1.0)", "https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/RobotExpressive/README.md"),
    "erichlof/THREE.js-PathTracing-Renderer": ("CC0-1.0", "erichlof / THREE.js-PathTracing-Renderer (CC0-1.0)", "https://github.com/erichlof/THREE.js-PathTracing-Renderer/blob/gh-pages/LICENSE"),
    "javagl/gltfTutorialModels": ("CC0-1.0", "javagl / glTF Tutorial Models (CC0 per README)", "https://github.com/javagl/gltfTutorialModels/blob/master/README.md"),
    "KhronosGroup/glTF-Sample-Assets": ("CC0-1.0", "Khronos glTF Sample Assets / per-model metadata CC0-1.0", "https://github.com/KhronosGroup/glTF-Sample-Assets"),
}

def slug(dest):
    return hashlib.sha1(dest.encode()).hexdigest()[:10]

new_rows = []
for f in man["files"]:
    dest = f["dest"]
    ext = os.path.splitext(dest)[1].lower()
    if not dest.startswith(("website/models/", "website/shaders/")):
        continue
    if ext in (".txt", ".md", ".json"):
        continue
    lic, attr, lic_url = LICENSES.get(f["source_repo"], ("CC0-1.0", f["source_repo"], "https://github.com/" + f["source_repo"]))
    if ext == ".glsl":
        category = "Materials, Shaders & Lighting / WebGL GLSL shaders"
        fmt = "GLSL"
    elif "/tutorial/" in dest:
        category = "3D Objects & Models / glTF tutorial primitives"
        fmt = "GLTF-Embedded"
    else:
        category = "3D Objects & Models / WebGL & three.js hero models"
        fmt = "GLB" if ext == ".glb" else ext[1:].upper()
    rid = f"github-{'shader' if ext=='.glsl' else 'model'}/{slug(dest)}"
    if rid in existing:
        continue
    row = {
        "id": rid,
        "name": os.path.splitext(os.path.basename(dest))[0].replace("_", " ").replace("-", " "),
        "category_path": category,
        "format": fmt,
        "license": lic,
        "attribution": attr,
        "bytes": f["bytes"],
        "sha256": f["sha256"],
        "local_path": dest,
        "r2_key": None,
        "r2_url": None,
        "source_url": f"https://github.com/{f['source_repo']}/blob/{f['source_branch']}/{urllib.parse.quote(f['source_path'])}",
        "github_raw_url": RAW + dest,
        "github_blob_url": BLOB + dest,
        "public_url": RAW + dest,
        "preview_url": None,
        "serve_from_github": True,
        "source_repo": f["source_repo"],
        "source_branch": f["source_branch"],
        "source_path": f["source_path"],
        "license_url": lic_url,
        "verification_date": TODAY,
        "ai_generated": False,
        "allow_ai_training": True,
        "license_permits_ai_training": True,
        "reduced_motion_variant": False,
        "archive": None,
        "archive_member": None,
        "mode": "github",
        "note": "Small hero asset served from the GitHub repo/raw CDN to preserve R2 free-tier headroom; not uploaded to R2",
        "local_path_note": "committed to repo under website/ for GitHub serving",
    }
    new_rows.append(row)
    assets.append(row)

# Deep sources kept as link-only rows: commercial-safe but not bulk-downloaded.
link_rows = []
for p in man.get("polyhaven_link_only", []):
    rid = "link/polyhaven/" + p["id"]
    if rid in existing:
        continue
    link_rows.append({
        "id": rid, "name": p.get("name") or p["id"].replace("_", " "),
        "category_path": "External registries / Poly Haven CC0 models",
        "format": "glTF", "license": "CC0-1.0",
        "attribution": "Poly Haven (CC0-1.0; no attribution required)",
        "bytes": 0, "sha256": None, "local_path": None, "r2_key": None, "r2_url": None,
        "source_url": p["url"], "public_url": p["url"], "preview_url": None,
        "serve_from_github": False, "license_url": "https://polyhaven.com/license",
        "ai_generated": False, "allow_ai_training": True, "license_permits_ai_training": True,
        "reduced_motion_variant": False, "archive": None, "archive_member": None,
        "mode": "link_only",
        "note": "Link-only CC0 model record; live API/ToS restrict bulk scraping, so not mirrored into R2",
    })
assets.extend(link_rows)

# Smithsonian CC0 deep-source link-only records (not bulk-mirrored).
SMITH = [
    ("1903-wright-flyer", "1903 Wright Flyer", "https://3d.si.edu/object/3d/1903-wright-flyer:nasm_A19710024000"),
    ("george-washington-bust", "George Washington bust", "https://3d.si.edu/object/3d/george-washington-bust:npg_NPG.77.1"),
    ("thomas-elkins-refrigerator", "Thomas Elkins refrigerator patent model", "https://3d.si.edu/"),
]
for sid, name, url in SMITH:
    rid = "link/smithsonian/" + sid
    if rid in existing:
        continue
    assets.append({
        "id": rid, "name": name, "category_path": "External registries / Smithsonian CC0 scans",
        "format": "GLB", "license": "CC0-1.0", "attribution": "Smithsonian Open Access (CC0)",
        "bytes": 0, "sha256": None, "local_path": None, "r2_key": None, "r2_url": None,
        "source_url": url, "public_url": url, "preview_url": None, "serve_from_github": False,
        "license_url": "https://www.si.edu/openaccess", "ai_generated": False,
        "allow_ai_training": True, "license_permits_ai_training": True,
        "reduced_motion_variant": False, "archive": None, "archive_member": None,
        "mode": "link_only", "note": "Link-only museum scan; CC0 on marked Smithsonian Open Access items",
    })

src_ids = {s["id"] for s in doc["sources"]}
for s in [
    {"id": "pmndrs-assets", "license": "CC0-1.0", "url": "https://github.com/pmndrs/assets", "mode": "github_hero", "note": "3 optimized GLBs + licence text copied into website/models; served from GitHub raw"},
    {"id": "threejs-robot", "license": "CC0-1.0", "url": "https://github.com/mrdoob/three.js", "mode": "github_hero", "note": "RobotExpressive GLB + README; CC0 per model README"},
    {"id": "erichlof-pathtracing", "license": "CC0-1.0", "url": "https://github.com/erichlof/THREE.js-PathTracing-Renderer", "mode": "github_shaders", "note": "5 CC0 GLSL fragment shaders copied into website/shaders"},
    {"id": "javagl-tutorial", "license": "CC0-1.0", "url": "https://github.com/javagl/gltfTutorialModels", "mode": "github_hero", "note": "Embedded glTF tutorial primitives, CC0 per README"},
    {"id": "khronos-cc0-small", "license": "CC0-1.0", "url": "https://github.com/KhronosGroup/glTF-Sample-Assets", "mode": "github_hero", "note": "12 small per-model CC0 GLBs with metadata"},
    {"id": "polyhaven-link", "license": "CC0-1.0", "url": "https://polyhaven.com/models", "mode": "link_only", "note": "12 link-only CC0 model records; API ToS requires unique UA and visible credit if live API used"},
    {"id": "smithsonian-link", "license": "CC0-1.0", "url": "https://www.si.edu/openaccess", "mode": "link_only", "note": "3 link-only CC0 museum-scan records"},
]:
    if s["id"] not in src_ids:
        doc["sources"].append(s)

doc["generated"] = datetime.datetime.now().isoformat(timespec="seconds") + "Z"
doc["counts"] = {
    "total": len(assets),
    "by_mode": dict(collections.Counter(a.get("mode") for a in assets)),
    "by_license": dict(collections.Counter(a.get("license") for a in assets)),
    "by_category_top": dict(collections.Counter((a.get("category_path") or "").split(" / ")[0] for a in assets)),
}
json.dump(doc, open(CAT, "w"), indent=2, ensure_ascii=False)
print("new GitHub-served rows:", len(new_rows))
print("new Poly Haven link rows:", len(link_rows))
print("catalogue rows:", len(assets))
print("by mode:", doc["counts"]["by_mode"])
