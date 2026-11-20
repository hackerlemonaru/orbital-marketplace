import metricsJson from './metrics.json';
import siteJson from './site.json';

export interface Metrics {
  generatedAt: string;
  totalRows: number;
  assets: number;
  downloadableFiles: number;
  previewFiles: number;
  fixturesHidden: number;
  linkOnly: number;
  sources: number;
  uploadedFiles: number;
  usedGib: number;
  headroomGib: number;
  capGib: number;
  objects: number;
  usedPct: number;
}

export interface FeaturedAsset {
  id: string;
  name: string;
  catalogName: string;
  category: string;
  format: string;
  license: string;
  bytes: number;
  sha256: string;
  sourceUrl: string;
  sourceRepo: string;
  verifiedUrl: string;
  publicUrl: string;
  mode: string;
  thumbnail: string | null;
  productImage: string;
  modelPath: string;
  renderSlug: string;
  polygonCount: number | null;
  cardSize: 'large' | 'small';
  downloadable: boolean;
}

export interface SourceInfo {
  id: string;
  label: string;
  license: string;
  mode: string;
  modeLabel: string;
  url: string;
  note: string;
  linkOnly: boolean;
  icon: 'link' | 'code' | 'box';
}

export interface Passport {
  id: string;
  name: string;
  license: string;
  sha256: string;
  format: string;
  bytes: number;
  sourceUrl: string;
  sourceRepo: string;
  verifiedUrl: string;
  attribution: string;
  publicUrl: string;
  mode: string;
  verificationDate: string;
}

export interface MotionPlate {
  label: string;
  image: string;
  caption: string;
}

export interface SiteData {
  metrics: Metrics;
  apiOrigin: string;
  repoUrl: string;
  catalogUrl: string;
  healthUrl: string;
  endpoints: string[];
  llmsExcerpt: string;
  allowedLicences: string[];
  licenceGate: { allow?: string[]; require_attribution?: string[]; deny?: string[] };
  sources: SourceInfo[];
  sourceMarks: { label: string; url: string; license: string }[];
  featured: FeaturedAsset[];
  passport: Passport;
  motionPlates: MotionPlate[];
  polygonMap: Record<string, number>;
  heroGlb: string;
  heroPoster: string;
}

export const metrics = metricsJson as Metrics;
export const siteData = siteJson as unknown as SiteData;
export const PHASE = typeof __ORBITAL_PHASE__ === 'number' ? __ORBITAL_PHASE__ : 3;
