import { useId, type ReactNode } from 'react'
import { komma, strings } from '../../content/strings'
import { TEMPLATES } from '../../lib/type/goals'
import { ALIGNS, LIMITS, MAX_ZIN, ROLES, type Role } from '../../lib/type/zetsel'
import { fontById, store, useLetters } from '../../lib/store'
import { Stempel } from './Stempel'
import { Woord } from './Woord'

const w = strings.winkelhaak

interface SliderProps {
  label: ReactNode
  value: number
  min: number
  max: number
  step: number
  shown: string
  onChange: (v: number) => void
  hint?: ReactNode
}

/** Een schuifje met zijn waarde erbij, op het lijntje geschreven */
function Schuif({ label, value, min, max, step, shown, onChange, hint }: SliderProps) {
  const id = useId()
  return (
    <div className="schuif">
      <div className="schuif-boven">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="schuif-waarde">
          {shown}
        </output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={shown} />
      {hint}
    </div>
  )
}

/** Wat je per rol zet: gewicht, cursief, spatiëring en de assen van een variabele letter */
function RolInstellingen({ role }: { role: Role }) {
  const z = useLetters((s) => s.zetsel)
  const font = useLetters((s) => fontById(s.zetsel[role], s))
  if (!font) return null
  const style = role === 'kop' ? z.kopStijl : z.tekstStijl
  const wght = font.axes?.wght
  const weights = font.weights
  const extraAxes = Object.entries(font.axes ?? {}).filter(([tag]) => tag !== 'wght' && tag !== 'ital')
  const cursiefId = `cursief-${role}`
  return (
    <div className="rol-instellingen">
      {wght ? (
        <Schuif
          label={<Woord uitleg={w.uitleg.gewicht}>{w.gewicht}</Woord>}
          value={style.weight}
          min={wght.min}
          max={wght.max}
          step={1}
          shown={String(style.weight)}
          onChange={(v) => store.style(role, { weight: v }, `gewicht-${role}`)}
          hint={<Stempel ids={['nep-vet', 'doel-dun']} role={role} />}
        />
      ) : (
        <Schuif
          label={<Woord uitleg={w.uitleg.gewicht}>{w.gewicht}</Woord>}
          value={Math.max(0, weights.indexOf(style.weight))}
          min={0}
          max={Math.max(0, weights.length - 1)}
          step={1}
          shown={String(style.weight)}
          onChange={(i) => store.style(role, { weight: weights[i] }, `gewicht-${role}`)}
          hint={<Stempel ids={['nep-vet', 'doel-dun']} role={role} />}
        />
      )}
      <div className="vinkje">
        <input id={cursiefId} type="checkbox" checked={style.italic} disabled={!font.italic && !style.italic} onChange={(e) => store.style(role, { italic: e.target.checked })} />
        <label htmlFor={cursiefId}>
          <Woord uitleg={w.uitleg.cursief}>{w.cursief}</Woord>
          {!font.italic && <span className="klein-uitleg"> · {font.family} {w.geenCursief}</span>}
        </label>
      </div>
      <Stempel ids={['nep-cursief']} role={role} />
      <Schuif
        label={<Woord uitleg={w.uitleg.spatiering}>{w.spatiering}</Woord>}
        value={style.tracking}
        min={-0.05}
        max={0.2}
        step={0.005}
        shown={w.em(style.tracking)}
        onChange={(v) => store.style(role, { tracking: v }, `spatie-${role}`)}
      />
      {extraAxes.length > 0 && (
        <fieldset className="assen">
          <legend>
            <Woord uitleg={w.uitleg.assen}>{w.assen}</Woord>
          </legend>
          {extraAxes.map(([tag, axis]) => {
            const value = style.axes[tag] ?? axis.default
            return (
              <Schuif
                key={tag}
                label={`${w.asNamen[tag] ?? tag} (${tag})`}
                value={value}
                min={axis.min}
                max={axis.max}
                step={axis.max - axis.min > 20 ? 1 : 0.1}
                shown={komma(value, 1)}
                onChange={(v) => store.style(role, { axes: { ...style.axes, [tag]: v } }, `as-${role}-${tag}`)}
              />
            )
          })}
        </fieldset>
      )}
    </div>
  )
}

/** Je zin, in de winkelhaak. Hij komt als grote kop op het vel en als lood in de pers */
export function ZinVeld({ titel = false }: { titel?: boolean }) {
  const z = useLetters((s) => s.zetsel)
  const zinId = useId()
  const count = [...z.zin].length
  return (
    <div className="field zin-veld">
      <label htmlFor={zinId}>{titel ? <Woord uitleg={w.uitleg.winkelhaak}>{w.zin}</Woord> : w.zin}</label>
      <textarea id={zinId} rows={2} maxLength={MAX_ZIN * 2} value={z.zin} onChange={(e) => store.update({ zin: e.target.value }, 'zin')} aria-describedby={`${zinId}-uitleg`} />
      <p id={`${zinId}-uitleg`} className="klein-uitleg">
        {w.zinUitleg} <span className="teller">{w.teller(count, MAX_ZIN)}</span>
      </p>
      <Stempel ids={['ij']} />
    </div>
  )
}

/** Welk sjabloon het vel is */
export function SjabloonKeuze() {
  const z = useLetters((s) => s.zetsel)
  const sjabloonId = useId()
  return (
    <div className="field">
      <label htmlFor={sjabloonId}>{w.sjabloon}</label>
      <select id={sjabloonId} value={z.sjabloon} onChange={(e) => store.template(e.target.value as typeof z.sjabloon)}>
        {TEMPLATES.map((t) => (
          <option key={t} value={t}>
            {strings.vel.sjablonen[t]}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * Fijnzetten: gewicht, cursief, spatiëring, assen, korps, interlinie, regel, schaal, uitlijning, tabelcijfers en afbreken.
 * Standaard dicht. De drukker zet het open als hij iets oplost dat hier staat, zodat je ziet wat er veranderde
 */
export function Fijnzetten() {
  const z = useLetters((s) => s.zetsel)
  const role = useLetters((s) => s.role)
  const open = useLetters((s) => s.fine)
  const tekst = useLetters((s) => fontById(s.zetsel.tekst, s))
  return (
    <details className="fijnzetten" open={open} onToggle={(e) => store.setFine(e.currentTarget.open)}>
      <summary>
        <span className="paneel-kop">{strings.vel.fijnzetten}</span>
        <span className="klein-uitleg">{strings.vel.fijnUitleg}</span>
      </summary>
      <div className="fijnzetten-inhoud">
        <div className="kast-rol" role="radiogroup" aria-label={w.rol}>
          <span className="hand">{w.rol}</span>
          {ROLES.map((r) => (
            <label key={r} className="stemming" data-aan={role === r}>
              <input type="radio" name="winkelhaak-rol" checked={role === r} onChange={() => store.setRole(r)} />
              {strings.kast.rollen[r]}
            </label>
          ))}
        </div>
      <RolInstellingen role={role} key={role} />

      <h4 className="hand winkelhaak-sub">{w.algemeen}</h4>
      <Schuif
        label={<Woord uitleg={w.uitleg.maat}>{w.maat}</Woord>}
        value={z.maat}
        min={LIMITS.maat[0]}
        max={LIMITS.maat[1]}
        step={0.5}
        shown={w.px(z.maat)}
        onChange={(v) => store.update({ maat: v }, 'maat')}
        hint={<Stempel ids={['te-klein']} />}
      />
      <Schuif
        label={<Woord uitleg={w.uitleg.interlinie}>{w.interlinie}</Woord>}
        value={z.interlinie}
        min={LIMITS.interlinie[0]}
        max={LIMITS.interlinie[1]}
        step={0.05}
        shown={komma(z.interlinie)}
        onChange={(v) => store.update({ interlinie: v }, 'interlinie')}
        hint={<Stempel ids={['interlinie-krap', 'interlinie-ruim']} />}
      />
      <Schuif
        label={<Woord uitleg={w.uitleg.regel}>{w.regel}</Woord>}
        value={z.regel}
        min={LIMITS.regel[0]}
        max={LIMITS.regel[1]}
        step={1}
        shown={w.tekens(z.regel)}
        onChange={(v) => store.update({ regel: v }, 'regel')}
        hint={<Stempel ids={['regel-lang', 'regel-kort']} />}
      />
      <Schuif
        label={<Woord uitleg={w.uitleg.ratio}>{w.ratio}</Woord>}
        value={z.ratio}
        min={LIMITS.ratio[0]}
        max={LIMITS.ratio[1]}
        step={0.001}
        shown={komma(z.ratio, 3)}
        onChange={(v) => store.update({ ratio: v }, 'ratio')}
        hint={<Stempel ids={['doel-schaal']} />}
      />
      <fieldset className="uitlijning">
        <legend>
          <Woord uitleg={w.uitleg.uitlijning}>{w.uitlijning}</Woord>
        </legend>
        <div className="stemmingen">
          {ALIGNS.map((a) => (
            <label key={a} className="stemming" data-aan={z.uitlijning === a}>
              <input type="radio" name="uitlijning" checked={z.uitlijning === a} onChange={() => store.update({ uitlijning: a })} />
              {w.uitlijningen[a]}
            </label>
          ))}
        </div>
        <Stempel ids={['uitvullen']} />
      </fieldset>
      <div className="vinkje">
        <input id="tabelcijfers" type="checkbox" checked={z.tabelcijfers} onChange={(e) => store.update({ tabelcijfers: e.target.checked })} />
        <label htmlFor="tabelcijfers">
          <Woord uitleg={w.uitleg.tabelcijfers}>{w.tabelcijfers}</Woord>
          {tekst && !tekst.coverage.tabular && <span className="klein-uitleg"> · {w.geenTabelcijfers}</span>}
        </label>
      </div>
      <Stempel ids={['doel-cijfers']} />
      <div className="vinkje">
        <input id="mooi-afbreken" type="checkbox" checked={z.mooiAfbreken} onChange={(e) => store.update({ mooiAfbreken: e.target.checked })} />
        <label htmlFor="mooi-afbreken">
          <Woord uitleg={w.uitleg.mooiAfbreken}>{w.mooiAfbreken}</Woord>
        </label>
      </div>
      <Stempel ids={['weduwe']} />
      </div>
    </details>
  )
}
