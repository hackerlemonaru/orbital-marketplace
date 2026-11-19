# Media slots

Generated poster frames are committed here:

- `poster-hero.jpg` → `hero-loop.mp4`
- `poster-orbit.jpg` → `asset-orbit.mp4`
- `poster-material.jpg` → `material-loop.mp4`
- `poster-agent.jpg` → `agent-loop.mp4`

The storefront HEAD-probes the MP4 filenames and plays them only when present. Until then, the poster remains visible. Keep videos 16:9, H.264 MP4, muted, no audio, under ~15 MB each. See `docs/video-brief.md` for the exact four prompts.
