# ORBITAL video brief — four drop-in loops

You said you will source 3–4 videos. The storefront already has four poster frames and four auto-detected slots. Generate or place MP4s with the exact filenames below; the page HEAD-probes each file and only switches from poster to video when the file exists.

## Global direction

- **Archetype:** developer-infrastructure product film, not AI SaaS bumper.
- **Palette:** `#fafafa`, `#171717`, `#000000`, `#ededed`; one `#0070f3` blue accent. No purple, cyan glow, pink, rainbow gradient, neon bloom or lens flares.
- **Material:** black anodized aluminium, matte white ceramic, etched glass, brushed steel, fibre optics. Physical, machined, photographed.
- **Camera:** locked-off or slow motorised move, 35mm–85mm feel, hard shadows, no handheld shake, no whip pans.
- **Loop:** 6–8 seconds, seamless first/last frame, 16:9, 1080p or 1440p, H.264 MP4, no audio, under ~15 MB each.
- **Forbidden:** text, logos, UI, dashboards, fake screenshots, floating spheres/toruses, generic glowing blobs, people, emoji, stock-workplace scenes, "Built with" logo bars.
- **Composition:** keep the object off-center; leave real negative space for interface labels.

---

## 01 — Hero monolith loop

**File:** `website/media/hero-loop.mp4`  
**Poster:** `website/media/poster-hero.jpg`  
**Use:** large hero WebGL window, behind/around the procedural three.js monolith.

**Prompt:**

> A seamless 8-second 16:9 product-film loop of a black anodized aluminium triangular lattice standing off-center on a seamless near-white studio floor. The lattice has precise triangular cut-outs, visible machining marks and hard directional shadows. A single thin electric-blue `#0070f3` edge light travels once along one bevel while the object rotates only eight degrees and returns to its exact starting position. Locked camera, slow motorised turntable, high-contrast editorial lighting, physical materials, expensive and restrained. No text, no logo, no UI, no purple, no cyan glow, no generic 3D blob, no glassmorphism, no collage. First and last frame identical.

## 02 — Asset orbit loop

**File:** `website/media/asset-orbit.mp4`  
**Poster:** `website/media/poster-orbit.jpg`  
**Use:** model index / three.js GLB viewer section.

**Prompt:**

> A seamless 7-second 16:9 studio turntable loop of one faceted triangular aerospace-like 3D asset made from matte white ceramic and black anodized metal, suspended above a black plinth against true black. Hard white rim light, one precise `#0070f3` blue specular edge, crisp readable silhouette, photogrammetry-scan detail, tiny screws and machined seams. The asset completes one slow 360-degree orbit and returns exactly to frame one. No text, no logos, no UI, no floating cube, no sphere, no torus, no purple, no cyan bloom, no generic AI render, no collage. Feels like a real asset viewer.

## 03 — Material scan loop

**File:** `website/media/material-loop.mp4`  
**Poster:** `website/media/poster-material.jpg`  
**Use:** technical proof / source-audit divider.

**Prompt:**

> A seamless 6-second 16:9 macro loop of a black etched glass wafer with an ultra-precise hairline square grid, microscopic scratches and dust. A single thin `#0070f3` blue laser line scans diagonally across the surface from upper left to lower right, then resets invisibly on the loop boundary. Hard directional light, white negative space on the right edge, shallow controlled depth, real industrial material study. No text, no logos, no UI, no buttons, no purple, no cyan glow, no rainbow gradient, no collage. First and last frame identical.

## 04 — Agent index loop

**File:** `website/media/agent-loop.mp4`  
**Poster:** `website/media/poster-agent.jpg`  
**Use:** free-agent / machine-readable catalogue section.

**Prompt:**

> A seamless 8-second 16:9 architectural loop of a dense field of thin white vertical fibre-optic filaments receding into a dark industrial corridor, representing machine-readable asset data as physical material. Tiny sparse `#0070f3` blue index marks pulse in a precise left-to-right sequence; a very slow dolly moves forward and resets seamlessly. High-contrast black-and-white long exposure, slight film grain, ruled perspective. No robot, no human, no dashboard, no fake screenshot, no text, no logos, no UI, no purple, no cyan, no pink, no generic AI mesh gradient, no collage. First and last frame identical.

---

## Drop-in

Place any 3 or 4 of these files in `website/media/`:

```text
hero-loop.mp4
asset-orbit.mp4
material-loop.mp4
agent-loop.mp4
```

Then run:

```bash
python3 scripts/r2_sync_site.py
bash scripts/push_github.sh
```

The site will show the generated JPG poster when a video is absent, and autoplay muted/looping/playsinline video when present. All four posters are already generated and committed.
