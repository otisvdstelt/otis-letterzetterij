import { strings } from '../../content/strings'
import { fontStack } from '../../lib/type/fontface'
import { buildScale } from '../../lib/type/scale'
import { encodeWaslijn } from '../../lib/type/share'
import type { Zetsel } from '../../lib/type/zetsel'
import { fallbackFor, familyOf, lettersOf, store, useLetters, WASLIJN_MAX } from '../../lib/store'
import { useFontFaces } from '../../hooks/useFontFaces'
import { Kopieer } from './Kopieer'
import { Vel } from './Vel'

const t = strings.waslijn

/** Een vel aan de lijn, klein: je zin in de kopletter, op zijn eigen papier */
function Hangend({ z, index, visiting, comparing, chosen }: { z: Zetsel; index: number; visiting: boolean; comparing: boolean; chosen: boolean }) {
  const letters = useLetters((s) => lettersOf(z, s))
  useFontFaces([letters?.kop, letters?.tekst])
  const kop = familyOf(z.kop)
  const tekst = familyOf(z.tekst)
  return (
    <li className="hangend" data-gekozen={chosen} style={{ '--draai': `${((index * 37) % 7) - 3}deg` } as React.CSSProperties}>
      <span className="knijper" aria-hidden="true" />
      <div className="hangend-vel" style={{ background: z.papier, color: z.inkt }}>
        <span className="hangend-zin" style={{ fontFamily: letters ? fontStack(letters.kop) : undefined, fontWeight: z.kopStijl.weight, fontStyle: z.kopStijl.italic ? 'italic' : undefined }}>
          {z.zin}
        </span>
        <span className="hangend-tekst" style={{ fontFamily: letters ? fontStack(letters.tekst) : undefined, color: z.tweedeInkt ?? z.inkt }}>
          {strings.vel.letters(kop, tekst)}
        </span>
      </div>
      <div className="hangend-knoppen">
        {comparing && (
          <label className="stemming" data-aan={chosen}>
            <input type="checkbox" checked={chosen} onChange={() => store.toggleCompare(index)} aria-label={t.kiesLabel(kop, tekst)} />
            {t.vergelijk}
          </label>
        )}
        <button type="button" className="quiet" aria-label={t.zetVerderLabel(kop, tekst)} onClick={() => store.continueFrom(z)}>
          {t.zetVerder}
        </button>
        {!visiting && (
          <button type="button" className="quiet" aria-label={t.haalAfLabel(kop, tekst)} onClick={() => store.unhang(index)}>
            {t.haalAf}
          </button>
        )}
      </div>
    </li>
  )
}

/** Twee of drie vellen naast elkaar, leesbaar, in de DOM */
function Vergelijk({ sheets }: { sheets: Zetsel[] }) {
  const state = useLetters((s) => s)
  return (
    <div className="vergelijk" data-aantal={sheets.length}>
      {sheets.map((z, i) => {
        const letters = lettersOf(z, state)
        if (!letters) return null
        return (
          <div key={i} className="vergelijk-vel">
            <p className="hand vergelijk-naam">{strings.vel.letters(letters.kop.family, letters.tekst.family)}</p>
            <Vel zetsel={z} kop={letters.kop} tekst={letters.tekst} scale={buildScale(z, letters.kop, letters.tekst)} compact />
          </div>
        )
      })}
    </div>
  )
}

/** De waslijn: hooguit zes vellen in de wind. Kies er twee of drie om ze naast elkaar te zien, en deel de hele lijn */
export function Waslijn() {
  const own = useLetters((s) => s.waslijn)
  const visiting = useLetters((s) => s.visiting)
  const compare = useLetters((s) => s.compare)
  const kept = useLetters((s) => s.kept)
  const sheets = visiting ?? own
  const comparing = compare !== null
  const chosen = (compare ?? []).filter((i) => i < sheets.length)
  const link = sheets.length ? `${window.location.origin}/waslijn/${encodeWaslijn(sheets, fallbackFor, (id) => familyOf(id))}` : ''
  return (
    <section className="waslijn" aria-labelledby="waslijn-kop">
      <div className="waslijn-boven">
        <h2 id="waslijn-kop" className="paneel-kop">
          {visiting ? t.bezoekKop : t.kop}
        </h2>
        {sheets.length >= 2 && (
          <button type="button" className="inked klein" aria-pressed={comparing} onClick={() => store.comparing(!comparing)}>
            {comparing ? t.sluitVergelijk : t.vergelijk}
          </button>
        )}
        {sheets.length > 0 && !visiting && <Kopieer text={link} what={t.deel} label={t.deel} />}
      </div>
      {visiting ? (
        <div className="bezoek">
          <p>{t.bezoekUitleg(visiting.length)}</p>
          <div className="knoppenrij">
            <button type="button" className="plaque" onClick={() => store.leaveVisit(true)}>
              {t.neemOver}
            </button>
            <button type="button" className="quiet" onClick={() => store.leaveVisit(false)}>
              {t.klaarMetKijken}
            </button>
          </div>
        </div>
      ) : (
        <p className="klein-uitleg">{sheets.length === 0 ? t.leeg : sheets.length >= WASLIJN_MAX ? t.vol : t.uitleg}</p>
      )}
      {!kept && <p className="hand">{t.nietBewaard}</p>}
      {sheets.length > 0 && (
        <ul className="lijn">
          {sheets.map((z, i) => (
            <Hangend key={`${i}-${z.kop}-${z.tekst}`} z={z} index={i} visiting={visiting !== null} comparing={comparing} chosen={chosen.includes(i)} />
          ))}
        </ul>
      )}
      {comparing && <p className="klein-uitleg">{t.kies(chosen.length)}</p>}
      {comparing && chosen.length >= 2 && <Vergelijk sheets={chosen.map((i) => sheets[i])} />}
    </section>
  )
}
