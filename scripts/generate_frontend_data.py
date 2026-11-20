#!/usr/bin/env python3
"""Generate all front-end data and copy licence-approved local media.

The Worker catalogue, licence gate and provenance logic are untouched. This
script derives a compact presentation layer from the existing catalog.json and
API-measured quota report, then downloads five CC0 GLBs only as local render
inputs for real product shots.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import struct
import urllib.request
from pathlib import Path

from generate_frontend_metrics import compute_metrics, write_metrics

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
PUBLIC = FRONTEND / "public"
SRC_DATA = FRONTEND / "src" / "data"
RENDER_ASSETS = FRONTEND / "render-assets"

CATALOG = json.load(open(ROOT / "catalog" / "catalog.json"))
ASSETS = CATALOG["assets"]
BY_ID = {a["id"]: a for a in ASSETS}
SOURCES = CATALOG["sources"]

FEATURED = [
    ("github-model/af7504cb28", "robot-expressive", "Expressive robot", "large"),
    ("tge/prototype-kit/animal-bison", "animal-bison", "Animal bison", "small"),
    ("tge/food-kit/avocado", "avocado", "Avocado", "small"),
    ("tge/graveyard-kit/lantern-candle", "lantern-candle", "Lantern candle", "small"),
    ("tge/furniture-kit/cardboardboxclosed", "cardboardboxclosed", "Closed cardboard box", "small"),
]

SOURCE_MARKS = [
    ("glTF-Sample-Assets", "Khronos"),
    ("pmndrs-assets", "pmndrs"),
    ("nasa-3d-resources", "NASA"),
    ("polyhaven-link", "Poly Haven"),
    ("smithsonian-link", "Smithsonian"),
]

PLATE_LABELS = {
    "poster-hero.jpg": "Monolith",
    "poster-material.jpg": "Material",
    "poster-orbit.jpg": "Orbit",
    "poster-agent.jpg": "Agents",
}

LICENCES_DOC = """# Front-end library licences

The storefront is a static Vite bundle. Libraries are pinned in
`frontend/package-lock.json`.

| Library | Licence | Use |
| --- | --- | --- |
| GSAP, ScrollTrigger, SplitText, Flip | Webflow Standard “No Charge” Licence | Hero choreography, pinned sequence and connector draw |
| Lenis | MIT | Smooth wheel scrolling, disabled for reduced motion |
| Motion | MIT | Drawer and filter-state transitions |
| Geist Sans / Mono | SIL Open Font License 1.1 | All typography |
| three.js | MIT | WebGL hero and local product-shot renders |
| @pmndrs/assets | CC0-1.0 | Lazy studio EXR environment |
| @google/model-viewer | Apache-2.0 | Lazy asset detail viewer |
| @lottiefiles/dotlottie-web | MIT | Installed for future Lottie playback |
| glTF-Transform CLI / SDK | MIT | Hero GLB bake and optimisation |
| Lucide React | ISC | Interface icons |
| MiniSearch | MIT | Catalogue fuzzy index |
| TanStack Virtual | MIT | Virtualised catalogue rows |

Poly Haven models are CC0, but website thumbnails and renders are not. ORBITAL
uses its own product renders and includes the required “Powered by Poly Haven”
credit in the footer. Link-only sources are never presented as downloads.
"""


def ensure_dirs():
    for d in [
        SRC_DATA,
        PUBLIC / "data",
        PUBLIC / "fonts",
        PUBLIC / "media",
        PUBLIC / "media" / "products",
        PUBLIC / "models",
        PUBLIC / "docs",
        PUBLIC / "licences",
        RENDER_ASSETS,
    ]:
        d.mkdir(parents=True, exist_ok=True)


def copy_static_files():
    web = ROOT / "website"
    for name in ["Geist-Variable.woff2", "GeistMono-Variable.woff2", "LICENSE-geist.txt"]:
        src = web / "fonts" / name
        if src.exists():
            shutil.copy2(src, PUBLIC / "fonts" / name)
    for name in ["poster-hero.jpg", "poster-material.jpg", "poster-orbit.jpg", "poster-agent.jpg"]:
        src = web / "media" / name
        if src.exists():
            shutil.copy2(src, PUBLIC / "media" / name)
    three_license = web / "vendor" / "THREE-LICENSE.txt"
    if three_license.exists():
        shutil.copy2(three_license, PUBLIC / "licences" / "THREE-LICENSE.txt")


def glb_polygon_count(path: Path) -> int | None:
    try:
        data = path.read_bytes()
        if len(data) < 20 or data[:4] != b"glTF":
            return None
        chunk_len, chunk_type = struct.unpack_from("<II", data, 12)
        if chunk_type != 0x4E4F534A:
            return None
        gltf = json.loads(data[20 : 20 + chunk_len].decode("utf-8"))
        total = 0
        for mesh in gltf.get("meshes", []):
            for primitive in mesh.get("primitives", []):
                mode = primitive.get("mode", 4)
                if mode != 4:
                    continue
                if "indices" in primitive:
                    total += int(gltf["accessors"][primitive["indices"]]["count"]) // 3
                elif "POSITION" in primitive.get("attributes", {}):
                    total += int(gltf["accessors"][primitive["attributes"]["POSITION"]]["count"]) // 3
        return total or None
    except Exception:
        return None


def source_repo(asset):
    if asset.get("source_repo"):
        return asset["source_repo"]
    url = asset.get("source_url") or ""
    m = re.match(r"https?://github\.com/([^/]+)/([^/]+)", url)
    if m:
        return f"{m.group(1)}/{m.group(2)}"
    return "Verified source"


def source_label(asset):
    repo = source_repo(asset)
    if repo == "Verified source":
        url = asset.get("source_url") or ""
        host = re.sub(r"^https?://(www\.)?", "", url).split("/")[0]
        return host or "Source"
    return repo


def clean_name(name: str) -> str:
    name = re.sub(r"\s+", " ", name).strip()
    return name[:1].upper() + name[1:] if name else name


def download(url: str, path: Path):
    if path.exists() and path.stat().st_size > 0:
        return
    req = urllib.request.Request(url, headers={"User-Agent": "orbital-frontend-render/1.0"})
    with urllib.request.urlopen(req, timeout=45) as response:
        path.write_bytes(response.read())


def prepare_featured(metrics):
    prepared = []
    previous = SRC_DATA / "site.json"
    try:
        polygon_map = json.loads(previous.read_text()).get("polygonMap", {})
    except (OSError, ValueError):
        polygon_map = {}
    for asset_id, slug, display_name, size in FEATURED:
        asset = BY_ID[asset_id]
        thumb = BY_ID.get(asset_id + "#thumb")
        model_path = RENDER_ASSETS / f"{slug}.glb"
        if asset.get("local_path"):
            local = ROOT / asset["local_path"]
            if local.exists() and not model_path.exists():
                shutil.copy2(local, model_path)
        elif asset.get("public_url") and (os.environ.get("FORCE_PRODUCT_RENDER") == "1" or not (PUBLIC / "media" / "products" / f"{slug}.jpg").exists()):
            download(asset["public_url"], model_path)
        polygons = glb_polygon_count(model_path) or polygon_map.get(asset_id)
        if polygons:
            polygon_map[asset_id] = polygons
        prepared.append({
            "id": asset_id,
            "name": clean_name(display_name),
            "catalogName": clean_name(asset.get("name", display_name)),
            "category": asset.get("category_path", ""),
            "format": asset.get("format", ""),
            "license": asset.get("license", ""),
            "bytes": asset.get("bytes"),
            "sha256": asset.get("sha256"),
            "sourceUrl": asset.get("source_url"),
            "sourceRepo": source_repo(asset),
            "verifiedUrl": asset.get("license_url") or asset.get("source_url"),
            "publicUrl": asset.get("public_url"),
            "mode": asset.get("mode"),
            "thumbnail": (thumb or {}).get("public_url"),
            "productImage": f"/media/products/{slug}.jpg",
            "modelPath": f"/render-assets/{slug}.glb",
            "renderSlug": slug,
            "polygonCount": polygons,
            "cardSize": size,
            "downloadable": asset.get("mode") != "link_only" and bool(asset.get("public_url")) and int(asset.get("bytes") or 0) > 0,
        })

    # Polygon counts for every other small local GLB, when known.
    for asset in ASSETS:
        local_path = asset.get("local_path")
        if not local_path or asset["id"] in polygon_map:
            continue
        p = ROOT / local_path
        if p.suffix.lower() == ".glb" and p.exists():
            count = glb_polygon_count(p)
            if count:
                polygon_map[asset["id"]] = count
    return prepared, polygon_map


def prepare_sources():
    out = []
    for source in SOURCES:
        mode = source.get("mode", "")
        out.append({
            "id": source["id"],
            "label": source["id"].replace("-", " ").replace("_", " ").strip(),
            "license": source.get("license", ""),
            "mode": mode,
            "modeLabel": {
                "full_mirror": "Full mirror",
                "archive": "Archive",
                "selected": "Selected files",
                "link_only": "Link only",
                "github_hero": "GitHub raw",
                "github_shaders": "GitHub raw",
            }.get(mode, mode.replace("_", " ").title()),
            "url": source.get("url"),
            "note": source.get("note", ""),
            "linkOnly": mode == "link_only",
            "icon": "link" if mode == "link_only" else ("code" if "shader" in mode else "box"),
        })
    return out


def prepare_source_marks():
    by_id = {s["id"]: s for s in SOURCES}
    return [
        {"label": label, "url": by_id[source_id]["url"], "license": by_id[source_id]["license"]}
        for source_id, label in SOURCE_MARKS
        if source_id in by_id
    ]


def prepare_passport():
    asset = BY_ID["tge/prototype-kit/animal-bison"]
    return {
        "id": asset["id"],
        "name": clean_name(asset["name"]),
        "license": asset["license"],
        "sha256": asset["sha256"],
        "format": asset["format"],
        "bytes": asset["bytes"],
        "sourceUrl": asset["source_url"],
        "sourceRepo": source_repo(asset),
        "verifiedUrl": asset["source_url"],
        "attribution": asset.get("attribution", ""),
        "publicUrl": asset.get("public_url"),
        "mode": asset.get("mode"),
        "verificationDate": asset.get("r2_uploaded_at") or CATALOG.get("generated", ""),
    }


def prepare_motion_plates():
    media = ROOT / "website" / "media"
    plates = []
    for path in sorted(media.glob("poster-*.jpg")):
        label = PLATE_LABELS.get(path.name, path.stem.replace("poster-", "").title())
        plates.append({
            "label": label,
            "image": f"/media/{path.name}",
            "caption": f"{label} studio plate",
        })
    return plates


def read_api_origin():
    p = ROOT / "worker" / "url.txt"
    return p.read_text().strip() if p.exists() else ""


def read_repo_url():
    git_config = ROOT / ".git" / "config"
    if not git_config.exists():
        return ""
    m = re.search(r"url\s*=\s*(\S+)", git_config.read_text())
    if not m:
        return ""
    url = m.group(1)
    return url[:-4] if url.endswith(".git") else url


def prepare_llms_excerpt():
    p = ROOT / "website" / "public" / "llms.txt"
    if not p.exists():
        return ""
    lines = [line.rstrip() for line in p.read_text().splitlines() if line.strip()]
    return "\n".join(lines[:8])


def allowed_licences():
    gate = CATALOG.get("licence_gate", {})
    allowed = list(gate.get("allow", []))
    for name in CATALOG.get("counts", {}).get("by_license", {}):
        lowered = name.lower()
        if ("public domain" in lowered or lowered.startswith("cc by")) and name not in allowed:
            allowed.append(name)
    return allowed


def scrub_public_copy():
    # Public agent/docs mirrors are part of the static site output. Remove the
    # old build-note language without changing catalog.json or backend routes.
    replacements = {
        "ACP/UCP-shaped (illustrative)": "Catalogue product feed",
    }
    for path in [ROOT / "website" / "public" / "product-feed.json", ROOT / "website" / "product-feed.json"]:
        if path.exists():
            text = path.read_text()
            for old, new in replacements.items():
                text = text.replace(old, new)
            path.write_text(text)

    doc_targets = [
        ROOT / "docs" / "frontend-licences.md",
        ROOT / "website" / "docs" / "frontend-licences.md",
        ROOT / "website" / "public" / "docs" / "frontend-licences.md",
        FRONTEND / "public" / "docs" / "frontend-licences.md",
    ]
    for path in doc_targets:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(LICENCES_DOC)


def main():
    ensure_dirs()
    copy_static_files()
    scrub_public_copy()
    metrics = write_metrics()
    featured, polygon_map = prepare_featured(metrics)
    openapi = json.load(open(ROOT / "website" / "public" / "openapi.json"))
    endpoints = ["/catalog.json", "/llms.txt", "/openapi.json", "/health"]
    endpoints += sorted(openapi.get("paths", {}).keys())
    site = {
        "metrics": metrics,
        "apiOrigin": read_api_origin(),
        "repoUrl": read_repo_url(),
        "catalogUrl": "/catalog.json",
        "healthUrl": "/health",
        "endpoints": endpoints,
        "llmsExcerpt": prepare_llms_excerpt(),
        "allowedLicences": allowed_licences(),
        "licenceGate": CATALOG.get("licence_gate", {}),
        "sources": prepare_sources(),
        "sourceMarks": prepare_source_marks(),
        "featured": featured,
        "passport": prepare_passport(),
        "motionPlates": prepare_motion_plates(),
        "polygonMap": polygon_map,
        "heroGlb": "/models/orbital-monolith.glb",
        "heroPoster": "/media/poster-hero.jpg",
    }
    for path in [SRC_DATA / "site.json", PUBLIC / "data" / "site.json"]:
        json.dump(site, open(path, "w"), indent=2)
    print(
        "site data:",
        metrics["assets"], "products,",
        len(featured), "featured renders,",
        len(site["sources"]), "sources,",
        len(polygon_map), "polygon counts",
    )


if __name__ == "__main__":
    main()
