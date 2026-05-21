import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the repo from /maestro-helper/ subpath.
// Change this if you rename the repo.
export default defineConfig({
  plugins: [react()],
  base: '/maestro-helper/',
});
