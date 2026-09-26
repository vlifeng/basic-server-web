import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site: /basic-server-web/
  base: process.env.VITE_BASE || '/basic-server-web/',
});
