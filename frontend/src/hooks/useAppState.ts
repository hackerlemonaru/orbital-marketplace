import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { siteData } from '../data/site';
import { normalizeCatalog, type Asset } from '../lib/catalog';

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

export type HealthState = 'checking' | 'live' | 'unknown';

export function useHealthStatus(): HealthState {
  const [state, setState] = useState<HealthState>('checking');
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const urls = [siteData.healthUrl, `${siteData.apiOrigin.replace(/\/$/, '')}${siteData.healthUrl}`];
      for (const url of urls) {
        try {
          const response = await fetch(url, { cache: 'no-store' });
          if (!response.ok) continue;
          const data = await response.json();
          if (data && data.ok === true) {
            if (!cancelled) setState('live');
            return;
          }
        } catch {
          // Try the Worker origin next; local static previews do not serve /health.
        }
      }
      if (!cancelled) setState('unknown');
    };
    check();
    return () => { cancelled = true; };
  }, []);
  return state;
}

export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      setScrolled(window.scrollY > threshold);
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [threshold]);
  return scrolled;
}

export function useScrollProgress(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      if (ref.current) ref.current.style.transform = `scaleX(${progress})`;
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
}

export interface CatalogState {
  assets: Asset[] | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useCatalog(enabled = true): CatalogState {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const retry = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(siteData.catalogUrl, { signal: controller.signal, cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Catalogue returned ${response.status}`);
        return response.json();
      })
      .then((doc) => {
        if (cancelled) return;
        setAssets(normalizeCatalog(doc));
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : 'Catalogue could not be loaded');
        setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [nonce, enabled]);

  return { assets, loading, error, retry };
}
