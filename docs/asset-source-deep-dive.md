# Asset source deep-dive — 19 Nov 2026

Goal: find more top-tier WebGL/three.js-ready models, shaders and commercial-safe sources without crossing the Cloudflare R2 free-tier guardrail. Decision: **small hero assets are committed to the GitHub repo and served from `raw.githubusercontent.com`; only the existing catalogue stays in R2.** New link-only sources are recorded, not bulk-mirrored.

## Storage guardrail

Cloudflare's R2 Standard free tier is **10 GB-month per month**; the user asked for a stricter **9.8 GiB** cap. Exact bucket measurement on 19 Nov 2026:

- Total: **4.3614 GiB**
- Headroom: **5.4386 GiB**
- Objects: **14,493**
- Largest prefix is pre-existing academic PDF data (~4.1 GiB), which we did not touch.
- ORBITAL `assets/` prefix: **0.2122 GiB**; `site/`: **0.0118 GiB**.

`scripts/r2_quota.py` re-measures by paginating the R2 objects API and exits non-zero if usage reaches the cap. `catalog/r2-quota.json` stores the latest report.

GitHub's own guidance recommends repositories stay under **1 GB** and blocks single files over **100 MiB**, so the new repo-served files are deliberately small (all under ~0.5 MiB each). Large binaries stay in R2 or remain link-only.

## Approved / added

| Source | Licence | What we kept | Serving |
|---|---|---|---|
| `pmndrs/assets` | CC0-1.0 | `bunny.glb`, `pmndrs.glb`, `suzi.glb` + LICENSE | GitHub repo `website/models/` |
| `mrdoob/three.js` `RobotExpressive` | CC0-1.0 per model README | `RobotExpressive.glb` + README | GitHub repo |
| `erichlof/THREE.js-PathTracing-Renderer` | CC0-1.0 | 5 GLSL fragment shaders + LICENSE | GitHub repo `website/shaders/` |
| `javagl/gltfTutorialModels` | CC0 per README | 9 self-contained glTF tutorial primitives | GitHub repo |
| `KhronosGroup/glTF-Sample-Assets` | per-model metadata | 12 small CC0 GLBs + metadata JSON | GitHub repo |
| Poly Haven | CC0-1.0 | 12 link-only model records; no bulk mirror | live link / API |
| Smithsonian Open Access | CC0 on marked items | 3 link-only museum scans | live link |

Poly Haven's licence allows commercial use and redistribution of downloaded assets, but its **live API** has separate terms: unique `Referer`/User-Agent and a visible "Powered by Poly Haven" credit when surfacing live API content. We therefore did not bulk-download from the live API; we added link-only rows and used already-CC0 GitHub mirrors for actual files.

## Excluded / do not stock

- **Adobe Substance 3D Assets**: commercial projects are allowed, but the product-specific terms forbid distributing an unmodified standalone asset or allowing third parties to download/extract the asset on a stand-alone basis. That conflicts with a marketplace catalogue, so no Adobe/Mixamo/Substance files were imported.
- **Mixamo**: commercial use is broadly allowed under Adobe terms, but standalone redistribution of animations/characters is restricted, so it is not suitable as a downloadable asset source.
- **Quaternius / 100Avatars / OmniLottie / GSAP / React Bits / Aceternity**: already excluded in the earlier plan due to QAL / provenance conflicts / NC / proprietary / Commons Clause terms.
- **three.js example assets generally**: the library is MIT, but individual example models/textures carry separate credits. Only the explicitly CC0 `RobotExpressive` README case was imported.
- **google/model-viewer assets**: code is Apache-2.0, but bundled example assets need per-item checks; not bulk-imported.

## Web / rendering stack note

`three` npm latest checked on 19 Nov 2026: **0.187.0**. The new storefront uses an import map pinned to `three@0.187.0` from jsDelivr for the optional GLB viewer, with a dependency-free WebGL2 shader + CSS fallback so the page still works in the sandboxed in-app preview where external scripts are blocked.

## Commercial-use baseline

CC0 / public-domain / MIT / MIT-0 / CC-BY-4.0 (with attribution) remain the allowlist. CC-BY rows require `attribution_text`; NASA rows keep `allow_ai_training=false` and usage-guideline notes; AI-generated submissions still require disclosure, provenance and opt-in training rights.
