#!/usr/bin/env python3
"""Generate front-end metrics from the catalogue and the exact R2 quota report.

No display numbers are hand-authored in the UI: row counts and file counts come
from catalog.json, storage comes from the API-measured r2-quota.json, and health
is fetched at runtime by the browser.
"""
import datetime
import json
import os
import re

ROOT = str(__import__("pathlib").Path(__file__).resolve().parent.parent)

FIXTURE = re.compile(
    r"(Triangle|SimpleMaterial|SimpleMeshes|Cameras|SimpleSkin|Unicode|Interpolation|Visibility|Coordinate|TextureEncoding|TextureLinear|BoxVertexColors|LightVisibility|NodeVisibility|AnimatedColorsCube|AnimatedMorphCube|CubeVisibility|SimpleInstancing)",
    re.I,
)


def is_preview(asset):
    name = asset.get("name", "")
    category = asset.get("category_path", "")
    fmt = str(asset.get("format", "")).upper()
    return (
        str(asset.get("id", "")).endswith("#thumb")
        or "(preview)" in name.lower()
        or " / previews" in category.lower()
        or (category.lower().endswith("previews") and fmt in {"WEBP", "PNG", "JPG", "JPEG"})
    )


def is_fixture(asset):
    return bool(FIXTURE.search(asset.get("name", ""))) and asset.get("mode") != "github"


def load_inputs():
    doc = json.load(open(f"{ROOT}/catalog/catalog.json"))
    quota = json.load(open(f"{ROOT}/catalog/r2-quota.json"))
    upload_log = json.load(open(f"{ROOT}/catalog/r2-upload-log.json"))
    return doc, quota, upload_log


def compute_metrics():
    doc, quota, upload_log = load_inputs()
    assets = doc["assets"]
    previews = [a for a in assets if is_preview(a)]
    display = [a for a in assets if not is_preview(a) and not is_fixture(a)]
    downloadable = [
        a for a in display
        if a.get("mode") != "link_only"
        and a.get("public_url")
        and int(a.get("bytes") or 0) > 0
    ]
    link_only = [a for a in display if a.get("mode") == "link_only"]
    cap = float(quota.get("cap_gib", 9.8))
    used = float(quota.get("used_gib", 0))
    return {
        "generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "totalRows": len(assets),
        "assets": len(display),
        "downloadableFiles": len(downloadable),
        "previewFiles": len(previews),
        "fixturesHidden": len(assets) - len(previews) - len(display),
        "linkOnly": len(link_only),
        "sources": len(doc.get("sources", [])),
        "uploadedFiles": len(upload_log.get("uploaded", [])),
        "usedGib": used,
        "headroomGib": float(quota.get("headroom_gib", cap - used)),
        "capGib": cap,
        "objects": quota.get("objects"),
        "usedPct": round((used / cap) * 100, 2),
    }


def write_metrics(metrics=None):
    metrics = metrics or compute_metrics()
    os.makedirs(f"{ROOT}/frontend/src/data", exist_ok=True)
    os.makedirs(f"{ROOT}/frontend/public/data", exist_ok=True)
    for path in (
        f"{ROOT}/frontend/src/data/metrics.json",
        f"{ROOT}/frontend/public/data/metrics.json",
    ):
        json.dump(metrics, open(path, "w"), indent=2)
    return metrics


if __name__ == "__main__":
    m = write_metrics()
    print(
        "assets", m["assets"],
        "downloadable", m["downloadableFiles"],
        "previews", m["previewFiles"],
        "used", m["usedGib"],
    )
