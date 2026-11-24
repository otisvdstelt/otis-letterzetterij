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

/**
 * Twee standaardadressen in bibliotheken die we nooit willen gebruiken, en die dus ook niet in de bundel horen:
 * - drei valt voor Draco terug op een decoder bij gstatic; wij geven altijd /draco/ mee;
 * - troika (achter drei Text) haalt een terugvalfont bij jsDelivr als een teken niet in de letter zit.
 * Beide worden een lokaal pad. Een ontbrekend teken geeft dan hooguit een 404 op deze site, nooit een verzoek naar buiten
 */
const LOCAL_ONLY: [RegExp, string][] = [
  [/https:\/\/www\.gstatic\.com\/draco\/versioned\/decoders\/[\d.]+\//g, '/draco/'],
  [/https:\/\/cdn\.jsdelivr\.net\/gh\/lojjic\/unicode-font-resolver@[^/`'"]+\/packages\/data/g, '/geen-terugvalfonts'],
]

const localOnly = (): Plugin => ({
  name: 'alleen-lokaal',
  enforce: 'pre',
  transform(code, id) {
    if (!/node_modules\/(@react-three\/drei|troika-three-text)\//.test(id)) return null
    let out = code
    for (const [pattern, local] of LOCAL_ONLY) out = out.replace(pattern, local)
    return out === code ? null : { code: out, map: null }
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrl(), localOnly()],
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
