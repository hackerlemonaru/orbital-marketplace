# Local three.js scene

`orbital-scene.js` is a self-contained ESM bundle built from `src/orbital-scene.js` and `src/create-spatial-asset-monolith.js`. It includes three.js `0.187.0`, `GLTFLoader`, `OrbitControls` and ORBITAL's procedural hero model. No CDN or import map is required; the page works from the sandboxed file viewer and through the Worker.

Rebuild with:

```bash
bash scripts/build_scene.sh
python3 scripts/build_website.py
python3 scripts/r2_sync_site.py
```

Licences: `../vendor/THREE-LICENSE.txt` (three.js MIT) and `../fonts/LICENSE-geist.txt` (Geist OFL). The modeling source applies the `tattooinmtl/omni / threejs-3d-modeler` skill rules installed with `npx skillfish add tattooinmtl/omni threejs-3d-modeler`; see `../../docs/design-system.md`.
