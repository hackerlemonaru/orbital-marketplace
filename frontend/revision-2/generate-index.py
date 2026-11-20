#!/usr/bin/env python3
"""Create a minimal presentation index without changing the source catalogue."""
import json, re, struct
from urllib.parse import quote, unquote, urlparse
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
catalog = json.loads((ROOT / 'catalog/catalog.json').read_text())['assets']
featured = json.loads((HERE / 'featured.json').read_text())
byid = {a['id']:a for a in catalog}
bysha = {a.get('sha256'):a for a in catalog if a.get('sha256')}
seed = json.loads((ROOT / 'seed-assets/seed-manifest.json').read_text())['assets']
seed_by_sha = {a.get('sha256'):a for a in seed if a.get('sha256')}
seed_by_file = {a['file']:a for a in seed}
fixtures = re.compile(r'Triangle|SimpleMaterial|SimpleMeshes|Cameras|SimpleSkin|Unicode|Interpolation|Visibility|Coordinate|TextureEncoding|TextureLinear|BoxVertexColors|LightVisibility|NodeVisibility|AnimatedColorsCube|AnimatedMorphCube|CubeVisibility|SimpleInstancing', re.I)

def clean(s):
    s=re.sub(r'^\d+[_\- ]*','',s or '')
    s=re.sub(r'\.(glb|gltf|webp|json|lottie|html|ts|spz|sog)$','',s,flags=re.I)
    s=re.sub(r'_Art$','',s,flags=re.I).replace('_',' ').replace('-',' ')
    s=re.sub(r'(?<=[a-z])(?=[A-Z])',' ',s)
    return re.sub(r'\s+',' ',s).strip().capitalize() or 'Untitled'

def inspect_glb(path):
    try:
        data = path.read_bytes()
        length, kind = struct.unpack_from('<II', data, 12)
        if data[:4] != b'glTF' or kind != 0x4e4f534a: return None
        doc = json.loads(data[20:20+length])
        total = 0
        for mesh in doc.get('meshes', []):
            for primitive in mesh.get('primitives', []):
                if primitive.get('mode', 4) != 4: continue
                index = primitive.get('indices', primitive.get('attributes', {}).get('POSITION'))
                if index is not None: total += doc['accessors'][index]['count'] // 3
        return {'triangles':total or None, 'textured':bool(doc.get('textures')), 'animated':bool(doc.get('animations')), 'showy':bool(set(doc.get('extensionsUsed',[])) & {'KHR_materials_transmission','KHR_materials_iridescence','KHR_materials_clearcoat','KHR_materials_sheen'})}
    except (OSError, ValueError, IndexError, KeyError, struct.error): return None

def quality(name, info, featured=False):
    score = 2 if featured else 0
    if fixtures.search(name): score -= 5
    if not info: return score
    if info['textured']: score += 3
    if info['showy']: score += 2
    if info['animated']: score += 2
    count = info['triangles'] or 0
    if 5000 <= count <= 300000: score += 1
    if info['textured'] is False and 0 < count < 2000: score -= 3
    return score

items=[]
for x in featured:
    legal=x['credits'];slug=x['slug'];license=x['licenses'][0]
    info=inspect_glb(HERE/'public'/'showcase'/slug/'preview.glb')
    credit='; '.join(f"{v.get('artist','')}, {v.get('owner','')}, {v.get('license','')}" for v in legal if v.get('license')=='CC-BY-4.0')
    items.append({'id':slug,'name':x['name'],'category':'3D Objects & Models','format':'GLB','license':license,'credit':credit,'bytes':x['bytes'],'sha':x['sha256'],'image':f'/showcase/{slug}/render.webp','model':f'/showcase/{slug}/preview.glb','download':f'/showcase/{slug}/{slug}.glb','credits':f'/showcase/{slug}/CREDITS.txt','licenseFile':f'/showcase/{slug}/LICENSE.md','triangles':info['triangles'] if info else None,'featured':True,'score':quality(x['name'],info,True)})
for a in catalog:
    name=a.get('name','');aid=a.get('id','')
    if aid.endswith('#thumb') or '(preview)' in name.lower() or fixtures.search(name): continue
    if re.search(r'^(?:cesium[ _-]*)?box(?:[ _.-]|$)',name,re.I): continue
    if a.get('mode') == 'link_only' and not (aid.startswith('link/polyhaven/') or aid.startswith('link/smithsonian/')): continue
    seed_info=seed_by_sha.get(a.get('sha256')) if aid.startswith('seed/') else None
    if seed_info and seed_info['file'].startswith('licenses/'): continue
    if seed_info and seed_info['file'].endswith('.webp') and seed_info['file'][:-5]+'.glb' in seed_by_file: continue
    license=str(seed_info.get('license') if seed_info else a.get('license') or '')
    if license not in ('CC0-1.0','MIT','MIT-0','CC-BY-4.0','CC BY 4.0','Public domain + NASA usage guidelines'):continue
    thumb=byid.get(aid+'#thumb',{})
    if not thumb and seed_info and seed_info['file'].endswith('.glb'):
        seed_thumb=seed_by_file.get(seed_info['file'][:-4]+'.webp',{})
        thumb=bysha.get(seed_thumb.get('sha256'),{})
    image=thumb.get('preview_url') or thumb.get('public_url') or a.get('preview_url') or ''
    if not re.search(r'\.(webp|png|jpe?g|avif)$', unquote(urlparse(image).path), re.I): image = ''
    # Archive entries are not individual files on the server. Fetch and extract
    # their actual member instead of offering the known 404 URL.
    archive = a.get('archive') or ''
    member = a.get('archive_member') or ''
    public_url='' if a.get('mode') == 'link_only' else (a.get('public_url') or '')
    download = ('https://orbital-assets-proxy.jc-bose.workers.dev/download/' + quote(archive, safe='')) if archive and member else public_url
    licence_map={'uiverse':'MIT-uiverse.txt','useanim':'MIT-useanimations.txt','tslfx':'MIT-tslfx.txt','magicui':'MIT-magicui.txt','aws-splat':'MIT-0-aws.txt'}
    key=aid.split('/')[0]
    if seed_info:
        source=seed_info.get('source','').lower()
        key='uiverse' if 'uiverse' in source else 'useanim' if 'useanimations' in source else 'tslfx' if 'tslfx' in source else 'aws-splat' if 'amazon' in source or 'aws-solutions' in source else key
    licence_name=licence_map.get(key)
    needs_credit='BY' in license.upper() or license=='MIT' or license.startswith('Public domain')
    attribution=(seed_info.get('attribution','') if seed_info else a.get('attribution','')) if needs_credit else ''
    source_url=(seed_info.get('source','') if seed_info else a.get('source_url','')) if needs_credit else ''
    local = a.get('local_path') or ''
    info = inspect_glb(ROOT / local) if local and str(a.get('format','')).upper() == 'GLB' else None
    items.append({'id':aid,'name':clean(name),'category':(a.get('category_path') or 'Other').split(' / ')[0],'format':str(a.get('format') or 'FILE').upper(),'license':license,'credit':attribution,'creditSource':source_url,'licenseFile':('/licence-texts/'+licence_name) if licence_name else '', 'bytes':a.get('bytes') or 0,'sha':a.get('sha256') or '', 'image':image,'model':public_url if str(a.get('format','')).upper() in ('GLB','GLTF') else '', 'download':download,'member':member,'triangles':info['triangles'] if info else None,'featured':False,'score':quality(name,info)})
(HERE/'public'/'index-data.json').write_text(json.dumps(items,separators=(',',':'),ensure_ascii=False))
(HERE/'src'/'featured-data.json').write_text(json.dumps(items[:len(featured)],separators=(',',':'),ensure_ascii=False))
(HERE/'src'/'stats.json').write_text(json.dumps({'total':len(items),'formats':len({x['format'] for x in items}),'categories':len({x['category'] for x in items})},separators=(',',':')))
print(f'Indexed {len(items)} records, including {len(featured)} featured assets')
