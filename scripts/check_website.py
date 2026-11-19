#!/usr/bin/env python3
"""Quality gate for the generated storefront: no AI-slop defaults, no external runtime deps."""
import re, sys, pathlib

p = pathlib.Path("website/index.html")
if not p.exists():
    print("missing website/index.html")
    sys.exit(1)
s = p.read_text()
checks = {
    "no unresolved placeholders": not re.search(r"__[A-Z0-9_]+__", s),
    "no external script/link src": not re.search(r'<(?:script|link)[^>]+(?:src|href)=["\']https?://', s, re.I),
    "no CDN font/host": not any(x in s.lower() for x in ("cdn.jsdelivr.net", "unpkg.com", "fonts.googleapis.com", 'type="importmap"')),
    "no decorative gradients": not any(x in s.lower() for x in ("linear-gradient", "radial-gradient", "conic-gradient")),
    "no purple/cyan AI palette": not any(x in s.lower() for x in ("#7928ca", "#00e5c0", "#b45cff", "#7f5af0", "#a855f7", "#38bdf8")),
    "no generic SaaS copy": not any(x in s.lower() for x in ("ship the impossible", "empower your", "seamless", "revolutionize", "game-changing", "trusted by")),
    "Geist embedded twice": s.count("data:font/woff2;base64,") >= 2,
    "posters embedded": s.count("data:image/jpeg;base64,") >= 4,
    "local three.js bundle": 'src="js/orbital-scene.js"' in s,
    "four video slots": s.count('data-src="media/') >= 4,
    "reduced motion": "prefers-reduced-motion" in s,
    "WebGL2": "webgl2" in s.lower(),
}
failed = [k for k, ok in checks.items() if not ok]
for k, ok in checks.items():
    print(("PASS " if ok else "FAIL ") + k)
if failed:
    print("design gate failed:", ", ".join(failed))
    sys.exit(1)
print("design gate OK")
