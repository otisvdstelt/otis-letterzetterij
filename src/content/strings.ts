// Alle woorden van de drukkerij op één plek, ook die van de drukker, zodat er later Engels naast kan.
// In src/lib/type staan geen woorden: de kern geeft codes terug, en hier krijgen ze hun zin

import type { Drawer, Mood } from '../lib/type/catalogue'
import type { Level } from '../lib/type/contrast'
import type { Goal, Template } from '../lib/type/goals'
import type { Note } from '../lib/type/pairing'
import type { FixId, Params, RemarkId } from '../lib/type/printer'
import type { Align, Role } from '../lib/type/zetsel'

const GETALLEN = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf']
/** Een getal in woorden tot twaalf, daarna in cijfers */
export const inWoorden = (n: number) => GETALLEN[n] ?? String(n)
/** Een getal met een komma, zoals we het schrijven */
export const komma = (n: number, digits = 2) => n.toLocaleString('nl-NL', { maximumFractionDigits: digits })
const hoofdletter = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const ROLNAAM: Record<Role, string> = { kop: 'kop', tekst: 'tekst' }

const DOELEN: Record<Goal, { naam: string; uitleg: string; lidwoord: string }> = {
  website: { naam: 'website', uitleg: 'kop en broodtekst voor een scherm', lidwoord: 'een website' },
  boek: { naam: 'boek of lange tekst', uitleg: 'een rustige broodtekst, met cursief', lidwoord: 'een boek' },
  affiche: { naam: 'affiche', uitleg: 'groot, weinig tekst, display mag', lidwoord: 'een affiche' },
  presentatie: { naam: 'presentatie', uitleg: 'groot, veel contrast, niks dun', lidwoord: 'een presentatie' },
  huisstijl: { naam: 'huisstijl', uitleg: 'woordmerk, kop en tekst, veel gewichten', lidwoord: 'een huisstijl' },
  app: { naam: 'app', uitleg: 'duidelijke tekens en tabelcijfers', lidwoord: 'een app' },
}

/** Wat de drukker zegt. Elke opmerking 2 tot 4 varianten; welke het wordt, hangt af van het zetsel, niet van toeval */
const OPMERKINGEN: Record<RemarkId, (p: Params) => string[]> = {
  'twee-schreef': () => ['Twee schreefletters? Gewaagd.', 'Schreef op schreef. Het kan, als ze elkaar niet nadoen.', 'Twee schreven naast elkaar. Durf je het aan?'],
  'te-gelijk': () => ['Die twee lijken te veel op elkaar. Nu zie je niet wat de kop is.', 'Dat is geen paar, dat is een tweeling.', 'Ik zie het verschil niet, en je lezer ook niet.'],
  'twee-display': () => ['Twee display-letters? Dan schreeuwen ze allebei en hoort niemand iets.', 'Twee hoofdrolspelers en geen figurant. Dat wordt niks.'],
  'tekst-display': (p) => [`${p.naam ?? 'Deze letter'} is voor koppen. Een hele alinea erin en je lezer is op.`, 'Een display-letter als broodtekst? Na drie regels ben je moe.'],
  'tekst-handschrift': () => ['Een handschrift als broodtekst? Na één alinea leest niemand meer.', 'Mooi voor een kaartje, niet voor een hele bladzijde.', 'Handschrift is om naar te kijken. Lezen doe je in iets anders.'],
  'tekst-mono': () => ['Een monoletter als broodtekst leest als een typemachine die haast heeft.', 'Mono is voor code en tabellen. Voor lopende tekst is hij te stijf.'],
  'x-hoogte': (p) => [`De x-hoogtes schelen ${p.procent}%. Naast elkaar zie je dat meteen.`, `De kleine letters van kop en tekst verschillen ${p.procent}% in hoogte. Dat valt op.`],
  'familie-dun': () => ['Eén familie met maar één gewicht. Dan lijken kop en tekst precies op elkaar.', 'Dezelfde letter, hetzelfde gewicht. Waar is de kop?'],
  'regel-lang': (p) => [`${p.tekens} tekens per regel. Je oog raakt de weg kwijt op de terugweg.`, `Na ${p.tekens} tekens weet niemand meer waar de volgende regel begint.`],
  'regel-kort': (p) => [`${p.tekens} tekens per regel. Dat hakt de tekst in stukjes.`, 'Zulke korte regels lezen schokkerig. Geef ze wat ruimte.'],
  'te-klein': (p) => [`Broodtekst op ${komma(Number(p.px), 1)}px? Dan zet iedereen zijn leesbril op.`, `${komma(Number(p.px), 1)}px is te klein om lang te lezen.`],
  'interlinie-krap': (p) => ['De regels staan op elkaars tenen.', `Interlinie ${komma(Number(p.waarde))}: te krap, de stokken raken elkaar bijna.`],
  'interlinie-ruim': () => ['Zoveel wit tussen de regels dat het losse regels worden.', 'De regels zijn elkaar kwijt. Iets dichter bij elkaar.'],
  weduwe: () => ['Daar staat één woord alleen op de laatste regel. Een weduwe, zeggen wij.', 'Een eenzaam woord onderaan. Dat lossen we op.'],
  uitvullen: () => ['Uitvullen op een scherm geeft rivieren van wit.', 'Uitgevuld zonder een zetter die afbreekt? Dan krijg je gaten.'],
  'nep-vet': (p) => [`${p.naam} heeft geen ${p.gewicht}. De browser verzint dan een gewicht, en dat zie je.`, `Gewicht ${p.gewicht} bestaat niet in ${p.naam}. Nagemaakt vet ziet er smoezelig uit.`],
  'nep-cursief': (p) => [`${p.naam} heeft geen cursief. De browser trekt hem dan scheef, en dat is geen cursief.`, `Een scheefgetrokken ${p.naam} is geen cursief. Een echte heeft hij niet.`],
  'geen-vet': (p) => [`${p.naam} heeft geen vet. Elk vet woord wordt dan nagemaakt.`, `Geen vet in ${p.naam}. De browser gaat dat verzinnen, en dat zie je.`],
  'geen-cursief': (p) => [`${p.naam} heeft geen cursief. Een citaat of een boektitel wordt dan scheefgetrokken.`, `Geen cursief in ${p.naam}. De browser gaat er een verzinnen.`],
  'doel-handschrift': (p) =>
    p.doel === 'boek'
      ? ['Een handschrift voor een boek? Dan leest niemand verder dan bladzijde twee.', 'Een boek met een handschrift als kop. Leuk op de kaft, niet erin.']
      : [`Een handschrift in ${DOELEN[p.doel as Goal]?.lidwoord ?? 'dit'}? Dat leest niemand in één oogopslag.`, 'Handschrift is te traag voor wat hier moet gebeuren.'],
  'doel-display': () => ['Een display-letter in een app? Dan schreeuwt elke knop.', 'In een app wil je rust. Deze kop maakt lawaai.'],
  'doel-tekens': (p) => [`In ${p.naam} lijken I, l en 1 of O en 0 op elkaar. In een app is dat een wachtwoord dat niet werkt.`, 'Il1 en O0 moeten in een app uit elkaar te houden zijn. Hier niet.'],
  'doel-cijfers': () => ['Een app vol getallen wil tabelcijfers. Anders dansen de kolommen.', 'Zonder tabelcijfers staan je bedragen scheef onder elkaar.'],
  'doel-schaal': (p) => [`Een affiche met een schaal van ${komma(Number(p.ratio), 3)}? Daar mag veel meer verschil in.`, 'Een affiche moet van de overkant van de straat te lezen zijn. Grotere stappen.'],
  'doel-haarlijnen': () => ['Die haarlijnen verdwijnen op een beamer.', 'Zoveel contrast in de stokken. Op een scherm achterin de zaal blijft er weinig van over.'],
  'doel-dun': (p) => [`Gewicht ${p.gewicht} op een dia? Van achterin de zaal zie je daar niks van.`, 'Dunne letters en een beamer. Dat wordt grijs op grijs.'],
  ij: () => ['IJsselmeer met een losse I en J? Dat doen we hier niet.', 'In het Nederlands is IJ één letter. Allebei een hoofdletter dus.'],
  'inkt-zwak': (p) => [`${ratio(Number(p.ratio))} is te zwak. Deze inkt verdwijnt in het papier.`, `Inkt en papier lijken te veel op elkaar: ${ratio(Number(p.ratio))}.`],
  'tweede-inkt-zwak': (p) => [`De tweede inkt haalt maar ${ratio(Number(p.ratio))} op dit papier. Te zwak voor de koppen.`, 'De tweede inkt verdwijnt in het papier. Dan zie je de koppen niet.'],
  'inkt-presentatie': (p) => [`${ratio(Number(p.ratio))} is genoeg voor een scherm, maar een beamer vreet contrast. Geef hem 7:1.`, 'Voor een zaal mag de inkt nog donkerder.'],
  'lof-paar': (p) =>
    p.waarom === 'familie-veilig'
      ? ['Eén familie, twee gewichten. Daar kan niks aan misgaan.', 'Familie onder elkaar. Rustig, en het klopt.']
      : p.waarom === 'genoeg-verschil'
        ? ['Twee van dezelfde soort, maar met genoeg verschil. Netjes.', 'Dezelfde soort, toch elk een eigen stem. Mooi zo.']
        : p.waarom === 'valt-op'
          ? ['Die twee verschillen flink, en dat mag gezien worden.', 'Een kop met karakter boven een tekst die zijn werk doet.']
          : ['Schreef boven schreefloos. Het oudste recept, en het werkt nog steeds.', 'Een schreef en een schreefloze. Die kennen elkaar al eeuwen.'],
  'lof-klaar': () => ['Dit kan zo de pers op.', 'Niks op aan te merken. Dat zeg ik niet vaak.', 'Goed gezet. Trek maar over.'],
}

/** De knop bij een oplossing. Soms zegt de opmerking het net anders */
const OPLOSSINGEN: Record<FixId, (p: Params) => string> = {
  'wissel-kop': (p) => `Wissel de kop voor ${p.naam}`,
  'wissel-tekst': (p) => `Wissel de tekst voor ${p.naam}`,
  'als-kop': (p) => `Zet ${p.naam} als kop, met ${p.partner} eronder`,
  'zet-regel': (p) => `Zet de regel op ${p.tekens} tekens`,
  'zet-maat': (p) => `Zet de broodtekst op ${komma(Number(p.px), 1)}px`,
  'zet-interlinie': (p) => `Zet de interlinie op ${komma(Number(p.waarde))}`,
  'mooi-afbreken': () => 'Laat de browser mooi afbreken',
  'links-uitlijnen': () => 'Lijn links uit',
  'echt-gewicht': (p) => `Neem gewicht ${p.gewicht}`,
  'cursief-uit': () => 'Zet de cursief uit',
  zwaarder: () => 'Maak het zwaarder',
  'tabelcijfers-aan': () => 'Zet de tabelcijfers aan',
  'zet-schaal': (p) => `Zet de schaal op ${komma(Number(p.ratio), 3)}`,
  'ij-hoofdletter': () => 'Maak er IJ van',
  'betere-inkt': (p) => `Neem inkt ${p.hex}, die leest wel`,
  'betere-tweede-inkt': (p) => `Neem ${p.hex} als tweede inkt`,
}

/** Waarom de drukker een paar voorstelt, als het niet uit het zetboek komt */
const NOTITIES: Record<Note, string> = {
  'schreef-schreefloos': 'Schreef boven schreefloos, het oudste recept.',
  'twee-schreef': 'Twee schreefletters, maar wel heel verschillend.',
  'genoeg-verschil': 'Dezelfde soort, maar met genoeg verschil.',
  'te-gelijk': 'Ze lijken op elkaar.',
  'twee-display': 'Twee display-letters.',
  'tekst-display': 'Een display-letter als tekst.',
  'tekst-handschrift': 'Een handschrift als tekst.',
  'tekst-mono': 'Een monoletter als tekst.',
  'x-gelijk': 'De x-hoogtes liggen dicht bij elkaar.',
  'x-anders': 'De x-hoogtes verschillen.',
  'familie-veilig': 'Eén familie in twee gewichten. Dat gaat nooit mis.',
  'familie-dun': 'Eén familie met weinig gewichten.',
  'valt-op': 'Ze verschillen genoeg om de kop te laten opvallen.',
  'leest-rustig': 'De tekst leest lang zonder dat je moe wordt.',
  'leest-zwaar': 'De tekst leest wat zwaar.',
  'display-past': 'Een display-letter, zoals een affiche wil.',
  'display-liever-niet': 'Een display-letter als kop.',
  'geen-cursief': 'Geen cursief in de tekst.',
  'handschrift-te-veel': 'Een handschrift als kop.',
  'interface-goed': 'Duidelijke tekens en tabelcijfers, zoals een app wil.',
  'interface-tekens': 'Sommige tekens lijken op elkaar.',
  'interface-cijfers': 'Geen tabelcijfers.',
  'interface-schreef': 'Een schreefletter in een interface.',
  'veel-gewichten': 'Gewichten genoeg voor een hele huisstijl.',
  'weinig-gewichten': 'Weinig gewichten.',
  haarlijnen: 'Dunne haarlijnen.',
}

const ratio = (r: number) => `${(Math.floor(r * 10) / 10).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}:1`

export const strings = {
  titel: 'Letterzetterij',
  ondertitel: 'Trek een laatje open, zet je eigen zin en haal de pers over.',
  maker: 'Otis van der Stelt',
  portfolio: 'otisstelt.vercel.app',
  /** De eerste zin op het vel, voordat je zelf iets zet */
  beginzin: 'Het vel kwam warm uit de pers',
  laden: {
    bezig: 'De inkt wordt uitgerold',
    klaar: 'De pers staat klaar',
    kastMislukt: 'De letterkast kwam niet binnen. Ververs de pagina en probeer het nog eens.',
  },
  uur: {
    label: 'Licht in de drukkerij',
    dag: 'dag',
    nacht: 'nacht',
  },
  geluid: {
    label: 'Geluid',
    uit: 'stil',
    aan: 'geluid',
  },
  drukkerStil: {
    label: 'De drukker',
    praat: 'drukker praat',
    stil: 'zwijgt',
  },

  // ------------------------------------------------------------------ de werkbank
  werkbank: {
    kop: 'Op de werkbank',
    uitleg: 'Drie dingen, in elke volgorde. De drukker kijkt mee.',
    letterKop: 'Jouw letter',
    letterUitleg: 'Staat er al een letter vast, zoals je merkletter? Pak hem uit de kast en zet er een klem op.',
    geenKlem: 'Nog niks vastgezet.',
    klemOp: (naam: string, rol: Role) => `${naam} zit vast als ${ROLNAAM[rol]}.`,
    klemEraf: 'klem eraf',
    zetKlem: (rol: Role) => `Klem op de ${ROLNAAM[rol]}`,
    doelKop: 'Waar is het voor?',
    stemmingKop: 'Hoe moet het voelen?',
    stemmingUitleg: 'Eén of twee. De drukker ordent ermee, maar het verplicht niks.',
  },
  doelen: DOELEN,
  stemmingen: { klassiek: 'klassiek', modern: 'modern', speels: 'speels', technisch: 'technisch', warm: 'warm', statig: 'statig' } satisfies Record<Mood, string>,

  voorstel: {
    kop: 'Het voorstel van de drukker',
    uitlegVrij: (doel: Goal) => `Drie paren voor ${DOELEN[doel].lidwoord}.`,
    uitlegKlem: (naam: string, rol: Role) => `Drie partners bij ${naam}, die als ${ROLNAAM[rol]} vastzit.`,
    zetboek: 'uit het zetboek',
    pak: (kop: string, tekst: string) => `Zet ${kop} met ${tekst}`,
    staatAl: 'staat al op het vel',
    verras: 'Drukker, verras me',
    verrasUitleg: 'Een paar uit de beste vijfentwintig. Alleen als je erom vraagt.',
    notitie: (n: Note) => NOTITIES[n],
    leeg: 'Niks dat past. Haal de klem eraf of kies een ander doel.',
  },

  // ------------------------------------------------------------------ een eigen font
  eigen: {
    kop: 'Of je eigen fontbestand',
    uitleg: 'Sleep een .woff2, .woff, .ttf of .otf hierheen, of kies er een.',
    belofte: 'Het blijft op je apparaat. Het wordt hier in je browser geladen en gaat nergens heen, ook niet in een deellink.',
    kies: 'Kies een fontbestand',
    loslaten: 'Laat maar los, op de werkbank',
    bezig: 'Het font wordt gemeten',
    fout: 'Dit kan ik niet lezen als font. Probeer een .woff2, .woff, .ttf of .otf.',
    teGroot: 'Dit bestand is groter dan 12 MB. Dat is geen letter meer, dat is een hele familie.',
    soort: (naam: string) => `Wat voor letter is ${naam}?`,
    soorten: { schreef: 'schreef', schreefloos: 'schreefloos', display: 'display', handschrift: 'handschrift', mono: 'mono' } as Record<string, string>,
  },

  // ------------------------------------------------------------------ het magazijn
  magazijn: {
    knop: (n: number) => `Het magazijn: nog ${n} letters`,
    knopKort: 'Het magazijn',
    uitleg: 'Het hele archief van Fontsource. Die letters staan niet hier, maar bij jsDelivr.',
    vraagKop: 'Naar het magazijn?',
    vraag: 'Dit haalt letters op bij jsDelivr. Daarbij gaat je IP-adres naar hen. Doorgaan?',
    sessie: 'Je antwoord geldt alleen zolang deze tab open is.',
    ja: 'Doorgaan',
    nee: 'Liever niet',
    zoek: 'Zoek in het magazijn',
    leeg: 'Niks gevonden.',
    meer: (n: number) => `en nog ${n}. Zoek wat preciezer.`,
    pak: (naam: string, rol: Role) => `${naam} ophalen, voor de ${ROLNAAM[rol]}`,
    halen: 'wordt opgehaald',
    mislukt: (naam: string) => `${naam} kwam niet uit het magazijn. Probeer het nog eens, of een andere.`,
    categorie: { serif: 'schreef', 'sans-serif': 'schreefloos', display: 'display', handwriting: 'handschrift', monospace: 'mono' } as Record<string, string>,
    sluit: 'dicht',
  },

  // ------------------------------------------------------------------ een flesje uit de Kleurenalchemist
  flesje: {
    kop: 'Een flesje uit de Kleurenalchemist',
    label: 'Plak een flesjes- of plankenlink',
    knop: 'Gebruik',
    kies: 'Welk flesje van deze plank?',
    pak: (naam: string) => `Pak ${naam}`,
    fouten: {
      'geen-link': 'Dat is geen flesjeslink. Hij ziet eruit als …/fles/… of …/plank/….',
      onleesbaar: 'Dit flesje kan ik niet lezen. Misschien is de link afgeknipt, of komt hij uit een nieuwere Kleurenalchemist dan ik ken.',
      leeg: 'Deze plank is leeg.',
    } as Record<string, string>,
    uitleg: 'Tekst wordt inkt, achtergrond wordt papier, accent wordt de tweede inkt.',
  },

  // ------------------------------------------------------------------ de kast
  kast: {
    kop: 'De letterkast',
    uitleg: 'Trek een laatje open. Een letter gaat naar de kop of naar de tekst, wat je hieronder kiest.',
    laatjes: { schreef: 'Schreef', schreefloos: 'Schreefloos', display: 'Display', handschrift: 'Handschrift', mono: 'Mono', huis: 'Huis' } satisfies Record<Drawer, string>,
    laatjeUitleg: {
      schreef: 'Met voetjes. Voor lang lezen en voor koppen met gezag.',
      schreefloos: 'Zonder voetjes. Helder op een scherm.',
      display: 'Voor koppen. Alleen groot gebruiken.',
      handschrift: 'Met de hand. Voor een woord of drie.',
      mono: 'Alle tekens even breed. Voor code en tabellen.',
      huis: 'Mijn eigen vier, uit mijn portfolio.',
    } satisfies Record<Drawer, string>,
    naar: 'Pak voor de',
    rollen: { kop: 'kop', tekst: 'tekst' } satisfies Record<Role, string>,
    zoek: 'Zoek een letter',
    zoekLeeg: 'Geen letter met die naam in de kast.',
    aantal: (n: number) => `${n} ${n === 1 ? 'letter' : 'letters'}`,
    pakLabel: (naam: string, rol: Role) => `${naam}, voor de ${ROLNAAM[rol]}`,
    inGebruik: (rol: Role) => `nu de ${ROLNAAM[rol]}`,
    variabel: 'variabel',
    cursief: 'cursief',
    licentie: (l: string) => `licentie ${l}`,
    specimenLaden: 'De voorbeelden komen eraan.',
  },

  // ------------------------------------------------------------------ de pers
  pers: {
    trek: 'Trek de pers over',
    trekKort: 'Trek over',
    hint: 'Sleep de hendel omlaag, of druk op Enter.',
    hendel: 'Hendel van de pers. Sleep omlaag of druk op Enter om te drukken.',
    gedrukt: 'Er ligt een vel klaar.',
    hang: 'Hang aan je waslijn',
    eerder: 'Eerder gedrukt',
    eerderUitleg: 'De laatste vijf vellen. Pak er een terug.',
    terugpakken: (kop: string, tekst: string) => `Pak het vel met ${kop} en ${tekst} terug`,
    ongedaan: 'Ongedaan maken',
    ongedaanKort: 'terug',
    tekeningLabel: 'Een handpers met een vel papier erop',
    uitzicht: 'Kijk naar',
    plekken: { kast: 'de kast', pers: 'de pers', waslijn: 'de waslijn' },
  },

  // ------------------------------------------------------------------ de winkelhaak
  winkelhaak: {
    kop: 'De winkelhaak',
    zin: 'Je eigen zin',
    zinUitleg: 'Hij komt als grote kop op het vel. Hooguit 280 tekens.',
    teller: (n: number, max: number) => `${n} van ${max}`,
    rol: 'Je zet de',
    sjabloon: 'Sjabloon',
    algemeen: 'Het hele vel',
    gewicht: 'Gewicht',
    cursief: 'Cursief',
    geenCursief: 'heeft geen cursief',
    spatiering: 'Spatiëring',
    maat: 'Korps',
    interlinie: 'Interlinie',
    regel: 'Regel',
    ratio: 'Schaal',
    uitlijning: 'Uitlijning',
    uitlijningen: { links: 'links', midden: 'midden', uitvullen: 'uitvullen' } satisfies Record<Align, string>,
    tabelcijfers: 'Tabelcijfers',
    geenTabelcijfers: 'deze tekst heeft ze niet',
    mooiAfbreken: 'Mooi afbreken',
    assen: 'Assen',
    asNamen: { wght: 'gewicht', wdth: 'breedte', opsz: 'optische maat', slnt: 'helling', ital: 'cursief', GRAD: 'gradatie', SOFT: 'zachtheid', WONK: 'eigenwijs', CASL: 'losheid', MONO: 'mono', CRSV: 'cursief', XTRA: 'teller', YOPQ: 'dunne stok' } as Record<string, string>,
    px: (n: number) => `${komma(n, 1)}px`,
    em: (n: number) => `${komma(n, 3)}em`,
    tekens: (n: number) => `${n} tekens`,
    wat: 'wat is dat?',
    /** Bij elk drukkerswoord een uitleg, met de muis of met een tik */
    uitleg: {
      winkelhaak: 'Het bakje waarin de zetter letter voor letter een regel zet. Hier zet jij je zin.',
      gewicht: 'Hoe dik de stokken zijn. 400 is gewoon, 700 is vet.',
      cursief: 'De schuine, geschreven variant van een letter. Een echte cursief is anders getekend, niet scheefgetrokken.',
      spatiering: 'Extra ruimte tussen de letters. Kapitalen willen er wat meer, grote koppen wat minder.',
      maat: 'De maat van de broodtekst. Drukkers zeggen korps. Op een scherm minstens 16px.',
      interlinie: 'De ruimte tussen de regels. Vroeger letterlijk een strip lood die de zetter tussen de regels legde.',
      regel: 'Hoeveel tekens er op een regel staan. Tussen 60 en 75 leest het fijnst.',
      ratio: 'Hoeveel groter elke kop is dan de vorige. Hoe groter het getal, hoe meer verschil.',
      uitlijning: 'Links lijnt de regels links uit en laat rechts los. Uitvullen maakt ze even lang, met gaten als er niet wordt afgebroken.',
      tabelcijfers: 'Cijfers die allemaal even breed zijn, zodat ze in een kolom recht onder elkaar staan.',
      mooiAfbreken: 'De browser schuift woorden zo dat er geen woord alleen op de laatste regel staat.',
      assen: 'Een variabele letter heeft knoppen. Gewicht, breedte, optische maat: alles traploos.',
      klem: 'Een letter die vaststaat. De drukker zoekt er een partner bij en wisselt hem nooit.',
      xhoogte: 'De hoogte van de kleine letters, zoals de x. Twee letters naast elkaar lezen het best als die dicht bij elkaar ligt.',
    },
  },

  // ------------------------------------------------------------------ inkt en papier
  inkt: {
    kop: 'Inkt en papier',
    inkt: 'Inkt',
    papier: 'Papier',
    tweede: 'Tweede inkt',
    tweedeUitleg: 'Voor de kleinere koppen.',
    geenTweede: 'geen',
    eigen: 'eigen kleur',
    eigenLabel: (wat: string) => `Eigen kleur voor ${wat}, als hex`,
    inkten: {
      '#1d1b19': 'drukzwart',
      '#2c2823': 'lampzwart',
      '#1f3a5f': 'pruisisch blauw',
      '#2e2a5a': 'indigo',
      '#3b533e': 'mos',
      '#6e1f1f': 'ossenbloed',
      '#8f4526': 'terracotta',
      '#5b4636': 'sepia',
    } as Record<string, string>,
    papieren: {
      '#fcfaf3': 'krijtwit',
      '#f7f4eb': 'perkament',
      '#efe6cf': 'oud ivoor',
      '#e3ebe4': 'mintgrijs',
      '#ebe4d0': 'haver',
      '#c9a77c': 'kraft',
      '#171b2e': 'nachtblauw',
      '#1e1d1b': 'zwart karton',
    } as Record<string, string>,
  },

  // ------------------------------------------------------------------ het vel
  vel: {
    label: 'Het vel',
    tabs: { vel: 'Vel', leesbaar: 'Leesbaar', meenemen: 'Meenemen' },
    tabsLabel: 'Over het vel',
    sjablonen: { website: 'website', boek: 'boekpagina', affiche: 'affiche', dia: 'dia', briefpapier: 'visitekaartje en briefpapier', app: 'appscherm' } satisfies Record<Template, string>,
    letters: (kop: string, tekst: string) => (kop === tekst ? `${kop}, kop en tekst` : `${kop} met ${tekst}`),
    eigenVervangen: (naam: string, vervanger: string) => `${naam} is een eigen font en ging niet mee. Je ziet ${vervanger}.`,
  },

  /** Wat er op de sjablonen staat, naast jouw zin */
  zetsel: {
    website: {
      merk: 'Drukkerij De Pers',
      menu: ['Werk', 'Over', 'Contact'],
      intro: 'We zetten letters zoals ze bedoeld zijn: met de hand, met geduld en met een mening. Wat eruit komt, leest als vanzelf.',
      knop: 'Bekijk het werk',
      h2: 'Waarom letters ertoe doen',
      alinea: 'Een goede letter merk je niet. Je leest door, je onthoudt wat er stond, en je weet niet eens waarom. Een slechte letter merk je wel: je oog struikelt, je leest een zin twee keer, en je haakt af. Daar zit het verschil tussen een tekst die werkt en een tekst die je wegklikt.',
      citaat: 'Typografie is wat een stem is voor een gesprek.',
      bron: 'Uit het zetboek van de drukkerij',
      h3: 'Klein begonnen',
      alinea2: 'De eerste pers stond in een schuur. Nu staat hij nog steeds in een schuur, maar wel een grotere. Het lood is hetzelfde gebleven.',
      bijschrift: 'Foto: de pers op een dinsdagochtend, 1962.',
    },
    boek: {
      kopregel: 'Het zetboek',
      hoofdstuk: 'Hoofdstuk drie',
      alinea: 'Hij legde de letters een voor een in de winkelhaak, met de duim tegen de laatste aan zodat er niets kon schuiven. Het ging langzaam. Het moest langzaam gaan. Wie haast had in een drukkerij, kon de volgende ochtend alles opnieuw doen.',
      alinea2: 'Boven de kast hing een lamp die al jaren flikkerde. Niemand had hem ooit vervangen. In dat licht leerde je de letters op de tast kennen: de schreef van een Garamond, de dikke buik van een Bodoni, de kerf onderaan die zei dat je hem goed om had.',
      citaat: 'Een goed gezette bladzijde lees je niet. Je verdwijnt erin.',
      h3: 'De kerf',
      noot: '¹ De kerf is een gleufje in het loden blokje, zodat de zetter blind voelt hoe de letter moet liggen.',
      folio: '47',
    },
    affiche: {
      boven: 'Zaterdag 14 maart',
      plaats: 'De Oude Drukkerij',
      tijd: 'Deuren 20:00 · Aanvang 20:30',
      h2: 'Met live muziek en drukwerk',
      alinea: 'Neem een vel mee naar huis, nat van de pers. Op is op.',
      citaat: '„Het lawaai van de pers is de beste maat.”',
      bijschrift: 'Toegang € 12,50 · Kaarten aan de deur',
    },
    dia: {
      boven: 'Dia 4 van 12',
      h2: 'Wat we leerden',
      punten: ['Een letter kies je voor de lezer, niet voor jezelf.', 'Twee letters zijn genoeg. Drie is een gesprek dat niemand volgt.', 'Contrast is geen smaak. Het is een getal.'],
      citaat: 'Wie achterin zit, moet het ook kunnen lezen.',
      bijschrift: 'Bron: de drukker, na veertig jaar.',
    },
    briefpapier: {
      merk: 'De Pers',
      naam: 'Anna de Zetter',
      functie: 'Letterzetter en drukker',
      contact: ['Loodstraat 12', '1015 AB Amsterdam', '020 123 45 67', 'anna@depers.nl'],
      datum: 'Amsterdam, 24 november 2026',
      betreft: 'Betreft: uw drukwerk',
      aanhef: 'Beste meneer Van Dijk,',
      alinea: 'Hartelijk dank voor uw bestelling. De vellen liggen te drogen en gaan vrijdag de deur uit. Ik heb de kop iets groter gezet dan u vroeg. Neemt u het me niet kwalijk: hij verdiende het.',
      citaat: 'Op is op.',
      groet: 'Met vriendelijke groet,',
      voetregel: 'KvK 12345678 · IBAN NL00 BANK 0123 4567 89',
    },
    app: {
      balk: 'Bestellingen',
      h3: 'Vandaag',
      regels: [
        ['Visitekaartjes, 250 stuks', '€ 48,00'],
        ['Briefpapier A4, 500 vel', '€ 112,50'],
        ['Affiche A2, 40 stuks', '€ 96,00'],
        ['Enveloppen, 100 stuks', '€ 21,10'],
      ] as [string, string][],
      totaal: ['Totaal', '€ 277,60'] as [string, string],
      knop: 'Afrekenen',
      tekens: 'Code: Il1O0 · 0118 999 881',
      citaat: 'Alles wordt vrijdag gedrukt.',
      bijschrift: 'Prijzen inclusief btw',
    },
  },

  // ------------------------------------------------------------------ leesbaar
  leesbaar: {
    kop: 'Leesbaar',
    inktOpPapier: 'Inkt op papier',
    tweedeOpPapier: 'Tweede inkt op papier',
    verhouding: (r: number) => ratio(r),
    nodig: (r: number) => `nodig: ${ratio(r)}`,
    niveaus: { aaa: 'AAA', aa: 'AA', groot: 'alleen groot', nee: 'te zwak' } satisfies Record<Level, string>,
    stempel: { goed: 'leest', zwak: 'te zwak' },
    apca: (lc: number) => `APCA Lc ${Math.round(Math.abs(lc))}`,
    apcaUitleg: 'Een nieuwe maat voor contrast, nog in ontwikkeling. Alleen ter informatie.',
    regellengte: 'Regellengte',
    regelWaarde: (tekens: number, rem: number) => `${tekens} tekens, ${komma(rem, 1)}rem breed`,
    goedBereik: (min: number, max: number) => `goed: ${min} tot ${max}`,
    kleinste: 'Kleinste maat',
    kleinsteWaarde: (px: number) => `${komma(px, 1)}px op een telefoon`,
    delen: 'Wat de letters hebben',
    heeft: 'heeft',
    mist: 'mist',
    gewichten: (n: number, variabel: boolean) => (variabel ? 'traploze gewichten' : `${inWoorden(n)} ${n === 1 ? 'gewicht' : 'gewichten'}`),
    cursief: 'cursief',
    tabel: 'tabelcijfers',
    ij: 'IJ als één teken',
    il1: 'duidelijke Il1 en O0',
    drukker: 'De drukker zegt',
    niks: 'De drukker heeft niks meer te zeggen.',
    xHoogte: 'x-hoogte',
    xWaarde: (kop: number, tekst: number) => `kop ${komma(kop, 3)}, tekst ${komma(tekst, 3)}`,
  },

  // ------------------------------------------------------------------ meenemen
  meenemen: {
    kop: 'Meenemen',
    uitleg: 'Alles om dit vel in je eigen project te zetten.',
    tailwind: 'Tailwind v4',
    tailwindUitleg: 'Plak het in je CSS. Daarna font-display, text-3xl en max-w-regel.',
    css: 'CSS',
    cssUitleg: 'Gewone CSS met clamp(): de maten groeien mee van telefoon tot breed scherm.',
    npm: 'npm',
    npmUitleg: 'De letters via Fontsource, zelf gehost. Geen verzoek naar Google.',
    figma: 'Figma',
    figmaUitleg: 'Tekststijlen als design tokens, voor een plugin als Tokens Studio.',
    png: 'PNG van het vel',
    pngUitleg: 'Een plaatje om te laten zien. Het echte werk zit in de code.',
    link: 'De link',
    linkUitleg: 'De zin staat in de link. Wie hem opent, ziet precies dit vel.',
    linkEigen: 'Een eigen font gaat niet mee: de link noemt de naam, en de ontvanger ziet een vervanger.',
    briefje: 'Briefje van de drukker',
    kopieer: 'kopieer',
    gekopieerd: 'gekopieerd',
    download: 'download',
    deel: 'deel',
    zelfKopieren: 'Kopiëren mocht niet. Selecteer het zelf:',
    geenNpm: 'Eigen fonts hebben geen npm-pakket. Die host je zelf.',
    licenties: 'Licenties',
    licentieRegel: (naam: string, licentie: string) => `${naam}: ${licentie}`,
    bron: 'Lettertypes van Google Fonts, via Fontsource, onder hun eigen open licenties (meestal OFL).',
  },
  /** Het briefje van de drukker: waarom dit werkt */
  briefje: {
    aanhef: 'Beste zetter,',
    paar: (kop: string, tekst: string) => (kop === tekst ? `Je zet alles in ${kop}.` : `Je zet de koppen in ${kop} en de tekst in ${tekst}.`),
    waarom: (zin: string) => zin,
    schaal: (ratio: number, maat: number, doel: Goal) => `De schaal stapt met ${komma(ratio, 3)}, vanaf ${komma(maat, 1)}px, zoals ${DOELEN[doel].lidwoord} het wil.`,
    regel: (tekens: number) => `Een regel is ${tekens} tekens: daar raakt je oog de weg niet kwijt.`,
    inkt: (r: number, niveau: Level) => `De inkt staat ${ratio(r)} op het papier (${niveau === 'aaa' ? 'AAA' : niveau === 'aa' ? 'AA' : 'te zwak'}).`,
    nog: (n: number) => (n === 0 ? 'Ik heb er niks meer op aan te merken.' : `Ik heb nog ${inWoorden(n)} ${n === 1 ? 'opmerking' : 'opmerkingen'}. Kijk bij Leesbaar.`),
    groet: 'De drukker',
  },

  // ------------------------------------------------------------------ de waslijn
  waslijn: {
    kop: 'De waslijn',
    uitleg: 'Hang vellen op om ze te vergelijken. Er passen er zes aan.',
    leeg: 'Nog niks aan de lijn. Trek de pers over en hang het vel op.',
    vol: 'De lijn is vol. Haal er eerst een af.',
    vergelijk: 'Vergelijk',
    vergelijkUitleg: 'Kies twee of drie vellen.',
    kies: (n: number) => (n < 2 ? `Kies er nog ${inWoorden(2 - n)}.` : `${hoofdletter(inWoorden(n))} gekozen.`),
    kiesLabel: (kop: string, tekst: string) => `Kies ${kop} met ${tekst} om te vergelijken`,
    sluitVergelijk: 'klaar met vergelijken',
    haalAf: 'haal af',
    haalAfLabel: (kop: string, tekst: string) => `Haal het vel met ${kop} en ${tekst} van de lijn`,
    zetVerder: 'zet verder',
    zetVerderLabel: (kop: string, tekst: string) => `Zet het vel met ${kop} en ${tekst} terug in de pers`,
    deel: 'Deel de hele lijn',
    nietBewaard: 'Je browser liet de lijn niet bewaren. Hij blijft hangen zolang deze pagina open is.',
    bezoekKop: 'Iemand heeft een waslijn voor je gespannen',
    bezoekUitleg: (n: number) => `${hoofdletter(inWoorden(n))} ${n === 1 ? 'vel' : 'vellen'}. Hang ze aan je eigen lijn, of kijk alleen.`,
    neemOver: 'Hang ze aan mijn lijn',
    alleenKijken: 'alleen kijken',
    klaarMetKijken: 'klaar met kijken',
  },

  // ------------------------------------------------------------------ het welkom
  welkom: {
    kop: 'Iemand heeft dit vel voor je gezet',
    uitleg: (kop: string, tekst: string) => `Met ${kop} en ${tekst}. Hang het aan je waslijn, of zet het verder naar je eigen smaak.`,
    hang: 'Hang aan je waslijn',
    verder: 'Zet verder',
    onleesbaar: 'Deze link kon ik niet lezen. Misschien is hij afgeknipt. Je staat in de drukkerij, met een vers vel.',
  },

  // ------------------------------------------------------------------ nieuws voor de aria-live-regio
  nieuws: {
    gepakt: (naam: string, rol: Role) => `${naam} is nu de ${ROLNAAM[rol]}.`,
    klem: (naam: string, rol: Role) => `Klem op ${naam}. De drukker zoekt er een ${rol === 'kop' ? 'tekst' : 'kop'} bij.`,
    klemEraf: 'De klem is eraf.',
    doel: (doel: Goal) => `Het is voor ${DOELEN[doel].lidwoord}. De schaal en de maat zijn mee veranderd.`,
    stemming: (moods: string[]) => (moods.length ? `Stemming: ${moods.join(' en ')}.` : 'Geen stemming meer.'),
    voorstel: (kop: string, tekst: string) => `${kop} met ${tekst} staat op het vel.`,
    verrast: (kop: string, tekst: string) => `De drukker koos ${kop} met ${tekst}.`,
    opgelost: (wat: string) => `${wat}. Gedaan.`,
    gedrukt: 'Het vel komt uit de pers.',
    opgehangen: (n: number) => `Het vel hangt aan de waslijn. Er ${n === 1 ? 'hangt' : 'hangen'} er nu ${inWoorden(n)}.`,
    alAanLijn: 'Dit vel hangt al aan de lijn.',
    afgehaald: 'Het vel is van de lijn.',
    terug: 'Het vel ligt weer in de pers.',
    ongedaan: 'Ongedaan gemaakt.',
    nietsOngedaan: 'Er is niks meer om ongedaan te maken.',
    sjabloon: (naam: string) => `Het vel is nu een ${naam}.`,
    gekopieerd: (wat: string) => `${wat} staat op je klembord.`,
    gedownload: (wat: string) => `${wat} is gedownload.`,
    overgenomen: (n: number) => `De vellen hangen aan je lijn. Er hangen er nu ${inWoorden(n)}.`,
    welkom: 'Er is een vel voor je gezet.',
    drukkerStil: (stil: boolean) => (stil ? 'De drukker houdt zijn mond.' : 'De drukker praat weer mee.'),
    eigen: (naam: string, rol: Role) => `${naam} ligt op de werkbank, met een klem erop, als ${ROLNAAM[rol]}. Het bestand blijft op je apparaat.`,
    soort: (naam: string, soort: string) => `${naam} telt nu als ${soort}.`,
    flesje: (naam: string) => `Inkt en papier komen nu uit het flesje ${naam}.`,
  },

  // ------------------------------------------------------------------ colofon
  colofon: {
    knop: 'over',
    kop: 'Over de Letterzetterij',
    sluit: 'sluit',
    watKop: 'Wat het is',
    wat: 'Een oude drukkerij waar je lettercombinaties kiest en uitprobeert, voor iets echts. Je trekt een laatje open, zet je zin en haalt de pers over. Het is een spel, maar het gereedschap is echt: de schaal, de regellengte en het contrast worden gemeten, en wat je meeneemt plak je zo in je project.',
    wieKop: 'Wie',
    wie: 'Gemaakt door Otis van der Stelt. Het hoort bij mijn portfolio, en het is het zusje van de Kleurenalchemist: dezelfde hand, een andere werkplaats.',
    portfolio: 'Naar het portfolio',
    privacyKop: 'Privacy',
    privacy:
      'Er is geen backend, er zijn geen analytics en geen cookies. Alle letters in de kast staan op deze site zelf: er gaat geen verzoek naar Google. Alleen het magazijn haalt letters bij jsDelivr, en dat pas als je daar ja op zegt. Een eigen fontbestand verlaat je apparaat nooit. Je waslijn en je keuze voor dag of nacht staan alleen in je eigen browser. Een deellink bevat het zetsel en je zin, niet meer.',
    lettersKop: 'De letters',
    letters: 'Lettertypes van Google Fonts, via Fontsource, onder hun eigen open licenties (meestal OFL). De licentie staat bij elke letter in de kast.',
    inGebruik: 'Nu op het vel',
    bronnenKop: 'Bronnen',
    bronnen: [
      ['Fontsource, de letters zelf gehost (en het magazijn, via jsDelivr, alleen als je dat wilt)', 'https://fontsource.org'],
      ['SIL Open Font License', 'https://openfontlicense.org'],
      ['fontkit, letters lezen en meten', 'https://github.com/foliojs/fontkit'],
      ['culori, kleurruimtes en gamut mapping uit CSS Color 4', 'https://culorijs.org'],
      ['WCAG 2.2, contrastverhouding', 'https://www.w3.org/TR/WCAG22/'],
      ['APCA, het concept voor de volgende contrastmaat', 'https://github.com/Myndex/apca-w3'],
      ['Utopia, vloeiende typografische schalen', 'https://utopia.fyi'],
      ['Three.js, React Three Fiber en drei', 'https://threejs.org'],
      ['Homemade Apple, Zen Antique Soft, Klee One en Yomogi, via Fontsource', 'https://fontsource.org'],
    ] as const,
    code: 'De code staat op GitHub.',
    codeLink: 'https://github.com/otisvdstelt/otis-letterzetterij',
  },

  wereld: {
    mislukt: 'De drukkerij kon niet getekend worden. Alles werkt gewoon op papier.',
  },
}

/** Wat de drukker zegt bij deze opmerking: steeds dezelfde variant voor hetzelfde zetsel */
export function opmerking(id: RemarkId, params: Params, variant: number): string {
  const options = OPMERKINGEN[id](params)
  return options[variant % options.length]
}

/** Alle varianten, voor de test */
export const opmerkingVarianten = (id: RemarkId, params: Params) => OPMERKINGEN[id](params)

/** De tekst op de knop van een oplossing */
export function oplossing(id: FixId, params: Params, remark?: RemarkId): string {
  if (remark === 'geen-cursief' && id === 'wissel-tekst') return `Pak de cursief erbij: ${params.naam}`
  return OPLOSSINGEN[id](params)
}
