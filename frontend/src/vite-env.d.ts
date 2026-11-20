/// <reference types="vite/client" />

declare const __ORBITAL_PHASE__: number;

interface Window {
  __ORBITAL_BOOT__?: {
    metrics: Record<string, unknown>;
    site: Record<string, unknown>;
  };
}
