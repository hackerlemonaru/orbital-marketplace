#!/usr/bin/env python3
"""Generate the browsable storefront + agent discovery files from catalog.json."""
import os, json, html, re, shutil

ROOT = "/home/user/orbital-marketplace"
WEB = f"{ROOT}/website"
PUB = f"{WEB}/public"
doc = json.load(open(f"{ROOT}/catalog/catalog.json"))
assets = doc["assets"]
counts = doc["counts"]
uploaded = sum(1 for a in assets if a.get("r2_etag") or a.get("r2_archive_uploaded"))

# ---------------------------------------------------------------- compact inline catalogue
def compact(a):
    return {"id": a["id"], "n": a["name"][:46], "c": a["category_path"], "f": a["format"],
            "l": a["license"], "m": a["mode"], "b": a["bytes"], "u": a.get("r2_url") or "",
            "s": a["source_url"][:120]}

# representative sample: interleave across top categories so filters show variety
by_cat = {}
for a in assets:
    top = a["category_path"].split(" / ")[0]
    by_cat.setdefault(top, []).append(a)
sample = []
for top, items in by_cat.items():
    step = max(1, len(items) // 55)
    sample.extend(items[::step][:55])
sample = sample[:360]
payload = {
    "counts": counts,
    "totals": {"assets": len(assets), "r2_objects": uploaded,
               "archive_entries": counts["by_mode"].get("archive", 0),
               "link_only": counts["by_mode"].get("link_only", 0)},
    "sample": [compact(a) for a in sample],
}
os.makedirs(WEB, exist_ok=True)
with open(f"{WEB}/catalog-data.js", "w") as f:
    f.write("window.ORBITAL_CATALOG = " + json.dumps(payload, separators=(",", ":")) + ";\n")

# ---------------------------------------------------------------- inject into the showpiece page
src = open("/home/user/marketplace-preview/index.html").read()
extra_css = """
/* catalogue browser */
.catbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.catbar input,.catbar select{background:rgba(8,5,20,.72);border:1px solid var(--line);color:var(--ink);padding:11px 14px;border-radius:10px;font-size:13px;outline:none;min-width:150px}
.catbar input:focus,.catbar select:focus{border-color:rgba(55,230,255,.6)}
.catbar label{display:inline-flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);padding:0 8px}
.catgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-height:640px;overflow:auto;padding-right:6px}
.asset{border:1px solid var(--line);border-radius:13px;padding:14px;background:rgba(255,255,255,.032);transition:border-color .25s,transform .25s}
.asset:hover{border-color:rgba(139,92,255,.6);transform:translateY(-2px)}
.asset b{font-size:12px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.asset .c{font-size:10px;color:var(--muted);margin:6px 0 10px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.asset .row{display:flex;justify-content:space-between;gap:8px;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase}
.asset .row span:first-child{color:var(--cyan)}
.asset .row span:last-child{color:var(--muted)}
.catstat{display:flex;gap:22px;flex-wrap:wrap;margin:0 0 20px;font-size:12px;color:var(--muted)}
.catstat b{color:#fff;font-size:18px;display:block}
.more{margin-top:16px}
@media(max-width:1000px){.catgrid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:620px){.catgrid{grid-template-columns:1fr}}
"""
src = src.replace("</style>", extra_css + "\n</style>")

browser = f"""
<section id="catalog-browser">
  <div class="shead reveal">
    <div><span class="kicker">03 / LIVE CATALOGUE</span><h2>{len(assets):,} assets, indexed.</h2></div>
    <p>Generated from <code>catalog/catalog.json</code>. Every row carries SPDX licence, attribution, SHA-256, source URL and an R2 key. {uploaded:,} objects are already in your bucket.</p>
  </div>
  <div class="catstat reveal">
    <div><b>{len(assets):,}</b>catalogue rows</div>
    <div><b>{uploaded:,}</b>R2 objects</div>
    <div><b>{counts['by_license'].get('CC0-1.0',0):,}</b>CC0 assets</div>
    <div><b>{counts['by_license'].get('MIT',0):,}</b>MIT assets</div>
    <div><b>0</b>licence-gate failures</div>
  </div>
  <div class="catbar reveal">
    <input id="q" placeholder="Search asset name…" />
    <select id="fcat"><option value="">All categories</option></select>
    <select id="ffmt"><option value="">All formats</option></select>
    <select id="flic"><option value="">All licences</option></select>
    <label><input type="checkbox" id="ffree" checked /> free / OSS only</label>
  </div>
  <div class="catgrid" id="catgrid"></div>
  <div class="more"><button class="btn" id="moreBtn">Show more ↓</button> <span id="shown" style="font-size:11px;color:var(--muted);margin-left:12px"></span></div>
</section>
"""
src = src.replace('<section id="pricing">', browser + '\n<section id="pricing">')

inline = "<script id=\"catalog-inline\" type=\"application/json\">" + json.dumps(payload, separators=(",", ":")).replace("</", "<\\/") + "</script>\n"
browser_js = """
<script>
(function(){
 const D=JSON.parse(document.getElementById('catalog-inline').textContent);
 const S=D.sample, grid=document.getElementById('catgrid'), q=document.getElementById('q');
 const fc=document.getElementById('fcat'), ff=document.getElementById('ffmt'), fl=document.getElementById('flic'), fr=document.getElementById('ffree');
 const uniq=(k)=>[...new Set(S.map(x=>x[k]).filter(Boolean))].sort();
 uniq('c').forEach(v=>fc.insertAdjacentHTML('beforeend',`<option>${v}</option>`));
 uniq('f').forEach(v=>ff.insertAdjacentHTML('beforeend',`<option>${v}</option>`));
 uniq('l').forEach(v=>fl.insertAdjacentHTML('beforeend',`<option>${v}</option>`));
 let limit=48;
 function render(){
  const term=q.value.toLowerCase(), c=fc.value, f=ff.value, l=fl.value, free=fr.checked;
  const rows=S.filter(x=>(!term||x.n.toLowerCase().includes(term))&&(!c||x.c===c)&&(!f||x.f===f)&&(!l||x.l===l)&&(!free||/CC0|MIT|Public|see seed/i.test(x.l)));
  grid.innerHTML=rows.slice(0,limit).map(x=>`<div class="asset"><b title="${x.n}">${x.n}</b><span class="c">${x.c}</span><div class="row"><span>${x.f}</span><span>${x.l}</span></div><div class="row" style="margin-top:8px"><span>${x.m}</span><span>${x.b?(x.b/1024).toFixed(0)+' KB':'index'}</span></div></div>`).join('')||'<p style="color:var(--muted);font-size:13px">No matches — clear a filter.</p>';
  document.getElementById('shown').textContent=`showing ${Math.min(limit,rows.length)} of ${rows.length} matching · ${D.totals.assets.toLocaleString()} total in catalog.json`;
 }
 [q,fc,ff,fl,fr].forEach(e=>e.addEventListener('input',render));
 document.getElementById('moreBtn').addEventListener('click',()=>{limit+=48;render()});
 render();
})();
</script>
"""
src = src.replace("</body>", inline + browser_js + "\n</body>")
open(f"{WEB}/index.html", "w").write(src)

# ---------------------------------------------------------------- agent discovery files
os.makedirs(f"{PUB}/.well-known/mcp", exist_ok=True)
os.makedirs(f"{PUB}/skills/orbital-assets", exist_ok=True)
os.makedirs(f"{PUB}/docs", exist_ok=True)
BASE = "https://orbital.example"  # replace with the real domain on deploy

files = {}
files["llms.txt"] = f"""# ORBITAL — 3D, motion & UI-decoration asset marketplace

> Browser-ready 3D, shader, motion and UI assets with performance budgets, machine-readable licences and a rate-limited agent API. Free read-only access for agents.

All endpoints are rate limited; read /docs/agent-rate-limits.md before bulk access. Free tier: search, metadata, licence, watermarked previews, install snippets. Paid file downloads require an entitlement.

## Catalogue
- [Catalogue JSON]({BASE}/catalog.json): {len(assets):,} rows with SPDX licence, SHA-256, source URL, R2 key
- [Category index]({BASE}/catalog.md): 8 families, 66 subcategories
- [Format & performance spec]({BASE}/docs/formats.md): GLB/KTX2, dotLottie, Rive, TSL/WGSL
- [Licence matrix]({BASE}/docs/licenses.md): CC0 / MIT / MIT-0 / CC-BY + attribution rules

## Agents
- [OpenAPI 3.1]({BASE}/openapi.json)
- [MCP server]({BASE}/mcp): spec 2026-07-28, Streamable HTTP, OAuth 2.1
- [Agent card]({BASE}/.well-known/agent-card.json)
- [MCP registry server.json]({BASE}/.well-known/mcp/server.json)
- [Rate limits & 429 contract]({BASE}/docs/agent-rate-limits.md)
- [Product feed (ACP/UCP shape)]({BASE}/product-feed.json)

## Optional
- [Creator submission guide]({BASE}/docs/submit.md)
- [AGENTS.md]({BASE}/AGENTS.md) · [SKILL.md]({BASE}/skills/orbital-assets/SKILL.md)
"""
files["robots.txt"] = """User-agent: *
Allow: /
Disallow: /api/private/

# As a condition of accessing this website, you agree to abide by the following content signals:
# (a) If a content-signal = yes, you may collect content for the corresponding use.
# (b) If a content-signal = no, you may not collect content for the corresponding use.
# search: building a search index and providing search results
# ai-input: inputting content into one or more AI models (RAG / grounding)
# ai-train: training or fine-tuning AI models
Content-Signal: search=yes, ai-input=yes, ai-train=no
"""
files["AGENTS.md"] = """# AGENTS.md

## Project
ORBITAL — web-native 3D / motion / UI-decoration asset marketplace.

## Layout
- `catalog/catalog.json` — source of truth for every asset (licence, sha256, R2 key)
- `catalog/taxonomy.json` — 8 families / 66 subcategories / required asset fields
- `seed-assets/` — 36 licence-vetted sample files
- `website/` — Next.js target; `website/index.html` is a zero-dependency design proof
- `website/public/` — files served at root (llms.txt, robots.txt, .well-known/*, openapi.json)
- `scripts/` — import_github.py, r2_upload.py, build_website.py

## Conventions
- Never commit `.secrets/`, `.env`, or any token.
- Large binaries go to Cloudflare R2, not git. `asset-corpus/` is git-ignored.
- Licence gate: allow CC0-1.0, MIT, MIT-0, CC-BY-4.0, Apache-2.0. Reject NC / Commons Clause / NOASSERTION / GPL-3.0.
- CC-BY rows require `attribution_text` in the listing, bundle manifest and `.md` mirror.
- All 3D assets need a WebGL2 fallback, a 2D poster and a reduced-motion variant.
"""
files["docs/agent-rate-limits.md"] = """# Agent rate limits

| Tier | Auth | Read | Downloads |
|---|---|---|---|
| Anonymous | IP | 30 req/hour, burst 10/min | none (watermarked previews) |
| Free agent key (read-only) | API key / OAuth 2.1 | 60 req/min, 1,000/day | free assets via signed URL; no paid files |
| Studio plan | scoped key | 120 req/min, 50,000/day | 100/day licensed |
| Enterprise | key + Web Bot Auth (RFC 9421) | 1,000 req/min | negotiated + SLA |

Weighted quota units: search=1, preview=2, download=10, generation=50.
Global guardrails: per-agent-per-tool 60/5min, per-conversation 500/hour, per-tenant 10k/hour, per-tool-global 100 rps.

```http
RateLimit-Policy: "search";q=60;w=60, "daily";q=1000;w=86400
RateLimit: "search";r=42;t=18
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 18
```

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 18
RateLimit: "search";r=0;t=18
{"type":"https://orbital.example/problems/quota-exceeded","retry_after":18}
```

IETF draft-11 headers are still an Internet-Draft (not an RFC), so legacy `X-RateLimit-*` are sent too. MCP layers must surface 429s as structured `isError` tool results, never silently retry.
"""
files["docs/formats.md"] = """# Format & performance baseline (2026)

- 3D: GLB / glTF 2.0 (primary), KTX2/Basis textures, Draco or EXT_meshopt_compression, USDZ for AR.
- Ratified glTF extensions: KHR_gaussian_splatting, KHR_interactivity, KHR_node_hoverability/selectability/visibility, KHR_xmp_json_ld.
- Renderers: Three.js WebGPURenderer + TSL, React Three Fiber, Babylon.js, PlayCanvas, model-viewer. **WebGL2 fallback + 2D poster required** (MDN still marks WebGPU Limited availability).
- Motion: dotLottie `.lottie` (primary), Rive `.riv`, GSAP/Motion timelines, WebM/MP4 alpha, CSS View Transitions / ScrollTimeline. Raw `.json` and `@lottiefiles/react-lottie-player` are legacy.
- Code: React/Next.js + Tailwind TSX, plain HTML/CSS/JS, shadcn registry item JSON.
- Images: AVIF, WebP, SVG; PNG fallback only.
- Every asset: byte budget, poly/layer count, reduced-motion variant, SHA-256, SPDX licence, poster fallback.
"""
files["docs/licenses.md"] = """# Licence matrix

| SPDX | Allowed | Attribution | AI training |
|---|---|---|---|
| CC0-1.0 | yes | not required (credit appreciated) | permitted |
| MIT | yes | MIT notice required | permitted |
| MIT-0 | yes | none | permitted |
| CC-BY-4.0 | yes | **mandatory** in listing + bundle + .md mirror | permitted with attribution |
| Apache-2.0 | yes | NOTICE required | permitted |

Rejected: Commons Clause (React Bits), CC-BY-NC / NC-SA (OmniLottie dataset), NOASSERTION mirrors, GPL-3.0, proprietary "no redistribution" (GSAP, Quaternius QAL, Mixamo, Megascans, Aceternity).

AI-generated submissions: "Created with AI" label, C2PA manifest, model/seed/prompt metadata, `allow_ai_training` opt-in (default false).
"""
files["docs/submit.md"] = """# Creator submission

1. Upload the asset + source files.
2. Licence gate runs automatically (SPDX allowlist).
3. Optimisation: gltf-transform (Draco/Meshopt/KTX2), dotLottie packing, TSL+WGSL variants, splat-transform → KHR_gaussian_splatting GLB.
4. Provenance: SHA-256, C2PA, SPDX embedded via KHR_xmp_json_ld.
5. Preview render + WebP thumb + 2D poster + performance budget check.
6. Choose: free item, per-item price (Personal/Commercial/Extended), or include in plans.
7. Published to storefront, llms.txt, ACP/UCP feed, MCP tool index and SKILL.md.
"""
files["openapi.json"] = json.dumps({
    "openapi": "3.1.0",
    "info": {"title": "ORBITAL Asset API", "version": "1.0.0",
             "description": "Read-only agent API for 3D, motion and UI-decoration assets."},
    "servers": [{"url": BASE + "/v1"}],
    "paths": {
        "/assets": {"get": {"operationId": "search_assets", "summary": "Search the catalogue",
            "parameters": [{"name": "q", "in": "query", "schema": {"type": "string"}},
                           {"name": "category", "in": "query", "schema": {"type": "string"}},
                           {"name": "format", "in": "query", "schema": {"type": "string"}},
                           {"name": "license", "in": "query", "schema": {"type": "string"}},
                           {"name": "cursor", "in": "query", "schema": {"type": "string"}},
                           {"name": "limit", "in": "query", "schema": {"type": "integer", "maximum": 100, "default": 20}}],
            "responses": {"200": {"description": "Asset page"}, "429": {"description": "Quota exceeded"}}}},
        "/assets/{asset_id}": {"get": {"operationId": "get_asset", "responses": {"200": {"description": "Asset record"}}}},
        "/assets/{asset_id}/license": {"get": {"operationId": "get_license", "responses": {"200": {"description": "SPDX + attribution"}}}},
        "/assets/{asset_id}/preview": {"get": {"operationId": "get_preview", "responses": {"200": {"description": "Watermarked preview URL"}}}},
        "/assets/{asset_id}/install": {"get": {"operationId": "get_install_snippet", "responses": {"200": {"description": "Install snippet"}}}},
        "/quota": {"get": {"operationId": "check_quota", "responses": {"200": {"description": "Current quota"}}}},
    },
    "components": {"securitySchemes": {"agentKey": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}}},
}, indent=2)
files[".well-known/agent-card.json"] = json.dumps({
    "name": "ORBITAL Asset Agent", "description": "Search, inspect and license web-native 3D, motion and UI assets.",
    "version": "1.0.0",
    "supportedInterfaces": [
        {"url": BASE + "/mcp", "protocolBinding": "JSONRPC", "protocolVersion": "2026-07-28"},
        {"url": BASE + "/v1", "protocolBinding": "HTTP+JSON", "protocolVersion": "1.0"}],
    "provider": {"organization": "ORBITAL", "url": BASE},
    "capabilities": {"streaming": True, "pushNotifications": False},
    "securitySchemes": {"agentKey": {"httpAuthSecurityScheme": {"scheme": "bearer", "bearerFormat": "JWT"}}},
    "securityRequirements": [{"schemes": {"agentKey": {"list": []}}}],
    "defaultInputModes": ["text/plain", "application/json"],
    "defaultOutputModes": ["application/json", "text/markdown"],
    "skills": [
        {"id": "asset-search", "name": "Search assets", "description": "Find assets by category, format, licence and byte budget.", "tags": ["3d", "motion", "catalog"]},
        {"id": "license-check", "name": "Check licence", "description": "Return SPDX licence, attribution and AI-training flag.", "tags": ["rights", "compliance"]},
    ],
}, indent=2)
files[".well-known/mcp/server.json"] = json.dumps({
    "$schema": "https://registry.modelcontextprotocol.io/schema/server.json",
    "name": "io.orbital/assets", "description": "Read-only ORBITAL asset catalogue MCP server",
    "version": "1.0.0", "status": "active",
    "remotes": [{"type": "streamable-http", "url": BASE + "/mcp"}],
    "_meta": {"io.orbital/protocolVersion": "2026-07-28", "io.orbital/rateLimits": BASE + "/docs/agent-rate-limits.md"},
}, indent=2)
files["skills/orbital-assets/SKILL.md"] = """---
name: orbital-assets
description: Find and install web-native 3D, shader, motion and UI-decoration assets from ORBITAL. Use when a site needs a GLB model, a dotLottie animation, a TSL/WGSL shader, or an animated UI component.
license: MIT
compatibility: Requires network access to the ORBITAL API; works with Claude Code, Codex, Cursor, Gemini CLI and any MCP client.
metadata:
  author: ORBITAL
  version: "1.0"
---

# ORBITAL asset install

1. Read `/llms.txt` first, then `/docs/agent-rate-limits.md`.
2. Use the MCP tool `search_assets` or `GET /v1/assets?q=...&category=...&format=...`.
3. Always call `get_license` before installing. CC-BY-4.0 rows require the attribution string in code comments or a CREDITS file.
4. Prefer assets with a `reduced_motion_variant` and a `poster_fallback_url`; wire `prefers-reduced-motion`.
5. Install GLB with `get_install_snippet` (R3F / model-viewer). Use WebGPU renderer with a WebGL2 fallback.
6. Never bulk-download: honour `RateLimit-Remaining` and `Retry-After`. On 429, back off and surface the error.
"""
files["catalog.md"] = f"""# ORBITAL catalogue

Generated 2026-11-19 from licence-vetted GitHub sources.

- **{len(assets):,}** catalogue rows
- **{uploaded:,}** objects uploaded to Cloudflare R2 (`jc-bose`)
- Machine-readable source: `/catalog.json`
- 8 families / 66 subcategories in `/catalog/taxonomy.json`

| Top category | Rows |
|---|---|
""" + "\n".join(f"| {k} | {v:,} |" for k, v in sorted(counts["by_category_top"].items(), key=lambda x: -x[1])) + "\n"

# ACP/UCP-shaped product feed sample (free + paid placeholders)
feed_items = []
for a in assets[:24]:
    feed_items.append({"id": a["id"], "title": a["name"], "description": a["category_path"],
                       "price": {"amount": 0, "currency": "USD"}, "license": a["license"],
                       "url": BASE + "/assets/" + a["id"], "availability": "in_stock",
                       "ai_generated": a["ai_generated"], "allow_ai_training": a["allow_ai_training"]})
files["product-feed.json"] = json.dumps({"spec": "ACP/UCP-shaped (illustrative)", "version": "2026-11-19",
                                         "freshness_target_seconds": 900, "items": feed_items}, indent=2)

for rel, content in files.items():
    p = os.path.join(PUB, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w").write(content)
# copy catalog.json to public for agents
shutil.copy(f"{ROOT}/catalog/catalog.json", f"{PUB}/catalog.json")

# Static-preview mirror: a Next.js `public/` is served at root, so duplicate the
# agent files at website/ root too for python http.server / any static host.
for rel in list(files) + ["catalog.json"]:
    src = os.path.join(PUB, rel)
    dst = os.path.join(WEB, rel)
    if os.path.isfile(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy(src, dst)

print("website/index.html:", os.path.getsize(f"{WEB}/index.html"), "bytes")
print("catalog-data.js:", os.path.getsize(f"{WEB}/catalog-data.js"), "bytes")
print("public agent files:", len(files) + 1)
