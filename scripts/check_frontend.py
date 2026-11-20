#!/usr/bin/env python3
"""Quality gate for the Vite storefront output."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "frontend" / "dist"
INDEX = DIST / "index.html"
METRICS = json.load(open(ROOT / "frontend" / "src" / "data" / "metrics.json"))
SITE = json.load(open(ROOT / "frontend" / "src" / "data" / "site.json"))
GLB = ROOT / "frontend" / "public" / "models" / "orbital-monolith.glb"
LOCK = ROOT / "frontend" / "package-lock.json"
WORKER = ROOT / "worker" / "src" / "worker.js"

checks: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    checks.append((name, bool(ok), detail))


text = INDEX.read_text() if INDEX.exists() else ""
js_css = ""
for path in DIST.rglob("*"):
    if path.is_file() and path.suffix in {".js", ".css"}:
        js_css += path.read_text(errors="ignore")
all_rendered = text + js_css

check("production index exists", INDEX.exists(), str(INDEX))
check("lockfile committed", LOCK.exists() and LOCK.stat().st_size > 10000)
check("hero GLB exists and is under 1.5 MB", GLB.exists() and GLB.stat().st_size <= 1_500_000, f"{GLB.stat().st_size if GLB.exists() else 0} bytes")
check("catalogue route copied", (DIST / "catalog.json").exists())
check("llms route copied", (DIST / "llms.txt").exists())
check("openapi route copied", (DIST / "openapi.json").exists())
check("agent card copied", (DIST / ".well-known" / "agent-card.json").exists())
baseline = subprocess.run(['git', 'show', 'f468ca3:worker/src/worker.js'], cwd=ROOT, capture_output=True)
check("backend Worker unchanged from f468ca3", baseline.returncode == 0 and WORKER.read_bytes() == baseline.stdout)
check("backend route contract intact", all(route in WORKER.read_text() for route in ['/health', '/sign', '/preview/', '/download/', 'siteKey(path)']))
check("computed asset count is server-rendered", f"{METRICS['assets']:,}" in text or str(METRICS['assets']) in text)
check("computed storage is server-rendered", f"{METRICS['usedGib']:.4f}" in text or str(METRICS['usedGib']) in text)
check("no zero-value count flash", "data-count" not in all_rendered and "0 catalogue assets" not in text)
check("no unresolved placeholders", "%ORBITAL_" not in text)
check("no internal copy leaks", not any(term in all_rendered.lower() for term in [
    "skillfish", "drop the matching mp4", "illustrative model from the project plan",
    "static storefront + catalogue foundation", "you said you will source", "head-probe",
]))
check("no test fixture card copy", "trianglewithoutindices (0 kb)" not in all_rendered.lower())
check("no left progress bar", "position:fixed;left:0" not in js_css.replace(" ", ""))
check("no old coloured headline phrase", "spatial web." not in all_rendered.lower())
check("no 8-second loop labels", "8s loop" not in all_rendered.lower() and "poster/8s" not in all_rendered.lower())
check("display tracking is calm", "-.03em" in js_css or "-0.03em" in js_css)
check("no 11px interface labels", "font-size:11px" not in js_css.replace(" ", "") and "font-size: 11px" not in js_css)
check("custom accessible controls present", all(token in all_rendered for token in ["custom-check", "custom-toggle", "custom-select", "custom-slider", "custom-scroll"]))
check("link-only honesty present", "Link only" in text or "linkOnly" in js_css)
check("waitlist state present", "Checkout opens soon" in all_rendered and "Notify me" in all_rendered)
check("Poly Haven credit present", "Powered by Poly Haven" in text)
check("computed stats are not placeholders", METRICS["assets"] > 0 and METRICS["usedGib"] > 0 and METRICS["headroomGib"] > 0)
check("source records are real", len(SITE["sources"]) == METRICS["sources"] and all(source["url"].startswith("http") for source in SITE["sources"]))
check("featured product shots exist", all((DIST / "media" / "products" / f"{item['renderSlug']}.jpg").exists() for item in SITE["featured"]))
check("phase screenshots exist", all((ROOT / "screenshots" / f"phase-{phase}-{width}.jpg").exists() for phase in (1, 2, 3) for width in (1440, 1920, 390)))
check("phase review pages exist", all((ROOT / "screenshots" / f"phase-{phase}-review.html").exists() for phase in (1, 2, 3)))

failed = [item for item in checks if not item[1]]
for name, ok, detail in checks:
    print(("PASS" if ok else "FAIL"), name, detail)
print(f"frontend quality gate: {len(checks) - len(failed)} PASS, {len(failed)} FAIL")
raise SystemExit(1 if failed else 0)
