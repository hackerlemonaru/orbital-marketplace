import { siteData } from '../data/site';
import type { Asset } from './catalog';

const integer = new Intl.NumberFormat('en-US');

export function formatInteger(value: number | null | undefined): string {
  return integer.format(Number(value || 0));
}

export function formatBytes(value: number | null | undefined): string {
  const bytes = Number(value || 0);
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const display = size >= 10 || unit === 0 ? Math.round(size).toString() : size.toFixed(1);
  return `${display} ${units[unit]}`;
}

export function formatGib(value: number | null | undefined): string {
  return `${Number(value || 0).toFixed(4)} GiB`;
}

export function formatCompactGib(value: number | null | undefined): string {
  return `${Number(value || 0).toFixed(2)} GiB`;
}

export function formatPercent(value: number | null | undefined): string {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function licenseShort(license: string): string {
  const map: Record<string, string> = {
    'Public domain + NASA usage guidelines': 'NASA guidelines',
    'see seed-manifest.json': 'See manifest',
    'CC BY 4.0': 'CC-BY-4.0',
    'mixed CC0-1.0 / CC-BY-4.0 (per model)': 'Mixed per model',
  };
  return map[license] || license;
}

export function modeLabel(mode: string): string {
  const map: Record<string, string> = {
    r2: 'Stored file',
    archive: 'Archive member',
    github: 'GitHub raw',
    link_only: 'Link only',
  };
  return map[mode] || mode.replace(/_/g, ' ');
}

export function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return /\.(webp|png|jpe?g|avif|gif)$/.test(clean);
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteData.apiOrigin.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function endpointUrl(endpoint: string): string {
  return `${siteData.apiOrigin.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

export function shortHash(hash: string | null | undefined): string {
  if (!hash) return 'Not published';
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function posterForAsset(id: string): string {
  const posters = siteData.motionPlates.map((plate) => plate.image);
  if (!posters.length) return siteData.heroPoster;
  return posters[hashString(id) % posters.length];
}

export function assetInstallSnippets(asset: Asset): { three: string; r3f: string } {
  const url = asset.publicUrl || asset.verifiedUrl || '';
  const is3d = /^(GLB|GLTF|GLTF-EMBEDDED|GLTF-EMBEDDED)$/i.test(asset.format.replace(/\s/g, '-'));
  const quoted = JSON.stringify(url);
  return {
    three: is3d
      ? `new GLTFLoader().load(${quoted}, gltf => scene.add(gltf.scene))`
      : `fetch(${quoted}).then(response => response.text())`,
    r3f: is3d
      ? `const {{ scene }} = useGLTF(${quoted})`
      : `useLoader(FileLoader, ${quoted})`,
  };
}
