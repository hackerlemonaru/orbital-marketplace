# ORBITAL storefront design system — 19 Nov 2026

## Visual thesis

**Infrastructure editorial, not AI-SaaS cosplay.** The page is built like a serious developer platform launch: near-white canvas, near-black typography, one blue accent, real numbers, hard rules, asymmetric grids and a single expensive WebGL/three.js artifact. Motion is engineered around pointer, scroll, state changes and the hero model; it is not sprinkled over every card.

This is a Vercel/Geist-*inspired* visual language, not a Vercel clone and not an actual Vercel deployment.

## Research basis

- Official Vercel Geist docs: <https://vercel.com/geist/colors> and <https://vercel.com/font>. The font page states Geist was designed for developers/designers around simplicity, minimalism and speed, with Sans, Serif, Mono and Pixel families. The colors page describes neutral scales, drawing each border once, and translucent material shadows.
- Vercel Geist token reference: <https://www.designsystems.one/design-systems/vercel-geist> — `#000000`, `#ffffff`, `#666666`, `#eaeaea`, `#fafafa`, `#0070f3`, Geist Sans/Mono, 4px spacing, 6/8/12px radii, 150ms motion.
- Anti-slop audit: <https://publishd.app/blog/make-ai-built-site-not-look-ai> — the nine fingerprints are Inter/default font, cyan-to-purple gradient, three-column card grid, fake testimonials, fake logo bar, identical section rhythm, stock illustration, centered everything, and animations without a reason.
- Anti-slop framework: <https://moelkholy1995.medium.com/beyond-make-it-beautiful-the-anti-slop-framework-for-ai-frontend-craftsmanship-c99bbee6c994> — avoid centered badge + headline + 3-card grid, fake dashboard mockups, floating icon pills; use bold hero, strong type, asymmetric layout, one memorable visual anchor per section, CTA hierarchy, transform/opacity motion, custom easing, reduced motion.
- Further patterns: <https://sailop.com/blog/anti-slop-prompt-template-2026>, <https://ui-ux-pro-max-skill.com/blog/avoiding-ai-slop/>, <https://www.candede.com/articles/escaping-ai-slop-in-web-design/>.

## Tokens

```css
--bg: #fafafa;          /* Geist-like off-white canvas */
--surface: #ffffff;
--ink: #171717;         /* Vercel near-black */
--muted: #666666;
--line: #ebebeb;
--line-strong: #171717;
--blue: #0070f3;        /* single accent, punctuation only */
--black: #000000;
--white: #ededed;
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--space: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px;
```

Type: self-hosted Geist Sans + Geist Mono, OFL, embedded as data URIs in the generated HTML so the in-app preview works without network. Fallbacks are system sans/mono, never Inter-first. Weights cap at 600. Mono is used only for labels, numbers, paths, versions, coordinates and status. Numbers are tabular.

## Hard bans

No purple/cyan/pink gradient, no gradient headline, no mesh-gradient hero, no glassmorphism, no `backdrop-filter` chrome, no floating decorative spheres/cubes/toruses, no three equal feature cards, no generic icon + title + two-line card, no `rounded-full` buttons, no fake testimonials, no fake logo cloud, no fake dashboard, no "trusted by", no "empower / seamless / revolutionize / unlock" copy, no emoji as UI icons, no scroll-fade on every section, no count-up on invented metrics, no external font/CDN dependencies.

## Spatial system

- 12-column editorial grid. Hero is 62/38; video section is 58/42 plus a narrow strip; sources and models are dense ruled rows, not cards.
- Section rhythm intentionally varies: 96px hero, 48px data rail, 128px pipeline, 64px dark storage band, 112px catalogue, 80px pricing/footer.
- At most one radius per component family; borders are 1px solid and drawn once.
- One memorable visual anchor per fold: hero model window, four video/poster frames, exact quota meter, model index, catalogue browser.

## Motion contract

- Mostly `transform` and `opacity`, custom `cubic-bezier(.16, 1, .3, 1)`, 150–700ms.
- One orchestrated page-load type reveal; no decorative fade-in on every section.
- Full-page WebGL2 shader background reacts to pointer + scroll; capped DPR and paused when hidden/out of view.
- three.js hero monolith uses scroll-linked rotation, pointer parallax, model switching and orbit controls.
- Video slots reveal loaded MP4s only after a successful same-origin HEAD probe; otherwise the generated poster remains visible.
- Count-ups use only real values from `catalog.json` and `r2-quota.json`.
- View Transitions API is used for in-page navigation where supported; unsupported browsers get normal smooth scroll.
- `prefers-reduced-motion` disables continuous loops and all non-essential transitions; WebGL renders one frame.

## Skill application

Installed `tattooinmtl/omni / threejs-3d-modeler` via `npx skillfish add tattooinmtl/omni threejs-3d-modeler` into `~/.claude/skills/threejs-3d-modeler`. Metadata: repo `tattooinmtl/omni`, path `skills/gamedev/threejs-3d-modeler`, branch `main`, sha `0b1e6e95bf6b0ae10dfcaa63ad647e42f5ab889c`.

Applied rules in `website/js/src/create-spatial-asset-monolith.js`:

- Primitive-first: `BoxGeometry`, `CylinderGeometry(…, 3)`, `TorusGeometry`, `SphereGeometry`.
- Returns a named `THREE.Group` with named child meshes and outlines.
- Shared materials inside the model family.
- Readable isometric/three-quarter silhouette, consistent ~2.8-unit scale.
- `group.userData` records `modelType`, `style`, `family`, `generator`, `version`, `scaleReference`.
- No heavy imported assets; catalogue GLBs load only on explicit model switch.

## Self-critique and fixes

First draft could still look AI-made if: (1) the hero window became a generic floating 3D ornament, (2) the generated posters read as stock renders, or (3) the catalogue fell back to a card grid. Fixes: the hero object is a named procedural deploy monolith tied to real model switching, posters are physical black/white/blue material studies used only as video fallback frames, and source/model/catalogue data is laid out as ruled technical rows. The old neon showpiece remains available at `/classic.html` for comparison, but is no longer the default.
