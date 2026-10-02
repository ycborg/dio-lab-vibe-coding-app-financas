import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Caminhos relativos: o build funciona em qualquer subpasta (ex.: GitHub Pages em /nome-do-repo/).
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
