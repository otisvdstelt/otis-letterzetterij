import { useEffect, useId, useState, type ReactNode } from 'react'
import { strings } from '../../content/strings'
import { normalizeHex } from '../../lib/type/color'
import { checkInk, formatRatio } from '../../lib/type/contrast'
import { store, useLetters } from '../../lib/store'
import { Stempel } from './Stempel'

const t = strings.inkt

/** Een eigen kleur als hex. Pas als het een kleur is, gaat hij door */
function EigenKleur({ value, what, onChange }: { value: string; what: string; onChange: (hex: string) => void }) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <span className="eigen-kleur">
      <label htmlFor={id} className="sr-only">
        {t.eigenLabel(what)}
      </label>
      <input
        id={id}
        type="text"
        inputMode="text"
        spellCheck={false}
        value={draft}
        size={8}
        onChange={(e) => {
          setDraft(e.target.value)
          const hex = normalizeHex(e.target.value)
          if (hex) onChange(hex)
        }}
        onBlur={() => setDraft(value)}
      />
    </span>
  )
}

/** Een rij potjes om uit te kiezen */
function Potjes({ name, label, colors, value, onPick, extra }: { name: string; label: string; colors: Record<string, string>; value: string | null; onPick: (hex: string | null) => void; extra?: ReactNode }) {
  return (
    <fieldset className="potjes">
      <legend>{label}</legend>
      <div className="potjes-rij">
        {Object.entries(colors).map(([hex, naam]) => (
          <label key={hex} className="potje" data-aan={value === hex} title={naam}>
            <input type="radio" name={name} checked={value === hex} onChange={() => onPick(hex)} />
            <span className="potje-kleur" style={{ background: hex }} aria-hidden="true" />
            <span className="sr-only">{naam}</span>
          </label>
        ))}
        {extra}
      </div>
    </fieldset>
  )
}

/** Inkt en papier, met een echte contrastcheck ernaast */
export function InktPapier({ plakken }: { plakken?: ReactNode }) {
  const z = useLetters((s) => s.zetsel)
  const check = checkInk(z.inkt, z.papier, z.maat, z.tekstStijl.weight)
  return (
    <section className="inkt-papier" aria-labelledby="inkt-kop">
      <h3 id="inkt-kop" className="paneel-kop">
        {t.kop}
      </h3>
      <Potjes name="inkt" label={t.inkt} colors={t.inkten} value={z.inkt} onPick={(hex) => hex && store.update({ inkt: hex })} extra={<EigenKleur value={z.inkt} what={t.inkt} onChange={(inkt) => store.update({ inkt }, 'inkt')} />} />
      <Potjes name="papier" label={t.papier} colors={t.papieren} value={z.papier} onPick={(hex) => hex && store.update({ papier: hex })} extra={<EigenKleur value={z.papier} what={t.papier} onChange={(papier) => store.update({ papier }, 'papier')} />} />
      <p className="contrast-regel" data-goed={check.passes}>
        <span className="contrast-staal" style={{ background: z.papier, color: z.inkt }} aria-hidden="true">
          Aa
        </span>
        <span>
          {strings.leesbaar.inktOpPapier}: <strong>{formatRatio(check.ratio)}</strong> · {strings.leesbaar.niveaus[check.level]}
        </span>
        <span className="stempeltje" data-goed={check.passes}>
          {check.passes ? strings.leesbaar.stempel.goed : strings.leesbaar.stempel.zwak}
        </span>
      </p>
      <Stempel ids={['inkt-zwak', 'inkt-presentatie']} />
      <Potjes
        name="tweede"
        label={`${t.tweede} · ${t.tweedeUitleg}`}
        colors={t.inkten}
        value={z.tweedeInkt}
        onPick={(hex) => store.update({ tweedeInkt: hex })}
        extra={
          <>
            <label className="potje potje-geen" data-aan={z.tweedeInkt === null}>
              <input type="radio" name="tweede" checked={z.tweedeInkt === null} onChange={() => store.update({ tweedeInkt: null })} />
              <span className="hand">{t.geenTweede}</span>
            </label>
            {z.tweedeInkt && <EigenKleur value={z.tweedeInkt} what={t.tweede} onChange={(tweedeInkt) => store.update({ tweedeInkt }, 'tweede')} />}
          </>
        }
      />
      <Stempel ids={['tweede-inkt-zwak']} />
      {plakken}
    </section>
  )
}
