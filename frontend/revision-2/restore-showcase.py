#!/usr/bin/env python3
"""Restore original showcase GLBs from recorded upstream URLs, verifying SHA-256.

Large originals are deliberately excluded from git. No catalogue/backend state
is changed. Generated previews and thumbnails are tracked separately.
"""
import hashlib, json, os, tempfile
from pathlib import Path
import requests

HERE=Path(__file__).resolve().parent
records=json.loads((HERE/'featured.json').read_text())
session=requests.Session()
session.headers['User-Agent']='ORBITAL-showcase-restore/1.0'
for item in records:
    target=HERE/'public'/'showcase'/item['slug']/(item['slug']+'.glb')
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==item['sha256']:
        print('verified',item['slug']);continue
    response=session.get(item['modelUrl'],timeout=120)
    response.raise_for_status()
    data=response.content
    if not data.startswith(b'glTF') or hashlib.sha256(data).hexdigest()!=item['sha256']:
        raise SystemExit(f"Upstream file changed or failed verification: {item['slug']}")
    with tempfile.NamedTemporaryFile(dir=target.parent,delete=False) as tmp:
        tmp.write(data);name=tmp.name
    os.replace(name,target)
    print('restored',item['slug'])
