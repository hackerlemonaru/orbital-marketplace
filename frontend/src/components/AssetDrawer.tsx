import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Box,
  Check,
  Download,
  ExternalLink,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { Asset } from '../lib/catalog';
import { assetInstallSnippets, formatBytes, licenseShort, shortHash } from '../lib/format';
import { productSources } from './ProductCard';
import { Button, CopyButton, InfoTip } from './ui';

const ModelViewer: any = 'model-viewer';

export default function AssetDrawer({
  asset,
  onClose,
  onNotify,
}: {
  asset: Asset;
  onClose: () => void;
  onNotify: () => void;
}) {
  const [tab, setTab] = useState<'three' | 'r3f'>('three');
  const [downloaded, setDownloaded] = useState(false);
  const [viewerFailed, setViewerFailed] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sources = useMemo(() => productSources(asset), [asset]);
  const snippets = useMemo(() => assetInstallSnippets(asset), [asset]);
  const is3d = /GLB|GLTF/i.test(asset.format);
  const poster = sources[sources.length - 1] || asset.poster;
  const code = tab === 'three' ? snippets.three : snippets.r3f;

  useEffect(() => {
    setDownloaded(false);
    setViewerFailed(false);
    setTab('three');
  }, [asset.id]);

  useEffect(() => {
    import('@google/model-viewer').catch(() => setViewerFailed(true));
  }, []);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !containerRef.current) return;
      const focusables = [...containerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [asset.id, onClose]);

  return (
    <>
      <motion.button
        type="button"
        className="drawer-backdrop"
        aria-label="Close asset details"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.aside
        ref={containerRef}
        className="asset-drawer custom-scroll"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        data-lenis-prevent
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">Asset passport</span>
            <h2 id="drawer-title">{asset.name}</h2>
          </div>
          <button ref={closeRef} type="button" className="icon-button" onClick={onClose} aria-label="Close asset details"><X size={20} /></button>
        </div>

        <div className="drawer-viewer">
          {is3d && asset.downloadable && asset.publicUrl && !viewerFailed ? (
            <ModelViewer
              src={asset.publicUrl}
              poster={poster}
              alt={`Interactive view of ${asset.name}`}
              auto-rotate
              auto-rotate-delay="0"
              camera-controls
              interaction-prompt="none"
              shadow-intensity="1"
              environment-image="neutral"
              exposure="1.05"
              loading="lazy"
              onError={() => setViewerFailed(true)}
            />
          ) : (
            <img src={sources[0] || poster} alt="" loading="lazy" decoding="async" />
          )}
          {!is3d && (!sources[0] || sources[0] === asset.poster) && <span className="preview-placeholder">Preview unavailable</span>}
          {asset.linkOnly && <span className="solid-chip viewer-chip">Link only</span>}
        </div>

        <dl className="drawer-spec">
          <div>
            <dt>Format</dt>
            <dd><span className="format-chip">{asset.format}</span></dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd><span className="mono">{formatBytes(asset.bytes)}</span></dd>
          </div>
          <div>
            <dt>Polygon count</dt>
            <dd>{asset.polygonCount ? <span className="mono">{asset.polygonCount.toLocaleString('en-US')} triangles</span> : <span>Not listed</span>}</dd>
          </div>
          <div>
            <dt>SPDX licence</dt>
            <dd><span className="licence-pill">{licenseShort(asset.license)}</span>{asset.isFree && <ShieldCheck size={15} aria-hidden="true" />}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>{asset.modeLabel}{asset.linkOnly && <InfoTip label="Link only delivery">ORBITAL does not store or download this file. Use the source record.</InfoTip>}</dd>
          </div>
          <div className="drawer-hash">
            <dt>SHA-256</dt>
            <dd><span className="mono">{shortHash(asset.sha256)}</span>{asset.sha256 && <CopyButton text={asset.sha256} label="Copy" compact />}</dd>
          </div>
          <div>
            <dt>Source repo</dt>
            <dd>{asset.sourceUrl ? <a href={asset.sourceUrl} target="_blank" rel="noreferrer">{asset.sourceRepo}<ExternalLink size={14} aria-hidden="true" /></a> : <span>{asset.sourceRepo}</span>}</dd>
          </div>
          <div>
            <dt>Verified URL</dt>
            <dd>{asset.verifiedUrl ? <a href={asset.verifiedUrl} target="_blank" rel="noreferrer">Open source record<ArrowUpRight size={14} aria-hidden="true" /></a> : <span>Not published</span>}</dd>
          </div>
        </dl>

        <div className="drawer-install">
          <div className="drawer-section-head">
            <Box size={17} aria-hidden="true" />
            <h3>Install snippet</h3>
          </div>
          <div className="install-tabs" role="tablist" aria-label="Install snippet format">
            <button type="button" role="tab" aria-selected={tab === 'three'} className={clsx(tab === 'three' && 'is-active')} onClick={() => setTab('three')}>three.js</button>
            <button type="button" role="tab" aria-selected={tab === 'r3f'} className={clsx(tab === 'r3f' && 'is-active')} onClick={() => setTab('r3f')}>R3F</button>
            <CopyButton text={code} label="Copy" compact />
          </div>
          <pre className="code-block is-small custom-scroll"><code>{code}</code></pre>
        </div>

        <div className="drawer-actions">
          {asset.paid ? (
            <>
              <Button variant="primary" icon={<Lock size={16} />} onClick={onNotify}>Unlock</Button>
              <p>Checkout opens soon. Join the Studio waitlist for release notes.</p>
            </>
          ) : asset.linkOnly ? (
            <>
              <Button href={asset.verifiedUrl || asset.sourceUrl} variant="secondary" icon={<ExternalLink size={16} />}>View source</Button>
              <p>ORBITAL links to this source. It does not redistribute the file.</p>
            </>
          ) : asset.downloadable ? (
            <>
              <a
                className="button button-primary"
                href={asset.publicUrl}
                download
                onClick={() => setDownloaded(true)}
              >
                {downloaded ? 'Downloaded' : 'Download'}
                {downloaded ? <Check size={16} aria-hidden="true" className="button-icon" /> : <Download size={16} aria-hidden="true" className="button-icon" />}
              </a>
              <p>Verified free file. Keep the licence and checksum with your project.</p>
            </>
          ) : (
            <>
              <Button href={asset.verifiedUrl || asset.sourceUrl} variant="secondary" icon={<ArrowUpRight size={16} />}>Open source record</Button>
              <p>Metadata is public; no download is offered for this record.</p>
            </>
          )}
        </div>
      </motion.aside>
    </>
  );
}
