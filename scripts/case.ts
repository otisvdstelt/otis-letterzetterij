// npm run case: de kast vullen.
// Haalt bij het bouwen een vaste set families op via Fontsource, meet ze met fontkit, en schrijft alles naar public/.
// Alleen dit script praat met Fontsource. De bezoeker doet geen enkele externe aanroep.
//
// Wat er gebeurt, per familie:
// - de metadata uit de Fontsource-API (gewichten, stijlen, licentie, versie, assen);
// - woff2 voor de DOM: variabel waar het kan (de standaardassen), anders statische gewichten. Alleen latin en latin-ext;
// - woff voor drei Text in 3D (400 en 700, alleen latin);
// - meten: metrieken, bereik, Il1/O0 en "Aa" als pad.
// Uitvoer: public/fonts/<id>/<versie>/..., public/data/fonts.json en public/data/specimens.json

import { mkdir, readFile, readdir, rm, stat, writeFile, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { create, registerFormat } from 'fontkit/core'
import { WOFF2Font } from 'fontkit/formats/WOFF2Font'
import { caseItems, STATIC_ITALICS, STATIC_WEIGHTS, WEIGHT_PRIORITY, WOFF_WEIGHTS, type CaseItem } from './case.config.ts'
import type { Catalogue, Face, FontEntry, Style, Subset } from '../src/lib/type/catalogue.ts'
import { measure, type FontLike, type Specimen } from '../src/lib/type/metrics.ts'

registerFormat(WOFF2Font)

const ROOT = new URL('..', import.meta.url).pathname
const CACHE = join(ROOT, '.case-cache')
const PUBLIC = join(ROOT, 'public')
const API = 'https://api.fontsource.org/v1'
const CDN = 'https://cdn.jsdelivr.net/fontsource/fonts'
const SUBSETS: Subset[] = ['latin', 'latin-ext']
const CONCURRENCY = 6

interface ApiFont {
  id: string
  family: string
  subsets: string[]
  weights: number[]
  styles: Style[]
  variable: boolean
  category: string
  license: string
  npmVersion: string
  unicodeRange: Record<string, string>
}

interface ApiAxes {
  axes: Record<string, { min: string; max: string; default: string }>
}

/** Haal iets op, of lees het uit de cache als het er al is. Een 404 is null, de rest is een fout */
async function cached(url: string, file: string): Promise<Buffer | null> {
  const path = join(CACHE, file)
  if (existsSync(path)) return readFile(path)
  if (existsSync(`${path}.404`)) return null
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url)
    if (response.status === 404) {
      await mkdir(dirname(path), { recursive: true })
      await writeFile(`${path}.404`, '')
      return null
    }
    if (response.ok) {
      const body = Buffer.from(await response.arrayBuffer())
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, body)
      return body
    }
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
  }
  throw new Error(`kon ${url} niet ophalen`)
}

async function json<T>(url: string, file: string): Promise<T> {
  const body = await cached(url, file)
  if (!body) throw new Error(`niet gevonden: ${url}`)
  return JSON.parse(body.toString('utf8')) as T
}

const open = (bytes: Buffer) => create(new Uint8Array(bytes)) as FontLike

/** Kies de statische gewichten: de belangrijkste eerst, hooguit STATIC_WEIGHTS */
function pickWeights(available: number[]): number[] {
  return WEIGHT_PRIORITY.filter((w) => available.includes(w))
    .slice(0, STATIC_WEIGHTS)
    .sort((a, b) => a - b)
}

const nearest = (available: number[], wanted: number) => available.reduce((best, w) => (Math.abs(w - wanted) < Math.abs(best - wanted) ? w : best), available[0])

interface Built {
  entry: FontEntry
  specimen: Specimen
  bytes: number
}

async function build(item: CaseItem): Promise<Built> {
  const meta = await json<ApiFont>(`${API}/fonts/${item.id}`, `api/${item.id}.json`)
  const version = meta.npmVersion
  const subsets = SUBSETS.filter((s) => meta.subsets.includes(s))
  const dir = `fonts/${item.id}/${version}`
  const faces: Face[] = []
  const files: { from: string; to: string }[] = []
  let bytes = 0

  // Een bestand ophalen en onthouden waar het naartoe moet
  const take = async (url: string, name: string): Promise<Buffer | null> => {
    const cacheName = `files/${item.id}/${version}/${name}`
    const body = await cached(url, cacheName)
    if (body) {
      files.push({ from: join(CACHE, cacheName), to: join(PUBLIC, dir, name) })
      bytes += body.length
    }
    return body
  }

  let axes: FontEntry['axes'] = null
  const measureFiles: Buffer[] = []

  if (meta.variable) {
    const api = await json<ApiAxes>(`${API}/variable/${item.id}`, `api/${item.id}.variable.json`)
    // Alleen wght (en ital, dat een eigen bestand is) heeft genoeg aan het wght-bestand. Anders de standaardassen
    const extra = Object.keys(api.axes).some((tag) => tag !== 'wght' && tag !== 'ital')
    const axisFile = extra ? 'standard' : 'wght'
    for (const style of meta.styles) {
      for (const subset of subsets) {
        const name = `${subset}-${axisFile}-${style}.woff2`
        let body = await take(`${CDN}/${item.id}:vf@${version}/${name}`, name)
        // Een andere versie van het variabele pakket? Dan de laatste
        body ??= await take(`${CDN}/${item.id}:vf@latest/${name}`, name)
        if (!body) continue
        const wght = api.axes.wght
        faces.push({ style, subset, weight: wght ? [Number(wght.min), Number(wght.max)] : 400, file: `${dir}/${name}`, bytes: body.length })
        if (style === 'normal') measureFiles.push(body)
      }
    }
  }

  // Statisch, of variabel maar zonder bruikbaar bestand
  if (faces.length === 0) {
    const weights = pickWeights(meta.weights)
    for (const style of meta.styles) {
      for (const weight of weights) {
        if (style === 'italic' && !STATIC_ITALICS.includes(weight)) continue
        for (const subset of subsets) {
          const name = `${subset}-${weight}-${style}.woff2`
          const body = await take(`${CDN}/${item.id}@${version}/${name}`, name)
          if (!body) continue
          faces.push({ style, subset, weight, file: `${dir}/${name}`, bytes: body.length })
        }
      }
    }
    // Meten op het gewone gewicht
    const base = nearest(weights, 400)
    for (const subset of subsets) {
      const body = await cached(`${CDN}/${item.id}@${version}/${subset}-${base}-normal.woff2`, `files/${item.id}/${version}/${subset}-${base}-normal.woff2`)
      if (body) measureFiles.push(body)
    }
  }

  if (measureFiles.length === 0) throw new Error(`${item.id}: geen bestand om te meten`)
  const fonts = measureFiles.map(open)
  const measured = measure(fonts)
  if (Object.keys(measured.axes).length > 0) axes = measured.axes

  // De .woff voor 3D
  const woff: Record<string, string> = {}
  for (const wanted of WOFF_WEIGHTS) {
    const weight = nearest(meta.weights, wanted)
    const name = `latin-${weight}-normal.woff`
    if (woff[String(weight)]) continue
    if (await take(`${CDN}/${item.id}@${version}/${name}`, name)) woff[String(weight)] = `${dir}/${name}`
  }

  for (const f of files) {
    await mkdir(dirname(f.to), { recursive: true })
    await copyFile(f.from, f.to)
  }

  const entry: FontEntry = {
    id: item.id,
    family: meta.family,
    drawer: item.drawer,
    kind: item.kind,
    moods: item.moods,
    category: meta.category,
    license: meta.license,
    version,
    weights: meta.weights,
    italic: meta.styles.includes('italic'),
    axes,
    faces,
    unicodeRange: Object.fromEntries(subsets.map((s) => [s, meta.unicodeRange[s]])),
    woff,
    scripts: meta.subsets.filter((sub) => !sub.startsWith('latin')),
    metrics: measured.metrics,
    coverage: measured.coverage,
  }
  return { entry, specimen: measured.specimen, bytes }
}

/** Een paar tegelijk, in de volgorde van de config */
async function inBatches<T, R>(items: T[], size: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await work(items[i])
      }
    }),
  )
  return out
}

/** Gooi weg wat niet meer in de kast hoort: oude versies en families die eruit zijn */
async function prune(keep: Set<string>) {
  const root = join(PUBLIC, 'fonts')
  if (!existsSync(root)) return
  for (const id of await readdir(root)) {
    for (const version of await readdir(join(root, id))) {
      if (!keep.has(`fonts/${id}/${version}`)) await rm(join(root, id, version), { recursive: true })
    }
    if ((await readdir(join(root, id))).length === 0) await rm(join(root, id), { recursive: true })
  }
}

async function main() {
  const started = Date.now()
  const ids = new Set<string>()
  for (const item of caseItems) {
    if (ids.has(item.id)) throw new Error(`${item.id} staat er twee keer in`)
    ids.add(item.id)
  }
  let done = 0
  const built = await inBatches(caseItems, CONCURRENCY, async (item) => {
    const result = await build(item)
    done++
    process.stdout.write(`\r${done}/${caseItems.length} ${item.id}`.padEnd(60))
    return result
  })
  process.stdout.write('\n')

  await prune(new Set(built.map((b) => `fonts/${b.entry.id}/${b.entry.version}`)))

  const catalogue: Catalogue = { built: new Date().toISOString().slice(0, 10), fonts: built.map((b) => b.entry) }
  const specimens = Object.fromEntries(built.map((b) => [b.entry.id, b.specimen]))
  await mkdir(join(PUBLIC, 'data'), { recursive: true })
  await writeFile(join(PUBLIC, 'data', 'fonts.json'), JSON.stringify(catalogue))
  await writeFile(join(PUBLIC, 'data', 'specimens.json'), JSON.stringify(specimens))

  // Het magazijn: de hele lijst van Fontsource, kort, zodat de app hem lokaal kan doorzoeken.
  // De bestanden zelf komen pas na toestemming, bij jsDelivr
  const all = await json<{ id: string; family: string; subsets: string[]; weights: number[]; styles: string[]; variable: boolean; category: string; license: string; type: string }[]>(`${API}/fonts`, 'api/alle.json')
  const magazijn = all
    .filter((f) => f.type === 'google' && f.subsets.includes('latin') && f.category !== 'icons' && !ids.has(f.id))
    .map((f) => [f.id, f.family, f.category, f.weights.join(','), f.styles.includes('italic') ? 1 : 0, f.variable ? 1 : 0, f.license])
  await writeFile(join(PUBLIC, 'data', 'magazijn.json'), JSON.stringify(magazijn))
  console.log(`magazijn.json: ${magazijn.length} families die niet in de kast staan`)

  const total = built.reduce((sum, b) => sum + b.bytes, 0)
  const size = async (f: string) => (await stat(join(PUBLIC, 'data', f))).size
  console.log(`${built.length} families, ${(total / 1e6).toFixed(1)} MB aan fonts`)
  console.log(`fonts.json ${((await size('fonts.json')) / 1024).toFixed(0)} KB, specimens.json ${((await size('specimens.json')) / 1024).toFixed(0)} KB`)
  const perDrawer = new Map<string, number>()
  for (const b of built) perDrawer.set(b.entry.drawer, (perDrawer.get(b.entry.drawer) ?? 0) + 1)
  console.log([...perDrawer].map(([d, n]) => `${d} ${n}`).join(', '))
  console.log(`klaar in ${((Date.now() - started) / 1000).toFixed(0)} s`)
}

await main()
