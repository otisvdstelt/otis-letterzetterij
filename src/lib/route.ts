// Een gedeelde link wordt één keer gelezen, voordat de pagina getekend wordt.
// Een vel opent met een welkom; een waslijn bekijk je eerst; een kapotte link zegt dat netjes

import { store } from './store'
import { decodeVel, decodeWaslijn, readRoute } from './type/share'

/** Het laatste vel dat deze tab zelf in het adres zette. Een verversing daarvan is geen gedeelde link */
const OWN_KEY = 'letterzetterij-eigen'

export function readOwn(): string | null {
  try {
    return window.sessionStorage.getItem(OWN_KEY)
  } catch {
    return null
  }
}

export function keepOwn(code: string) {
  try {
    window.sessionStorage.setItem(OWN_KEY, code)
  } catch {
    // Dan krijg je na verversen een welkom. Niet erg
  }
}

/** Lees het adres. Geeft true als er een link was die niet te lezen is */
export function readSharedLink(): boolean {
  const route = readRoute(window.location.pathname, window.location.hash)
  const home = () => window.history.replaceState(null, '', `/${window.location.search}`)
  if (route.kind === 'vel') {
    const decoded = decodeVel(route.code)
    if (!decoded) {
      home()
      return true
    }
    if (readOwn() === route.code) store.continueFrom(decoded.zetsel)
    else store.openShared(decoded.zetsel, decoded.replaced)
    return false
  }
  if (route.kind === 'waslijn') {
    const sheets = decodeWaslijn(route.code)
    // Een gedeelde waslijn laat het adres los: je bekijkt hem, en dan is het weer jouw drukkerij
    home()
    if (!sheets) return true
    store.visit(sheets.map((s) => s.zetsel))
  }
  return false
}
