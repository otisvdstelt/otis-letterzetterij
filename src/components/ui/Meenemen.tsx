import { useState } from 'react'
import { opmerking, strings } from '../../content/strings'
import { checkInk } from '../../lib/type/contrast'
import { cssExport, figmaExport, npmExport, selfHost, tailwindExport, type ExportInput, type SelfHost } from '../../lib/type/exports'
import { fileUrl } from '../../lib/type/fontface'
import { makeZip } from '../../lib/type/zip'
import { currentRemarks, currentScale, currentSuggestions, codeOf, isOwn, lettersOf, store, useLetters } from '../../lib/store'
import type { FontEntry } from '../../lib/type/catalogue'
import type { Remark } from '../../lib/type/printer'
import { Kopieer } from './Kopieer'
import { download, sheetPng } from './png'

const m = strings.meenemen

/** Een stuk code met een kopieerknop */
function Code({ titel, uitleg, code, what }: { titel: string; uitleg: string; code: string; what: string }) {
  return (
    <section className="mee">
      <div className="mee-boven">
        <h3 className="mee-kop">{titel}</h3>
        <Kopieer text={code} what={what} />
      </div>
      <p className="klein-uitleg">{uitleg}</p>
      <pre className="mee-code" tabIndex={0}>
        <code>{code}</code>
      </pre>
    </section>
  )
}

/** Het briefje van de drukker: waarom dit werkt, in een paar zinnen */
function briefje(input: ExportInput, remarks: Remark[], waarom: string | null): string {
  const b = strings.briefje
  const z = input.zetsel
  const ink = checkInk(z.inkt, z.papier, z.maat, z.tekstStijl.weight)
  const praise = remarks.find((r) => r.id === 'lof-paar')
  const left = remarks.filter((r) => r.tone !== 'lof').length
  return [
    b.aanhef,
    '',
    b.paar(input.kop.family, input.tekst.family),
    waarom ?? (praise ? opmerking(praise.id, praise.params, praise.variant) : ''),
    b.schaal(z.ratio, z.maat, z.doel),
    b.regel(z.regel),
    b.inkt(ink.ratio, ink.level),
    b.nog(left),
    '',
    b.groet,
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n')
}

const kb = (bytes: number) => Math.max(1, Math.round(bytes / 1024))

/**
 * Alles in één map: de fonts, de @font-face-regels, de Tailwind- en CSS-export, een leesmij en de licenties.
 * De bestanden komen uit de kast van deze site (of het magazijn, als je daar een letter vandaan haalde); er gaat niks heen
 */
async function zip(input: ExportInput, fonts: readonly FontEntry[], host: SelfHost) {
  const files = await Promise.all(
    host.files.map(async (f) => {
      const url = /^(blob:|data:|https?:)/.test(f.from) ? f.from : fileUrl(f.from)
      const response = await fetch(url)
      if (!response.ok) throw new Error(f.name)
      return { name: `fonts/${f.name}`, data: new Uint8Array(await response.arrayBuffer()) }
    }),
  )
  const text = (t: string) => new TextEncoder().encode(t)
  const licenties = [...fonts.map((f) => m.licentieRegel(f.family, f.license)), '', m.bron].join('\n')
  return makeZip([
    ...files,
    { name: 'letters.css', data: text(host.css + '\n') },
    { name: 'tailwind.css', data: text(tailwindExport(input)) },
    { name: 'schaal.css', data: text(cssExport(input)) },
    { name: 'LEESMIJ.txt', data: text(m.zipLeesmij(input.kop.family, input.tekst.family)) },
    { name: 'LICENTIES.txt', data: text(licenties + '\n') },
  ])
}

/** Tab Meenemen: alles om dit vel in je eigen project te zetten, in één menu */
export function Meenemen() {
  const z = useLetters((s) => s.zetsel)
  const letters = useLetters((s) => lettersOf(s.zetsel, s))
  const scale = useLetters(currentScale)
  const remarks = useLetters(currentRemarks)
  const suggestions = useLetters(currentSuggestions)
  const [busy, setBusy] = useState(false)
  const [packing, setPacking] = useState(false)
  if (!letters || !scale) return null
  const input: ExportInput = { zetsel: z, kop: letters.kop, tekst: letters.tekst, scale }
  const npm = npmExport(input)
  const link = `${window.location.origin}/vel/${codeOf(z)}`
  const own = isOwn(z.kop) || isOwn(z.tekst)
  const book = suggestions.find((s) => s.kop === z.kop && s.tekst === z.tekst && s.reason.kind === 'zetboek')
  const note = briefje(input, remarks, book?.reason.kind === 'zetboek' ? book.reason.waarom : null)
  const fonts = [...new Map([letters.kop, letters.tekst].map((f) => [f.id, f])).values()]
  const host = selfHost({ zetsel: z, kop: letters.kop, tekst: letters.tekst })

  const pack = async () => {
    setPacking(true)
    try {
      const data = await zip(input, fonts, host)
      download(new Blob([data as BlobPart], { type: 'application/zip' }), 'letters.zip')
      store.say(strings.nieuws.gedownload(m.zip))
    } catch {
      store.say(strings.nieuws.zipMislukt)
    } finally {
      setPacking(false)
    }
  }

  const png = async () => {
    setBusy(true)
    try {
      const t = strings.zetsel.website
      const blob = await sheetPng(z, letters.kop, letters.tekst, scale, {
        alinea: t.alinea,
        citaat: t.citaat,
        bijschrift: t.bijschrift,
        voet: `${strings.vel.letters(letters.kop.family, letters.tekst.family)} · ${strings.titel}`,
      })
      download(blob, 'vel.png')
      store.say(strings.nieuws.gedownload(m.png))
    } finally {
      setBusy(false)
    }
  }

  const share = async () => {
    try {
      await navigator.share({ title: strings.titel, text: z.zin, url: link })
    } catch {
      // Afgebroken of niet toegestaan: de link staat er nog
    }
  }

  return (
    <div className="meenemen">
      <p className="klein-uitleg">{m.uitleg}</p>

      <section className="mee">
        <div className="mee-boven">
          <h3 className="mee-kop">{m.link}</h3>
          <Kopieer text={link} what={m.link} />
          {'share' in navigator && (
            <button type="button" className="inked klein" onClick={() => void share()}>
              {m.deel}
            </button>
          )}
        </div>
        <p className="klein-uitleg">
          {m.linkUitleg} {own && m.linkEigen}
        </p>
        <p className="mee-link">{link}</p>
      </section>

      <Code titel={m.tailwind} uitleg={m.tailwindUitleg} code={tailwindExport(input)} what={m.tailwind} />
      <Code titel={m.css} uitleg={m.cssUitleg} code={cssExport(input)} what={m.css} />
      {npm.install ? <Code titel={m.npm} uitleg={m.npmUitleg} code={`${npm.install}\n\n${npm.imports}`} what={m.npm} /> : <p className="klein-uitleg">{m.geenNpm}</p>}

      {host.files.length > 0 && (
        <section className="mee">
          <div className="mee-boven">
            <h3 className="mee-kop">{m.zelfHosten}</h3>
            <Kopieer text={host.css} what={m.zelfHosten} />
          </div>
          <p className="klein-uitleg">{m.zelfHostenUitleg(kb(host.bytes), host.files.length)}</p>
          <ul className="klein-uitleg mee-bestanden">
            {host.files.map((f) => (
              <li key={f.name}>{m.bestand(f.name, kb(f.bytes))}</li>
            ))}
          </ul>
          <pre className="mee-code" tabIndex={0}>
            <code>{host.css}</code>
          </pre>
        </section>
      )}

      <section className="mee">
        <div className="mee-boven">
          <h3 className="mee-kop">{m.zip}</h3>
          <button type="button" className="inked klein" disabled={packing || host.files.length === 0} aria-busy={packing} onClick={() => void pack()}>
            {packing ? m.zipBezig : m.download}
          </button>
        </div>
        <p className="klein-uitleg">{m.zipUitleg}</p>
      </section>

      <section className="mee">
        <div className="mee-boven">
          <h3 className="mee-kop">{m.figma}</h3>
          <button
            type="button"
            className="inked klein"
            onClick={() => {
              download(new Blob([figmaExport(input)], { type: 'application/json' }), 'tekststijlen.json')
              store.say(strings.nieuws.gedownload(m.figma))
            }}
          >
            {m.download}
          </button>
        </div>
        <p className="klein-uitleg">{m.figmaUitleg}</p>
      </section>

      <section className="mee">
        <div className="mee-boven">
          <h3 className="mee-kop">{m.png}</h3>
          <button type="button" className="inked klein" disabled={busy} onClick={() => void png()}>
            {m.download}
          </button>
        </div>
        <p className="klein-uitleg">{m.pngUitleg}</p>
      </section>

      <section className="mee">
        <div className="mee-boven">
          <h3 className="mee-kop">{m.briefje}</h3>
          <Kopieer text={note} what={m.briefje} />
        </div>
        <p className="briefje paper">{note}</p>
      </section>

      <section className="mee">
        <h3 className="mee-kop">{m.licenties}</h3>
        <ul className="klein-uitleg">
          {fonts.map((f) => (
            <li key={f.id}>{m.licentieRegel(f.family, f.license)}</li>
          ))}
        </ul>
        <p className="klein-uitleg">{m.bron}</p>
      </section>
    </div>
  )
}
