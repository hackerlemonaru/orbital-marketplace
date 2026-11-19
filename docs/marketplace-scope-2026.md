# Marketplace Scope & Category Map — Research v1

**Date:** 19 November 2026 · **Status:** research / scope proposal, not yet a build spec
**Question answered:** what should our marketplace for 3D elements, animations and website-decoration assets actually sell in 2026, and how should the AI-agent access layer work with rate limits?

> **Note on "our marketplace":** the workspace was empty — no existing repo, catalog, URL or brand asset was available to audit. I've treated this as a greenfield build and mapped the market from current sources. If you already have a live catalog, send me the URL or export and I'll re-map it against this taxonomy.

---

## 1. Executive readout

1. **Position it as a *web-native* asset marketplace, not another game-asset store.** Fab, Unity Asset Store, CGTrader and Cubebrush already own "generic 3D models for engines" [1](https://www.meshy.ai/blog/unity-asset-store) [2](https://practicetestgeeks.com/unreal/unreal-engine-marketplace) [3](https://cubebrush.co/marketplace?categories=345%2C74). The gap is **browser-first, performance-budgeted, install-ready** assets: GLB under a stated KB budget, a working WebGL2 fallback, a poster image, an install snippet, and a machine-readable license.
2. **Eight top-level families, ~70 subcategories** are defensible (§4). Six are P0 for an MVP; AI-native/agent-ready assets are the differentiating P1 family.
3. **"Latest, not old" has concrete 2026 anchors**: `KHR_gaussian_splatting` is ratified in the official glTF registry, `KHR_interactivity` and the `KHR_node_*` extensions are ratified alongside it ([glTF extension registry](https://github.com/KhronosGroup/glTF/blob/main/extensions/README.md)); WebGPU is shipping in all major engines but is **still a W3C Candidate Recommendation Draft (16 Nov 2026)** and MDN still marks it *Limited availability* ([W3C](https://www.w3.org/TR/webgpu/), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)) — so dual-path WebGPU + WebGL2 is mandatory, not optional.
4. **Motion formats moved**: `.lottie` (dotLottie) is the current container, raw Bodymovin `.json` and `@lottiefiles/react-lottie-player` are legacy/deprecated, and Rive `.riv` owns stateful interactivity [4](https://wikivibe.ru/en/vibe-design/motion-i-animatsiya/lottie-animatsii-dlya-prodakshena/) [1](https://uithings.com/lottie-animations) [2](https://lottiefiles.com/blog/lottie-animations/lottiefiles-or-rive).
5. **The "AI agent file" should be a stack, not one file.** Minimum viable: `/llms.txt` (v2 spec) + `/.well-known/agent-card.json` (A2A v1.0.x) + `/.well-known/mcp/server.json` (MCP registry discovery) + `/robots.txt` with Content Signals + `/AGENTS.md` and `SKILL.md` install skills + a hosted `/mcp` server + `/openapi.json`. Competitors are already here: LottieFiles shipped a hosted Creator MCP server in Nov 2026 and Sketchfab has a community MCP server [3](https://docs.lottiefiles.com/en/creator-mcp) [2](https://skywork.ai/skypage/en/sketchfab-ai-3d-universe/1980523773654507520).
6. **Rate limits must be multi-dimensional and machine-readable.** Use IETF draft-11 `RateLimit-Policy` / `RateLimit` headers *plus* legacy `X-RateLimit-*` for compatibility, always return `429` + `Retry-After`, and cap per-agent-per-tool, per-conversation, per-tenant and per-tool-global separately [4](https://rapidclaw.dev/blog/mcp-gateway-security-guide-2026) ([IETF datatracker](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)). Note draft-11 is **still an Internet-Draft**, not an RFC [5](https://www.flowverify.co/blog/ietf-ratelimit-header-still-a-draft-2026).
7. **Licensing/provenance is a product feature, not legal boilerplate.** Fab requires a "Created with AI" disclosure, CGTrader barred standard listings from AI-training licensing on 15 May 2026, and creator share is a competitive lever (Fab 88%) [5](https://tech-insider.org/unity-asset-store-vs-fab-vs-cgtrader-2026/).

---

## 2. Freshness ledger — what is current as of Nov 2026

This is the anti-"old" checklist. Where blogs and primary sources disagree, I've flagged it.

| Standard / thing | Verified status (Nov 2026) | Implication for us |
|---|---|---|
| glTF 2.0 + KHR extensions | Official registry lists `KHR_gaussian_splatting`, `KHR_interactivity`, `KHR_node_hoverability/selectability/visibility`, `KHR_animation_pointer`, `KHR_xmp_json_ld`, `EXT_meshopt_compression`, `EXT_texture_webp` as **ratified** ([registry](https://github.com/KhronosGroup/glTF/blob/main/extensions/README.md)) | Accept these as native metadata/interaction features, not "experimental" |
| Gaussian splats | `KHR_gaussian_splatting` spec says **"Complete, Ratified by the Khronos Group"**; announced Feb 2026, ratified 3 Sep 2026 ([spec](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_gaussian_splatting/README.md), [4](https://github.com/klausi3D/godotGS/issues/1190)) | Add a "Splats & radiance fields" category now. Accept GLB + `.spz`/`.sog`/`.ply` variants; compression extension `KHR_gaussian_splatting_compression_spz_2` is still draft [2](https://radiancefields.com/platforms/the-khronos-group) |
| WebGPU | Chrome/Edge, Firefox 141 (Windows), Safari 26 ship it; **W3C Candidate Recommendation Draft dated 16 Nov 2026**; MDN: *Limited availability* ([W3C](https://www.w3.org/TR/webgpu/), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API), [1](https://mainstaydigital.com/newsroom/webgpu-baseline-2026-webxr-unified/)) | ⚠️ Several 2026 blogs claim "Baseline since Jan 2026" [2](https://www.utsubo.com/blog/frontier-web-apis-2026-production-ready) — primary sources disagree. **Require WebGL2 fallback + 2D poster on every 3D asset.** |
| Three.js / R3F | `WebGPURenderer` + TSL are the main path; R3F v10 alpha is "WebGPU first" with WebGL2 fallback; v9 supports async `gl` prop for WebGPURenderer ([2](https://github.com/pmndrs/react-three-fiber/releases), [5](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)) | Ship scene kits with both entry points; label assets by compatible renderer versions |
| Motion runtime | dotLottie `.lottie` primary, `.json` legacy, `@lottiefiles/dotlottie-react` current, `react-lottie-player` deprecated; Rive `.riv` for state machines [4](https://wikivibe.ru/en/vibe-design/motion-i-animatsiya/lottie-animatsii-dlya-prodakshena/) [1](https://uithings.com/lottie-animations) | Reject `.json`-only submissions; require reduced-motion variant |
| Web motion conventions | GSAP free since Apr 2025, Figma Motion (Jun 2026), shaders in Figma (Config 2026), View Transitions / ScrollTimeline, `prefers-reduced-motion`; scrolljacking is "out" [4](https://www.digidop.com/blog/5-web-design-trends-2025) [5](https://www.grafdom.com/web-design-trends-whats-in-whats-out-and-whats-essential/) | Every animated listing needs duration, trigger, reduced-motion fallback and bundle cost |
| MCP | **Current spec = 2026-07-28** (stateless, `server/discover`, no `initialize`/sessions); 2025-11-25 is Final [MCP versioning](https://modelcontextprotocol.io/specification/versioning), [3](https://nhimg.org/mcp-spec-version-tracker) | Build the MCP server against 2026-07-28 with backward compatibility for 2025-11-25 clients |
| `llms.txt` | **v2 proposal** (2026), community convention only — not W3C/IETF; ~2% general-web adoption (2025 Web Almanac) up to ~10% in broader crawls; AI-tool sites ~54%; real consumers are IDE agents and MCP docs servers, not citation crawlers ([llmstxt.org](https://llmstxt.org/), [2](https://digitalstrategyforce.com/journal/does-your-site-need-llms-txt-to-get-cited-by-ai-search-in-2026/), [3](https://automatelab.tech/blog/ai-agents/llms-txt-across-top-1-000-saas-sites-may-2026-who-ships-what/), [5](https://inite.ai/en/blog/is-llms-txt-dead-2026)) | Publish it for agent navigation, **not** as an SEO play and **not** as a permissions mechanism |
| A2A Agent Card | v1.0.1 stable (28 May 2026), Linux Foundation / AAIF; canonical path **`/.well-known/agent-card.json`** — old `/.well-known/agent.json` is stale [1](https://blog.tobira.ai/how-a2a-agent-cards-work/) [3](https://atlan.com/know/mcp/a2a-protocol-implementation-guide/) | Use `agent-card.json` only; don't copy old tutorials |
| MCP discovery | `/.well-known/mcp/server.json` is the registry-supported convention (Replicate shipped auto-discovery Feb 2026); "Server Card" SEP-2127 is still an open proposal with a moving filename [2](https://replicate.com/changelog/2026-02-10-mcp-server-auto-discovery) [3](https://mcpplaygroundonline.com/blog/mcp-server-cards-well-known-discovery) | Ship `server.json`; treat server-card proposals as optional |
| Agent Skills / AGENTS.md | `SKILL.md` is an open spec (YAML frontmatter + Markdown, progressive disclosure) with 25+ agent clients; `AGENTS.md` is a separate codebase-instruction convention ([spec](https://agentskills.io/specification), [agents.md](https://agents.md/), [4](https://chatforest.com/guides/agentic-web-agents-md-llms-txt/)) | Distribute "install this asset" skills alongside assets |
| WebMCP | Chrome Early Preview (Feb 2026), origin trial from Chrome 149; **W3C Community Group Draft, not a standard** [2](https://developer.chrome.com/blog/webmcp-epp) [1](https://w3c-cg.github.io/aikr/webMCP/webmcp-technical-notes.html) [5](https://sreenathmenon.com/blog/2026-08-04-webmcp-teaching-websites-to-talk-to-ai-agents/) | Experimental P3 only — a browser-side tool surface for the storefront |
| Agentic commerce | ACP (OpenAI/Stripe, beta, latest spec 2026-04-17, Apache-2.0), UCP (Google + retail, Jan 2026), AP2 (payment authorisation, donated to FIDO, v0.2) [1](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol) [2](https://brandlight.ai/blog/agentic-commerce) [3](https://ecorpit.com/ucp-acp-ap2-agentic-commerce-standards-merchant-guide-2026/) | Product feed is now discovery infrastructure; feeds need ~15-min freshness [5](https://www.growthcentr.com/product-feed-optimization-for-ai-shopping-agents-what-changed-in-2026/) |
| HTTP rate-limit headers | `draft-ietf-httpapi-ratelimit-headers-11` (23 May 2026, expires 24 Nov 2026), IESG state "I-D Exists", early review "Not ready" ([datatracker](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)) | Send draft-11 headers **and** legacy `X-RateLimit-*`; never make the draft the only contract |
| Web Bot Auth | RFC 9421 HTTP Message Signatures; WG draft `draft-ietf-webbotauth-httpsig-protocol-00` adopted 1 Sep 2026, **not an RFC**; Cloudflare/Akamai/Vercel/AWS already verify [5](https://ppc.land/web-bot-auth/) [3](https://en.natielimelech.com/blog/web-bot-auth) | Verify signed agents for higher tiers; keep API keys as the baseline |
| Cloudflare agent controls | Pay per Crawl (Jul 2025, HTTP 402, private beta), Content Signals Policy (Sep 2025), Markdown for Agents (12 Feb 2026), Monetization Gateway / Pay per Use beta (Sep 2026) ([pay per crawl](https://blog.cloudflare.com/introducing-pay-per-crawl/), [Content Signals](https://blog.cloudflare.com/content-signals-policy/), [1](https://developers.cloudflare.com/changelog/post/2026-02-12-markdown-for-agents/), [5](https://www.taskade.com/blog/x402-protocol-explained)) | Free `text/markdown` negotiation, explicit `ai-train=no`, optional 402 monetisation later |

---

## 3. Market signals (why this scope, now)

- **Demand is real but the numbers need care.** The 3D e-commerce market is estimated at **$10.54B in 2026 → $24.37B by 2030 (23.3% CAGR)** [1](https://www.researchandmarkets.com/reports/6226870/3d-e-commerce-global-market-report), and the wider 3D digital asset market at **$36.72B in 2026 → $98.21B by 2034 (13.09% CAGR)** [3](https://www.fortunebusinessinsights.com/3d-digital-asset-market-112221). Other analysts put 2026 at $36.2B [4](https://www.grandviewresearch.com/industry-analysis/3d-digital-asset-market-report) and $38.4B [5](https://www.factmr.com/report/3d-digital-asset-market). Paid analyst estimates with different definitions — treat as directional, not a TAM claim for a web-asset marketplace.
- **3D and spatial depth are mainstream, with a performance tax.** 2026 trend reporting consistently puts lightweight glTF 3D, scroll storytelling, kinetic typography, shaders/glass and purposeful micro-interactions in the "in" column [2](https://www.theedigital.com/blog/web-design-trends) [3](https://coalitiontechnologies.com/blog/2026-web-design-trends) [4](https://www.digidop.com/blog/5-web-design-trends-2025). The same sources insist on <5MB budgets, progressive loading, 2D fallbacks and reduced-motion [1](https://techbuild.me/blog/web-design-trends-2026-the-future-of-digital-experiences-is-here) [5](https://www.grafdom.com/web-design-trends-whats-in-whats-out-and-whats-essential/). **That constraint is our product wedge:** sell assets that are already optimised and labelled.
- **The renderer stack changed.** PlayCanvas ships WebGPU, WGSL, Gaussian splats (SOG), KTX2/Basis and Draco/Meshopt [5](https://playcanvas.com/products/engine); Three.js/R3F are WebGPU-first; GLB is the default marketplace deliverable with FBX only as an optional source [3](https://bitsoulhosting.com/marketplace/blog/fbx-vs-glb-vs-obj-3d-file-format-guide-2026). A splat-first marketplace already exists (GLB, USDZ, PLY, SPZ, KSPLAT, SOG) [1](https://3dasset.io/en) — proof the category is commercial, not research.
- **Free component libraries commoditised "decoration".** Aceternity UI, Magic UI and React Bits give away hundreds of animated components and even expose an MCP/shadcn-registry install path [1](https://ui.aceternity.com/) [2](https://ui.aceternity.com/components) [4](https://thanor.ai/blog/21st-dev-alternatives) [3](https://snigdhachandrapaik.vercel.app/blogs/animated-website-libraries-nextjs-react). Competing on "we also have glow cards" is a losing move; compete on **curation, cross-format bundles, guaranteed performance, licensing clarity, and agent-native delivery**.
- **AI agents are now a real buyer channel.** MCP spec 2026-07-28 is current, LottieFiles runs a hosted Creator MCP with OAuth, and Cloudflare serves Markdown to agents via `Accept: text/markdown` [3](https://docs.lottiefiles.com/en/creator-mcp) [1](https://developers.cloudflare.com/changelog/post/2026-02-12-markdown-for-agents/). ACP/UCP product feeds are becoming the discovery layer for agentic shopping [1](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol) [5](https://www.growthcentr.com/product-feed-optimization-for-ai-shopping-agents-what-changed-in-2026/).
- **Trust is a differentiator.** AI-generated 3D assets need provenance metadata (C2PA, SHA-256, SPDX, XMP, AI model/seed/prompt fields) and explicit `AllowTraining` flags [3](https://virtuall.pro/blog/metadata-standards-for-ai-generated-3d-assets) [1](https://brandlabs.cloud/legal-checklist-for-using-ai-generated-video-and-creator-ass). glTF even has a ratified `KHR_xmp_json_ld` extension for carrying this inside the asset ([registry](https://github.com/KhronosGroup/glTF/blob/main/extensions/README.md)).

---

## 4. Proposed category taxonomy (the actual answer to "what all category")

Eight families. **P0** = MVP catalogue, **P1** = next release, **P2** = later. A machine-readable version is in `catalog-taxonomy.json`.

| # | Family | Pri. | Subcategories | Primary formats / deliverables | 2026 freshness signal |
|---|---|---|---|---|---|
| 1 | **3D Objects & Models** | P0 | Hero product models & 360 viewers · 3D icons & small UI objects · abstract shapes / blobs / glass & liquid objects · characters, mascots & rigged figures · environments, dioramas & virtual showrooms · modular kits / kitbash · scans & photogrammetry · 3D typography & logos · low-poly / stylised packs · **Gaussian splats & radiance fields** · AR/WebXR objects · LOD packs + 2D poster fallbacks | `.glb`/`.gltf`, `.usdz`, KTX2, Draco/Meshopt, optional `.fbx`/`.blend` source, `poster.avif` | `KHR_gaussian_splatting` ratified Sep 2026; `KHR_materials_*` (transmission, iridescence, dispersion) ratified; `KHR_xmp_json_ld` for rights |
| 2 | **3D Scenes, Viewers & Interaction Kits** | P0 | Three.js/R3F scene templates · Babylon/PlayCanvas/TresJS/model-viewer kits · product configurators & turntables · scroll-driven 3D storytelling · camera/orbit/transition rigs · hotspots & annotations · **glTF Interactivity behaviour graphs** · WebXR showrooms · GPU particles/compute effects · performance presets | TSX/JS scene folders, `.glb` + config JSON, GSAP/ScrollTrigger + Lenis recipes, WebGPU **and** WebGL2 entry points | `KHR_interactivity` + `KHR_node_hoverability/selectability/visibility` ratified; R3F v10 WebGPU-first |
| 3 | **Materials, Shaders & Lighting** | P0 | WGSL/TSL shader packs · animated background shaders (aurora, noise, gradient mesh, liquid glass, chromatic displacement) · post-processing (bloom, DoF, grain) · PBR material libraries · HDRI/env maps & lighting rigs · CSS/SVG no-JS fallbacks · GLSL legacy variants | `.wgsl`, TSL modules, `.glb` material spheres, KTX2/HDR/EXR, CSS fallback | Shaders landing in Figma at Config 2026; WGSL/TSL now primary, GLSL secondary |
| 4 | **2D Motion & Micro-interactions** | P0 | dotLottie packs · Rive state machines & data binding · Lottie state machines / theme tokens · hover/press/toggle/magnetic buttons · kinetic typography & text reveals · loading/empty/success/error states · animated icon sets & SVG motion · transparent video loops · GSAP/Motion/View-Transitions recipes · optional UI sound packs (muted by default) | `.lottie`, `.riv`, `.webm`/`.mp4` alpha, TSX, CSS, `motion.json` tokens | `.lottie` > `.json`; `react-lottie-player` deprecated; `prefers-reduced-motion` mandatory |
| 5 | **Website Decoration & UI Components** | P0 | Heroes, bento grids, feature blocks, pricing, navbars, footers · backgrounds (gradients, grids, dots, beams, stars, noise, mesh gradients) · cards (3D tilt, spotlight border, glass, parallax) · custom cursors · page transitions, reveal masks, scroll progress · decorative illustration / stickers / organic shapes / scribbles · theme packs, tokens, variable fonts · shadcn-registry items | TSX + Tailwind, HTML/CSS/JS, Webflow/Framer, `registry-item.json` | Copy-paste libraries give these away → sell curation, bundles, licences, agent install |
| 6 | **Full-Page & Project Templates** | P1 | SaaS/AI-product landing · e-commerce storytelling · portfolio/agency · launch/event microsites · docs & marketing kits · framework variants (Next.js, Astro, Webflow, Framer, plain HTML) | Full project ZIP + repo, asset manifest, Lighthouse/perf report | "Design and code merging with AI agents" is a 2026 trend [4](https://www.digidop.com/blog/5-web-design-trends-2025) |
| 7 | **AI-Native & Agent-Ready Assets** | P1 | Prompt & generation-recipe packs (model, version, seed, params) · AI-generated asset packs with C2PA + disclosure · **`SKILL.md` install skills** · MCP tool manifests & agent-card snippets · design-to-code prompt templates · machine-readable licence bundles · agent-installable component bundles | `SKILL.md`, `manifest.json`, `agent-card.json` fragment, C2PA manifest, `license.spdx` | AAIF/agentskills open standards; CGTrader barred AI-training licensing May 2026; Fab requires AI disclosure [5](https://tech-insider.org/unity-asset-store-vs-fab-vs-cgtrader-2026/) |
| 8 | **Bundles, Collections & Services** | P2 | Industry kits (SaaS launch, commerce, real estate, events) · seasonal/trend collections · team starter libraries · custom commissions · optimisation/conversion services · creator storefronts | Bundle manifest + mixed formats | Retention / AOV lever; also the natural home for creator subscriptions |

**Cross-cutting filters every category must support** (these are what make the catalogue agent-queryable): format, renderer/framework, file size budget, poly/layer count, WebGPU/WebGL2 support, reduced-motion variant, licence type, AI-generated flag, `allow_ai_training`, price, creator, version, updated date.

### Required asset record (for both the storefront and the agent API)

`asset_id · title · category_path · version · creator_id · formats[] · file_size_bytes · checksum_sha256 · polycount_or_layer_count · texture_resolution · lod_variants · renderer_compat[] · runtime_dependencies[] · performance_budget · reduced_motion_variant · poster_fallback_url · preview_urls[] · license_spdx · allow_ai_training · ai_generated · c2pa_manifest_url · install_snippet · tags[] · price · updated_at`

Rationale: enterprise 3D pipelines already track identity, taxonomy, technical specs, AI provenance, rights/compliance, review status and distribution targets as first-class metadata [3](https://virtuall.pro/blog/metadata-standards-for-ai-generated-3d-assets), and rights should be verifiable through an API rather than a PDF [1](https://brandlabs.cloud/legal-checklist-for-using-ai-generated-video-and-creator-ass).

---

## 5. What **not** to sell (explicitly "old")

| Retire | Why it's stale | 2026 replacement |
|---|---|---|
| Flash `.swf`/`.fla`, SMIL | Dead runtimes | `.lottie` / `.riv` / CSS |
| GIF / APNG as the primary animation | Multi-MB, no runtime control, no reduced-motion | `.lottie`, `.riv`, WebM/MP4 with alpha |
| Raw Bodymovin `.json` as the primary file | Superseded container (`.lottie` is 50–80% smaller, bundles assets/themes/state machines) [4](https://wikivibe.ru/en/vibe-design/motion-i-animatsiya/lottie-animatsii-dlya-prodakshena/) [2](https://lottiefiles.com/blog/lottie-animations/lottiefiles-or-rive) | dotLottie `.lottie` |
| `@lottiefiles/react-lottie-player` | Deprecated package [4](https://wikivibe.ru/en/vibe-design/motion-i-animatsiya/lottie-animatsii-dlya-prodakshena/) | `@lottiefiles/dotlottie-react` |
| jQuery plugins, PNG sprite sheets | Legacy DOM era | React/Web Components + SVG |
| FBX / OBJ as the primary download | Not web-runtime friendly; GLB is the 2026 default [3](https://bitsoulhosting.com/marketplace/blog/fbx-vs-glb-vs-obj-3d-file-format-guide-2026) | GLB primary + optional source files |
| Uncompressed PNG/JPG textures | Fails mobile budgets | KTX2/Basis, AVIF, WebP |
| GLSL-only shaders, WebGL-only scenes | Single backend; WebGPU coverage still uneven per MDN | TSL/WGSL + WebGL2 fallback + poster |
| Scrolljacking, autoplay sound, motion without `prefers-reduced-motion` | Named as 2026 "what's out" [5](https://www.grafdom.com/web-design-trends-whats-in-whats-out-and-whats-essential/) | Purposeful 200–300ms motion + reduced-motion variant |
| Undisclosed AI-generated assets / "unlimited training rights" defaults | Marketplace policy + legal exposure [5](https://tech-insider.org/unity-asset-store-vs-fab-vs-cgtrader-2026/) | "Created with AI" label, C2PA, explicit training flag |
| Generic game-engine asset dumps | Off-positioning vs Fab/Unity/CGTrader | Web-optimised, budget-labelled, install-ready |
| Treating `llms.txt` as a permission file or SEO ranking hack | It's neither; Google ignores it for Search and no major crawler commits to it ([llmstxt.org](https://llmstxt.org/), [5](https://inite.ai/en/blog/is-llms-txt-dead-2026)) | `robots.txt` + Content Signals + OAuth/keys at the API |

---

## 6. Competitive scan

| Player | What they own | Gap we exploit |
|---|---|---|
| Fab (Epic), Unity Asset Store, CGTrader, Cubebrush | Engine-first 3D: models, environments, materials, VFX, templates; 30k+ products on Fab; Fab pays 88% and requires AI disclosure; CGTrader banned AI-training licensing May 2026 [5](https://tech-insider.org/unity-asset-store-vs-fab-vs-cgtrader-2026/) [1](https://www.meshy.ai/blog/unity-asset-store) [2](https://practicetestgeeks.com/unreal/unreal-engine-marketplace) [3](https://cubebrush.co/marketplace?categories=345%2C74) | Web runtime, KB budgets, browser fallbacks, agent API |
| Sketchfab / Epic | Hosting, embeds, glTF viewer, Data API; community MCP server exists [1](https://apis.io/providers/sketchfab/) [2](https://skywork.ai/skypage/en/sketchfab-ai-3d-universe/1980523773654507520) | First-party metered agent access + decorative/motion cross-sell |
| LottieFiles / IconScout | dotLottie ecosystem, AI-assisted Creator, DAM, **hosted Creator MCP** (Nov 2026) [3](https://docs.lottiefiles.com/en/creator-mcp) [2](https://lottiefiles.com/blog/lottie-animations/lottiefiles-or-rive) | 3D + shaders + UI kits in one catalogue; neutral multi-format |
| Rive | Interactive state-machine animation [2](https://lottiefiles.com/blog/lottie-animations/lottiefiles-or-rive) | We resell `.riv` assets, don't compete with the editor |
| Aceternity UI / Magic UI / React Bits / 21st.dev | Free animated React components, shadcn/MCP install [1](https://ui.aceternity.com/) [4](https://thanor.ai/blog/21st-dev-alternatives) | Licensed, curated, cross-framework, performance-certified bundles |
| Envato / Motion Array / Creative Market | Broad stock + subscription | Depth in *web-native interactive* assets |
| Spline / 3D SaaS tools | Creation tools | We're the distribution + rights layer, not an editor |

**Positioning line:** *"The only catalogue where every asset ships with a browser performance budget, a fallback, a machine-readable licence, and an agent-callable install path."*

---

## 7. AI-agent access layer with rate limits

### 7.1 The file/endpoint stack

| Layer | Artefact | Purpose | Notes |
|---|---|---|---|
| Policy | `/robots.txt` + Content Signals | `search=yes, ai-input=yes, ai-train=no` ([Cloudflare](https://blog.cloudflare.com/content-signals-policy/)) | Expresses preferences; **not** enforcement |
| Navigation | `/llms.txt` (v2), `/llms-full.txt`, `.md` mirrors of listing pages, `Link:` headers | Curated map for agents ([llmstxt.org](https://llmstxt.org/)) | Keep small; detail lives behind links |
| Identity | `/.well-known/agent-card.json` | A2A v1.0.1 capability manifest: skills, endpoints, auth schemes [1](https://blog.tobira.ai/how-a2a-agent-cards-work/) [5](https://www.matthewswong.com/en/blog/a2a-protocol-v1-agent-cards-guide/) | Serve unauthenticated with ETag/Cache-Control. **Do not** use legacy `agent.json` |
| MCP discovery | `/.well-known/mcp/server.json` | Official MCP Registry auto-discovery [2](https://replicate.com/changelog/2026-02-10-mcp-server-auto-discovery) | Server Card SEPs are still proposals [3](https://mcpplaygroundonline.com/blog/mcp-server-cards-well-known-discovery) |
| Codebase | `/AGENTS.md`, `/skills/<name>/SKILL.md` | Instructions + install recipes for coding agents ([agents.md](https://agents.md/), [1](https://agentskills.io/specification)) | Progressive disclosure: metadata → body → resources |
| API contract | `/openapi.json` (OpenAPI 3.1), `/product-feed.json` (ACP/UCP shape) | Deterministic calls + agentic-commerce discovery [1](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol) [5](https://www.growthcentr.com/product-feed-optimization-for-ai-shopping-agents-what-changed-in-2026/) | Feed freshness ≤15 min |
| Live tools | `POST /mcp` (Streamable HTTP, spec **2026-07-28**), REST `/v1/*` | `search_assets`, `get_asset`, `get_license`, `get_preview`, `get_install_snippet`, `check_quota` | OAuth 2.1 for paid scopes; keep <20–30 tools [2](https://truto.one/blog/the-hands-on-guide-to-building-mcp-servers-for-ai-agents-2026/) |
| Content negotiation | `Accept: text/markdown` → Markdown + `x-markdown-tokens` | Agent-friendly payloads [1](https://developers.cloudflare.com/changelog/post/2026-02-12-markdown-for-agents/) | HTML stays default for browsers |
| Experimental | WebMCP `navigator.modelContext.registerTool()` | Browser-side tools for the storefront [2](https://developer.chrome.com/blog/webmcp-epp) | Chrome origin trial only; P3 |

**Minimal `/llms.txt` sketch (v2 format):**

```markdown
# <Marketplace Name>

> Browser-ready 3D, motion and UI-decoration assets with performance budgets, machine-readable licences and an agent API.

All catalogue endpoints are rate limited. Read /agent-rate-limits.md before bulk access.
Free tier: preview only. Full files require a licensed agent key.

## Catalogue
- [Category index](https://example.com/catalog.md): eight families, ~70 subcategories
- [Format & performance spec](https://example.com/docs/formats.md): GLB/KTX2, dotLottie, Rive, TSL/WGSL
- [License matrix](https://example.com/docs/licenses.md): SPDX ids, AI-training flags

## Agents
- [OpenAPI 3.1](https://example.com/openapi.json)
- [MCP server](https://example.com/mcp): spec 2026-07-28, OAuth 2.1
- [Agent card](https://example.com/.well-known/agent-card.json)
- [Rate limits & 429 contract](https://example.com/docs/agent-rate-limits.md)

## Optional
- [Creator submission guide](https://example.com/docs/submit.md)
```

**`/.well-known/agent-card.json` sketch (A2A v1.0.x shape):**

```json
{
  "name": "Marketplace Asset Agent",
  "description": "Search, inspect and license web-native 3D, motion and UI assets.",
  "version": "1.0.0",
  "supportedInterfaces": [
    { "url": "https://example.com/mcp", "protocolBinding": "JSONRPC", "protocolVersion": "2026-07-28" },
    { "url": "https://example.com/v1", "protocolBinding": "HTTP+JSON", "protocolVersion": "1.0" }
  ],
  "provider": { "organization": "Marketplace", "url": "https://example.com" },
  "capabilities": { "streaming": true, "pushNotifications": false },
  "securitySchemes": { "agentKey": { "httpAuthSecurityScheme": { "scheme": "bearer", "bearerFormat": "JWT" } } },
  "securityRequirements": [{ "schemes": { "agentKey": { "list": [] } } }],
  "defaultInputModes": ["text/plain", "application/json"],
  "defaultOutputModes": ["application/json", "text/markdown"],
  "skills": [
    { "id": "asset-search", "name": "Search assets", "description": "Find assets by category, format, framework and file-size budget.", "tags": ["3d", "motion", "catalog"] },
    { "id": "license-check", "name": "Check license", "description": "Return SPDX licence, AI-training flag and provenance for an asset id.", "tags": ["rights", "compliance"] }
  ]
}
```

### 7.2 Rate-limit design (concrete numbers)

| Tier | Auth | Search/browse | Downloads | Notes |
|---|---|---|---|---|
| Anonymous | IP only | 30 req/hour, burst 10/min | 0 | Watermarked previews only |
| Free agent key | OAuth/API key | 60 req/min, 1,000/day | 5/day | Preview + install snippets |
| Paid agent key | Scoped key | 120 req/min, 50,000/day | 100/day | Full licensed files, signed URLs |
| Enterprise / verified bot | Key + **Web Bot Auth** signature (RFC 9421) [3](https://en.natielimelech.com/blog/web-bot-auth) | 1,000 req/min | Negotiated | SLA, bulk quota, audit log |

**Global guardrails** (in addition to per-key tiers): per-agent-per-tool `60 / 5 min`, per-conversation `500 / hour`, per-tenant `10,000 / hour`, per-tool-global `100 rps`, plus idempotency keys to kill runaway agent loops [4](https://rapidclaw.dev/blog/mcp-gateway-security-guide-2026) [1](https://truto.one/blog/how-to-build-mcp-servers-for-ai-agents-2026-hands-on-architecture-guide/). A real-world precedent: commercetools' public Knowledge MCP caps at **100 requests / 15 min per IP** and returns `RateLimit-*`, `Retry-After` and 429 [3](https://docs.commercetools.com/dev-tooling/mcp/knowledge-mcp).

**Weighted quota units** (token bucket in Redis, sliding window for daily caps): `search=1`, `preview=2`, `download=10`, `generation=50`. Downloads must never be a plain public URL: short-lived signed URL + entitlement check + watermarked preview for unlicensed callers.

**Response contract:**

```http
HTTP/1.1 200 OK
RateLimit-Policy: "search";q=60;w=60, "daily";q=1000;w=86400
RateLimit: "search";r=42;t=18
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 18
```

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 18
RateLimit-Policy: "search";q=60;w=60
RateLimit: "search";r=0;t=18
Content-Type: application/problem+json

{"type":"https://example.com/problems/quota-exceeded","title":"Quota exceeded","policy":"search","retry_after":18}
```

Rules: send both draft-11 structured-field headers and legacy `X-RateLimit-*` (draft-11 is still an Internet-Draft, expires 24 Nov 2026 [IETF datatracker](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)); `Retry-After` and `RateLimit-Reset` should point to the same moment [4](https://openllm.wavise.com/blog/http-rate-limiting-reference); **never silently retry a 429 inside the MCP layer** — surface it as a structured tool error so the agent can back off [1](https://truto.one/blog/how-to-build-mcp-servers-for-ai-agents-2026-hands-on-architecture-guide/) [2](https://truto.one/blog/the-hands-on-guide-to-building-mcp-servers-for-ai-agents-2026/). Log `tool name, agent id, tenant, conversation, status, latency, quota unit` on every call.

**Monetisation (P2/P3, optional):** Cloudflare's Pay per Crawl / x402 model uses HTTP `402` with a price header for metered agent access ([Cloudflare](https://blog.cloudflare.com/introducing-pay-per-crawl/), [5](https://www.taskade.com/blog/x402-protocol-explained)); by Sep 2026 Cloudflare had moved toward "pay per use"/Monetization Gateway beta [1](https://heybuffy.com/blog/can-you-charge-ai-agents-to-crawl). Worth watching, but don't gate the MVP on a closed beta.

### 7.3 Don't make these mistakes

- Treating `llms.txt` as access control or a ranking signal ([llmstxt.org](https://llmstxt.org/), [1](https://www.openhermit.com/blog/llms-txt-guide)).
- Using the outdated `/.well-known/agent.json` path [3](https://atlan.com/know/mcp/a2a-protocol-implementation-guide/).
- Building the MCP server on the 2025-11-25 handshake model only — 2026-07-28 is stateless [MCP versioning](https://modelcontextprotocol.io/specification/versioning).
- Exposing 100+ tools; agent accuracy degrades past ~20–30 [2](https://truto.one/blog/the-hands-on-guide-to-building-mcp-servers-for-ai-agents-2026/).
- Rate-limiting only by IP: agents are noisy neighbours; enforce per-token/per-agent budgets too [1](https://truto.one/blog/how-to-build-mcp-servers-for-ai-agents-2026-hands-on-architecture-guide/).
- Letting an agent bulk-download the whole GLB catalogue through a "search" tool.

---

## 8. MVP scope & roadmap

**Phase 0 — decisions (now):** brand/domain, stack, monetisation model, whether AI-generated assets are allowed, first framework targets, final tier ceilings.

**Phase 1 — MVP (catalogue + agent-readable):**
- P0 families 1–5, ~150–300 curated assets, each with the required asset record, a live preview, a poster fallback, a licence and an install snippet.
- GLB/KTX2, `.lottie`, `.riv`, TSL/WGSL + GLSL variant, TSX/HTML components.
- Human storefront with filters: format, framework, file-size budget, reduced motion, licence, AI-generated.
- Publish `/llms.txt`, `/.well-known/agent-card.json`, `/.well-known/mcp/server.json`, `/robots.txt` with Content Signals, `/AGENTS.md`, one `SKILL.md`, `/openapi.json`.
- Read-only `/mcp` with 5–6 tools, tiered rate limits, 429 contract, signed preview URLs, per-call audit log.

**Phase 2 — commerce & trust:** checkout + entitlements, ACP/UCP product feed, C2PA provenance on upload, AI-disclosure flag, `allow_ai_training` in every licence response, creator payouts, Web Bot Auth verification for higher tiers, agent skills for one-command install.

**Phase 3 — differentiation:** WebMCP tools for in-browser agents, pay-per-use/x402 experiments, MCP-assisted asset generation, enterprise quotas and partner feeds.

**KPIs:** agent-originated sessions → licensed downloads conversion, tool calls per conversion, 429 rate by tier, p95 tool latency, download→install ratio, category fill rate, creator payout/share competitiveness.

---

## 9. Decisions I need from you before building

1. **Is there an existing marketplace/catalogue** (URL, repo, export) I should map instead of assuming greenfield?
2. **Monetisation:** per-asset purchase, subscription library, credits, or free + paid agent API tier?
3. **Stack:** Next.js/React-first, or framework-neutral (HTML/Webflow/Framer/Astro all equal)? This decides whether TSX is a primary format.
4. **AI-generated assets:** allowed? If yes, do we permit AI-training rights (opt-in per creator) or ban by default?
5. **Agent access:** free read-only tier with strict limits (my recommendation) or key-required from day one?

Say "build the agent files" and I'll generate `llms.txt`, `agent-card.json`, `server.json`, `robots.txt`, `SKILL.md`, the OpenAPI spec and a working rate-limited `/mcp` stub next.

---

## 10. Primary sources worth keeping

- [glTF 2.0 Extension Registry (Khronos)](https://github.com/KhronosGroup/glTF/blob/main/extensions/README.md) · [KHR_gaussian_splatting spec](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_gaussian_splatting/README.md) · [Khronos glTF news](https://www.khronos.org/news/tags/tag/glTF)
- [W3C WebGPU (Candidate Recommendation Draft, 16 Nov 2026)](https://www.w3.org/TR/webgpu/) · [MDN WebGPU API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [MCP versioning (current 2026-07-28)](https://modelcontextprotocol.io/specification/versioning) · [R3F releases](https://github.com/pmndrs/react-three-fiber/releases) · [R3F v9 migration](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)
- [llms.txt v2 proposal](https://llmstxt.org/) · [AGENTS.md](https://agents.md/) · [Agent Skills spec](https://agentskills.io/specification) · [Chrome WebMCP Early Preview](https://developer.chrome.com/blog/webmcp-epp)
- [IETF draft-ietf-httpapi-ratelimit-headers-11](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/) · [commercetools MCP rate limiting](https://docs.commercetools.com/dev-tooling/mcp/knowledge-mcp) · [LottieFiles Creator MCP](https://docs.lottiefiles.com/en/creator-mcp)
- [Cloudflare Pay per Crawl](https://blog.cloudflare.com/introducing-pay-per-crawl/) · [Content Signals Policy](https://blog.cloudflare.com/content-signals-policy/) · [Markdown for Agents](https://developers.cloudflare.com/changelog/post/2026-02-12-markdown-for-agents/)
- [ACP specification (OpenAI/Stripe)](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol) · [MCP registry auto-discovery precedent](https://replicate.com/changelog/2026-02-10-mcp-server-auto-discovery)
