import { lazy, Suspense, useState } from 'react';
import { ArrowUpRight, CircleDot } from 'lucide-react';
import { siteData } from '../data/site';
import { formatGib, formatInteger } from '../lib/format';
import type { HealthState } from '../hooks/useAppState';
import { Button, StatusDot } from './ui';

const MonolithScene = lazy(() => import('./MonolithScene'));

const stats = [
  { value: formatInteger(siteData.metrics.assets), label: 'catalogue assets' },
  { value: formatInteger(siteData.metrics.sources), label: 'verified sources' },
  { value: formatGib(siteData.metrics.headroomGib), label: 'storage headroom' },
];

export default function Hero({
  mounted,
  reducedMotion,
  health,
  onBrowse,
}: {
  mounted: boolean;
  reducedMotion: boolean;
  health: HealthState;
  onBrowse: () => void;
}) {
  const [webglFailed, setWebglFailed] = useState(false);
  const showCanvas = mounted && !reducedMotion && !webglFailed;

  return (
    <section className="hero" id="top">
      <div className="hero-container">
        <div className="hero-copy">
          <div className="hero-kicker">
            <CircleDot size={15} aria-hidden="true" />
            <span>Catalogue is live</span>
            <StatusDot state={health} label="API live" />
          </div>
          <h1 className="hero-headline">3D assets you can ship, with the paperwork already done.</h1>
          <p className="hero-sub">
            Browse {formatInteger(siteData.metrics.assets)} models, shaders and motion assets.
            Every file shows its licence, source and checksum before you download.
          </p>
          <div className="hero-actions">
            <Button variant="primary" icon={<ArrowUpRight size={17} />} onClick={onBrowse}>Browse assets</Button>
            <Button href="/openapi.json" variant="secondary">Read the API</Button>
          </div>
          <dl className="hero-stats" aria-label="Live catalogue figures">
            {stats.map((stat) => (
              <div key={stat.label} className="hero-stat">
                <dt>{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="hero-visual" aria-label="Black lattice monolith with a blue edge-light seam">
          <img
            className="hero-poster"
            src={siteData.heroPoster}
            alt="Black lattice monolith with a blue edge seam on a studio-white cove"
            width="1280"
            height="714"
            fetchPriority="high"
            decoding="async"
          />
          {showCanvas && (
            <Suspense fallback={null}>
              <MonolithScene onFailure={() => setWebglFailed(true)} />
            </Suspense>
          )}
        </figure>
      </div>
      <div className="hero-baseline" aria-hidden="true" />
    </section>
  );
}
