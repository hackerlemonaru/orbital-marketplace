# Format & performance baseline (2026)

- 3D: GLB / glTF 2.0 (primary), KTX2/Basis textures, Draco or EXT_meshopt_compression, USDZ for AR.
- Ratified glTF extensions: KHR_gaussian_splatting, KHR_interactivity, KHR_node_hoverability/selectability/visibility, KHR_xmp_json_ld.
- Renderers: Three.js WebGPURenderer + TSL, React Three Fiber, Babylon.js, PlayCanvas, model-viewer. **WebGL2 fallback + 2D poster required** (MDN still marks WebGPU Limited availability).
- Motion: dotLottie `.lottie` (primary), Rive `.riv`, GSAP/Motion timelines, WebM/MP4 alpha, CSS View Transitions / ScrollTimeline. Raw `.json` and `@lottiefiles/react-lottie-player` are legacy.
- Code: React/Next.js + Tailwind TSX, plain HTML/CSS/JS, shadcn registry item JSON.
- Images: AVIF, WebP, SVG; PNG fallback only.
- Every asset: byte budget, poly/layer count, reduced-motion variant, SHA-256, SPDX licence, poster fallback.
