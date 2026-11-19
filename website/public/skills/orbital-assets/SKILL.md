---
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
