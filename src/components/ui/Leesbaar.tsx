import { oplossing, strings } from '../../content/strings'
import { checkInk, formatRatio } from '../../lib/type/contrast'
import { GOAL_SPECS } from '../../lib/type/goals'
import { currentRemarks, currentScale, lettersOf, store, useLetters } from '../../lib/store'
import type { FontEntry } from '../../lib/type/catalogue'

const l = strings.leesbaar

/** Wat een letter heeft en mist, als vinkjes */
function Delen({ font, rol }: { font: FontEntry; rol: string }) {
  const items: [string, boolean][] = [
    [l.cursief, font.italic],
    [l.tabel, font.coverage.tabular],
    [l.ij, font.coverage.ij],
    [l.il1, font.coverage.distinctIl1 && font.coverage.distinctO0],
  ]
  return (
    <div className="delen">
      <p className="delen-naam">
        <span className="hand">{rol}</span> {font.family} · {l.gewichten(font.weights.length, Boolean(font.axes?.wght))}
      </p>
      <ul className="delen-lijst">
        {items.map(([naam, has]) => (
          <li key={naam} data-heeft={has}>
            <span aria-hidden="true">{has ? '✓' : '–'}</span> <span className="sr-only">{has ? l.heeft : l.mist}</span> {naam}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Tab Leesbaar: contrast, regellengte, kleinste maat, wat de letters hebben, en alles wat de drukker zegt */
export function Leesbaar() {
  const z = useLetters((s) => s.zetsel)
  const letters = useLetters((s) => lettersOf(s.zetsel, s))
  const scale = useLetters(currentScale)
  const list = useLetters(currentRemarks)
  if (!letters || !scale) return null
  const spec = GOAL_SPECS[z.doel]
  const ink = checkInk(z.inkt, z.papier, z.maat, z.tekstStijl.weight)
  const second = z.tweedeInkt ? checkInk(z.tweedeInkt, z.papier, scale.levels.h3.min, z.kopStijl.weight) : null
  const lineOk = z.regel >= spec.measure[0] && z.regel <= spec.measure[1]
  return (
    <div className="leesbaar">
      <dl className="metingen">
        <div data-goed={ink.passes}>
          <dt>{l.inktOpPapier}</dt>
          <dd>
            <strong>{formatRatio(ink.ratio)}</strong> {l.niveaus[ink.level]} · {l.nodig(ink.required)}
            <span className="klein-uitleg" title={l.apcaUitleg}>
              {' '}
              · {l.apca(ink.lc)}
            </span>
          </dd>
        </div>
        {second && (
          <div data-goed={second.passes}>
            <dt>{l.tweedeOpPapier}</dt>
            <dd>
              <strong>{formatRatio(second.ratio)}</strong> {l.niveaus[second.level]} · {l.nodig(second.required)}
            </dd>
          </div>
        )}
        <div data-goed={lineOk}>
          <dt>{l.regellengte}</dt>
          <dd>
            {l.regelWaarde(z.regel, scale.measure.rem)} · {l.goedBereik(spec.measure[0], spec.measure[1])}
          </dd>
        </div>
        <div data-goed={scale.levels.tekst.min >= 16}>
          <dt>{l.kleinste}</dt>
          <dd>{l.kleinsteWaarde(scale.levels.klein.min)}</dd>
        </div>
        <div>
          <dt>{l.xHoogte}</dt>
          <dd>{l.xWaarde(letters.kop.metrics.xHeight, letters.tekst.metrics.xHeight)}</dd>
        </div>
      </dl>

      <h3 className="paneel-kop">{l.delen}</h3>
      <Delen font={letters.kop} rol={strings.kast.rollen.kop} />
      {letters.tekst.id !== letters.kop.id && <Delen font={letters.tekst} rol={strings.kast.rollen.tekst} />}

      <h3 className="paneel-kop">{l.drukker}</h3>
      <ul className="opmerkingen">
        {list.map((r) => (
          <li key={`${r.id}-${r.params.rol ?? ''}`} className="opmerking" data-toon={r.tone}>
            <p>{store.words(r)}</p>
            {r.fix && (
              <button type="button" className="inked klein" onClick={() => store.fix(r)}>
                {oplossing(r.fix.id, r.fix.params, r.id)}
              </button>
            )}
          </li>
        ))}
      </ul>
      {list.every((r) => r.tone === 'lof') && <p className="hand">{l.niks}</p>}
    </div>
  )
}
