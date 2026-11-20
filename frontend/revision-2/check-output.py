#!/usr/bin/env python3
"""Report literal case-insensitive banned byte sequences in production output."""
import re
from pathlib import Path

root=Path(__file__).resolve().parent/'dist'
pattern=re.compile(rb'GiB|bucket|R2|quota|headroom|storage|Worker live|API live|health|GitHub raw|github_raw|link_only|Selected files|tge-assets',re.I)
if not root.exists():
    raise SystemExit('Build output missing')
failed=[]
for file in root.rglob('*'):
    if not file.is_file(): continue
    match=pattern.search(file.read_bytes())
    if match: failed.append((file.relative_to(root),match.group().decode('ascii','replace')))
for name,token in failed: print(f'FAIL {name}: {token}')
print(f'Literal binary-inclusive scan: {len(failed)} files with matches')
raise SystemExit(bool(failed))
