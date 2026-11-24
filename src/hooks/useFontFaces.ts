import { useEffect } from 'react'
import { fontFaceCss } from '../lib/type/fontface'
import type { FontEntry } from '../lib/type/catalogue'
import { isOwn } from '../lib/type/zetsel'

// Eén stijlblad met @font-face voor elke letter die ooit in beeld kwam. Alleen lokale bestanden.
// De browser laadt een bestand pas als er tekst in die letter op de pagina staat
const loaded = new Set<string>()
let sheet: HTMLStyleElement | null = null

function ensure(fonts: readonly FontEntry[]) {
  const fresh = fonts.filter((f) => !loaded.has(f.id) && !isOwn(f.id))
  if (fresh.length === 0) return
  if (!sheet) {
    sheet = document.createElement('style')
    sheet.id = 'letters'
    document.head.append(sheet)
  }
  for (const f of fresh) loaded.add(f.id)
  sheet.append(document.createTextNode(`${fresh.map((f) => fontFaceCss(f, import.meta.env.BASE_URL)).join('\n')}\n`))
}

/** Zorg dat deze letters te gebruiken zijn */
export function useFontFaces(fonts: readonly (FontEntry | null | undefined)[]) {
  const ids = fonts.map((f) => f?.id ?? '').join('|')
  useEffect(() => {
    ensure(fonts.filter((f): f is FontEntry => Boolean(f)))
    // De lijst verandert alleen als de ids veranderen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids])
}
