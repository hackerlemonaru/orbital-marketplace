#!/usr/bin/env python3
"""Fail CI if the catalogue contains a licence-gate violation."""
import json, sys
ROOT = "/home/user/orbital-marketplace"
d = json.load(open(f"{ROOT}/catalog/catalog.json"))
allow = set(d["licence_gate"]["allow"])
deny = [x.lower() for x in d["licence_gate"]["deny"]]
errs = []
for a in d["assets"]:
    lic = (a.get("license") or "").lower()
    if any(x in lic for x in deny):
        errs.append(f"{a['id']}: denied licence {a['license']}")
    if a.get("license") == "CC-BY-4.0" and not a.get("attribution"):
        errs.append(f"{a['id']}: CC-BY without attribution")
    if a.get("mode") == "r2" and not (a.get("sha256") or a.get("r2_etag")):
        errs.append(f"{a['id']}: missing checksum")
if errs:
    print("LICENCE GATE FAILED:"); [print(" -", e) for e in errs[:40]]; sys.exit(1)
print(f"OK: {len(d['assets'])} assets passed the licence gate")
