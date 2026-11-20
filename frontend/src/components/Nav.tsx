import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { PHASE, siteData } from '../data/site';
import { formatCompactGib } from '../lib/format';
import { Brand, Button, Kbd } from './ui';

const links = [
  { label: 'Assets', href: PHASE >= 3 ? '#catalogue' : '#top' },
  { label: 'Story', href: PHASE >= 2 ? '#story' : '#top' },
  { label: 'Sources', href: PHASE >= 2 ? '#sources' : '#top' },
  { label: 'For agents', href: PHASE >= 2 ? '#agents' : '#top' },
  { label: 'Pricing', href: PHASE >= 3 ? '#pricing' : '#top' },
];

export default function Nav({
  scrolled,
  onSearch,
}: {
  scrolled: boolean;
  onSearch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const storageLabel = `${formatCompactGib(siteData.metrics.usedGib)} / ${formatCompactGib(siteData.metrics.capGib)}`;
  const browseHref = PHASE >= 3 ? '#catalogue' : '#top';

  return (
    <>
      <header className={clsx('site-nav', scrolled && 'is-scrolled')}>
        <div className="nav-inner">
          <Brand />
          <nav className="nav-links" aria-label="Primary">
            {links.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}
          </nav>
          <div className="nav-actions">
            <a
              className="storage-pill"
              href={PHASE >= 2 ? '#transparency' : '#top'}
              aria-label={`${siteData.metrics.usedGib} GiB stored of ${siteData.metrics.capGib} GiB budget`}
            >
              <span className="storage-dot" aria-hidden="true" />
              <span>{storageLabel}</span>
            </a>
            <button type="button" className="nav-search" onClick={onSearch} aria-label="Search the catalogue">
              <Kbd>K</Kbd>
              <span>Search</span>
            </button>
            <Button href={browseHref} variant="primary" size="compact" icon={<ArrowUpRight size={15} />}>
              Browse assets
            </Button>
            <button
              type="button"
              className="nav-menu-button"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="mobile-sheet" role="dialog" aria-modal="true" aria-label="Menu" data-lenis-prevent>
          <div className="mobile-sheet-head">
            <Brand />
            <button ref={closeRef} type="button" className="icon-button" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <nav className="mobile-links" aria-label="Mobile primary">
            {links.map((link) => (
              <a key={link.label} href={link.href} onClick={() => setOpen(false)}>
                <span>{link.label}</span><ArrowUpRight size={18} aria-hidden="true" />
              </a>
            ))}
          </nav>
          <div className="mobile-sheet-foot">
            <a className="storage-pill" href={PHASE >= 2 ? '#transparency' : '#top'} onClick={() => setOpen(false)}>
              <span className="storage-dot" aria-hidden="true" />
              <span>{storageLabel} stored</span>
            </a>
            <Button href={browseHref} variant="primary" icon={<ArrowUpRight size={16} />} onClick={() => setOpen(false)}>
              Browse assets
            </Button>
            <button type="button" className="button button-secondary" onClick={() => { setOpen(false); onSearch(); }}>
              Search catalogue
            </button>
          </div>
        </div>
      )}
    </>
  );
}
