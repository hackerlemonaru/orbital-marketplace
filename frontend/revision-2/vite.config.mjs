import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({root:resolve(import.meta.dirname),plugins:[react()],publicDir:'public',build:{outDir:'dist',emptyOutDir:true,rollupOptions:{input:{home:resolve(import.meta.dirname,'index.html'),browse:resolve(import.meta.dirname,'browse/index.html'),licences:resolve(import.meta.dirname,'licences/index.html')}}},server:{host:'0.0.0.0',allowedHosts:true},preview:{host:'0.0.0.0',allowedHosts:true}});
