#!/usr/bin/env python3
"""Deploy an isolated revision-2 pre-production site.

Uses a separate Worker name, independent signing secrets and an isolated object
prefix. Never changes the production Worker or its site/ objects.
"""
from __future__ import annotations
import json, os, secrets, urllib.parse
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'frontend/revision-2/dist'
QUOTA = ROOT / 'catalog/r2-quota.json'
CREDS = Path.home() / '.secrets/cloudflare.env'
STAGE_CREDS = Path.home() / '.secrets/cloudflare-preproduction.env'
SCRIPT = 'orbital-assets-preprod'
PREFIX = 'site-preproduction/'


def env(path):
    out = {}
    if path.exists():
        for line in path.read_text().splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                k, v = line.split('=', 1); out[k] = v
    return out

cf = env(CREDS)
token = os.environ.get('CF_API_TOKEN') or cf.get('CF_API_TOKEN')
account = os.environ.get('CF_ACCOUNT_ID') or cf.get('CF_ACCOUNT_ID')
bucket = os.environ.get('CF_R2_BUCKET') or cf.get('CF_R2_BUCKET')
if not all((token, account, bucket)): raise SystemExit('Missing Cloudflare credentials')
if not (DIST/'index.html').exists() or not (DIST/'browse/index.html').exists(): raise SystemExit('Missing staging build')
headers = {'Authorization': 'Bearer '+token}
base = f'https://api.cloudflare.com/client/v4/accounts/{account}'
api = f'{base}/r2/buckets/{bucket}/objects/'
content_types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8','.glb':'model/gltf-binary','.webp':'image/webp','.woff2':'font/woff2','.wasm':'application/wasm','.jpg':'image/jpeg','.png':'image/png'}
files = [(p, p.relative_to(DIST).as_posix()) for p in DIST.rglob('*') if p.is_file()]
# Read-only agent contracts remain available without placing their raw contents in the UI build.
for rel in ('catalog.json', 'openapi.json', 'llms.txt', '.well-known/agent-card.json'):
    source = ROOT / 'website/public' / rel
    if not source.exists(): raise SystemExit(f'Missing agent contract: {rel}')
    files.append((source, rel))
if len({rel for _, rel in files}) != len(files): raise SystemExit('Duplicate output path')
if any(p.stat().st_size > 25_000_000 for p, _ in files): raise SystemExit('File exceeds API upload limit')
size = sum(p.stat().st_size for p, _ in files)
quota = json.loads(QUOTA.read_text())
if (int(quota['used_bytes']) + size) >= int(9.8 * 1024**3): raise SystemExit('Quota guard refused upload')
files.sort(key=lambda item: item[1] == 'index.html')
session = requests.Session(); session.headers.update(headers)
for i, (source, rel) in enumerate(files, 1):
    url = api + urllib.parse.quote(PREFIX + rel, safe='/')
    with source.open('rb') as f:
        r = session.put(url, data=f, headers={'Content-Type':content_types.get(source.suffix.lower(),'application/octet-stream')}, timeout=120)
    try: ok = r.ok and r.json().get('success')
    except ValueError: ok = False
    if not ok: raise SystemExit(f'Upload failed: {rel} (HTTP {r.status_code}); production is untouched')
    if i % 20 == 0 or i == len(files): print(f'Uploaded {i}/{len(files)}')

stage = env(STAGE_CREDS)
if not stage:
    STAGE_CREDS.parent.mkdir(parents=True, exist_ok=True)
    stage = {'SIGNING':secrets.token_urlsafe(48),'ADMIN':secrets.token_urlsafe(48)}
    fd = os.open(STAGE_CREDS, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as f:
        for key, value in stage.items(): f.write(f'{key}={value}\n')
if not stage.get('SIGNING') or not stage.get('ADMIN'): raise SystemExit('Missing staging secrets')
source = (ROOT/'worker/src/worker.js').read_text()
old='return "site/" + p;'
if source.count(old)!=1: raise SystemExit('Unexpected Worker source; refusing derived staging deployment')
source=source.replace(old, f'return "{PREFIX}" + p;')
metadata={'main_module':'worker.js','compatibility_date':'2026-11-19','bindings':[{'type':'r2_bucket','name':'ASSETS','bucket_name':bucket},{'type':'secret_text','name':'ASSET_SIGNING_KEY','text':stage['SIGNING']},{'type':'secret_text','name':'ADMIN_TOKEN','text':stage['ADMIN']}]}
r=session.put(f'{base}/workers/scripts/{SCRIPT}',files={'metadata':(None,json.dumps(metadata),'application/json'),'worker.js':('worker.js',source,'application/javascript+module')},timeout=90)
if not r.ok or not r.json().get('success'): raise SystemExit(f'Worker upload failed: HTTP {r.status_code}')
r=session.post(f'{base}/workers/scripts/{SCRIPT}/subdomain',json={'enabled':True,'previews_enabled':True},timeout=30)
if not r.ok or not r.json().get('success'): raise SystemExit(f'Enable subdomain failed: HTTP {r.status_code}')
r=session.get(f'{base}/workers/subdomain',timeout=30);r.raise_for_status()
subdomain=r.json()['result']['subdomain']
url=f'https://{SCRIPT}.{subdomain}.workers.dev'
(ROOT/'frontend/revision-2/preproduction-url.txt').write_text(url+'\n')
print(f'Pre-production: {url}')
print(f'Uploaded {len(files)} objects, {size/1024/1024:.2f} MiB; production unchanged.')
