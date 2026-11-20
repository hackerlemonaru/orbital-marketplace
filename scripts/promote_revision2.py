#!/usr/bin/env python3
"""Promote the verified revision-2 build; production Worker code is unchanged.

Prerequisites: deploy the identical build to pre-production, run visual and
interaction checks there, and write a passing Lighthouse report summary. The
landing document is uploaded last; agent contracts are not touched.
"""
from __future__ import annotations
import hashlib, json, os, subprocess, urllib.parse
from pathlib import Path
import requests

ROOT=Path(__file__).resolve().parent.parent
FRONT=ROOT/'frontend/revision-2'
DIST=FRONT/'dist'
QUOTA=ROOT/'catalog/r2-quota.json'
CREDS=Path.home()/'.secrets/cloudflare.env'

def env(path):
    out={}
    if path.exists():
        for line in path.read_text().splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                k,v=line.split('=',1);out[k]=v
    return out

def run(*args,cwd=ROOT):
    subprocess.run(args,cwd=cwd,check=True)

# Disabled until all release criteria pass and promotion is made atomic. The
# checks below do not bind Lighthouse to the complete build and uploads replace
# existing production paths in place, so running them would not be sufficient.
raise SystemExit('Promotion disabled: candidate is unverified and deployment is not atomic')

if not (DIST/'index.html').exists(): raise SystemExit('Missing revision-2 build')
run('python3','check-output.py',cwd=FRONT)
run('python3','check-contrast.py',cwd=FRONT)
base=(FRONT/'preproduction-url.txt').read_text().strip()
if not base.startswith('https://'):raise SystemExit('Missing pre-production URL')
# A release candidate is promoted only after its actual staged entry point
# is byte-identical to the local build.
staged=subprocess.check_output(['curl','--fail','--silent','--show-error','--max-time','40',base+'/?release-check=1'])
local=(DIST/'index.html').read_bytes()
if hashlib.sha256(staged).digest()!=hashlib.sha256(local).digest():
    raise SystemExit('Pre-production entry differs from build; redeploy and re-test staging first')
run('node','check-ui.mjs',base,cwd=FRONT)
run('node','check-interactions.mjs',base,cwd=FRONT)
report=json.loads((FRONT/'lighthouse-staging.json').read_text())
if report.get('url','').rstrip('/')!=base.rstrip('/') or report.get('score',0)<.95 or report.get('LCP_ms',999999)>=2000 or report.get('CLS',1)!=0:
    raise SystemExit('Pre-production Lighthouse report does not meet the release gate')
baseline=subprocess.run(['git','show','18a5bb7:worker/src/worker.js'],cwd=ROOT,capture_output=True,check=True).stdout
if (ROOT/'worker/src/worker.js').read_bytes()!=baseline: raise SystemExit('Production Worker differs from baseline')
cf=env(CREDS);token=os.environ.get('CF_API_TOKEN') or cf.get('CF_API_TOKEN');account=os.environ.get('CF_ACCOUNT_ID') or cf.get('CF_ACCOUNT_ID');bucket=os.environ.get('CF_R2_BUCKET') or cf.get('CF_R2_BUCKET')
if not all((token,account,bucket)):raise SystemExit('Missing Cloudflare credentials')
files=[(p,p.relative_to(DIST).as_posix()) for p in DIST.rglob('*') if p.is_file()]
if any(p.stat().st_size>25_000_000 for p,_ in files):raise SystemExit('Upload exceeds API file size limit')
size=sum(p.stat().st_size for p,_ in files)
quota=json.loads(QUOTA.read_text())
if int(quota['used_bytes'])+size>=int(9.8*1024**3):raise SystemExit('Quota guard refused promotion')
files.sort(key=lambda pair:pair[1]=='index.html')
content_types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8','.glb':'model/gltf-binary','.webp':'image/webp','.woff2':'font/woff2','.wasm':'application/wasm','.jpg':'image/jpeg','.png':'image/png'}
session=requests.Session();session.headers.update({'Authorization':'Bearer '+token})
api=f'https://api.cloudflare.com/client/v4/accounts/{account}/r2/buckets/{bucket}/objects/'
for i,(path,rel) in enumerate(files,1):
    with path.open('rb') as source:
        r=session.put(api+urllib.parse.quote('site/'+rel,safe='/'),data=source,headers={'Content-Type':content_types.get(path.suffix.lower(),'application/octet-stream')},timeout=120)
    try:ok=r.ok and r.json().get('success')
    except ValueError:ok=False
    if not ok:raise SystemExit(f'Upload failed: {rel} (HTTP {r.status_code}); root entry was not switched')
    if i%20==0 or i==len(files):print(f'Uploaded {i}/{len(files)}')
print(f'Promoted {len(files)} files; production Worker and agent contracts unchanged.')
