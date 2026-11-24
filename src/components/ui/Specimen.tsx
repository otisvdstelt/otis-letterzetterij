import type { Specimen as Shape } from '../../lib/type/metrics'

/** "Aa" in de letter zelf, als pad. Zo laat de kast voorbeelden zien zonder 144 fonts te laden */
export function Specimen({ shape }: { shape: Shape | undefined }) {
  if (!shape || !shape.d) return <svg className="specimen" viewBox="0 0 10 10" aria-hidden="true" />
  return (
    <svg className="specimen" viewBox={`0 ${-shape.ascent} ${Math.max(1, shape.width)} ${shape.ascent + shape.descent}`} aria-hidden="true" preserveAspectRatio="xMinYMid meet">
      <path d={shape.d} fill="currentColor" />
    </svg>
  )
}
