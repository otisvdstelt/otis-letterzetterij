import { describe, expect, it } from 'vitest'
import { fromBase64Url, toBase64Url } from './bytes'
import { decodeVel, decodeWaslijn, encodeVel, encodeWaslijn, readRoute } from './share'
import { MAX_ZIN, startZetsel, toggleMood, withGoal, withStyle, type Zetsel } from './zetsel'

function rich(): Zetsel {
  let z = withGoal(startZetsel('IJs en weder dienende, de pers gaat om acht uur aan.', 'fraunces', 'inter'), 'affiche')
  z = toggleMood(toggleMood(z, 'warm'), 'speels')
  z = withStyle(z, 'kop', { weight: 720, italic: true, tracking: -0.02, axes: { opsz: 72 } })
  return { ...z, tabelcijfers: true, klem: 'tekst', inkt: '#0c2600', papier: '#eff4da', tweedeInkt: '#a6662e' }
}

describe('een vel als link', () => {
  it('codeert en decodeert zonder verlies', () => {
    for (const z of [startZetsel('Kort'), rich(), { ...rich(), tweedeInkt: null, uitlijning: 'uitvullen' as const, mooiAfbreken: true, stemming: [] }]) {
      expect(decodeVel(encodeVel(z))).toEqual({ zetsel: z, replaced: {} })
    }
  })

  it('houdt de volgorde van de stemmingen', () => {
    const z = toggleMood(toggleMood(startZetsel('x'), 'statig'), 'klassiek')
    expect(decodeVel(encodeVel(z))!.zetsel.stemming).toEqual(['statig', 'klassiek'])
  })

  it('neemt een zin van 280 tekens mee, ook met emoji en accenten', () => {
    const zin = 'Één IJsselmeer, café en 🖋 '.repeat(20)
    const z = { ...startZetsel('x'), zin }
    const decoded = decodeVel(encodeVel(z))!.zetsel.zin
    expect([...decoded]).toHaveLength(MAX_ZIN)
    expect(decoded.startsWith('Één IJsselmeer, café en 🖋')).toBe(true)
  })

  it('houdt een gewoon vel kort genoeg voor een bericht', () => {
    expect(encodeVel(startZetsel('Het vel kwam warm uit de pers')).length).toBeLessThan(140)
  })

  it('stuurt een eigen font niet mee, maar noemt zijn naam en een vervanger', () => {
    const z = { ...startZetsel('x'), kop: 'eigen:Mijn Merkletter' }
    const decoded = decodeVel(encodeVel(z, () => 'libre-baskerville'))!
    expect(decoded.zetsel.kop).toBe('libre-baskerville')
    expect(decoded.replaced).toEqual({ kop: 'Mijn Merkletter' })
    expect(encodeVel(z, () => 'libre-baskerville')).not.toContain('eigen')
  })

  it('noemt een magazijnletter bij zijn naam, met een vervanger', () => {
    const z = { ...startZetsel('x'), kop: 'magazijn:abril-fatface' }
    const decoded = decodeVel(encodeVel(z, () => 'playfair-display', () => 'Abril Fatface'))!
    expect(decoded.zetsel.kop).toBe('playfair-display')
    expect(decoded.replaced).toEqual({ kop: 'Abril Fatface' })
  })

  it('leest versie 1 nog, zoals hij op 24 november 2026 gedeeld werd', () => {
    // Deze code is bevroren. Verandert het formaat, dan moet deze test blijven slagen
    const v1 = 'AQAIZnJhdW5jZXMABWludGVyAgIEAgIC0AUBJwFvcHN6oAuQAwAAALQBkQHADCoABQwmAO_02qZmLjRJSnMgZW4gd2VkZXIgZGllbmVuZGUsIGRlIHBlcnMgZ2FhdCBvbSBhY2h0IHV1ciBhYW4u'
    const decoded = decodeVel(v1)
    expect(decoded).not.toBeNull()
    expect(decoded!.zetsel).toEqual(rich())
  })

  it('neemt jouw tekst mee zonder verlies: naam, alinea met regels, knop en menu', () => {
    const z = { ...startZetsel('Kop'), eigen: { naam: 'Bakkerij De Korst', alinea: 'Regel één.\n\nRegel twee, met een é.', knop: 'Bestel', menu: 'Brood, Gebak' } }
    expect(decodeVel(encodeVel(z))!.zetsel).toEqual(z)
  })

  it('leest versie 2 nog, zoals hij op 25 november 2026 gedeeld werd', () => {
    // Deze code is bevroren. Verandert het formaat, dan moet deze test blijven slagen
    const v2 =
      'AgALeW91bmctc2VyaWYAB2ZpZ3RyZWUEAAQA2AQAAACQAwAAAKoBoAHiCUIABCwoI_z6849FJh5Ccm9vZCBtZXQgZWVuIGtvcnN0IGRpZSBrcmFha3QRQmFra2VyaWogRGUgS29yc3RmRWxrZSBvY2h0ZW5kIG9tIHZpamYgdXVyIGdhYXQgZGUgb3ZlbiBhYW4uCgpadXVyZGVzZW0sIHNwZWx0IGVuIGVlbiByb2dnZSBkaWUgamUgbmVyZ2VucyBhbmRlcnMgdmluZHQuEkJlc3RlbCB2b29yIG1vcmdlbhZCcm9vZCwgR2ViYWssIE92ZXIgb25z'
    const decoded = decodeVel(v2)!.zetsel
    expect(decoded).toMatchObject({ kop: 'young-serif', tekst: 'figtree', doel: 'huisstijl', zin: 'Brood met een korst die kraakt' })
    expect(decoded.eigen).toEqual({ naam: 'Bakkerij De Korst', alinea: 'Elke ochtend om vijf uur gaat de oven aan.\n\nZuurdesem, spelt en een rogge die je nergens anders vindt.', knop: 'Bestel voor morgen', menu: 'Brood, Gebak, Over ons' })
  })

  it('geeft null bij rommel en bij een versie die het niet kent', () => {
    expect(decodeVel('')).toBeNull()
    expect(decodeVel('!!!')).toBeNull()
    expect(decodeVel('AQ')).toBeNull()
    const good = encodeVel(rich())
    expect(decodeVel(good.slice(0, good.length - 8))).toBeNull()
    const bytes = fromBase64Url(good)
    bytes[0] = 9
    expect(decodeVel(toBase64Url(bytes))).toBeNull()
    expect(decodeVel(`${good}AA`)).toBeNull()
  })

  it('maakt van een vreemde waarde een geldig zetsel', () => {
    const odd = { ...startZetsel('x'), maat: 13.2, interlinie: 1.234 }
    expect(decodeVel(encodeVel(odd))!.zetsel.interlinie).toBe(1.23)
  })
})

describe('een waslijn als link', () => {
  it('codeert en decodeert zonder verlies', () => {
    const sheets = [startZetsel('Een'), rich(), withGoal(startZetsel('Drie'), 'boek')]
    expect(decodeWaslijn(encodeWaslijn(sheets))!.map((s) => s.zetsel)).toEqual(sheets)
    expect(decodeWaslijn(encodeWaslijn([]))).toEqual([])
  })

  it('weigert rommel en een vel als waslijn', () => {
    expect(decodeWaslijn('zzzz')).toBeNull()
    expect(decodeWaslijn(encodeVel(rich()))).toBeNull()
  })
})

describe('readRoute', () => {
  it('leest het pad en de hash', () => {
    expect(readRoute('/vel/AQXz8')).toEqual({ kind: 'vel', code: 'AQXz8' })
    expect(readRoute('/waslijn/AQ-_x/')).toEqual({ kind: 'waslijn', code: 'AQ-_x' })
    expect(readRoute('/', '#/vel/abc')).toEqual({ kind: 'vel', code: 'abc' })
    expect(readRoute('/')).toEqual({ kind: 'drukkerij' })
    expect(readRoute('/vel/')).toEqual({ kind: 'drukkerij' })
    expect(readRoute('/fles/abc')).toEqual({ kind: 'drukkerij' })
  })
})
