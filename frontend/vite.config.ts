import { cpSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const root = dirname(fileURLToPath(import.meta.url));
const phase = Number(process.env.VITE_PHASE || '3');

function agentMirrors(): Plugin {
  return {
    name: 'orbital-agent-mirrors',
    apply: 'build',
    closeBundle() {
      const source = resolve(root, '../website/public');
      if (!existsSync(source)) return;
      cpSync(source, resolve(root, 'dist'), { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), agentMirrors()],
  define: {
    __ORBITAL_PHASE__: JSON.stringify(phase),
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022',
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: resolve(root, 'index.html'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
});
