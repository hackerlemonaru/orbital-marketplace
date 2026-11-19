#!/usr/bin/env python3
"""Build catalog/catalog.json from licence-vetted GitHub sources.

Runs locally. Requires the shallow clones in /tmp (created by fetch_sources.sh).
Licence gate: only CC0-1.0, MIT, MIT-0, CC-BY-4.0, Apache-2.0 sources are ingested.
"""
import os, json, re, glob, subprocess, urllib.request, urllib.parse, concurrent.futures, hashlib, time

ROOT = "/home/user/orbital-marketplace"
OUT = f"{ROOT}/catalog/catalog.json"
EXTRA = "/tmp/orbital-extra"
os.makedirs(EXTRA, exist_ok=True)

UA = {"User-Agent": "orbital-catalog-builder/1.0"}
RAW = "https://raw.githubusercontent.com"

def fetch(url, dest=None, timeout=40):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = r.read()
    if dest:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            f.write(data)
    return data

def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def ent(**kw):
    base = dict(id="", name="", category_path="", format="", license="", attribution="",
                bytes=None, sha256=None, local_path=None, r2_key=None, r2_url=None,
                source_url="", ai_generated=False, allow_ai_training=False,
                license_permits_ai_training=False, reduced_motion_variant=False,
                archive=None, archive_member=None, mode="r2", note="")
    base.update(kw)
    return base

assets = []
sources = []

def add_source(**kw):
    sources.append(kw)

# ---------------------------------------------------------------- 1. Kenney / tge-assets (CC0)
TGE = "/tmp/tge"
if os.path.isdir(TGE):
    cat = json.load(open(f"{TGE}/catalog.json"))
    for pack in cat["packs"]:
        for m in pack["models"]:
            p = f"{TGE}/{m['file']}"
            if not os.path.exists(p):
                continue
            assets.append(ent(
                id="tge/" + m["id"], name=m["name"], category_path="3D Objects & Models / Low-poly & stylised packs",
                format="GLB", license="CC0-1.0", attribution="Kenney (kenney.nl)",
                bytes=os.path.getsize(p), sha256=sha(p), local_path=p,
                r2_key="assets/tge/" + m["file"], source_url="https://github.com/Hidencod/tge-assets/blob/main/" + m["file"],
                license_permits_ai_training=True, note=f"{pack['name']} · GLB with embedded textures; poster fallback required",
            ))
            tp = f"{TGE}/{m['thumb']}"
            if os.path.exists(tp):
                assets.append(ent(
                    id="tge/" + m["id"] + "#thumb", name=m["name"] + " (preview)", category_path="3D Objects & Models / Previews",
                    format="WEBP", license="CC0-1.0", attribution="Kenney (kenney.nl)",
                    bytes=os.path.getsize(tp), sha256=sha(tp), local_path=tp,
                    r2_key="assets/tge/" + m["thumb"], source_url="https://github.com/Hidencod/tge-assets/blob/main/" + m["thumb"],
                    license_permits_ai_training=True, note="auto-rendered 192x192 preview",
                ))
    add_source(id="tge-assets", license="CC0-1.0", url="https://github.com/Hidencod/tge-assets",
               mode="full_mirror", note="1,883 Kenney GLBs + thumbs, derived files also CC0 per repo LICENSE")

# ---------------------------------------------------------------- 2. Uiverse galaxy (MIT) -> ZIP
GAL = "/tmp/galaxy"
if os.path.isdir(GAL):
    htmls = sorted(glob.glob(f"{GAL}/**/*.html", recursive=True))
    for p in htmls:
        rel = os.path.relpath(p, GAL)
        head = open(p, errors="ignore").read(300)
        m = re.search(r"From Uiverse\.io by ([^\s\-]+)", head)
        author = m.group(1) if m else "Uiverse.io community"
        assets.append(ent(
            id="uiverse/" + rel.replace(".html", ""), name=os.path.basename(rel).replace(".html", "").replace("-", " ").title(),
            category_path="Website Decoration & UI Components / " + rel.split(os.sep)[0],
            format="HTML/CSS", license="MIT", attribution="Uiverse.io / " + author,
            bytes=os.path.getsize(p), sha256=sha(p),
            r2_key="assets/uiverse/" + rel, source_url="https://github.com/uiverse-io/galaxy/blob/main/" + urllib.parse.quote(rel),
            license_permits_ai_training=True, archive="assets/uiverse/uiverse-galaxy.zip", archive_member=rel,
            mode="archive", note="standalone HTML+CSS element; keep author comment",
        ))
    add_source(id="uiverse-galaxy", license="MIT", url="https://github.com/uiverse-io/galaxy",
               mode="archive", note="3,000+ community UI elements; verbatim MIT licence in repo")

# ---------------------------------------------------------------- 3. useAnimations (MIT) -> ZIP
USE = "/tmp/useanim"
if os.path.isdir(USE):
    icons = sorted(glob.glob(f"{USE}/icons/*.json"))
    for p in icons:
        rel = os.path.relpath(p, USE)
        assets.append(ent(
            id="useanim/" + os.path.basename(p).replace(".json", ""), name=os.path.basename(p).replace(".json", ""),
            category_path="2D Motion & Micro-interactions / Animated icon sets", format="LOTTIE-JSON", license="MIT",
            attribution="useAnimations (useanimations.com)", bytes=os.path.getsize(p), sha256=sha(p),
            r2_key="assets/useanim/" + rel, source_url="https://github.com/useanimations/react-useanimations/blob/main/" + rel,
            license_permits_ai_training=True, archive="assets/useanim/useanimations-json.zip", archive_member=rel,
            mode="archive", note="repackaged into .lottie for the storefront; raw JSON kept for provenance",
        ))
    add_source(id="useanimations", license="MIT", url="https://github.com/useanimations/react-useanimations",
               mode="archive", note="302 MIT animated icons")

# ---------------------------------------------------------------- 4. TSLFX (MIT)
TSL = "/tmp/tslfx"
if os.path.isdir(TSL):
    for p in sorted(glob.glob(f"{TSL}/src/shaders/**/*.ts", recursive=True)):
        rel = os.path.relpath(p, TSL)
        assets.append(ent(
            id="tslfx/" + rel.replace("/", "-").replace(".ts", ""), name=os.path.basename(p).replace(".ts", ""),
            category_path="Materials, Shaders & Lighting / WGSL & TSL shader packs", format="TSL", license="MIT",
            attribution="Verekia / TSLFX", bytes=os.path.getsize(p), sha256=sha(p), local_path=p,
            r2_key="assets/tslfx/" + rel, source_url="https://github.com/verekia/tslfx/blob/main/" + rel,
            license_permits_ai_training=True, note="Three.js Shading Language; WebGPU + WebGL2 backend",
        ))
    add_source(id="tslfx", license="MIT", url="https://github.com/verekia/tslfx", mode="full_mirror",
               note="TSL VFX/SDF modules, WebGPU-first with WebGL2 fallback")

# ---------------------------------------------------------------- 5. Magic UI registry items (MIT)
MAGIC = ["bento-grid", "animated-beam", "marquee", "globe", "meteors", "shimmer-button", "dock",
         "animated-shiny-text", "particles", "blur-fade", "number-ticker", "word-rotate",
         "border-beam", "ripple", "orbiting-circles", "aurora-text", "confetti", "terminal"]
os.makedirs(f"{EXTRA}/magicui", exist_ok=True)
for name in MAGIC:
    url = f"https://magicui.design/r/{name}.json"
    dest = f"{EXTRA}/magicui/{name}.json"
    try:
        data = fetch(url, dest)
        json.loads(data)
        assets.append(ent(
            id="magicui/" + name, name=name.replace("-", " ").title(),
            category_path="Website Decoration & UI Components / shadcn registry items", format="REGISTRY-JSON", license="MIT",
            attribution="Magic UI", bytes=os.path.getsize(dest), sha256=sha(dest), local_path=dest,
            r2_key="assets/magicui/" + name + ".json", source_url=url, license_permits_ai_training=True,
            note="shadcn registry item; agent-installable via MCP/shadcn CLI",
        ))
    except Exception as e:
        print("magicui skip", name, e)
add_source(id="magicui", license="MIT", url="https://github.com/magicuidesign/magicui", mode="selected",
           note="MIT animated React/Tailwind components; registry JSONs fetched from magicui.design")

# ---------------------------------------------------------------- 6. AWS sample Gaussian splats (MIT-0)
AWS_REPO = "aws-solutions-library-samples/guidance-for-open-source-3d-reconstruction-toolbox-for-gaussian-splats-on-aws"
AWS_BASE = "source/Gradio/favorites/"
AWS_FILES = ["benchmelb.spz", "big-penny.sog", "kitchen_island.sog", "laundry room.sog",
             "venetian-hall-panos.sog", "wolf.spz", "wooden-hedgehog.spz"]
os.makedirs(f"{EXTRA}/splats", exist_ok=True)
for f in AWS_FILES:
    dest = f"{EXTRA}/splats/{f}"
    try:
        fetch(f"{RAW}/{AWS_REPO}/main/{AWS_BASE}" + urllib.parse.quote(f), dest, timeout=90)
        assets.append(ent(
            id="aws-splat/" + f.replace(" ", "-").rsplit(".", 1)[0], name=f.replace(".spz", "").replace(".sog", "").replace("-", " ").title(),
            category_path="3D Objects & Models / Gaussian splats & radiance fields",
            format="SPZ" if f.endswith(".spz") else "SOG", license="MIT-0",
            attribution="Amazon Web Services (MIT-0, no attribution required)",
            bytes=os.path.getsize(dest), sha256=sha(dest), local_path=dest,
            r2_key="assets/splats/" + f.replace(" ", "-"),
            source_url=f"https://github.com/{AWS_REPO}/blob/main/{AWS_BASE}" + urllib.parse.quote(f),
            license_permits_ai_training=True,
            note="convert to ratified KHR_gaussian_splatting GLB before publishing",
        ))
    except Exception as e:
        print("splat skip", f, e)
add_source(id="aws-gaussian-splats", license="MIT-0", url=f"https://github.com/{AWS_REPO}", mode="selected",
           note="sample .spz/.sog splats from the MIT-0 3D reconstruction toolbox")

# ---------------------------------------------------------------- 7. Khronos glTF Sample Assets (per-model licence gate)
KH = json.load(open("/tmp/kh.json")) if os.path.exists("/tmp/kh.json") else {"tree": []}
glbs = [x for x in KH.get("tree", []) if x["type"] == "blob" and x["path"].lower().endswith(".glb") and "glTF-Binary" in x["path"] and (x.get("size") or 0) < 3_000_000]
glbs = sorted(glbs, key=lambda x: x.get("size", 0))[:70]
os.makedirs(f"{EXTRA}/khronos", exist_ok=True)
def kh_one(x):
    path = x["path"]
    model = path.split("/")[1]
    meta_url = f"{RAW}/KhronosGroup/glTF-Sample-Assets/main/Models/{urllib.parse.quote(model)}/metadata.json"
    try:
        txt = fetch(meta_url, timeout=20).decode("utf-8", "replace")
        up = txt.upper()
        if "NC" in up or "NON-COMMERCIAL" in up or "NONCOMMERCIAL" in up:
            return None
        if "CC0" in up:
            lic = "CC0-1.0"
        elif "CC-BY" in up or "CC BY" in up or "ATTRIBUTION 4.0" in up:
            lic = "CC-BY-4.0"
        else:
            return None
    except Exception:
        return None
    dest = f"{EXTRA}/khronos/{model}.glb"
    try:
        fetch(f"{RAW}/KhronosGroup/glTF-Sample-Assets/main/" + urllib.parse.quote(path), dest, timeout=60)
    except Exception as e:
        print("kh skip download", model, e)
        return None
    credit = "Cesium / Khronos glTF Sample Assets" if "Cesium" in txt else "Khronos glTF Sample Assets contributor (see metadata.json)"
    return dict(model=model, path=path, dest=dest, lic=lic, credit=credit)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    for r in ex.map(kh_one, glbs):
        if not r:
            continue
        assets.append(ent(
            id="khronos/" + r["model"], name=r["model"].replace("Test", " Test"),
            category_path="3D Objects & Models / glTF reference & material samples", format="GLB", license=r["lic"],
            attribution=r["credit"], bytes=os.path.getsize(r["dest"]), sha256=sha(r["dest"]), local_path=r["dest"],
            r2_key="assets/khronos/" + r["model"] + ".glb",
            source_url="https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/" + urllib.parse.quote(r["path"]),
            license_permits_ai_training=True,
            note="per-model SPDX read from metadata.json; CC-BY requires attribution in listing + .md mirror",
        ))
add_source(id="glTF-Sample-Assets", license="mixed CC0-1.0 / CC-BY-4.0 (per model)", url="https://github.com/KhronosGroup/glTF-Sample-Assets",
           mode="selected", note="NC / unlicensed models excluded by the licence gate")

# ---------------------------------------------------------------- 8. KayKit official CC0 packs
KAYKIT = [
    ("KayKit-Character-Pack-Adventures-1.0", "https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0"),
    ("KayKit-Space-Base-Bits-1.0", "https://github.com/KayKit-Game-Assets/KayKit-Space-Base-Bits-1.0"),
]
for repo, url in KAYKIT:
    dest = f"/tmp/{repo}"
    if not os.path.isdir(dest):
        try:
            subprocess.run(["git", "clone", "-q", "--depth", "1", url, dest], check=True, timeout=180)
        except Exception as e:
            print("kaykit clone skip", repo, e)
            continue
    for p in sorted(glob.glob(dest + "/**/*", recursive=True)):
        if not os.path.isfile(p) or "/.git/" in p or os.path.getsize(p) > 8_000_000:
            continue
        rel = os.path.relpath(p, dest)
        low = rel.lower()
        if not low.endswith((".gltf", ".glb", ".bin", ".png", ".jpg", ".txt", ".md", ".fbx", ".obj", ".blend")):
            continue
        assets.append(ent(
            id="kaykit/" + repo + "/" + rel.replace("/", "-"), name=os.path.basename(rel),
            category_path="3D Objects & Models / CC0 character & modular kits",
            format=os.path.splitext(rel)[1].lstrip(".").upper(), license="CC0-1.0",
            attribution="KayKit / Kay Lousberg (kaylousberg.com)", bytes=os.path.getsize(p), sha256=sha(p), local_path=p,
            r2_key="assets/kaykit/" + repo + "/" + rel.replace(" ", "-"),
            source_url=url + "/blob/main/" + urllib.parse.quote(rel), license_permits_ai_training=True,
            note="official CC0 pack; downsample 1024² atlas to 128² for web budgets",
        ))
add_source(id="kaykit", license="CC0-1.0", url="https://github.com/KayKit-Game-Assets", mode="selected",
           note="official KayKit repos only; NOASSERTION mirrors of the paid Complete Collection are excluded")

# ---------------------------------------------------------------- 9. seeded .lottie + seed assets
for p in sorted(glob.glob(f"{ROOT}/seed-assets/**/*", recursive=True)):
    if not os.path.isfile(p) or p.endswith("seed-manifest.json"):
        continue
    rel = os.path.relpath(p, ROOT)
    assets.append(ent(
        id="seed/" + rel.replace("/", "-"), name=os.path.basename(rel),
        category_path="Seed library / " + rel.split(os.sep)[1], format=os.path.splitext(rel)[1].lstrip(".").upper(),
        license="see seed-manifest.json", attribution="see seed-manifest.json",
        bytes=os.path.getsize(p), sha256=sha(p), local_path=p, r2_key="assets/seed/" + rel,
        source_url="https://github.com/Hidencod/tge-assets (see seed-manifest.json)",
        note="verified seed file; licence in seed-assets/seed-manifest.json",
    ))

# ---------------------------------------------------------------- 10. link-only (too large / licence-reviewed)
LINK_ONLY = [
    ("nasa-3d-resources", "Public domain + NASA usage guidelines", "https://github.com/nasa/NASA-3D-Resources", "5.2 GB — selective ingest only"),
    ("toxSam-cc0-models", "CC0-1.0", "https://github.com/ToxSam/cc0-models-Polygonal-Mind", "~991 GLBs / 1.6 GB — link index, not mirrored"),
    ("open-source-3d-assets", "CC0-1.0", "https://github.com/nexusmedialab/open-source-3d-assets", "991+ GLB JSON registry — tiny index"),
    ("polygonalmind-100avatars", "CC0-1.0", "https://github.com/PolygonalMind/100Avatars/releases", "200+ rigged VRM/FBX avatars"),
    ("polyfork-catalog", "CC BY 4.0", "https://github.com/lucas-martinic/polyfork-catalog", "3,391 GLBs — attribution required"),
    ("shadcn-ui", "MIT", "https://github.com/shadcn-ui/ui", "registry contract / base components"),
    ("three-js-runtime", "MIT", "https://github.com/mrdoob/three.js", "runtime dependency, not catalogue items"),
]
for i, (id_, lic, url, note) in enumerate(LINK_ONLY):
    assets.append(ent(id="link/" + id_, name=id_, category_path="External registries / link-only", format="INDEX",
                      license=lic, attribution="see source", source_url=url, mode="link_only", note=note,
                      license_permits_ai_training=(lic.startswith("CC0") or lic == "MIT")))
    add_source(id=id_, license=lic, url=url, mode="link_only", note=note)

os.makedirs(f"{ROOT}/catalog", exist_ok=True)
doc = {
    "schema_version": "1.0",
    "generated": "2026-11-19",
    "marketplace": "ORBITAL (placeholder name)",
    "licence_gate": {"allow": ["CC0-1.0", "MIT", "MIT-0", "CC-BY-4.0", "Apache-2.0"],
                     "require_attribution": ["CC-BY-4.0"],
                     "deny": ["Commons Clause", "CC-BY-NC", "CC-BY-NC-SA", "NOASSERTION", "GPL-3.0", "proprietary-no-redistribution"]},
    "r2": {"account_id": "1a2030ca3dfe1fd958c4fbf941b45192", "bucket": "jc-bose",
           "note": "objects uploaded via Cloudflare R2 REST API with the scoped API token; public serving requires an r2.dev domain or a Worker binding"},
    "counts": {"total": len(assets), "by_mode": {}, "by_license": {}, "by_category_top": {}},
    "sources": sources,
    "assets": assets,
}
for a in assets:
    doc["counts"]["by_mode"][a["mode"]] = doc["counts"]["by_mode"].get(a["mode"], 0) + 1
    doc["counts"]["by_license"][a["license"]] = doc["counts"]["by_license"].get(a["license"], 0) + 1
    top = a["category_path"].split(" / ")[0]
    doc["counts"]["by_category_top"][top] = doc["counts"]["by_category_top"].get(top, 0) + 1
json.dump(doc, open(OUT, "w"), indent=2)
print("catalog written:", OUT)
print("total assets:", len(assets))
print("by mode:", doc["counts"]["by_mode"])
print("by licence:", doc["counts"]["by_license"])
print("by top category:", doc["counts"]["by_category_top"])
print("uploadable files:", sum(1 for a in assets if a["local_path"]))
