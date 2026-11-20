import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { PHASE } from './data/site';
import {
  useCatalog,
  useHealthStatus,
  useMounted,
  useReducedMotion,
  useScrolled,
  useScrollProgress,
} from './hooks/useAppState';
import { useOrbitalMotion } from './hooks/useOrbitalMotion';
import Nav from './components/Nav';
import Hero from './components/Hero';
import {
  AgentSection,
  FeaturedAssets,
  MotionPlates,
  PinnedSequence,
  ProofStrip,
  Provenance,
  Sources,
  Transparency,
} from './components/StorySections';
import Catalogue from './components/Catalogue';
import AssetDrawer from './components/AssetDrawer';
import { Pricing, Footer } from './components/EndSections';
import WaitlistDialog from './components/WaitlistDialog';

function updateAssetParam(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set('asset', id);
  else url.searchParams.delete('asset');
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

export default function App() {
  const mounted = useMounted();
  const reducedMotion = useReducedMotion();
  const health = useHealthStatus();
  const scrolled = useScrolled();
  const progressRef = useRef<HTMLDivElement>(null);
  const catalog = useCatalog(PHASE >= 3);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  useScrollProgress(progressRef);
  useOrbitalMotion(PHASE, reducedMotion);

  useEffect(() => {
    if (!mounted) return;
    const read = () => setSelectedId(new URLSearchParams(window.location.search).get('asset'));
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [mounted]);

  const scrollToCatalogue = useCallback(() => {
    const id = PHASE >= 3 ? 'catalogue' : 'top';
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }, [reducedMotion]);

  const focusSearch = useCallback(() => {
    if (PHASE < 3) {
      scrollToCatalogue();
      return;
    }
    const section = document.getElementById('catalogue');
    section?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => {
      document.getElementById('catalogue-search')?.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 520);
  }, [reducedMotion, scrollToCatalogue]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        focusSearch();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusSearch]);

  const openAsset = useCallback((id: string) => {
    setSelectedId(id);
    updateAssetParam(id);
  }, []);
  const closeAsset = useCallback(() => {
    setSelectedId(null);
    updateAssetParam(null);
  }, []);
  const openWaitlist = useCallback(() => setWaitlistOpen(true), []);
  const notifyFromDrawer = useCallback(() => {
    closeAsset();
    setWaitlistOpen(true);
  }, [closeAsset]);

  const selectedAsset = selectedId && catalog.assets
    ? catalog.assets.find((asset) => asset.id === selectedId) || null
    : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="site-shell">
        <div ref={progressRef} className="scroll-progress" aria-hidden="true" />
        <Nav scrolled={scrolled} onSearch={focusSearch} />
        <main>
          <Hero mounted={mounted} reducedMotion={reducedMotion} health={health} onBrowse={scrollToCatalogue} />

          {PHASE >= 2 && (
            <>
              <ProofStrip />
              <PinnedSequence onOpenAsset={openAsset} />
              <FeaturedAssets onOpenAsset={openAsset} />
              <Provenance />
              <Sources />
              <AgentSection />
              <Transparency health={health} />
              <MotionPlates />
            </>
          )}

          {PHASE >= 3 && (
            <>
              <Catalogue catalog={catalog} onOpenAsset={openAsset} />
              <Pricing onWaitlist={openWaitlist} onBrowse={scrollToCatalogue} />
            </>
          )}
        </main>

        {PHASE >= 3 && <Footer health={health} onBrowse={scrollToCatalogue} />}

        <AnimatePresence>
          {PHASE >= 3 && selectedAsset && (
            <AssetDrawer
              key={selectedAsset.id}
              asset={selectedAsset}
              onClose={closeAsset}
              onNotify={notifyFromDrawer}
            />
          )}
        </AnimatePresence>
        {PHASE >= 3 && <WaitlistDialog open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />}
      </div>
    </MotionConfig>
  );
}
