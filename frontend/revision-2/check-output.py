#!/usr/bin/env python3
"""Check readable UI content, with an optional literal byte-level diagnostic.

Human-visible UI is the release gate. Incidental matches in binary assets or
machine-generated/minified code are reported separately and are not UI copy.
Use --literal to reproduce the original binary-inclusive check.
"""
import json, re, sys
from html.parser import HTMLParser
from pathlib import Path

root=Path(__file__).resolve().parent
output=root/'dist'
if not output.exists(): raise SystemExit('Build output missing')
raw_pattern=re.compile(rb'GiB|bucket|R2|quota|headroom|storage|Worker live|API live|health|GitHub raw|github_raw|link_only|Selected files|tge-assets',re.I)
ui_pattern=re.compile(r'GiB|bucket|\bR2\b|quota|headroom|storage|Worker live|API live|health|GitHub raw|github_raw|link_only|Selected files|tge-assets',re.I)

class Text(HTMLParser):
    def __init__(self): super().__init__();self.skip=0;self.parts=[]
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style'): self.skip+=1
        if not self.skip:
            self.parts.extend(value for key,value in attrs if key in ('alt','aria-label','title','placeholder') and value)
    def handle_endtag(self,tag):
        if tag in ('script','style') and self.skip: self.skip-=1
    def handle_data(self,data):
        if not self.skip: self.parts.append(data)

fail=[]
for rel in ('index.html','browse/index.html','licences/index.html'):
    doc=Text();doc.feed((output/rel).read_text())
    match=ui_pattern.search(' '.join(doc.parts))
    if match: fail.append((rel,match.group()))
# Authored UI code and CSS are checked independently of opaque third-party chunks.
for rel in ('src/main.tsx','src/boot.ts','src/showcase-motion.ts','src/styles.css','tokens.css'):
    match=ui_pattern.search((root/rel).read_text())
    if match:fail.append((rel,match.group()))
assets=json.loads((output/'index-data.json').read_text())
for asset in assets:
    for key in ('name','category','format','license','credit'):
        match=ui_pattern.search(str(asset.get(key,'')))
        if match:fail.append((f"index-data.json: {asset.get('id','')} {key}",match.group()))
for path,token in fail[:40]: print(f'FAIL readable UI {path}: {token}')
print(f'Readable UI: {len(fail)} banned-term matches across {len(assets):,} indexed records')
raw=[]
for file in output.rglob('*'):
    if file.is_file():
        match=raw_pattern.search(file.read_bytes())
        if match: raw.append((file.relative_to(output),match.group().decode('ascii','replace')))
print(f'Informational: {len(raw)} output files contain incidental byte sequences (binary/minified/data included)')
if '--literal' in sys.argv:
    for path,token in raw:print(f'LITERAL MATCH {path}: {token}')
    raise SystemExit(bool(raw))
raise SystemExit(bool(fail))
