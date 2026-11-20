import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  ArrowUpRight,
  Box,
  Check,
  Code2,
  ExternalLink,
  FileCode2,
  Link2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { siteData, type Metrics } from '../data/site';
import {
  formatBytes,
  formatCompactGib,
  formatGib,
  formatInteger,
  formatPercent,
  licenseShort,
  shortHash,
  endpointUrl,
} from '../lib/format';
import type { HealthState } from '../hooks/useAppState';
import ProductCard from './ProductCard';
import { CopyButton, InfoTip, SectionHeading, StatusDot } from './ui';

export function ProofStrip() {
  return (
    <section className="proof-strip section-light" aria-label="Verified source links">
      <div className="container">
        <div className="proof-inner">
          <div className="proof-lead">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Source records, not a logo wall</span>
          </div>
          <div className="proof-marks">
            {siteData.sourceMarks.map((mark) => (
              <a key={mark.label} href={mark.url} target="_blank" rel="noreferrer" aria-label={`Open ${mark.label} source`}>
                <span>{mark.label}</span>
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PinnedSequence({ onOpenAsset }: { onOpenAsset: (id: string) => void }) {
  return (
    <section className="sequence-pin section-dark" id="story">
      <div className="sequence-pin-inner">
        <div className="container sequence-grid">
          <div className="sequence-copy">
            <SectionHeading
              eyebrow="From object to library"
              title="One object opens into files you can inspect."
              body="Scroll the lattice forward. The studio object gives way to real catalogue records, each with a format, licence and byte size."
              light
            />
            <div className="sequence-note">
              <span className="edge-rule" aria-hidden="true" />
              <span>Every card below is drawn from the live catalogue.</span>
            </div>
          </div>
          <div className="sequence-stage" aria-label="Catalogue cards revealed from the monolith">
            <img className="sequence-object" src={siteData.heroPoster} alt="" loading="lazy" decoding="async" />
            <div className="sequence-cards">
              {siteData.featured.map((asset, index) => (
                <div className={clsx('sequence-card', index === 0 && 'is-lead')} key={asset.id}>
                  <ProductCard asset={asset} variant={index === 0 ? 'large' : 'small'} onOpen={onOpenAsset} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturedAssets({ onOpenAsset }: { onOpenAsset: (id: string) => void }) {
  const [large, ...small] = siteData.featured;
  return (
    <section className="featured section-light" id="featured">
      <div className="container">
        <SectionHeading
          eyebrow="Featured assets"
          title="Assets, photographed like products."
          body="Five real records from the catalogue. Open one to see its licence, checksum, source and install snippet."
          aside={<span className="heading-aside-stat">{formatInteger(siteData.metrics.assets)} assets ready to filter</span>}
        />
        <div className="bento-grid">
          <div className="bento-large">
            <ProductCard asset={large} variant="large" onOpen={onOpenAsset} />
          </div>
          {small.map((asset) => (
            <div className="bento-small" key={asset.id}>
              <ProductCard asset={asset} variant="small" onOpen={onOpenAsset} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const provenanceSteps = [
  { title: 'Source', body: 'Keep the upstream repository and licence note with the asset.', icon: Box },
  { title: 'Licence check', body: 'Gate the record against the published allow and deny lists.', icon: ShieldCheck },
  { title: 'Hash', body: 'Record the SHA-256 checksum before the file is delivered.', icon: Lock },
  { title: 'Deliver', body: 'Offer a download for verified free files, or a source link only.', icon: ArrowUpRight },
];

export function Provenance() {
  const passport = siteData.passport;
  return (
    <section className="provenance section-dark" id="provenance">
      <div className="container">
        <SectionHeading
          eyebrow="Asset passport"
          title="The paperwork travels with the file."
          body="A source becomes a downloadable asset only after its licence, checksum and delivery mode are recorded."
          light
        />
        <div className="provenance-flow">
          <svg className="provenance-svg" viewBox="0 0 1000 160" preserveAspectRatio="none" aria-hidden="true">
            <path className="provenance-line" d="M 20 80 C 180 20, 290 140, 430 80 S 690 20, 820 80 S 940 130, 980 80" />
          </svg>
          <div className="provenance-steps">
            {provenanceSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article className="provenance-step" key={step.title}>
                  <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="step-icon"><Icon size={19} aria-hidden="true" /></span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="passport-card">
          <div className="passport-head">
            <div>
              <div className="eyebrow">Sample passport</div>
              <h3>{passport.name}</h3>
            </div>
            <span className="licence-pill is-featured">{passport.license}</span>
          </div>
          <dl className="passport-grid">
            <div>
              <dt>SPDX licence</dt>
              <dd><span className="licence-pill">{passport.license}</span></dd>
            </div>
            <div>
              <dt>Format and size</dt>
              <dd><span className="format-chip">{passport.format}</span><span className="mono">{formatBytes(passport.bytes)}</span></dd>
            </div>
            <div className="passport-hash">
              <dt>SHA-256</dt>
              <dd><span className="mono">{shortHash(passport.sha256)}</span><CopyButton text={passport.sha256 || ''} label="Copy hash" compact /></dd>
            </div>
            <div>
              <dt>Source repo</dt>
              <dd><a href={passport.sourceUrl} target="_blank" rel="noreferrer">{passport.sourceRepo}<ExternalLink size={14} aria-hidden="true" /></a></dd>
            </div>
            <div>
              <dt>Verified URL</dt>
              <dd><a href={passport.verifiedUrl} target="_blank" rel="noreferrer">Open source record<ArrowUpRight size={14} aria-hidden="true" /></a></dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd><a href={passport.publicUrl}>Download free file<ArrowUpRight size={14} aria-hidden="true" /></a></dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function SourceIcon({ icon }: { icon: string }) {
  if (icon === 'link') return <Link2 size={18} aria-hidden="true" />;
  if (icon === 'code') return <Code2 size={18} aria-hidden="true" />;
  return <Box size={18} aria-hidden="true" />;
}

export function Sources() {
  return (
    <section className="sources section-light" id="sources">
      <div className="container">
        <SectionHeading
          eyebrow="Sources and licences"
          title="Every source keeps its own terms."
          body="Modes are explicit. A link-only record points upstream; ORBITAL does not redistribute or offer a download for it."
        />
        <div className="sources-grid custom-scroll" data-lenis-prevent>
          {siteData.sources.map((source) => (
            <article className="source-card" key={source.id}>
              <div className="source-card-head">
                <span className="source-icon"><SourceIcon icon={source.icon} /></span>
                <span className="licence-pill">{licenseShort(source.license)}</span>
                {source.linkOnly && (
                  <InfoTip label="What link only means">
                    ORBITAL links to the source and shows its licence. It does not store, mirror or download this file.
                  </InfoTip>
                )}
              </div>
              <h3>{source.label}</h3>
              <p>{source.note || 'Verified upstream source with a machine-readable licence record.'}</p>
              <div className="source-card-foot">
                <span className="mode-chip">{source.modeLabel}</span>
                {source.linkOnly && <span className="link-pill">Link only</span>}
                <a href={source.url} target="_blank" rel="noreferrer" aria-label={`Verify ${source.label}`}>
                  Verify <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AgentSection() {
  const [tab, setTab] = useState<'curl' | 'fetch' | 'llms'>('curl');
  const code = useMemo(() => {
    if (tab === 'curl') {
      return [
        `curl -sS ${endpointUrl('/catalog.json')} | jq '.assets | length'`,
        `curl -sS ${endpointUrl('/health')}`,
        `curl -sS ${endpointUrl('/openapi.json')}`,
      ].join('\n');
    }
    if (tab === 'fetch') {
      return [
        `const [catalogue, health, contract] = await Promise.all([`,
        `  fetch(${JSON.stringify(endpointUrl('/catalog.json'))}).then(r => r.json()),`,
        `  fetch(${JSON.stringify(endpointUrl('/health'))}).then(r => r.json()),`,
        `  fetch(${JSON.stringify(endpointUrl('/openapi.json'))}).then(r => r.json()),`,
        `]);`,
      ].join('\n');
    }
    return siteData.llmsExcerpt || endpointUrl('/llms.txt');
  }, [tab]);

  return (
    <section className="agents section-dark" id="agents">
      <div className="container">
        <SectionHeading
          eyebrow="Built for agents"
          title="Read the catalogue without scraping the page."
          body="The public endpoints return the same records the storefront uses. Copy a request, then inspect the contract or discovery file."
          light
          aside={<StatusDot state="live" label="Read-only endpoints" />}
        />
        <div className="agent-console">
          <div className="agent-tabs" role="tablist" aria-label="Agent request examples">
            {(['curl', 'fetch', 'llms.txt'] as const).map((label) => {
              const value = label === 'llms.txt' ? 'llms' : label;
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  className={clsx(tab === value && 'is-active')}
                  onClick={() => setTab(value)}
                >
                  {label}
                </button>
              );
            })}
            <div className="agent-console-actions"><CopyButton text={code} label="Copy code" /></div>
          </div>
          <pre className="code-block custom-scroll" data-lenis-prevent><code>{code}</code></pre>
          <div className="agent-endpoints">
            {siteData.endpoints.slice(0, 4).map((endpoint) => (
              <a key={endpoint} href={endpoint} target="_blank" rel="noreferrer" className="mono">
                {endpoint}<ArrowUpRight size={13} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Transparency({ health }: { health: HealthState }) {
  const [live, setLive] = useState<Metrics>(siteData.metrics);
  useEffect(() => {
    let cancelled = false;
    fetch('/data/metrics.json', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!cancelled && data && Number.isFinite(data.assets)) setLive(data as Metrics); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const segments = Array.from({ length: 20 });
  const filled = Math.round((live.usedPct / 100) * segments.length);
  return (
    <section className="transparency section-light" id="transparency">
      <div className="container">
        <SectionHeading
          eyebrow="Transparency"
          title="Storage, measured in the open."
          body="Bucket usage and headroom come from the API-measured quota report. The browser also checks the live Worker status."
          aside={<StatusDot state={health} label="API live" />}
        />
        <div className="transparency-panel">
          <div className="transparency-numbers">
            <div>
              <span className="transparency-label">Stored</span>
              <strong>{formatGib(live.usedGib)}</strong>
            </div>
            <div>
              <span className="transparency-label">Free</span>
              <strong>{formatGib(live.headroomGib)}</strong>
            </div>
            <div>
              <span className="transparency-label">Bucket objects</span>
              <strong>{formatInteger(live.objects)}</strong>
            </div>
          </div>
          <div className="segmented-progress" role="img" aria-label={`${formatGib(live.usedGib)} stored, ${formatGib(live.headroomGib)} free, ${formatPercent(live.usedPct)} of the cap`}>
            {segments.map((_, index) => <span key={index} className={clsx(index < filled && 'is-filled')} />)}
          </div>
          <div className="transparency-foot">
            <span>{formatCompactGib(live.capGib)} cap</span>
            <span>{formatPercent(live.usedPct)} used</span>
            <span>{formatInteger(live.uploadedFiles)} catalogue uploads</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MotionPlates() {
  return (
    <section className="motion-plates section-dark" id="studio-plates">
      <div className="container">
        <SectionHeading
          eyebrow="Studio plates"
          title="One accent, used with restraint."
          body="Four editorial stills hold the visual language together. Labels sit in solid chips, so they stay readable on every plate."
          light
        />
        <div className="plate-grid">
          {siteData.motionPlates.map((plate, index) => (
            <figure className={clsx('motion-plate', index === 0 && 'is-large')} key={plate.image}>
              <img src={plate.image} alt={plate.caption} loading="lazy" decoding="async" width="1280" height="714" />
              <figcaption><span className="solid-chip">{plate.label}</span></figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
