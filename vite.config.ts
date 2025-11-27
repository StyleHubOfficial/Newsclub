import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    // CRITICAL: base: './' ensures assets use relative paths, preventing 404 errors on GitHub Pages/Vercel.
    base: './', 
    build: {
      outDir: 'dist',
    }
  };
});