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
fixtures = re.compile(r'Triangle|SimpleMaterial|SimpleMeshes|Cameras|SimpleSkin|Unicode|Interpolation|Visibility|Coordinate|TextureEncoding|TextureLinear|BoxVertexColors|LightVisibility|NodeVisibility|AnimatedColorsCube|AnimatedMorphCube|CubeVisibility|SimpleInstancing', re.I)

def clean(s):
    s=re.sub(r'^\d+[_\- ]*','',s or '')
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
    if not info['textured'] and 0 < count < 2000: score -= 3
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
    if a.get('mode') not in ('r2','github','archive') or not a.get('public_url') or not a.get('bytes'):continue
    license=str(a.get('license') or '')
    if license not in ('CC0-1.0','MIT','MIT-0','CC-BY-4.0','CC BY 4.0'):continue
    thumb=byid.get(aid+'#thumb',{});image=thumb.get('preview_url') or thumb.get('public_url') or a.get('preview_url') or ''
    if not re.search(r'\.(webp|png|jpe?g|avif)$', unquote(urlparse(image).path), re.I): image = ''
    # Archive entries are not individual files on the server. Fetch and extract
    # their actual member instead of offering the known 404 URL.
    archive = a.get('archive') or ''
    member = a.get('archive_member') or ''
    download = ('https://orbital-assets-proxy.jc-bose.workers.dev/download/' + quote(archive, safe='')) if archive and member else a['public_url']
    licence_map={'uiverse':'MIT-uiverse.txt','useanim':'MIT-useanimations.txt','tslfx':'MIT-tslfx.txt','magicui':'MIT-magicui.txt','aws-splat':'MIT-0-aws.txt'}
    licence_name=licence_map.get(aid.split('/')[0])
    items.append({'id':aid,'name':clean(name),'category':(a.get('category_path') or 'Other').split(' / ')[0],'format':str(a.get('format') or 'FILE').upper(),'license':license,'credit':a.get('attribution','') if 'BY' in license.upper() else '', 'creditSource':a.get('source_url','') if 'BY' in license.upper() else '', 'licenseFile':('/licence-texts/'+licence_name) if licence_name else '', 'bytes':a['bytes'],'sha':a.get('sha256') or '', 'image':image,'model':a['public_url'] if str(a.get('format','')).upper() in ('GLB','GLTF') else '', 'download':download,'member':member,'featured':False,'score':quality(name,None)})
(HERE/'public'/'index-data.json').write_text(json.dumps(items,separators=(',',':'),ensure_ascii=False))
(HERE/'src'/'featured-data.json').write_text(json.dumps(items[:len(featured)],separators=(',',':'),ensure_ascii=False))
(HERE/'src'/'stats.json').write_text(json.dumps({'total':len(items),'formats':len({x['format'] for x in items}),'categories':len({x['category'] for x in items})},separators=(',',':')))
print(f'Indexed {len(items)} records, including {len(featured)} featured assets')
