import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Göreli yollar: site hangi alt klasörde yayınlanırsa yayınlansın çalışır.
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true, host: true },
});
