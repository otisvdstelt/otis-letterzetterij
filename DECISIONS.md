# Beslissingen

Wat ik zelf gekozen heb, met de reden erbij. Nieuwste onderaan.

## Fase 1: fundament

- **Dezelfde versies als de Kleurenalchemist** (React 19.3, Vite 8.3, Tailwind 4.3, TypeScript 7.0, Vitest 5.1, oxlint 1.94), exact vastgepind, zonder `^`. Dan gedragen de twee zusjes zich hetzelfde, en een build over een half jaar ook.
- **Vitest staat in `vite.config.ts`** met een node-omgeving. De letterkern is pure TypeScript en heeft geen DOM nodig. Tests in `scripts/` tellen ook mee, want het bouwscript voor de kast krijgt er straks een.
- **De vier handschriften uit het portfolio** (Homemade Apple, Zen Antique Soft, Klee One en Yomogi) komen via `@fontsource` uit npm en worden mee gebundeld. Zo is er vanaf de eerste regel geen verzoek naar Google.
- **Lood, ijzer en eiken** staan als tokens naast het palet van het portfolio (`--color-lead`, `--color-iron`, `--color-oak`). Ze zijn grijs en bruin en vragen geen aandacht: de letters op het vel zijn het enige dat mag opvallen.
- **De inktrol** vervangt het plantje uit het portfolio en het kolfje uit de Kleurenalchemist. Hij werkt op dezelfde manier: een Suspense-fallback houdt hem vast via `lib/progress.ts`, en hij luistert ook naar TanStack Query. Hij rolt heen en weer en laat een streep inkt achter, die voller wordt zolang hij wacht.
- **Dag en nacht volgen de klok** (nacht van 20:00 tot 7:00). Kies je zelf, dan onthoudt dit apparaat dat in `localStorage`. Met `?tijd=dag` of `?tijd=nacht` kun je het forceren.
- **De wind voor de waslijn** staat alvast in `air.ts` (`air.wind`), naast tijd, nacht, onthulling en mist. Er is geen damp zoals in de Kleurenalchemist, dus `tint` is weg.
- **Vercel herschrijft `/vel/*` en `/waslijn/*`** naar `index.html`. Fonts in `/fonts/` krijgen een jaar cache, want hun pad krijgt in fase 2 het versienummer van Fontsource erin: een nieuwe versie is een nieuw adres.
- **OG-adressen zijn volledig vanaf het begin.** `%SITE_URL%` in `index.html` wordt bij het bouwen vervangen door `VITE_SITE_URL`, of anders door het productiedomein dat Vercel meegeeft.
- **De favicon** is een loden letterblokje van boven, met een A in spiegelbeeld, zoals letters in de kast liggen.

## Fase 2: de kast vullen

- **fontkit in plaats van opentype.js.** opentype.js 2.0 kan geen woff2 lezen en struikelt over sommige `ccmp`-lookups (“substitutionType 62 is not yet supported”). Een eigen font dat iemand op de werkbank sleept is vaak woff2, en de bestanden voor de DOM zijn dat ook. fontkit 3 leest woff2, kent variabele assen (`getVariation`) en geeft glyphpaden. Het is modulair: we registreren alleen de formaten die we nodig hebben (`fontkit/core` plus `formats/WOFF2Font`). Typen staan in `src/types/fontkit.d.ts`; de kern kent fontkit niet en werkt met een eigen vorm (`FontLike`).
- **Meten doen we zelf, zonder canvas.** `lib/type/outline.ts` slaat een glyph plat tot veelhoeken en kleurt hem in op een raster (nonzero, zoals fonts). Daarmee meten we hetzelfde in Node en in de browser:
  - **x-hoogte en kapitaalhoogte** uit de x en de H zelf, niet uit de OS/2-tabel, die soms liegt;
  - **gemiddelde breedte** over een gewone Nederlandse alinea, met spaties en leestekens. Daar komt later de regellengte uit;
  - **contrast**: de dikste stok links in de o gedeeld door de dunste bovenin. Inter 1,2, Garamond 2,9, Bodoni Moda 5,8, Abril Fatface 10. Welke kant ook op, want een paar handschriften hebben het andersom;
  - **Il1 en O0**: elk teken op zijn eigen midden in hetzelfde vak, en dan de overlap. Boven 0,8 lijken ze te veel op elkaar. Inter, Jost en Montserrat vallen daardoor af voor een app, Atkinson Hyperlegible en IBM Plex Sans niet.
- **Een variabel font meten we op 400.** Fraunces staat standaard op 900, en dan meet je een andere letter. De assen in `fonts.json` houden wel hun echte standaardstand.
- **We meten de bestanden die de browser krijgt.** De subsets van Fontsource (die van Google komen) hebben vaak geen `onum`, `smcp` of `liga` meer, ook als het font ze eigenlijk wel heeft. De drukker baseert zich op wat er echt in het bestand zit. Een cursief of kleinkapitalen die er niet is, verzint de browser, en dat moet hij dan ook zeggen.
- **144 families** in zes laatjes: schreef 36, schreefloos 41, display 29, handschrift 20, mono 14 en huis 4. Het laatje bepaalt de soort, niet de categorie van Fontsource: Playfair Display is een schreefletter maar hoort in Display, want als broodtekst is hij te fijn. In Huis heeft elk font een eigen soort; Klee One telt als schreefloos, want ik gebruik hem zelf als broodtekst.
- **Wat er lokaal staat:**
  - variabel: één bestand per stijl en subset. Met alleen `wght` het wght-bestand, met meer assen (opsz, wdth) het standard-bestand, zodat de schuifjes in de winkelhaak echt iets doen;
  - statisch: hooguit zes gewichten (400 en 700 eerst), cursief alleen in 400 en 700;
  - latin en latin-ext, met `unicode-range`, zodat latin-ext pas laadt als je een ĳ of een ł zet;
  - een `.woff` in 400 en 700 (alleen latin) voor drei `Text` in 3D.

  Samen 24 MB. Het staat in de repo, met het versienummer van Fontsource in het pad (`fonts/inter/5.3.0/…`): een nieuwe versie is een nieuw adres, dus de bestanden krijgen een jaar cache.
- **Het bouwscript cachet** alles in `.case-cache/` (niet in git), met een `.404`-markering voor wat niet bestaat. Een tweede keer draaien duurt een seconde. Wat niet meer in de config staat, gooit het weg uit `public/fonts/`.
- **`pairings.json` staat in `src/content/`**, niet in `public/data/`. Het zijn woorden (één zin waarom per paar), en woorden horen bij de content. Het wordt mee gebundeld (een paar KB), dus het zetboek staat er meteen. 41 paren, elk doel heeft er minstens vijf. Zeven paren hebben meer dan 15% verschil in x-hoogte. Dat zijn vooral letters met alleen kapitalen (Bebas Neue, Monoton, Anton) op een affiche, waar die regel weinig telt.
- **De netwerktest** draait na elke `npm run build` en laat de build falen als er in `dist/` een adres van `googleapis.com`, `gstatic.com` of `jsdelivr.net` staat. Alleen een chunk met `magazijn` in de naam mag jsDelivr noemen (fase 8), Google nooit. Het woord "jsDelivr" in een zin mag wel. Een Vitest-test doet hetzelfde op `src/`, `public/data/` en `index.html`, zodat het ook zonder build opvalt.
