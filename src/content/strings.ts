// Alle woorden van de drukkerij op één plek, ook die van de drukker, zodat er later Engels naast kan.
// In src/lib/type staan geen woorden: de kern geeft codes terug, en hier krijgen ze hun zin

const GETALLEN = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf']
/** Een getal in woorden tot twaalf, daarna in cijfers */
export const inWoorden = (n: number) => GETALLEN[n] ?? String(n)

export const strings = {
  titel: 'Letterzetterij',
  ondertitel: 'Trek een laatje open, zet je eigen zin en haal de pers over.',
  maker: 'Otis van der Stelt',
  portfolio: 'otisstelt.vercel.app',
  laden: {
    bezig: 'De inkt wordt uitgerold',
    klaar: 'De pers staat klaar',
  },
  uur: {
    label: 'Licht in de drukkerij',
    dag: 'dag',
    nacht: 'nacht',
  },
  titelkaart: {
    zin: 'Een oude drukkerij met een houten letterkast. Je kiest een letter voor de kop en een voor de tekst, zet je eigen zin en trekt de pers over. Wat eruit komt, kun je meenemen.',
    binnenkort: 'De pers wordt nog in elkaar gezet.',
  },
}
