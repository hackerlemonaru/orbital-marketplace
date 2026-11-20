import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import MiniSearch from 'minisearch';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Grid2X2, List, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { siteData } from '../data/site';
import type { CatalogState } from '../hooks/useAppState';
import type { Asset } from '../lib/catalog';
import { facetValues } from '../lib/catalog';
import { formatBytes, formatInteger, licenseShort, posterForAsset } from '../lib/format';
import ProductCard, { productSources } from './ProductCard';
import { Button, Checkbox, Select, Slider, Toggle } from './ui';

type Filters = {
  q: string;
  category: string;
  format: string;
  license: string;
  source: string;
  max: number | null;
  sort: string;
  view: 'grid' | 'list';
  freeOnly: boolean;
};

const initialFilters: Filters = {
  q: '',
  category: '',
  format: '',
  license: '',
  source: '',
  max: null,
  sort: 'relevance',
  view: 'grid',
  freeOnly: true,
};

function searchable(asset: Asset) {
  return {
    id: asset.id,
    name: asset.name,
    category: asset.category,
    subcategory: asset.subcategory,
    format: asset.format,
    license: asset.license,
    sourceName: asset.sourceName,
    sourceRepo: asset.sourceRepo,
  };
}

function ListRow({ asset, onOpen }: { asset: Asset; onOpen: (id: string) => void }) {
  const sources = productSources(asset);
  const [src, setSrc] = useState(sources[0] || posterForAsset(asset.id));
  return (
    <motion.button
      type="button"
      layout
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="catalogue-list-row"
      onClick={() => onOpen(asset.id)}
    >
      <span className="list-shot">
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setSrc(posterForAsset(asset.id))}
        />
        {(src === posterForAsset(asset.id) || src === asset.poster) && <span className="preview-placeholder">No preview</span>}
      </span>
      <span className="list-main">
        <strong>{asset.name}</strong>
        <span>{asset.category} · {asset.sourceName}</span>
      </span>
      <span className="list-badges">
        <span className="licence-pill">{licenseShort(asset.license)}</span>
        <span className="format-chip">{asset.format}</span>
        {asset.linkOnly && <span className="link-pill">Link only</span>}
      </span>
      <span className="mono list-size">{formatBytes(asset.bytes)}</span>
      <ArrowUpRight size={16} aria-hidden="true" />
    </motion.button>
  );
}

export default function Catalogue({
  catalog,
  onOpenAsset,
}: {
  catalog: CatalogState;
  onOpenAsset: (id: string) => void;
}) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(3);
  const assets = catalog.assets;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawMax = Number(params.get('max'));
    setFilters({
      q: params.get('q') || '',
      category: params.get('category') || '',
      format: params.get('format') || '',
      license: params.get('license') || '',
      source: params.get('source') || '',
      max: Number.isFinite(rawMax) && rawMax > 0 ? rawMax : null,
      sort: params.get('sort') || 'relevance',
      view: params.get('view') === 'list' ? 'list' : 'grid',
      freeOnly: params.get('free') !== '0',
    });
    setHydrated(true);
  }, []);

  const maxBytes = useMemo(() => {
    if (!assets?.length) return 0;
    return assets.reduce((largest, asset) => Math.max(largest, Number(asset.bytes || 0)), 0);
  }, [assets]);
  const effectiveMax = filters.max ?? maxBytes;

  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(window.location.href);
    const write = (key: string, value: string) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    };
    write('q', filters.q.trim());
    write('category', filters.category);
    write('format', filters.format);
    write('license', filters.license);
    write('source', filters.source);
    write('sort', filters.sort === 'relevance' ? '' : filters.sort);
    write('view', filters.view === 'grid' ? '' : filters.view);
    write('free', filters.freeOnly ? '' : '0');
    write('max', filters.max && maxBytes && filters.max < maxBytes ? String(Math.round(filters.max)) : '');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [filters, hydrated, maxBytes]);

  const index = useMemo(() => {
    if (!assets) return null;
    const mini = new MiniSearch({
      fields: ['name', 'category', 'subcategory', 'format', 'license', 'sourceName', 'sourceRepo'],
      storeFields: ['id'],
      searchOptions: {
        boost: { name: 4, category: 2, subcategory: 1.4, format: 1.2 },
        prefix: true,
        fuzzy: 0.2,
        combineWith: 'AND',
      },
    });
    mini.addAll(assets.map(searchable));
    return mini;
  }, [assets]);

  const searchMatches = useMemo(() => {
    const query = filters.q.trim();
    if (!query || !index) return null;
    const results = index.search(query);
    return {
      ids: new Set(results.map((result) => String(result.id))),
      rank: new Map(results.map((result, position) => [String(result.id), position])),
    };
  }, [filters.q, index]);

  const passes = (asset: Asset, exclude: keyof Filters | null): boolean => {
    if (filters.freeOnly && !asset.isFree) return false;
    if (searchMatches && !searchMatches.ids.has(asset.id)) return false;
    if (exclude !== 'category' && filters.category && asset.category !== filters.category) return false;
    if (exclude !== 'format' && filters.format && asset.format !== filters.format) return false;
    if (exclude !== 'license' && filters.license && asset.license !== filters.license) return false;
    if (exclude !== 'source' && filters.source && asset.sourceName !== filters.source) return false;
    if (exclude !== 'max' && effectiveMax && Number(asset.bytes || 0) > effectiveMax) return false;
    return true;
  };

  const facetCounts = useMemo(() => {
    if (!assets) return {} as Record<string, Record<string, number>>;
    const build = (key: 'category' | 'format' | 'license' | 'sourceName') => {
      const values = facetValues(assets, key);
      const exclude: keyof Filters = key === 'sourceName' ? 'source' : key;
      return Object.fromEntries(values.map((value) => [
        value,
        assets.reduce((count, asset) => count + (asset[key] === value && passes(asset, exclude) ? 1 : 0), 0),
      ])) as Record<string, number>;
    };
    return {
      category: build('category'),
      format: build('format'),
      license: build('license'),
      sourceName: build('sourceName'),
    };
  }, [assets, filters, searchMatches, effectiveMax]);

  const results = useMemo(() => {
    if (!assets) return [];
    const matched = assets.filter((asset) => passes(asset, null));
    const sorted = [...matched];
    if (filters.sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (filters.sort === 'size-desc') sorted.sort((a, b) => Number(b.bytes || 0) - Number(a.bytes || 0));
    else if (filters.sort === 'size-asc') sorted.sort((a, b) => Number(a.bytes || 0) - Number(b.bytes || 0));
    else if (filters.sort === 'format') sorted.sort((a, b) => a.format.localeCompare(b.format) || a.name.localeCompare(b.name));
    else if (filters.sort === 'relevance' && searchMatches) {
      sorted.sort((a, b) => (searchMatches.rank.get(a.id) ?? Infinity) - (searchMatches.rank.get(b.id) ?? Infinity));
    } else sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [assets, filters, searchMatches, effectiveMax]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const update = () => {
      const width = element.clientWidth;
      setColumns(width >= 980 ? 3 : width >= 620 ? 2 : 1);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [catalog.loading]);

  const rowHeight = filters.view === 'grid' ? 354 : 112;
  const itemsPerRow = filters.view === 'grid' ? columns : 1;
  const virtualizer = useVirtualizer({
    count: Math.ceil(results.length / itemsPerRow),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 4,
  });
  useEffect(() => { virtualizer.measure(); }, [filters.view, columns, results.length, virtualizer]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const clearFilters = () => setFilters({ ...initialFilters, view: filters.view });

  const activePills = [
    filters.freeOnly && { key: 'freeOnly', label: 'Verified free / OSS' },
    filters.q.trim() && { key: 'q', label: `“${filters.q.trim()}”` },
    filters.category && { key: 'category', label: filters.category },
    filters.format && { key: 'format', label: filters.format },
    filters.license && { key: 'license', label: licenseShort(filters.license) },
    filters.source && { key: 'source', label: filters.source },
    filters.max && { key: 'max', label: `Under ${formatBytes(filters.max)}` },
  ].filter(Boolean) as { key: keyof Filters; label: string }[];

  const removePill = (key: keyof Filters) => {
    if (key === 'freeOnly') setFilter('freeOnly', false);
    else if (key === 'max') setFilter('max', null);
    else setFilter(key, '' as never);
  };

  const facet = (key: 'category' | 'format' | 'license' | 'sourceName', title: string, selected: string, param: keyof Filters) => {
    const values = assets ? facetValues(assets, key).sort((a, b) => (facetCounts[key]?.[b] || 0) - (facetCounts[key]?.[a] || 0) || a.localeCompare(b)) : [];
    const showAll = expanded[key];
    const visible = showAll ? values : values.slice(0, 6);
    return (
      <fieldset className="filter-group">
        <legend>{title}</legend>
        {visible.map((value) => (
          <Checkbox
            key={value}
            label={key === 'license' ? licenseShort(value) : value}
            count={facetCounts[key]?.[value] || 0}
            checked={selected === value}
            onChange={(checked) => setFilter(param, (checked ? value : '') as never)}
          />
        ))}
        {values.length > 6 && (
          <button type="button" className="show-more" onClick={() => setExpanded((state) => ({ ...state, [key]: !state[key] }))}>
            {showAll ? 'Show fewer' : `Show ${values.length - 6} more`}
          </button>
        )}
      </fieldset>
    );
  };

  return (
    <section className="catalogue section-light" id="catalogue">
      <div className="container">
        <div className="catalogue-heading">
          <div>
            <div className="eyebrow">Catalogue</div>
            <h2>Find the file. Read the terms. Ship it.</h2>
            <p>Search, filter and open a passport before you download. Everything here is derived from the public catalogue once.</p>
          </div>
          <span className="heading-aside-stat">{formatInteger(siteData.metrics.assets)} assets ready to filter</span>
        </div>

        <div className="catalogue-shell">
          <aside className="filter-rail custom-scroll" data-lenis-prevent aria-label="Catalogue filters">
            <div className="filter-rail-head">
              <SlidersHorizontal size={17} aria-hidden="true" />
              <span>Filters</span>
              <button type="button" onClick={clearFilters}>Clear</button>
            </div>
            <Toggle
              checked={filters.freeOnly}
              onChange={(checked) => setFilter('freeOnly', checked)}
              label="Verified free / OSS only"
              description="Show permissive licences by default."
            />
            {facet('category', 'Category', filters.category, 'category')}
            {facet('format', 'Format', filters.format, 'format')}
            {facet('license', 'Licence', filters.license, 'license')}
            {facet('sourceName', 'Source', filters.source, 'source')}
            {maxBytes > 0 && (
              <Slider
                label="Maximum file size"
                min={0}
                max={maxBytes}
                step={Math.max(1, Math.round(maxBytes / 100))}
                value={effectiveMax}
                onChange={(value) => setFilter('max', value >= maxBytes ? null : value)}
                display={formatBytes(effectiveMax)}
              />
            )}
          </aside>

          <div className="catalogue-main">
            <div className="catalogue-toolbar">
              <label className="catalogue-search">
                <Search size={17} aria-hidden="true" />
                <span className="sr-only">Search assets</span>
                <input
                  id="catalogue-search"
                  type="search"
                  value={filters.q}
                  placeholder="Search models, shaders, sources…"
                  onChange={(event) => setFilter('q', event.target.value)}
                  autoComplete="off"
                />
              </label>
              <Select
                label="Sort assets"
                value={filters.sort}
                onChange={(value) => setFilter('sort', value)}
                options={[
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'name', label: 'Name' },
                  { value: 'size-desc', label: 'Largest first' },
                  { value: 'size-asc', label: 'Smallest first' },
                  { value: 'format', label: 'Format' },
                ]}
              />
              <div className="view-toggle" role="group" aria-label="Catalogue view">
                <button type="button" aria-pressed={filters.view === 'grid'} aria-label="Grid view" className={clsx(filters.view === 'grid' && 'is-active')} onClick={() => setFilter('view', 'grid')}><Grid2X2 size={16} /></button>
                <button type="button" aria-pressed={filters.view === 'list'} aria-label="List view" className={clsx(filters.view === 'list' && 'is-active')} onClick={() => setFilter('view', 'list')}><List size={16} /></button>
              </div>
            </div>

            <div className="active-filters" aria-label="Active filters">
              <AnimatePresence initial={false}>
                {activePills.map((pill) => (
                  <motion.button
                    key={pill.key}
                    layout
                    type="button"
                    className="filter-pill"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => removePill(pill.key)}
                  >
                    {pill.label}<X size={13} aria-hidden="true" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            <div className="result-count" aria-live="polite">
              {catalog.loading
                ? 'Loading catalogue…'
                : catalog.error
                  ? 'Catalogue unavailable'
                  : `${formatInteger(results.length)} of ${formatInteger(assets?.length || siteData.metrics.assets)} assets`}
            </div>

            {catalog.loading && (
              <div className="catalogue-state">
                <span className="loading-mark" aria-hidden="true" />
                <strong>Loading catalogue…</strong>
                <span>One read of the public JSON, then a local fuzzy index.</span>
              </div>
            )}
            {!catalog.loading && catalog.error && (
              <div className="catalogue-state is-error">
                <strong>Could not load the catalogue.</strong>
                <span>{catalog.error}</span>
                <Button variant="secondary" size="compact" icon={<RotateCcw size={15} />} onClick={catalog.retry}>Retry</Button>
              </div>
            )}
            {!catalog.loading && !catalog.error && results.length === 0 && (
              <div className="catalogue-state">
                <strong>No assets match these filters.</strong>
                <span>Remove a filter or search for a broader term.</span>
                <Button variant="secondary" size="compact" onClick={clearFilters}>Clear filters</Button>
              </div>
            )}
            {!catalog.loading && !catalog.error && results.length > 0 && (
              <div ref={scrollRef} className="catalogue-scroll custom-scroll" data-lenis-prevent>
                <div className="virtual-canvas" style={{ height: virtualizer.getTotalSize() }}>
                  {virtualizer.getVirtualItems().map((row) => {
                    const start = row.index * itemsPerRow;
                    const rowAssets = results.slice(start, start + itemsPerRow);
                    return (
                      <div
                        key={row.key}
                        className={clsx('virtual-row', filters.view === 'grid' ? 'is-grid' : 'is-list')}
                        style={{ height: row.size, transform: `translateY(${row.start}px)`, gridTemplateColumns: filters.view === 'grid' ? `repeat(${columns}, minmax(0, 1fr))` : '1fr' }}
                      >
                        {filters.view === 'grid'
                          ? rowAssets.map((asset) => <ProductCard key={asset.id} asset={asset} onOpen={onOpenAsset} />)
                          : rowAssets.map((asset) => <ListRow key={asset.id} asset={asset} onOpen={onOpenAsset} />)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
