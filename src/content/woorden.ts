// Gewone woorden en waar ze in de kast naar wijzen: "ronde letter voor kinderen" is rond, speels en warm.
// Het eerste woord van elk rijtje is hoe de kast het teruggeeft ("op je woorden: rond · voor kinderen")

import type { Woord } from '../lib/type/zoek'

export const woorden: Woord[] = [
  { woorden: ['rond', 'bol', 'zacht'], eigenschappen: [{ soort: 'maat', maat: 'rond' }, { soort: 'bouw', bouw: 'geometrisch' }] },
  { woorden: ['voor kinderen', 'kinder', 'kind', 'kids', 'school'], eigenschappen: [{ soort: 'gevoel', gevoel: 'speels' }, { soort: 'gevoel', gevoel: 'warm' }, { soort: 'maat', maat: 'rond' }, { soort: 'maat', maat: 'groot-oog' }, { soort: 'laatje', kind: 'schreefloos' }] },
  { woorden: ['vriendelijk', 'lief', 'aardig', 'toegankelijk', 'gezellig'], eigenschappen: [{ soort: 'gevoel', gevoel: 'warm' }, { soort: 'maat', maat: 'rond' }, { soort: 'laatje', kind: 'schreefloos' }] },
  { woorden: ['chic', 'elegant', 'sierlijk', 'luxe', 'deftig', 'mode', 'verfijnd'], eigenschappen: [{ soort: 'gevoel', gevoel: 'statig' }, { soort: 'schreef', schreef: 'haarlijn' }, { soort: 'maat', maat: 'contrast' }] },
  { woorden: ['stoer', 'krachtig', 'zwaar', 'robuust', 'vet', 'luid'], eigenschappen: [{ soort: 'laatje', kind: 'display' }, { soort: 'bouw', bouw: 'grotesk' }, { soort: 'maat', maat: 'breed' }] },
  { woorden: ['smal', 'compact', 'condensed', 'hoog'], eigenschappen: [{ soort: 'maat', maat: 'smal' }] },
  { woorden: ['breed', 'ruim', 'wijd'], eigenschappen: [{ soort: 'maat', maat: 'breed' }] },
  { woorden: ['zakelijk', 'professioneel', 'neutraal', 'corporate', 'strak', 'nuchter', 'bedrijf'], eigenschappen: [{ soort: 'gevoel', gevoel: 'modern' }, { soort: 'bouw', bouw: 'grotesk' }, { soort: 'laatje', kind: 'schreefloos' }] },
  { woorden: ['klassiek', 'traditioneel', 'ouderwets', 'tijdloos', 'boekachtig'], eigenschappen: [{ soort: 'gevoel', gevoel: 'klassiek' }, { soort: 'schreef', schreef: 'wig' }] },
  { woorden: ['modern', 'fris', 'hedendaags', 'clean'], eigenschappen: [{ soort: 'gevoel', gevoel: 'modern' }] },
  { woorden: ['technisch', 'code', 'tech', 'programmeren', 'data'], eigenschappen: [{ soort: 'gevoel', gevoel: 'technisch' }, { soort: 'laatje', kind: 'mono' }] },
  { woorden: ['speels', 'vrolijk', 'grappig', 'gek', 'fun'], eigenschappen: [{ soort: 'gevoel', gevoel: 'speels' }] },
  { woorden: ['warm', 'menselijk', 'ambachtelijk'], eigenschappen: [{ soort: 'gevoel', gevoel: 'warm' }] },
  { woorden: ['serieus', 'statig', 'formeel', 'plechtig', 'gezag'], eigenschappen: [{ soort: 'gevoel', gevoel: 'statig' }, { soort: 'gevoel', gevoel: 'klassiek' }] },
  { woorden: ['handgeschreven', 'hand', 'script', 'pen', 'kwast'], eigenschappen: [{ soort: 'laatje', kind: 'handschrift' }] },
  { woorden: ['leesbaar', 'duidelijk', 'helder', 'slechtziend'], eigenschappen: [{ soort: 'maat', maat: 'groot-oog' }, { soort: 'maat', maat: 'breed' }] },
  { woorden: ['retro', 'vintage', 'western'], eigenschappen: [{ soort: 'schreef', schreef: 'slab' }, { soort: 'gevoel', gevoel: 'speels' }] },
  { woorden: ['typemachine', 'schrijfmachine'], eigenschappen: [{ soort: 'laatje', kind: 'mono' }, { soort: 'schreef', schreef: 'slab' }] },
  { woorden: ['geometrisch', 'cirkel'], eigenschappen: [{ soort: 'bouw', bouw: 'geometrisch' }] },
  { woorden: ['schreef', 'serif'], eigenschappen: [{ soort: 'laatje', kind: 'schreef' }] },
  { woorden: ['schreefloos', 'sans'], eigenschappen: [{ soort: 'laatje', kind: 'schreefloos' }] },
]
