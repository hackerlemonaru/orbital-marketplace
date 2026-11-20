import clsx from 'clsx';
import { ArrowUpRight, Check, CircleDot, ExternalLink } from 'lucide-react';
import { siteData } from '../data/site';
import type { HealthState } from '../hooks/useAppState';
import { Button, StatusDot } from './ui';

const plans = [
  {
    id: 'explorer',
    name: 'Explorer',
    price: '$0',
    cadence: 'Always free',
    summary: 'Read every record, search the catalogue and download verified free files.',
    features: ['Full catalogue search', 'Licence and checksum records', 'Free / OSS downloads', 'Public agent endpoints'],
    cta: 'Browse free',
    highlighted: false,
  },
  {
    id: 'studio',
    name: 'Studio',
    price: '$29',
    cadence: 'per month',
    summary: 'A workflow tier for teams that need saved collections and release tooling.',
    features: ['Everything in Explorer', 'Saved collections', 'Batch install snippets', 'Early Studio release notes'],
    cta: 'Join the Studio waitlist',
    highlighted: true,
  },
  {
    id: 'per-item',
    name: 'Per item',
    price: 'From $9',
    cadence: 'one-time',
    summary: 'Buy a single premium drop when individual licences become available.',
    features: ['One asset, one licence', 'Clear commercial terms', 'Checksum and source record', 'No subscription required'],
    cta: 'View items',
    highlighted: false,
  },
];

const faq = [
  {
    question: 'Which assets can I download today?',
    answer: 'Verified free and open-source files with a public download URL. Link-only records point to their upstream source and are never offered as ORBITAL downloads.',
  },
  {
    question: 'Does CC BY need attribution?',
    answer: 'Yes. ORBITAL keeps the attribution field with the asset record and marks attribution-required licences in the licence gate.',
  },
  {
    question: 'Are paid items available now?',
    answer: 'No checkout is live. Studio and per-item pricing describe the planned tiers; the waitlist records interest locally and links to public release notes.',
  },
  {
    question: 'Can agents use the catalogue?',
    answer: 'Yes. Free read-only access covers search, metadata, licence, preview and install snippets. Premium downloads require an entitlement.',
  },
];

export function Pricing({ onWaitlist, onBrowse }: { onWaitlist: () => void; onBrowse: () => void }) {
  return (
    <section className="pricing section-dark" id="pricing">
      <div className="container">
        <div className="pricing-heading">
          <div className="eyebrow">Access</div>
          <h2>Simple plans. No checkout theatre.</h2>
          <p>Free records stay free. Studio and individual items are planned tiers, with checkout clearly marked as coming soon.</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={clsx('pricing-card', plan.highlighted && 'is-highlighted')} key={plan.id}>
              <div className="pricing-card-head">
                <h3>{plan.name}</h3>
                {plan.highlighted && <span className="solid-chip">Planned</span>}
              </div>
              <div className="pricing-price">
                <strong>{plan.price}</strong>
                <span>{plan.cadence}</span>
              </div>
              <p>{plan.summary}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}><Check size={16} aria-hidden="true" /><span>{feature}</span></li>
                ))}
              </ul>
              {plan.id === 'explorer' && <Button variant="secondary" onClick={onBrowse}>{plan.cta}</Button>}
              {plan.id === 'studio' && <Button variant="primary" onClick={onWaitlist}>{plan.cta}</Button>}
              {plan.id === 'per-item' && <Button href="#catalogue" variant="secondary">{plan.cta}</Button>}
            </article>
          ))}
        </div>
        <div className="pricing-foot">
          <span>Checkout opens soon.</span>
          <span>No payment flow, account creation or fake entitlement is active.</span>
        </div>
        <div className="licence-faq">
          <h3>Licence questions</h3>
          {faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}<span aria-hidden="true" /></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

const columns = [
  {
    title: 'Marketplace',
    links: [
      { label: 'Browse assets', href: '#catalogue' },
      { label: 'Featured assets', href: '#featured' },
      { label: 'Sources', href: '#sources' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Agents',
    links: [
      { label: 'Catalogue JSON', href: '/catalog.json' },
      { label: 'API contract', href: '/openapi.json' },
      { label: 'llms.txt', href: '/llms.txt' },
      { label: 'Health', href: '/health' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub repository', href: siteData.repoUrl || '/AGENTS.md' },
      { label: 'Agent guide', href: '/AGENTS.md' },
      { label: 'Licence matrix', href: '/docs/licenses.md' },
      { label: 'Library licences', href: '/docs/frontend-licences.md' },
    ],
  },
  {
    title: 'Status',
    links: [
      { label: 'Storage panel', href: '#transparency' },
      { label: 'Provenance', href: '#provenance' },
      { label: 'Worker health', href: '/health' },
      { label: 'Robots', href: '/robots.txt' },
    ],
  },
];

export function Footer({ health, onBrowse }: { health: HealthState; onBrowse: () => void }) {
  return (
    <>
      <section className="final-cta section-light">
        <div className="container final-cta-inner">
          <div>
            <CircleDot size={18} aria-hidden="true" />
            <h2>Start with the files you can verify.</h2>
            <p>Open the catalogue, inspect a passport and download a free asset. No account needed.</p>
          </div>
          <div className="final-cta-actions">
            <Button variant="primary" icon={<ArrowUpRight size={16} />} onClick={onBrowse}>Browse assets</Button>
            <Button href="/openapi.json" variant="secondary">Read the API</Button>
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <a href="#top" className="footer-wordmark">ORBITAL</a>
              <p>3D, motion and UI assets with the paperwork already done.</p>
              <StatusDot state={health} label="Worker live" />
            </div>
            <div className="footer-columns">
              {columns.map((column) => (
                <nav key={column.title} aria-label={column.title}>
                  <h3>{column.title}</h3>
                  {column.links.map((link) => (
                    <a key={link.label} href={link.href}>
                      {link.label}
                      {link.href.startsWith('http') && <ExternalLink size={12.5} aria-hidden="true" />}
                    </a>
                  ))}
                </nav>
              ))}
            </div>
          </div>
          <div className="footer-bottom">
            <span>Powered by Poly Haven</span>
            <span>CC0, MIT, MIT-0, CC BY and public-domain records are shown with their source terms.</span>
            <a href="/llms.txt">llms.txt</a>
            <a href="/openapi.json">openapi.json</a>
            <a href="/health">health</a>
          </div>
        </div>
      </footer>
    </>
  );
}
