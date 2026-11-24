// De netwerktest: tijdens gewoon gebruik gaat er geen verzoek naar een ander domein.
// Hij zoekt in dist/ (na het bouwen) naar adressen van Google en jsDelivr. Alleen de magazijncode mag jsDelivr kennen,
// en die zit in een eigen chunk met "magazijn" in de naam. Draait na elke build; gaat het mis, dan faalt de build

import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

/** Wat niet mag. jsDelivr als woord mag wel (de toestemmingsvraag noemt het), het adres niet */
export const FORBIDDEN = [/googleapis\.com/i, /gstatic\.com/i, /jsdelivr\.net/i]

/** Bestanden waar het wel mag: alleen het magazijn, en alleen jsDelivr */
export const isMagazijn = (path: string) => /(^|\/)magazijn[-.]/.test(path)

export interface Hit {
  path: string
  match: string
}

/** Zoek verboden adressen in een rij bestanden. Het magazijn mag jsDelivr noemen, nooit Google */
export function findForeign(files: readonly { path: string; text: string }[]): Hit[] {
  const hits: Hit[] = []
  for (const { path, text } of files) {
    for (const pattern of FORBIDDEN) {
      const found = text.match(pattern)
      if (!found) continue
      if (isMagazijn(path) && /jsdelivr/i.test(found[0])) continue
      hits.push({ path, match: found[0] })
    }
  }
  return hits
}

const TEXT = /\.(js|mjs|css|html|json|svg|txt|webmanifest)$/

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])))
  return nested.flat()
}

async function main() {
  const root = new URL('../dist', import.meta.url).pathname
  const paths = (await walk(root)).filter((p) => TEXT.test(p))
  const files = await Promise.all(paths.map(async (p) => ({ path: relative(root, p), text: await readFile(p, 'utf8') })))
  const hits = findForeign(files)
  if (hits.length > 0) {
    for (const hit of hits) console.error(`✗ ${hit.path}: ${hit.match}`)
    console.error('De netwerktest faalt: er staat een adres van Google of jsDelivr in dist/.')
    process.exit(1)
  }
  console.log(`✓ netwerktest: ${files.length} bestanden in dist/, geen Google, geen jsDelivr buiten het magazijn`)
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '')) await main()
