// "Ik zoek iets als…": bekende letters, vaak betaald, en hun gratis broertjes in de kast.
// Een broertje is geen kopie: het lijkt in bouw en in gevoel, en het is vrij te gebruiken

import type { Alternatief } from '../lib/type/zoek'

export const alternatieven: Alternatief[] = [
  { naam: 'Helvetica', ook: ['Helvetica Neue', 'Arial'], ids: ['inter', 'public-sans', 'roboto'] },
  { naam: 'Futura', ids: ['jost', 'outfit', 'poppins'] },
  { naam: 'Gotham', ids: ['montserrat', 'outfit', 'mona-sans'] },
  { naam: 'Proxima Nova', ids: ['figtree', 'plus-jakarta-sans', 'nunito-sans'] },
  { naam: 'Circular', ook: ['Circular Std'], ids: ['plus-jakarta-sans', 'dm-sans', 'outfit'] },
  { naam: 'Avenir', ids: ['nunito-sans', 'figtree', 'mulish'] },
  { naam: 'Gill Sans', ids: ['lato', 'fira-sans', 'josefin-sans'] },
  { naam: 'Frutiger', ook: ['Myriad'], ids: ['source-sans-3', 'fira-sans', 'atkinson-hyperlegible-next'] },
  { naam: 'Akzidenz-Grotesk', ook: ['Akzidenz'], ids: ['schibsted-grotesk', 'hanken-grotesk', 'inter'] },
  { naam: 'DIN', ids: ['barlow', 'red-hat-text', 'archivo'] },
  { naam: 'SF Pro', ook: ['San Francisco'], ids: ['inter', 'onest', 'be-vietnam-pro'] },
  { naam: 'Garamond', ook: ['Adobe Garamond', 'Sabon'], ids: ['eb-garamond', 'cormorant-garamond', 'crimson-pro'] },
  { naam: 'Didot', ids: ['bodoni-moda', 'libre-bodoni', 'playfair-display'] },
  { naam: 'Bodoni', ids: ['bodoni-moda', 'libre-bodoni', 'dm-serif-display'] },
  { naam: 'Baskerville', ids: ['libre-baskerville', 'cardo', 'source-serif-4'] },
  { naam: 'Caslon', ids: ['libre-caslon-text', 'eb-garamond', 'crimson-pro'] },
  { naam: 'Times', ook: ['Times New Roman'], ids: ['source-serif-4', 'pt-serif', 'noticia-text'] },
  { naam: 'Georgia', ids: ['gelasio', 'merriweather', 'pt-serif'] },
  { naam: 'Tiempos', ids: ['newsreader', 'source-serif-4', 'literata'] },
  { naam: 'Freight', ook: ['Freight Text'], ids: ['fraunces', 'lora', 'literata'] },
  { naam: 'Rockwell', ids: ['roboto-slab', 'arvo', 'zilla-slab'] },
  { naam: 'Cooper', ook: ['Cooper Black'], ids: ['young-serif', 'shrikhand', 'fraunces'] },
  { naam: 'Courier', ook: ['Courier New'], ids: ['courier-prime', 'ibm-plex-mono', 'space-mono'] },
  { naam: 'Menlo', ook: ['Monaco', 'SF Mono'], ids: ['jetbrains-mono', 'fira-code', 'geist-mono'] },
]
