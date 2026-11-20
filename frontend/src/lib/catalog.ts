import { siteData } from '../data/site';
import { isImageUrl, licenseShort, modeLabel, posterForAsset } from './format';

export interface RawAsset {
  id: string;
  name: string;
  category_path?: string;
  format?: string;
  license?: string;
  attribution?: string;
  bytes?: number | null;
  sha256?: string | null;
  source_url?: string | null;
  source_repo?: string | null;
  license_url?: string | null;
  public_url?: string | null;
  preview_url?: string | null;
  github_blob_url?: string | null;
  r2_key?: string | null;
  mode?: string;
  verification_date?: string | null;
  r2_uploaded_at?: string | null;
  price_cents?: number | null;
  [key: string]: unknown;
}

export interface CatalogDoc {
  assets: RawAsset[];
  [key: string]: unknown;
}

export type AssetTier = 'free' | 'paid' | 'link' | 'metadata';

export interface Asset {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  format: string;
  license: string;
  licenseLabel: string;
  attribution: string;
  bytes: number | null;
  sha256: string | null;
  sourceName: string;
  sourceRepo: string;
  sourceUrl: string;
  verifiedUrl: string;
  publicUrl: string;
  previewUrl: string | null;
  thumbnail: string | null;
  poster: string;
  mode: string;
  modeLabel: string;
  downloadable: boolean;
  linkOnly: boolean;
  paid: boolean;
  tier: AssetTier;
  isFree: boolean;
  polygonCount: number | null;
  verificationDate: string;
  searchText: string;
}

export const FIXTURE_RE = /(Triangle|SimpleMaterial|SimpleMeshes|Cameras|SimpleSkin|Unicode|Interpolation|Visibility|Coordinate|TextureEncoding|TextureLinear|BoxVertexColors|LightVisibility|NodeVisibility|AnimatedColorsCube|AnimatedMorphCube|CubeVisibility|SimpleInstancing)/i;

export function isPreviewRow(asset: RawAsset): boolean {
  const name = asset.name || '';
  const category = asset.category_path || '';
  const format = String(asset.format || '').toUpperCase();
  return (
    asset.id.endsWith('#thumb')
    || name.toLowerCase().includes('(preview)')
    || category.toLowerCase().includes(' / previews')
    || (category.toLowerCase().endsWith('previews') && ['WEBP', 'PNG', 'JPG', 'JPEG'].includes(format))
  );
}

export function isFixtureRow(asset: RawAsset): boolean {
  return FIXTURE_RE.test(asset.name || '') && asset.mode !== 'github';
}

function cleanName(name: string): string {
  const cleaned = name.replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : 'Untitled asset';
}

function parseRepo(url: string | null | undefined): string {
  if (!url) return 'Verified source';
  const match = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)/i);
  return match ? `${match[1]}/${match[2]}` : 'Verified source';
}

function sourceName(asset: RawAsset): string {
  if (asset.source_repo) return asset.source_repo.replace(/\s*\(.*\)$/, '').trim();
  const repo = parseRepo(asset.source_url);
  if (repo !== 'Verified source') return repo;
  const url = asset.source_url || '';
  const host = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].replace(/\s*\(.*\)$/, '');
  return host || 'Source';
}

function categoryParts(path: string | undefined): [string, string] {
  const parts = (path || 'Uncategorised').split(' / ');
  return [parts[0] || 'Uncategorised', parts.slice(1).join(' / ') || 'General'];
}

function paidFromRaw(asset: RawAsset): boolean {
  return Boolean(
    Number(asset.price_cents || 0) > 0
    || String(asset.r2_key || '').startsWith('assets/premium/')
    || String(asset.tier || '').toLowerCase() === 'paid',
  );
}

export function normalizeCatalog(doc: CatalogDoc): Asset[] {
  const raw = Array.isArray(doc.assets) ? doc.assets : [];
  const thumbnails = new Map<string, string>();
  for (const row of raw) {
    if (!isPreviewRow(row)) continue;
    const parentId = row.id.replace(/#thumb$/, '');
    const url = row.public_url || row.preview_url;
    if (parentId && isImageUrl(url)) thumbnails.set(parentId, url as string);
  }

  const assets: Asset[] = [];
  for (const row of raw) {
    if (isPreviewRow(row) || isFixtureRow(row)) continue;
    const [category, subcategory] = categoryParts(row.category_path);
    const format = String(row.format || 'FILE').toUpperCase();
    const license = String(row.license || 'Licence not listed');
    const publicUrl = String(row.public_url || '');
    const sourceUrl = String(row.source_url || row.github_blob_url || row.license_url || '');
    const verifiedUrl = String(row.license_url || row.source_url || row.github_blob_url || '');
    const thumbnail = thumbnails.get(row.id) || (isImageUrl(row.preview_url) ? String(row.preview_url) : null);
    const previewUrl = isImageUrl(row.preview_url) ? String(row.preview_url) : thumbnail;
    const mode = String(row.mode || 'unknown');
    const linkOnly = mode === 'link_only';
    const paid = paidFromRaw(row);
    const bytes = Number(row.bytes || 0) || null;
    const downloadable = !linkOnly && !paid && Boolean(publicUrl) && Number(bytes || 0) > 0;
    const tier: AssetTier = linkOnly ? 'link' : paid ? 'paid' : downloadable ? 'free' : 'metadata';
    const repo = row.source_repo || parseRepo(sourceUrl);
    const name = cleanName(row.name || '');
    const sourceLabel = sourceName(row);
    const polygonCount = siteData.polygonMap[row.id] ?? null;
    const verificationDate = String(row.verification_date || row.r2_uploaded_at || '');
    const searchText = [
      name, category, subcategory, format, license, sourceLabel, repo,
      row.attribution || '', row.id,
    ].join(' ').toLowerCase();
    assets.push({
      id: row.id,
      name,
      category,
      subcategory,
      format,
      license,
      licenseLabel: licenseShort(license),
      attribution: String(row.attribution || ''),
      bytes,
      sha256: row.sha256 ? String(row.sha256) : null,
      sourceName: sourceLabel,
      sourceRepo: repo === 'Verified source' ? sourceLabel : repo,
      sourceUrl,
      verifiedUrl,
      publicUrl,
      previewUrl,
      thumbnail,
      poster: posterForAsset(row.id),
      mode,
      modeLabel: modeLabel(mode),
      downloadable,
      linkOnly,
      paid,
      tier,
      isFree: siteData.allowedLicences.includes(license),
      polygonCount,
      verificationDate,
      searchText,
    });
  }
  return assets;
}

export function facetValues(assets: Asset[], key: 'category' | 'format' | 'license' | 'sourceName'): string[] {
  return [...new Set(assets.map((asset) => asset[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
