import { useEffect, useId, useRef, useState } from 'react'
import { strings } from '../../content/strings'
import { familyName } from '../../lib/type/fontface'
import { FONT_FILE, MAX_FONT_BYTES, ownEntry, type FontInfo } from '../../lib/type/eigen'
import { KINDS, type Kind } from '../../lib/type/catalogue'
import { isOwn, store, useLetters } from '../../lib/store'

const e = strings.eigen

/**
 * Een eigen fontbestand op de werkbank. Het wordt gelezen met fontkit en geladen met de FontFace API
 * uit een ArrayBuffer. Het verlaat het apparaat nooit: niet naar een server, niet in een deellink
 */
async function take(file: File): Promise<'ok' | 'fout' | 'te-groot'> {
  if (file.size > MAX_FONT_BYTES) return 'te-groot'
  if (!FONT_FILE.test(file.name) && !/font|woff|ttf|otf/.test(file.type)) return 'fout'
  try {
    const bytes = await file.arrayBuffer()
    // fontkit komt pas als iemand een font aanbiedt
    const { parseFont, ownFonts } = await import('../../lib/fontFile')
    const font = parseFont(bytes) as FontInfo
    const entry = ownEntry(font, file.name)
    const face = new FontFace(familyName(entry.id), bytes.slice(0), { weight: entry.axes?.wght ? `${entry.axes.wght.min} ${entry.axes.wght.max}` : String(entry.weights[0] ?? 400), style: entry.italic ? 'italic' : 'normal' })
    await face.load()
    document.fonts.add(face)
    ownFonts.set(entry.id, font)
    store.addOwn(entry)
    return 'ok'
  } catch {
    return 'fout'
  }
}

/** De plek op de werkbank waar je een eigen fontbestand neerlegt, met een knop voor wie liever kiest */
export function EigenFont() {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [trouble, setTrouble] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const own = useLetters((s) => s.own)
  const z = useLetters((s) => s.zetsel)
  const current = own.filter((f) => isOwn(f.id) && (f.id === z.kop || f.id === z.tekst))

  const handle = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setTrouble(null)
    const result = await take(file)
    setBusy(false)
    if (result === 'fout') setTrouble(e.fout)
    if (result === 'te-groot') setTrouble(e.teGroot)
  }

  // Een bestand dat ergens op de pagina wordt losgelaten, komt ook op de werkbank
  useEffect(() => {
    const prevent = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) {
        event.preventDefault()
        setOver(true)
      }
    }
    const leave = (event: DragEvent) => {
      if (!event.relatedTarget) setOver(false)
    }
    const drop = (event: DragEvent) => {
      if (!event.dataTransfer?.files.length) return
      event.preventDefault()
      setOver(false)
      void handle(event.dataTransfer.files[0])
    }
    window.addEventListener('dragover', prevent)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragover', prevent)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
    }
  }, [])

  return (
    <div className="eigen" data-erover={over}>
      <p className="eigen-kop hand">{e.kop}</p>
      <p className="klein-uitleg">{e.uitleg}</p>
      <div className="knoppenrij">
        <label htmlFor={inputId} className="inked klein eigen-knop" aria-disabled={busy}>
          {busy ? e.bezig : e.kies}
        </label>
        <input
          ref={input}
          id={inputId}
          className="sr-only"
          type="file"
          accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"
          disabled={busy}
          onChange={(event) => {
            void handle(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
      <p className="klein-uitleg eigen-belofte">{e.belofte}</p>
      {trouble && (
        <p className="hand eigen-fout" role="alert">
          {trouble}
        </p>
      )}
      {current.map((f) => (
        <div key={f.id} className="field eigen-soort">
          <label htmlFor={`${inputId}-${f.id}`}>{e.soort(f.family)}</label>
          <select id={`${inputId}-${f.id}`} value={f.kind} onChange={(event) => store.ownKind(f.id, event.target.value as Kind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {e.soorten[k]}
              </option>
            ))}
          </select>
        </div>
      ))}
      {over && (
        <p className="sleep-hint slip paper hand" aria-hidden="true">
          {e.loslaten}
        </p>
      )}
    </div>
  )
}
