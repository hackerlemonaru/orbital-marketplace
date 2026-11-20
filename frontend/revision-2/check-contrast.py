#!/usr/bin/env python3
"""Check the revision 2 token pairs against WCAG relative-luminance ratios."""
import re
from pathlib import Path

css = (Path(__file__).parent / 'tokens.css').read_text()
tokens = dict(re.findall(r'(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;', css))

def luminance(hex_color):
    channels = [int(hex_color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    channels = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return sum(c * weight for c, weight in zip(channels, (0.2126, 0.7152, 0.0722)))

def contrast(a, b):
    x, y = sorted((luminance(tokens[a]), luminance(tokens[b])), reverse=True)
    return (x + .05) / (y + .05)

pairs = [
    ('--text-1', '--bg', 7), ('--text-1', '--surface-1', 7),
    ('--text-1', '--surface-2', 7), ('--text-1', '--surface-3', 7),
    ('--text-2', '--bg', 4.5), ('--text-2', '--surface-1', 4.5),
    ('--text-2', '--surface-2', 4.5), ('--text-2', '--surface-3', 4.5),
    ('--text-3', '--bg', 4.5), ('--text-3', '--surface-1', 4.5),
    ('--accent-text', '--bg', 4.5), ('--accent-text', '--surface-1', 4.5),
    ('--accent-text', '--surface-2', 4.5), ('--accent-text', '--surface-3', 4.5),
    ('--text-1', '--accent', 4.5), ('--text-1', '--accent-hover', 4.5),
]
failed = False
for fg, bg, minimum in pairs:
    value = contrast(fg, bg)
    ok = value >= minimum
    failed |= not ok
    print(f'{"PASS" if ok else "FAIL"} {fg} on {bg}: {value:.2f}:1 (minimum {minimum}:1)')
print('Restriction: --text-3 is not permitted on --surface-2 or --surface-3.')
raise SystemExit(1 if failed else 0)
