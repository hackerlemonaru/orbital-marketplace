# ORBITAL Revision 2 — implementation plan

Status: deployed to the isolated pre-production URL in `preproduction-url.txt`; the production app and Worker remain unchanged. Landing, browse and licences routes, a virtualized grid and an asset modal are staged. Six models with source metadata, original GLBs, resized previews, original WebP renders and credit files are staged under `public/showcase`. `generate-index.py`, `prerender.mjs`, `check-ui.mjs`, `check-interactions.mjs`, and `check-output.py` support reproducibility and testing. Current screenshots are in `screenshots/rev2-current-*.jpg`.

Not ready for production promotion: the literal binary-inclusive forbidden-string scan fails on incidental byte sequences in fonts/models and vendor code. Mobile Lighthouse results vary: recent local runs of this build measured performance 94 with 1.55-second LCP and 0 CLS, and 90 with 1.88-second LCP and 0 CLS; the required 95+ is not consistently met. Reduced-motion UI checks pass at all requested widths, and a local headless grid scroll sampled 59.6–60.0 fps (not a device guarantee). The presentation index has 6,640 records and hides records without images by default; it does not include every raw catalogue record. Archive downloads now extract and verify the original member; one archive package and one featured package were tested, not every asset. Scoring uses inspected metadata for featured models; unknown attributes of other records are not guessed. The main Worker has not changed.

## Route wireframes

- `/`: opaque top bar → three-line hero + monolith → curated showcase → four-step passport → agents tabs → three pricing cards → CTA and legal footer.
- `/browse/`: full-height top search → separately scrolling filter rail + virtualized grid. Search palette is global. An asset modal overlays either route.
- `/licences/`: readable licence index and required credits.

## Steps

1. Dark-only tokens, typography and contrast checks; remove unwanted landing sections and infrastructure/source indicators.
2. Vite multi-page routing, full-height browse, local filter state and deep links.
3. Centered asset modal with keyboard navigation, focus trap, details, attribution, copy, install tabs and download packaging.
4. Verify per-item permissions; ingest and optimize 6–8 high-fidelity models and build original transparent WebP renders. Record exact licensing and original files.
5. Rebuild landing sections and motion; avoid translucent UI; preserve reduced-motion support.
6. Produce per-step desktop/mobile screenshots; run UI acceptance, content scan, Lighthouse and performance checks before deployment.

## Constraints and technical hazards

- The existing static build copies the full raw catalogue and agent files into `dist/`; those files include banned strings. The existing Worker `/catalog.json` must remain untouched, so a separate sanitized presentation index is needed for the UI, and the build must stop copying the raw endpoint into dist. Existing external routes and files remain available through the unchanged backend. A literal `R2` grep is exceptionally broad and can match arbitrary binary or encoded content; test exact requested checks against the actual output and flag any incompatibilities.
- A bundled `CREDITS.txt` requires a download package per asset or client-side packaging; verify licence and security implications. Do not misrepresent link-only files as downloadable.
- The specified `--text-3` only passes on page and surface-1; use `--text-2` on raised surfaces. The supplied accent fails normal text contrast against off-white, so `--accent` is adjusted to `#285ED5` (4.95:1), and hover uses `#255BD2` (5.15:1). `--text-1` on page is 16.51:1, slightly above the requested approximate 16:1.
- `/health` must not be called by the new UI; backend stays untouched.
- Lighthouse, LCP, CLS, JS gzip, and 60fps are measurement targets, not assertions; verify in the required environment.

## Licence research

- Iridescence Lamp: Khronos model page lists Wayfair, LLC and Eric Chadwick under CC BY 4.0. Verify the item-level licence and include all required attribution, source, licence link and change notice. https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/IridescenceLamp
- Smithsonian Discovery item page marks media CC0, but item-specific download and trademark/insignia considerations still need verification. https://3d.si.edu/object/3d/orbiter-space-shuttle-ov-103-discovery:d8c636ce-4ebc-11ea-b77f-2e728ce88125
- The Met open-access policy explicitly covers public-domain artwork images and basic data; that page alone is not sufficient evidence that every 3D file is CC0. Verify the licence for each individual 3D model. https://www.metmuseum.org/hubs/open-access
- Poly Haven assets are CC0, but site example renders are not; make original renders. Its live API requires clear attribution. https://polyhaven.com/license and https://polyhaven.com/our-api

Published to pre-production only: Khronos Iridescence Lamp and Materials Variants Shoe (CC BY 4.0), Toy Car, Sheen Chair, Lantern and Boom Box (CC0). Individual metadata, licence files, original download links and hashes are recorded in `featured.json` and under `public/showcase/`. No Smithsonian, Met or Poly Haven files were ingested. The Stanford dragon and Damaged Helmet were excluded due to mixed or unverified non-commercial restrictions.

## Design references

- Radix 12-step purpose and surfaces: https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- Dark UI elevation, contrast, restrained accent: https://www.toptal.com/designers/ui/dark-ui-design
