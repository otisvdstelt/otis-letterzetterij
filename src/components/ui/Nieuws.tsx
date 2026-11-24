import { useLetters } from '../../lib/store'

/** Wat er net gebeurde, hardop voor wie de pagina hoort in plaats van ziet */
export function Nieuws() {
  const news = useLetters((s) => s.news)
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {/* Een onzichtbaar verschil, zodat hetzelfde bericht twee keer na elkaar ook twee keer wordt voorgelezen */}
      {news ? `${news.text}${Math.round(news.at) % 2 ? '​' : ''}` : ''}
    </p>
  )
}
