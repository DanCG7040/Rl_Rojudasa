import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'hybrid', // Páginas estáticas + API routes como serverless en Vercel
  adapter: vercel({
    maxDuration: 10,
  }),
  build: {
    assets: 'assets'
  }
});
