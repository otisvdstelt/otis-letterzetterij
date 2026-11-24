import { PaperFilters } from './components/ui/Chrome'
import { Inktrol } from './components/ui/Inktrol'
import { strings } from './content/strings'

/** Voorlopig een titelkaart: het vel ligt klaar, de pers komt eraan */
export default function App() {
  return (
    <>
      <PaperFilters />
      <main className="titelkaart">
        <div className="paper titelkaart-vel">
          <h1 className="woordmerk">{strings.titel}</h1>
          <p className="titelkaart-zin">{strings.titelkaart.zin}</p>
          <p className="hand">{strings.titelkaart.binnenkort}</p>
        </div>
      </main>
      <Inktrol />
    </>
  )
}
