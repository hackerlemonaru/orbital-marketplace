#!/usr/bin/env python3
"""Stage individually verified Khronos model files and redistribution credits.

Run explicitly; this does not modify the backend, catalogue, or live site.
"""
from __future__ import annotations
import hashlib, json, zipfile
from pathlib import Path
import requests

HERE = Path(__file__).resolve().parent
BASE = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models'
SELECTED = ['IridescenceLamp', 'ToyCar', 'SheenChair', 'MaterialsVariantsShoe', 'Lantern', 'BoomBox']
ALLOWED = {'CC0-1.0', 'CC-BY-4.0'}
ROOT = HERE / 'public' / 'showcase'
ROOT.mkdir(parents=True, exist_ok=True)
session = requests.Session()
session.headers['User-Agent'] = 'ORBITAL-showcase-licence-review/1.0'

def get(url):
    r = session.get(url, timeout=120)
    r.raise_for_status()
    return r.content

results=[]
for name in SELECTED:
    folder = ROOT / name
    folder.mkdir(exist_ok=True)
    metadata_url = f'{BASE}/{name}/metadata.json'
    licence_url = f'{BASE}/{name}/LICENSE.md'
    model_url = f'{BASE}/{name}/glTF-Binary/{name}.glb'
    metadata = json.loads(get(metadata_url))
    legal = metadata.get('legal', [])
    if not legal or any(item.get('license') not in ALLOWED for item in legal):
        raise RuntimeError(f'{name}: mixed, unverified or disallowed licence')
    licence = get(licence_url)
    if b'Non Commercial' in licence or b'NonCommercial' in licence or b'CC-BY-NC' in licence:
        raise RuntimeError(f'{name}: non-commercial term found')
    model_path = folder / (name + '.glb')
    if not model_path.exists():
        model_path.write_bytes(get(model_url))
    if model_path.read_bytes()[:4] != b'glTF':
        raise RuntimeError(f'{name}: invalid GLB')
    (folder / 'metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')
    (folder / 'LICENSE.md').write_bytes(licence)
    credits = [f"{metadata.get('name', name)}", f"Original file: {model_url}", f"Model information: {metadata_url}", 'Changes: no changes to the original GLB.', '']
    for item in legal:
        credits.append(f"{item.get('what', 'Asset')}: {item.get('artist', 'Not specified')}; copyright {item.get('year', '')} {item.get('owner', '')}. {item.get('license', '')}: {item.get('licenseUrl', '')}")
    credits += ['', 'Licence details: see LICENSE.md included in this package.', '']
    (folder / 'CREDITS.txt').write_text('\n'.join(credits))
    digest=hashlib.sha256(model_path.read_bytes()).hexdigest()
    archive=folder / (name + '.zip')
    with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for file in [model_path,folder/'CREDITS.txt',folder/'LICENSE.md']:
            z.write(file,file.name)
    results.append({'slug':name,'name':metadata.get('name',name),'licenses':sorted({x['license'] for x in legal}), 'credits':legal,'bytes':model_path.stat().st_size,'sha256':digest,'modelUrl':model_url,'licenseUrl':licence_url,'metadataUrl':metadata_url,'archiveBytes':archive.stat().st_size})
    print(name, model_path.stat().st_size, 'bytes', ', '.join(sorted({x['license'] for x in legal})))
(HERE / 'featured.json').write_text(json.dumps(results, indent=2)+'\n')
print(f'Staged {len(results)} models. Not published.')
