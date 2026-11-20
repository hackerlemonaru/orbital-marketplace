#!/usr/bin/env python3
"""Stitch Playwright viewport captures into one full-page JPEG."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image


def main() -> None:
    manifest = json.loads(Path(sys.argv[1]).read_text())
    width = int(manifest["width"])
    total = int(manifest["total"])
    output = Path(manifest["output"])
    result = Image.new("RGB", (width, total), (8, 9, 11))
    for tile in manifest["tiles"]:
        with Image.open(tile["path"]) as source:
            crop_top = int(tile["cropTop"])
            crop_height = int(tile["cropHeight"])
            region = source.crop((0, crop_top, width, crop_top + crop_height)).convert("RGB")
        result.paste(region, (0, int(tile["pasteY"])))
    result.save(output, "JPEG", quality=82, optimize=True, progressive=True)
    print(f"stitched {width}x{total}: {output} ({output.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
