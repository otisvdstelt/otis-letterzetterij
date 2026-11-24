/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Het adres van de site, voor og:image en og:url, die een volledige URL willen.
 * Eerst VITE_SITE_URL, dan wat Vercel bij het bouwen meegeeft, en anders de naam die Vercel de repo zou geven
 */
const SITE_URL = (process.env.VITE_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://otis-letterzetterij.vercel.app')).replace(/\/$/, '')

const siteUrl = (): Plugin => ({
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrl()],
  build: {
    // three.js en alles wat erbij hoort landt in één luie chunk, zodat het papieren vel eerst staat
    chunkSizeWarningLimit: 1300,
  },
  test: {
    // De letterkern is pure TypeScript, dus geen DOM nodig
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
})
