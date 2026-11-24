import { oplossing } from '../../content/strings'
import type { RemarkId } from '../../lib/type/printer'
import type { Role } from '../../lib/type/zetsel'
import { currentRemarks, store, useLetters } from '../../lib/store'

/**
 * Een stempeltje direct bij het ding dat je aan het veranderen bent: wat de drukker ervan vindt, met de oplossing.
 * Het blijft komen zolang het nodig is, ook na een eerdere oplossing en na bijstellen
 */
export function Stempel({ ids, role }: { ids: readonly RemarkId[]; role?: Role }) {
  const list = useLetters(currentRemarks)
  const remark = list.find((r) => ids.includes(r.id) && (!role || !r.params.rol || r.params.rol === role))
  if (!remark || remark.tone === 'lof') return null
  return (
    <div className="stempel" data-toon={remark.tone}>
      <p className="stempel-woorden">{store.words(remark)}</p>
      {remark.fix && (
        <button type="button" className="inked klein" onClick={() => store.fix(remark)}>
          {oplossing(remark.fix.id, remark.fix.params, remark.id)}
        </button>
      )}
    </div>
  )
}
