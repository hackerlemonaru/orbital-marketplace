# Build Plan v2 — GitHub seed assets, stack & monetisation

**Date:** 19 November 2026 · **Status:** decisions locked, ready to scaffold
**Companion files:** `seed-assets/` (36 verified files + `seed-manifest.json`) · `marketplace-preview/index.html` (visual proof) · `stack/package.json` (dependency skeleton) · `catalog-taxonomy.json` + `marketplace-scope-2026.md` (v1 research)

---

## 0. Decisions locked from your message

| Your call | What it means for the build |
|---|---|
| "no marketplace i have" | Greenfield. `catalog-taxonomy.json` is the schema of record; nothing to migrate. |
| "go search for assets on github we could import" | I did, and **license-gated** it. 36 files are already imported into `seed-assets/` with SHA-256 + source + SPDX. Full shortlist + banned list below. |
| "plan based, each item based and free available items also" | Three revenue levers on **one entitlement system**: free items, one-time per-item licences, subscription plans with credits. |
| "ai-generated assets allowed" | Accepted from creators **with** a "Created with AI" label, C2PA provenance and an opt-in `allow_ai_training` flag (default `false`). |
| "free read-only for agents" | Anonymous + free-key agents get search, metadata, licence checks, watermarked previews and install snippets. No paid-file downloads without an entitlement. |
| "if our own website doesn't look crazy we dont stand" | The storefront is a product demo: WebGPU/TSL shader hero, CSS-3D orb, kinetic type, tilt bento, custom cursor, scroll reveals — all with reduced-motion + WebGL2 fallback. See `marketplace-preview/index.html`. |

---

## 1. GitHub sourcing — license-vetted shortlist

**Method:** GitHub API for repo metadata + `raw.githubusercontent.com` for the actual `LICENSE` / `README` / `metadata.json`, checked 19 Nov 2026. Repos showing `NOASSERTION` or no licence were **excluded unless the upstream licence text was verified**. This matters more than usual: "free to use" is **not** the same as "free to redistribute", and a marketplace resells/redistributes by definition.

### 1.1 Approved for import → free tier

| Repo | What it gives us | Licence (verified) | Resale / redistribute? | Import action |
|---|---|---|---|---|
| [Hidencod/tge-assets](https://github.com/Hidencod/tge-assets) | **1,883 GLB models in 19 packs** + WebP thumbs, Kenney, `catalog.json` included [5](https://github.com/Hidencod/tge-assets) | **CC0-1.0** (repo `LICENSE` states derived GLBs + thumbs are also CC0) | ✅ Yes, no attribution required (credit appreciated) | Already seeded 6 GLBs + thumbs. Best single source for a free 3D starter library. |
| [useanimations/react-useanimations](https://github.com/useanimations/react-useanimations) | **302 MIT Lottie JSON icons** with hover/click/loop, shadcn registry + `llms.txt` [3](https://useanimations.com/lottie-icons) | **MIT** | ✅ Yes, include MIT notice | Repackaged 8 into `.lottie` containers (see §2). |
| [verekia/tslfx](https://github.com/verekia/tslfx) | TSL/WGSL shader collection (gradient, impact, dot-noise, SDF, scatter, water) for WebGPU + WebGL2 fallback [2](https://github.com/topics/glsl?l=typescript) | **MIT** | ✅ Yes, include MIT notice | Seeded 5 modules. Perfect for the Materials/Shaders family. |
| [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | 150+ animated React/Tailwind components, shadcn registry, 23k stars [1](https://webberui.com/guides/animated-react-component-libraries) [2](https://beui.dev/guides/best-react-animation-libraries-2027) | **MIT** | ✅ Yes | Curate ~30 components into free UI-decoration bundles; keep MIT notice. |
| [uiverse-io/galaxy](https://github.com/uiverse-io/galaxy) | **3,000+ standalone HTML/CSS UI elements** (buttons, cards, loaders, patterns, notifications) [1](https://github.com/uiverse-io/galaxy/blob/main/README.md) | **MIT** | ✅ Yes | Seeded 5 inline-style elements. Great for "decorating stuff". |
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | MIT base components + the registry format agents install through [3](https://github.com/CreativesLibrary/Components) | **MIT** | ✅ Yes | Use as the registry/install contract, not as premium stock. |
| [AWS Gaussian Splats guidance](https://github.com/aws-solutions-library-samples/guidance-for-open-source-3d-reconstruction-toolbox-for-gaussian-splats-on-aws) | Sample `.spz` / `.sog` splats + `splat-transform` pipeline (PLY/SPZ/SOG/USDZ, LOD SOG bundles) [1](https://github.com/aws-solutions-library-samples/guidance-for-open-source-3d-reconstruction-toolbox-for-gaussian-splats-on-aws) | **MIT-0** (no attribution) | ✅ Yes | Seeded `wolf.spz`. Convert to ratified `KHR_gaussian_splatting` GLB before listing. |
| [KhronosGroup/glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) | Curated glTF feature demos; **per-model `metadata.json` with SPDX licence** [5](https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/CONTRIBUTING.md) | Mixed **CC0-1.0 / CC-BY-4.0 / CC-BY-NC** — filter per model [2](https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/Models.md) | ⚠️ CC0 + CC-BY only; NC excluded | Import only CC0/CC-BY rows; auto-generate attribution from `metadata.json`. |
| [KayKit-Game-Assets/*](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0) | CC0 low-poly character/environment packs (FBX + glTF), 133-animation pack [3](https://kaylousberg.com/game-assets/character-animations) [5](https://github.com/KayKit-Game-Assets/KayKit-Space-Base-Bits-1.0) | **CC0-1.0** [2](https://tmhsdigital.github.io/Free-Game-Dev-Assets/entry/kaykit/) | ✅ Yes | Convert glTF → GLB, downsample the 1024² atlas to 128² for web budgets. |
| [PolygonalMind/100Avatars](https://github.com/PolygonalMind/100Avatars/releases) | 200+ rigged CC0 VRM/FBX avatars [1](https://github.com/PolygonalMind/100Avatars/releases) | **CC0-1.0** | ✅ Yes | Link + selective ingest (large files); convert to GLB. |
| [ToxSam/cc0-models-Polygonal-Mind](https://github.com/topics/free-3d-models) + [nexusmedialab/open-source-3d-assets](https://github.com/nexusmedialab/open-source-3d-assets) | **~991 CC0 GLBs** from 18 themed collections; the second is a tiny JSON registry [1](https://github.com/nexusmedialab/open-source-3d-assets) [3](https://github.com/topics/free-3d-models) | **CC0-1.0** | ✅ Yes | **Link-only index**, not a 1.6 GB mirror. Ingest selectively. |
| [nasa/NASA-3D-Resources](https://github.com/nasa/NASA-3D-Resources) | Spacecraft, rovers, telescopes, textures; repo states "free and without copyright" [1](https://github.com/nasa/NASA-3D-Resources) | Public domain + NASA usage guidelines | ✅ Yes, with usage-guideline compliance | 5.2 GB — link + selective GLB ingest, optimise hard. |
| [lucas-martinic/polyfork-catalog](https://github.com/topics/free-3d-models) | 3,391 GLB models / 35 themed kits for three.js [3](https://github.com/topics/free-3d-models) | **CC BY 4.0** | ⚠️ Yes **with attribution** | Attribution-required free tier only. |
| [LottieFiles/dotlottie-web](https://github.com/LottieFiles/dotlottie-web), [airbnb/lottie-web](https://github.com/airbnb/lottie-web), [pmndrs/drei](https://github.com/pmndrs/drei), [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber), [mrdoob/three.js](https://github.com/mrdoob/three.js) | Runtimes / helpers, MIT | **MIT** | ✅ Use as dependencies | **Not catalogue items.** Runtime stack only. |
| [spemer/lottie-animations-json](https://github.com/spemer/lottie-animations-json) | Small MIT Lottie JSON set, but 2018 / raw `.json` [1](https://github.com/spemer/lottie-animations-json) | MIT | ✅ Yes | Low priority; convert to `.lottie` if used. |

### 1.2 Do **not** import (this is the important part)

| Source | Why it's blocked |
|---|---|
| [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) | **MIT + Commons Clause** — I read the raw `LICENSE.md`: it permits use "as part of an application, website, or product" but forbids **selling / sublicensing / redistributing the components themselves**. That is exactly what our marketplace does [1](https://webberui.com/guides/animated-react-component-libraries) [5](https://soymarketingultra.com/en/react-bits-review-animated-components-ai/). |
| Aceternity UI (free + Pro) | Licence forbids **selling on marketplaces** / redistributing source, even for free-tier items [1](https://webberui.com/guides/animated-react-component-libraries). |
| [GSAP](https://github.com/greensock/GSAP) | Free since 30 Apr 2025 but **proprietary "No Charge"**, not OSI open source: Webflow keeps IP, branding notices can't be removed, a non-compete applies, and the grant is **use, not redistribution** [1](https://zumkai.com/en/post/gsap-free-license) [2](https://artofstyleframe.com/blog/gsap-2026-free-license-whats-new/) [4](https://github.com/Aberratio/web-studio-kit/pull/5). Use it as a site dependency; never ship GSAP source as an asset. |
| Quaternius packs | QAL v1.0: free commercial use, no attribution, but **you may not resell or redistribute the assets as a standalone pack / stock file / template** [3](https://app.cinevva.com/guides/free-rigged-3d-character-models). |
| Adobe Mixamo | Free for commercial use, **no redistribution of the files** [3](https://app.cinevva.com/guides/free-rigged-3d-character-models). |
| Quixel Megascans | Fab Standard License: use in projects, **don't redistribute the raw files** [2](https://github.com/kanaworksai-hue/sozai-search-mcp). |
| [OpenVGLab/OmniLottie](https://github.com/OpenVGLab/OmniLottie) | Code is Apache-2.0, but the **MMLottie-2M dataset is CC-BY-NC-SA** — "commercial use, redistribution for profit… strictly prohibited" [5](https://github.com/OpenVGLab/OmniLottie). Generator code only, never the dataset. |
| [GeorgeQLe/assets-kaykit-3d-props](https://github.com/GeorgeQLe/assets-kaykit-3d-props) | GitHub reports `NOASSERTION`; it mirrors the **paid "Complete KayKit Collection v6"** [4](https://github.com/GeorgeQLe/assets-kaykit-3d-props). Provenance unverifiable → skip. Use official KayKit-Game-Assets repos instead. |
| [sigco3111/assets-3d-lowpoly](https://github.com/sigco3111/assets-3d-lowpoly) | `NOASSERTION`, 683 MB of mixed mirrors from OpenGameArt/Kenney/Quaternius [1](https://github.com/sigco3111/assets-3d-lowpoly). Skip: no clean chain of custody. |
| [seansiddens/wgsl-shaders](https://github.com/seansiddens/wgsl-shaders) | No licence file [3](https://github.com/seansiddens/wgsl-shaders). Skip. |
| [JonGold83/JonGaussianSplatts](https://github.com/JonGold83/JonGaussianSplatts) | **GPL-3.0** splats [4](https://github.com/JonGold83/JonGaussianSplatts) — copyleft incompatible with a proprietary catalogue. |
| three.js `examples/` textures & models | Mixed third-party licences; an open 2026 issue flags an MRI texture under CPOL with unclear rights [5](https://github.com/mrdoob/three.js/issues/35077). Use MIT **code/addons** only. |
| [KhronosGroup/glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models) | Legacy repo frozen Dec 2023; superseded by `glTF-Sample-Assets`. Its `Box` is **CC-BY-4.0**, not CC0 — included in the seed pack only with mandatory attribution. |
| Anything CC-BY-NC, Editorial-only, "no resale", or a `NOASSERTION` mirror | Automatic licence-gate rejection. |

**Rule for the ingest service:** an SPDX allowlist of `{CC0-1.0, MIT, MIT-0, CC-BY-4.0, Apache-2.0}`. `CC-BY-4.0` is allowed only when `attribution_text` is non-empty. Everything else is rejected at upload with a reason code. Fab requires a "Created with AI" disclosure and CGTrader barred standard listings from AI-training licensing in May 2026 — clear evidence that machine-readable rights are now a competitive requirement [5](https://tech-insider.org/unity-asset-store-vs-fab-vs-cgtrader-2026/).

---

## 2. What I actually imported (`seed-assets/`)

**36 files · 2,077,067 bytes · verified 2026-11-19.** Every entry in `seed-assets/seed-manifest.json` has `file, bytes, sha256, source, license, category, attribution, note`.

| Folder | Count | Content | Licence |
|---|---|---|---|
| `3d-models/` | 13 | 6 Kenney CC0 GLBs + 6 WebP thumbnails + 1 Cesium `Box.glb` | CC0-1.0 / CC-BY-4.0 |
| `motion/` | 8 | `.lottie` archives built from MIT useAnimations JSON (`manifest.json` + `animations/*.json`) | MIT |
| `shaders/` | 5 | TSLFX gradient / impact / dot-noise / shape / util modules | MIT |
| `ui/` | 5 | Uiverse inline-style buttons, card, loader, notification, pattern | MIT |
| `splats/` | 1 | `wolf.spz` sample Gaussian splat | MIT-0 |
| `licenses/` | 4 | Verbatim upstream licence texts | — |

Notable: the `.lottie` files are a **real format conversion**, not copies — each is a deflate ZIP with a dotLottie `manifest.json` plus the MIT animation JSON, matching the 2026 container standard, since dotLottie is MIT-licensed and `.lottie` supersedes raw `.json` [4](https://lottiefiles.com/dotlottie). The `wolf.spz` is a placeholder for the ratified `KHR_gaussian_splatting` pipeline ([Khronos registry](https://github.com/KhronosGroup/glTF/blob/main/extensions/README.md)).

**AI-generated assets stay separate.** The seed pack is 100% OSS-derived. Creator-submitted AI work goes through a different path with C2PA content credentials, model/version/seed/prompt fields, SPDX licence, `ai_generated: true` and `allow_ai_training: false` by default — the metadata categories enterprise 3D pipelines now treat as mandatory [3](https://virtuall.pro/blog/metadata-standards-for-ai-generated-3d-assets).

---

## 3. Ingest pipeline (build this once)

```
GitHub API / raw / shallow clone
   → licence gate (SPDX allowlist + attribution check)      ← rejects Commons Clause / NC / NOASSERTION
   → checksum + provenance record (sha256, source URL, commit)
   → format normalisation
        GLB/glTF : gltf-transform → Draco/Meshopt + KTX2, LODs, poster.avif
        Lottie   : JSON → .lottie ZIP (+manifest)
        Splats   : .ply/.spz/.sog → KHR_gaussian_splatting GLB (splat-transform)
        Shaders  : TSL/WGSL primary + GLSL variant + CSS fallback
        UI       : TSX + plain HTML + shadcn registry-item.json
   → rights embed (SPDX + attribution in glTF KHR_xmp_json_ld / C2PA manifest)
   → preview render (headless Three.js / Playwright) + WebP thumb + 2D poster
   → performance budget check (bytes, polycount, reduced-motion variant, WebGL2 fallback)
   → asset record (catalog-taxonomy.json required fields) → Postgres + R2 + search index
   → publish surfaces: storefront / llms.txt / ACP-UCP feed / MCP tool index / SKILL.md
```

Pricing assignment at the last step: **OSS-derived → free tier**; **original creator work → per-item and/or plan**; never mark an OSS import as paid (legal + reputational risk).

---

## 4. Stack decision — best for an asset marketplace that must look unreal

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + React 19 + TypeScript** | SSG/ISR catalogue pages for SEO, React Server Components for heavy listings, route handlers for `/mcp`, `/v1/*`, `/.well-known/*`, `/openapi.json`, `/llms.txt` and product feeds — **one deploy**, no separate backend to proxy. |
| Styling | **Tailwind CSS v4 + shadcn/ui registry** | Registry items are what coding agents already install; our assets become one-command installs [3](https://github.com/CreativesLibrary/Components). |
| Storefront motion | **Motion (MIT)** + **GSAP ScrollTrigger** (dependency only, see §1.2) + **Lenis** + native View Transitions / ScrollTimeline | GSAP is free for commercial use since Apr 2025 [2](https://artofstyleframe.com/blog/gsap-2026-free-license-whats-new/); native CSS handles ~80% of simple motion. Everything respects `prefers-reduced-motion`. |
| 3D | **Three.js `WebGPURenderer` + TSL**, **React Three Fiber v10 + Drei**, Babylon/PlayCanvas/model-viewer variants | R3F v10 alpha is WebGPU-first with WebGL2 fallback ([R3F releases](https://github.com/pmndrs/react-three-fiber/releases)); WebGPU is still *Limited availability* per MDN, so **dual-path + 2D poster is mandatory** ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API), [W3C CRD 16 Nov 2026](https://www.w3.org/TR/webgpu/)). |
| Shader system | Custom **WGSL/TSL** packs + GLSL variants + CSS fallback | 2026's "shaders" trend, and the only way the site itself looks expensive. |
| Database | **Postgres (Neon/Supabase) + Drizzle ORM** | Relational asset records, licences, entitlements, creators, versions; `pgvector` for semantic asset search, or Typesense/Meilisearch for faceted filters. |
| Storage / CDN | **Cloudflare R2 + CDN**, signed short-lived URLs, WebP/AVIF transforms | No egress fee on large GLBs; `Markdown for Agents` and `Accept: text/markdown` come free at the edge ([Cloudflare changelog, 12 Feb 2026](https://developers.cloudflare.com/changelog/post/2026-02-12-markdown-for-agents/)). |
| Rate limiting | **Upstash/Redis token bucket + edge middleware**, weighted quota units, idempotency keys | Needed for per-agent-per-tool / per-conversation / per-tenant / per-tool-global guardrails [4](https://rapidclaw.dev/blog/mcp-gateway-security-guide-2026). |
| Payments | **Stripe** (per-item checkout, subscriptions, credits/metered billing) | One system for all three levers; also the reference implementation for ACP [1](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol). |
| Auth | **Auth.js / Clerk** + **OAuth 2.1** scoped agent keys, optional **Web Bot Auth** (RFC 9421) verification for enterprise bots | MCP's HTTP authorization profile is OAuth 2.1; Web Bot Auth gives cryptographically verified agent identity [1](https://www.coronium.io/blog/web-bot-auth-verifiable-ai-agents-2026). |
| Agent surface | **MCP TS SDK v2** at `/mcp` (spec **2026-07-28**, stateless, `server/discover`), `/llms.txt` v2, `/.well-known/agent-card.json`, `/.well-known/mcp/server.json`, `/openapi.json`, ACP/UCP feed, `SKILL.md` | 2026-07-28 is the **current** MCP revision ([MCP versioning](https://modelcontextprotocol.io/specification/versioning)); agent cards live at `agent-card.json`, the old `agent.json` path is stale [3](https://atlan.com/know/mcp/a2a-protocol-implementation-guide/). |
| Creator tooling | glTF Validator, gltf-transform, Lighthouse CI, C2PA signing, thumbnail renderer | Reject bad assets before they reach the catalogue. |
| Observability | OpenTelemetry + PostHog | Log every MCP `tools/call` (agent id, tenant, tool, status, latency, quota units) [2](https://truto.one/blog/the-hands-on-guide-to-building-mcp-servers-for-ai-agents-2026/). |

```
Browser ── Next.js (RSC/ISR + WebGPU hero) ── Cloudflare CDN (Markdown for Agents, Bot Auth)
   │                     │                          │
   │  humans: storefront │  agents: /mcp /v1 /llms.txt /.well-known/* /feed
   └─────────────────────┴──────────────┬───────────┘
                          edge middleware: auth + quota + 429 headers
                                   │
              Postgres (assets/rights/entitlements) ── R2 (signed files)
                                   │
                    Stripe (items / plans / credits) ── Redis (buckets)
```

**Why not:** a pure Vite SPA (weak SEO + you'd rebuild every agent endpoint), Shopify/WooCommerce (binary 3D previews, signed URLs and MCP don't fit), Webflow (can't host a rate-limited MCP server), or a game-engine asset-store clone (wrong formats, wrong buyer).

**"Crazy" design spec actually implemented in the demo:** full-viewport WebGL2 procedural aurora/beam/starfield shader, CSS-3D rotating orb with glass core and floating format chips, split-line kinetic headline with animated gradient, magnetic buttons, custom cursor + trailing ring, 8-card tilt bento, real seed thumbnails, pricing cards, an agent 429 contract panel, scroll reveals, grain overlay, and a **full reduced-motion + WebGL2-failure fallback**. Zero external requests — it renders inside the sandboxed preview.

---

## 5. Monetisation — three levers, one entitlement system

| Lever | What the buyer gets | Indicative price | Licence | Agent access |
|---|---|---|---|---|
| **Free items** | OSS-seeded CC0/MIT/MIT-0/CC-BY assets, creator donations, promo AI packs | $0 | Upstream SPDX + our Free Marketplace terms; attribution auto-rendered where required | Full read + **download of free assets** via signed URL |
| **Per-item** | One original asset, forever, with version updates | $9–$29 single model · $19–$49 scene/shader kit · $39–$149 template · $99+ bundle | **Personal** (1 site) / **Commercial** (unlimited projects + client work) / **Extended** (agent redistribution, white-label, API embedding) | Read free; download requires entitlement |
| **Plans** | Credits + quota + team features | Explorer $0 · **Studio $29/mo** (120 credits, 10× agent quota, team seats) · Team $99/mo · Enterprise custom | Plan terms + per-item licence for anything bought with credits | Scaled quotas, verified-bot tier, private catalogue, ACP/UCP feed |

**Credits:** 1 credit ≈ $0.25–0.30 of catalogue value; per-item purchases with credits get ~15–20% off vs à-la-carte; unused credits roll 12 months. Plan revenue is pooled to creators by usage (downloads + agent-attributed installs), not by raw pageviews.

**Creator economics:** target **80–85% payout on per-item sales**. Fab pays 88% and is the benchmark a creator will quote back at you [5](https://tech-insider.org/unity-asset-store-vs-fab-vs-cgtrader-2026/). Plan revenue split by weighted usage.

**AI-generated submissions (allowed):** mandatory "Created with AI" label, C2PA manifest, model name/version/seed/prompt reference, `ai_generated: true`, `allow_ai_training` **opt-in default false**, and no NC-licensed training data. CGTrader's May 2026 ban on AI-training licensing for standard listings shows buyers now expect this flag to be machine-readable [5](https://tech-insider.org/unity-asset-store-vs-fab-vs-cgtrader-2026/).

**Paid bundles must not contain attribution-blind items.** CC-BY rows carry `attribution_text` into the bundle manifest, the listing page and the `.md` mirror served to agents.

---

## 6. Rate limits — free read-only agents, precisely

| Tier | Auth | Read | Downloads |
|---|---|---|---|
| Anonymous | IP | 30 req/hour, burst 10/min | none (watermarked previews only) |
| **Free agent key (read-only)** | API key / OAuth | **60 req/min · 1,000/day**, `search_assets`, `get_asset`, `get_license`, `get_preview`, `get_install_snippet`, `check_quota` | free assets via signed URL; **no paid files** |
| Studio plan | scoped key | 120 req/min · 50,000/day | 100/day licensed |
| Team / Enterprise | key + Web Bot Auth signature | 1,000 req/min, negotiated | negotiated + SLA |

Weighted units: `search=1`, `preview=2`, `download=10`, `generation=50`. Global guardrails: per-agent-per-tool 60/5min, per-conversation 500/hour, per-tenant 10k/hour, per-tool-global 100 rps [4](https://rapidclaw.dev/blog/mcp-gateway-security-guide-2026). A real-world precedent: commercetools' public MCP caps at 100 req / 15 min per IP and returns `RateLimit-*`, `Retry-After` and 429 [3](https://docs.commercetools.com/dev-tooling/mcp/knowledge-mcp).

Response contract (send **both** because `draft-ietf-httpapi-ratelimit-headers-11` is still an Internet-Draft that expired 24 Nov 2026 and is not an RFC [IETF datatracker](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/) [5](https://www.flowverify.co/blog/ietf-ratelimit-header-still-a-draft-2026)):

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

Never silently retry a 429 inside the MCP layer — surface it as a structured `isError` tool result so the agent can back off [1](https://truto.one/blog/how-to-build-mcp-servers-for-ai-agents-2026-hands-on-architecture-guide/). Downloads are short-lived signed URLs, never a public bulk endpoint. Keep the MCP tool set under ~20–30 tools [2](https://truto.one/blog/the-hands-on-guide-to-building-mcp-servers-for-ai-agents-2026/).

`robots.txt` carries Cloudflare Content Signals (`search=yes, ai-input=yes, ai-train=no`) — preferences, not enforcement ([Cloudflare](https://blog.cloudflare.com/content-signals-policy/)). Optional later: HTTP 402 pay-per-crawl / x402 for high-volume commercial agents ([Cloudflare](https://blog.cloudflare.com/introducing-pay-per-crawl/)).

---

## 7. Roadmap

**Phase 1 — MVP (weeks 1–6)**
- Scaffold Next.js + Tailwind + shadcn; implement the WebGPU/TSL hero with WebGL2 fallback and reduced motion (reuse `marketplace-preview/index.html` as the design target).
- Load `catalog-taxonomy.json` + `seed-assets/seed-manifest.json` into Postgres; build faceted search (format, framework, bytes, licence, reduced motion, AI-generated).
- Publish `/llms.txt`, `/.well-known/agent-card.json`, `/.well-known/mcp/server.json`, `/robots.txt`, `/AGENTS.md`, `SKILL.md`, `/openapi.json`.
- Ship `/mcp` (2026-07-28) with 6 read-only tools + quota middleware + 429 contract + audit logging.
- Stripe: free items, per-item checkout, one Studio plan.

**Phase 2 — commerce & trust (weeks 7–12)** — creator upload + licence gate, C2PA signing, AI disclosure, `allow_ai_training` API, credits, ACP/UCP product feed (≤15-min freshness [5](https://www.growthcentr.com/product-feed-optimization-for-ai-shopping-agents-what-changed-in-2026/)), Web Bot Auth for enterprise, plan-based quota multipliers, A/B the shader hero against a static poster for conversion.

**Phase 3 — differentiation** — WebMCP browser tools (still a W3C CG Draft / Chrome origin trial, not a standard [2](https://developer.chrome.com/blog/webmcp-epp)), MCP-assisted generation, x402 pay-per-use, enterprise private catalogues.

**KPIs:** free→per-item conversion, plan MRR, agent-originated installs, tool calls per conversion, 429 rate by tier, p95 `/mcp` latency, creator payout fill rate, and **Lighthouse/INP of the storefront itself** (if our site is slow, the pitch dies).

---

## 8. Files in this workspace

| File | What it is |
|---|---|
| `marketplace-preview/index.html` | **Open this** — zero-dependency "crazy" storefront demo (WebGL2 shader + CSS-3D orb + tilt + kinetic type + real seed thumbnails + pricing + agent 429 panel). |
| `seed-assets/` | 36 licence-vetted imported files + `seed-manifest.json` with SHA-256 / source / SPDX / attribution. |
| `github-seed-assets-stack-plan.md` | This document. |
| `stack/package.json` | Dependency skeleton for the recommended stack. |
| `catalog-taxonomy.json` | 8 families / 66 subcategories / asset schema / agent-rate-limit config. |
| `marketplace-scope-2026.md` | v1 market + standards research (Nov 2026). |

---

## 9. Decisions I still need

1. **Brand + domain** — I used "ORBITAL" as a placeholder in the demo.
2. **Hosting** — Vercel + Cloudflare R2 (my recommendation) or all-Cloudflare (Workers + D1/R2)?
3. **Creator payout** — 80% / 85% / match Fab's 88%?
4. **Credit value** — confirm $0.25–0.30 per credit and the Studio monthly allotment.
5. **Framework priority** — Next.js-first (recommended) or also ship Astro/Webflow/plain-HTML variants from day one?
6. **CC-BY in paid bundles** — allow with attribution, or free-tier only?

Say **"scaffold it"** and I'll generate the actual Next.js project, the agent files, the MCP server with the quota middleware, and wire the seed pack into a working catalogue.
