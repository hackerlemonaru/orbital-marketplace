import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { motion } from 'motion/react';
import type { FeaturedAsset } from '../data/site';
import type { Asset } from '../lib/catalog';
import { formatBytes, licenseShort, posterForAsset } from '../lib/format';

export type ProductLike = Pick<
  FeaturedAsset & Asset,
  'id' | 'name' | 'format' | 'license' | 'bytes' | 'sourceName' | 'sourceRepo' | 'productImage' | 'thumbnail'
> & {
  poster?: string;
  modeLabel?: string;
  linkOnly?: boolean;
  downloadable?: boolean;
};

export function productSources(item: any): string[] {
  const poster = posterForAsset(String(item.id || ''));
  return [...new Set([
    item.productImage,
    item.thumbnail,
    item.previewUrl,
    item.poster,
    poster,
  ].filter(Boolean))] as string[];
}

export default function ProductCard({
  asset,
  variant = 'small',
  onOpen,
}: {
  asset: any;
  variant?: 'large' | 'small' | 'list';
  onOpen?: (id: string) => void;
}) {
  const sources = useMemo(() => productSources(asset), [asset]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const src = sources[Math.min(sourceIndex, sources.length - 1)];

  // Cached images can finish before React attaches onLoad; reveal them anyway.
  useEffect(() => {
    const image = imageRef.current;
    setLoaded(Boolean(image?.complete && image.naturalWidth > 0));
  }, [src]);

  return (
    <motion.button
      type="button"
      layout
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={clsx('product-card', `is-${variant}`)}
      onClick={() => onOpen?.(asset.id)}
      aria-label={`Open ${asset.name} asset details`}
    >
      <span className="product-shot">
        <img
          ref={imageRef}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className={clsx(loaded && 'is-loaded')}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setSourceIndex((index) => Math.min(index + 1, sources.length - 1));
          }}
        />
        {(src === posterForAsset(String(asset.id || '')) || (asset.poster && src === asset.poster)) && <span className="preview-placeholder">Preview unavailable</span>}
      </span>
      <span className="product-meta">
        <span className="product-title-row">
          <span className="product-title">{asset.name}</span>
          <span className="product-size mono">{formatBytes(asset.bytes)}</span>
        </span>
        <span className="product-source">{asset.sourceName || asset.sourceRepo || 'Verified source'}</span>
        <span className="product-badges">
          <span className="licence-pill">{licenseShort(asset.license)}</span>
          <span className="format-chip">{asset.format}</span>
          {asset.linkOnly && <span className="link-pill">Link only</span>}
        </span>
      </span>
    </motion.button>
  );
}
