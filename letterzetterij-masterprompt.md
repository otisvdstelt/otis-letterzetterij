# Masterprompt: Letterzetterij

> Plak alles hieronder in een nieuwe Claude Code-sessie, in een lege map voor het project.

---

## Rol en opdracht

Je bouwt **Letterzetterij**, een webapp waarin je in een oude drukkerij lettercombinaties kiest en uitprobeert, voor iets echts: een website, een affiche, een boek of een huisstijl. Je werkt als senior creative developer: sterk in React, Three.js en shaders, en net zo zorgvuldig met typografie, licenties en privacy.

Het project hoort bij mijn portfolio (otisstelt.vercel.app) en is het zusje van **Kleurenalchemist**: dezelfde hand, maar een andere werkplaats. **Het is een spel, maar het gereedschap is echt.** Wie het opent met een opdracht in zijn hoofd, gaat weg met een lettercombinatie, een typografische schaal en code die hij in zijn project kan plakken.

## Werkwijze (vast)

- **Repo:** https://github.com/otisvdstelt/otis-letterzetterij. Hij is leeg. Clone hem, werk op `main` en zet `origin` op deze repo.
- **Kijk eerst hoe het bij Kleurenalchemist ging:** https://github.com/otisvdstelt/otis-kleurenalchemist. Lees in elk geval:
  - `PRODUCT.md`, `README.md` en `DECISIONS.md` (opbouw, toon, beslissingen per fase);
  - `docs/LINKFORMAAT.md` (het linkformaat, dat deze app ook moet lezen);
  - `src/lib/alchemy/` (pure kern met tests ernaast);
  - `src/lib/store.ts` (één store met `useSyncExternalStore`);
  - `src/content/strings.ts` (alle teksten op één plek);
  - `scripts/build-world.ts` (het bakken);
  - de commitgeschiedenis (`git log`).
  
  Neem de opbouw over. Doe niet over wat daar fout ging (zie "Lessen uit Kleurenalchemist").
- **Teksten en commits in het Nederlands**: kort en in mijn toon (warm, een beetje eigenwijs, zonder opvulling).
- **Elk bestand of onderdeel krijgt een eigen commit.** Het bericht bestaat uit kleine letters en steekwoorden, in de vorm `onderdeel: wat`, net als in Kleurenalchemist. Voorbeelden:
  - `kast: laatjes, specimens, pijltjes`
  - `drukker: regels voor het paar`
  - `3d: pers zakt, vel komt omhoog`
  - `teksten: zetsel en waslijn`
  - `beslissingen fase 3`
- **Push na elke commit** naar `origin main`. Mislukt de push, stop dan en zeg waarom. Forceer nooit.
- Na elke fase draaien `npm run build`, `npm run lint` en `npm test` foutloos. Geef dan een korte samenvatting: wat er staat en wat nog niet.
- Vraag het me alleen als een keuze echt van mij is. Kies verder zelf, en schrijf het op in `DECISIONS.md`, met een commit `beslissingen fase N`.

## De ervaring

Je staat in een oude drukkerij met een houten **letterkast**. Je trekt laatjes open, pakt een letter voor de kop en een voor de broodtekst, zet je eigen zin in de **winkelhaak** en trekt de **handpers** over. Op het vel papier dat eruit komt zie je je combinatie in echt gebruik.

- **De drukker** is een karakter, in code gebouwd zoals mijn Rotom. Hij geeft commentaar: "Twee schreefletters? Gewaagd."
- **Inkt en papier** kies je zelf, met een echte contrastcheck.
- **De waslijn**: hang vellen op om ze naast elkaar te vergelijken.
- **Delen**: een vel deel je via een link.

## Bruikbaar eerst: drie keuzes, zoals in de ketel

Bij Kleurenalchemist bleek dat sfeervolle potjes alleen niet genoeg zijn om er iets echts mee te maken. Hier begint het daarom meteen bij wat je nodig hebt. Op de werkbank liggen drie dingen. Je kunt ze in elke volgorde aanpakken.

1. **Jouw letter (de basis), optioneel.** Een letter die al vaststaat, bijvoorbeeld je merkletter of de letter van je site.
   - Je pakt hem uit de kast en zet er een **klem** op. De drukker zoekt er dan een partner bij.
   - Of je sleept een eigen fontbestand (`.woff2`, `.woff`, `.ttf` of `.otf`) op de werkbank. Het wordt geladen met de `FontFace` API uit een `ArrayBuffer` en **verlaat het apparaat nooit**. Zeg dat in de UI. Een eigen font komt niet in een deellink: de link noemt dan de naam en laat bij de ontvanger een nette vervanger zien.

2. **Het doel: waar is het voor?** Precies één, standaard "website". Het doel bepaalt de sjablonen, de schaal en de regels van de drukker.
   - **website**: kop + broodtekst, schaalverhouding ongeveer 1,25, broodtekst minstens 16px, regels van 60 tot 75 tekens.
   - **boek of lange tekst**: een rustige broodtekst die het zwaarst weegt, schaal ongeveer 1,2, ruime interlinie, en cursief is verplicht.
   - **affiche**: een display-letter mag, grote schaal (1,5 of meer), weinig tekst.
   - **presentatie**: groot, veel contrast, schaal ongeveer 1,333, geen dunne gewichten.
   - **huisstijl**: woordmerk, kop en broodtekst, met een voorkeur voor families met veel gewichten.
   - **app**: schreefloos voor de interface, de tekens moeten duidelijk te onderscheiden zijn (`Il1`, `O0`), tabelcijfers.

3. **De stemming: hoe moet het voelen?** Eén of twee, bijvoorbeeld klassiek, modern, speels, technisch, warm of statig. De stemming filtert en ordent wat de drukker voorstelt. Ze verplicht niets.

Daaruit komt het **voorstel van de drukker**: drie combinaties die bij het doel en de stemming passen (of bij jouw geklemde letter), elk met één zin waarom. Je kunt ook alles zelf uit de kast pakken. De drukker heeft een mening, maar jij beslist.

**Wat eruit komt** is een complete typografische opzet, geen losse twee fonts:
- kop- en broodletter met hun gewichten en cursief;
- een **typografische schaal** (de verhouding komt van het doel) met vloeiende maten via `clamp()`;
- interlinie per niveau, letterspatiëring voor kapitalen en kleine maten, en de beste regellengte.

## Lessen uit Kleurenalchemist (doe dit meteen goed)

- **De uitkomst staat centraal en is altijd zichtbaar.** Het vel verandert live terwijl je kiest. Een paneel van vier schermen lang willen we niet: gebruik vanaf het begin tabbladen (**Vel**, **Leesbaar**, **Meenemen**).
- **Panelen overlappen nooit.** Test elke fase op 1024×768, 1440×900 en 375×812. Elk paneel dat kan groeien heeft een `max-height` en scrollt zelf. De 3D-pers is het middelpunt en zit nooit achter een paneel verstopt.
- **Niets wordt zomaar opnieuw gegooid.** Hetzelfde zetsel geeft altijd hetzelfde vel. Willekeur alleen achter een duidelijke knop (**Drukker, verras me**).
- **Een check die "te zwak" zegt, biedt altijd een oplossing aan**, ook na een eerdere oplossing en na bijstellen. Zet een stempeltje direct bij het ding dat je aan het veranderen bent.
- **Gebaren moet je kunnen vinden.** De hendel van de pers omlaag slepen krijgt de eerste keer een hint, en een cursor `grab`/`grabbing`.
- **Ongedaan maken** met een knop en met Ctrl/Cmd+Z, en de laatste vijf vellen terug.
- **De deellink blijft in de adresbalk** zolang het vel openstaat. Wie een link krijgt, krijgt een welkom ("Iemand heeft dit vel voor je gezet") met **Hang aan je waslijn** en **Zet verder**.
- **OG-tags met volledige URL's** (`og:image`, `og:url`), met het domein uit de omgeving.
- **Een getekende pers als placeholder** tot de 3D er is. Nooit een leeg midden.
- **Een colofon** met wat het is, wie het maakte, de privacy, de bronnen en de licenties van de letters.

## Eerst: lees mijn portfolio

Clone https://github.com/otisvdstelt/portfolio-otis-v2 naar een tijdelijke map. Neem deze onderdelen over en pas ze aan (Kleurenalchemist laat zien hoe):

| Uit het portfolio | Waarvoor hier |
|---|---|
| `src/components/three/InkPaper.tsx` | De schilderpass: inktlijnen, papiertand, de rafelige rand en de mistwipe tussen kast, pers en waslijn. |
| `src/components/three/materials.ts` | `paintedToon` met `toonGradient` en `washTexture` voor hout, lood en ijzer. Gebruik `glow` voor de lamp boven de pers en `shaft` voor stoflicht door het raam. |
| `src/lib/world/kit.ts`, `terrain.ts`, `scripts/build-world.ts` | De modelleerkit en het bakpatroon: alles in code gebouwd en met glTF Transform gebakken naar één Draco-`.glb`. |
| `src/lib/air.ts` | De gedeelde shaderstate. Gebruik `wind` voor de vellen aan de waslijn. |
| `src/components/three/look.ts` | `FACES` en `PAGE_INK`. drei `Text` krijgt **`.woff`**, geen `.woff2`. |
| `src/components/three/Piece.tsx` + `ui/Tags.tsx` | Papieren labels die aan een punt in de wereld vastzitten. Hier worden dat de tekstballonnen van de drukker. |
| `src/components/ui/Chrome.tsx` + `src/index.css` | De SVG-filters, de tokens, `.paper`/`.slip`/`.plaque`, de vier handschriften en dag/nacht. |
| `src/components/ui/Sprout.tsx` | De laadindicator. Hier wordt het een **inktrol** die in de hoek heen en weer rolt. |

De drukkerij heeft het palet van het portfolio (perkament, inkt, mos, terracotta) met daarnaast lood, ijzer en donker eikenhout. De letters zijn het belangrijkste in beeld.

## Stack (vast)

| Onderdeel | Keuze |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| 3D | Three.js + React Three Fiber + drei + postprocessing |
| Modellen | In code gebouwd, gebakken naar `.glb` met glTF Transform (Draco) |
| Data ophalen | TanStack Query |
| Linten | oxlint |
| Tests | Vitest |
| Hosting | Vercel |

- Pin exacte versies, zonder `^`, net als in Kleurenalchemist.
- Toegestane extra's, elk met een reden in `DECISIONS.md`:
  - **opentype.js** of **fontkit**: metrieken en glyphpaden.
  - **culori**: contrast. Gebruik dezelfde contrastcode als Kleurenalchemist.

## Licenties en privacy (hard)

- **Geen verbinding met Google.** Niets laden van `fonts.googleapis.com` of `fonts.gstatic.com`. Dat stuurt het IP-adres van bezoekers naar Google, en in de EU geldt dat als een AVG-schending.
- **Zelf hosten.** Het bouwscript `npm run case` haalt bij het bouwen een **samengestelde set** van ongeveer 150 families op via **Fontsource**:
  - waar het kan variabele fonts;
  - alleen latin en latin-ext;
  - woff2 voor de DOM, woff voor drei `Text`;
  - de bestanden komen in `public/fonts/`.
- **Metadata komt ook vooraf.** De Fontsource API wordt alleen tijdens het bouwen aangeroepen. Het resultaat wordt `public/data/fonts.json`, en de app haalt dat lokaal op met TanStack Query. Er is geen API-sleutel nodig en de bezoeker doet geen enkele externe aanroep.
- **Het magazijn (fase 8, optioneel).** Het hele archief via de Fontsource-CDN (jsDelivr), alleen **na een duidelijke vraag** ("Dit haalt letters op bij jsDelivr. Daarbij gaat je IP-adres naar hen. Doorgaan?"). Het antwoord geldt alleen voor deze sessie.
- **Geen "Google" in de naam, het logo of de titel.** Zet in het colofon: "Lettertypes van Google Fonts, via Fontsource, onder hun eigen open licenties (meestal OFL)." Toon de licentie bij elk font.
- **Een netwerktest**: tijdens normaal gebruik gaat er geen enkel verzoek naar een ander domein. Een script controleert of `dist/` buiten de magazijncode geen `googleapis`, `gstatic` of `jsdelivr` bevat.
- Geen analytics, geen cookies en geen backend.

## Architectuur

1. **`src/lib/type/`**: pure TypeScript met tests ernaast. Hier zitten de catalogus, metrieken, koppelregels, de schaal, de drukker (een regelmotor), contrast, de codering van de deellink en de exports.
2. **`src/components/ui/`**: de papieren laag in DOM. **Het vel is echte HTML-tekst** met echte OpenType-rendering. Alles werkt ook zonder 3D.
3. **`src/components/three/`**: de drukkerij, alleen presentatie. Hij leest de state en stuurt intenties terug (`pick`, `clamp`, `set`, `pull`, `hang`).
4. **`src/lib/store.ts`**: één store met `useSyncExternalStore`, zoals in Kleurenalchemist. Wat er gebeurt, zet de store als zin in `news` voor de `aria-live`-regio.
5. **`src/content/strings.ts`**: alle teksten, ook die van de drukker. Er staan geen woorden in `lib/type`.

## De lettertypekern

### De kast vullen (`npm run case`)
- `scripts/case.config.ts` bepaalt de inhoud: ongeveer 150 families in de laatjes **Schreef**, **Schreefloos**, **Display**, **Handschrift** en **Mono**, plus **Huis** met mijn eigen vier fonts. Kies goede letters voor elk doel, niet alleen de bekendste.
- Het script meet elk font met opentype.js en schrijft weg:
  - **metrieken**: x-hoogte en kapitaalhoogte per em, gemiddelde breedte, en een schatting van het contrast tussen dikke en dunne stokken;
  - **bereik**: gewichten, cursief, variabele assen, tabel- en mediëvale cijfers, kleinkapitalen, ligaturen, `IJ`/`ij` en Nederlandse diakrieten, en of `Il1` en `O0` goed van elkaar te onderscheiden zijn;
  - **specimen**: "Aa" als SVG-path. Zo laat de kast voorbeelden zien zonder 150 fonts te laden.
- Uitvoer: `public/data/fonts.json` en `public/data/specimens.json`.

### Koppelen
- **`pairings.json`** met zo'n 40 goede combinaties, elk met een doel, een stemming en één zin waarom.
- Koppelregels als pure functies, elk met een score en een uitleg:
  - schreef + schreefloos;
  - twee keer dezelfde soort alleen met genoeg verschil;
  - geen twee display-fonts;
  - geen display-, handschrift- of mono-font als broodtekst;
  - de x-hoogtes liggen dicht bij elkaar (een verschil van meer dan 15% valt op);
  - dezelfde familie in verschillende gewichten is veilig;
  - een groot verschil in karakter valt op.
- Elk doel weegt de regels anders (bij "boek" telt de broodtekst het zwaarst).
- Het voorstel van de drukker zijn de drie paren met de hoogste score die bij het doel en de stemming passen.

### Schaal en zetsel
- De schaal komt uit de verhouding van het doel, met een basismaat van 16-18px en vloeiende maten via `clamp()` tussen 375px en 1440px breed.
- Interlinie per niveau: koppen strakker (1,1-1,25), broodtekst ruimer (1,5-1,7).
- De regellengte wordt per doel gecontroleerd.
- Optische correcties:
  - een kop met een kleine x-hoogte krijgt een iets grotere maat;
  - kapitalen krijgen extra spatiëring;
  - het tabelcijferpotje zet `font-variant-numeric`.

### De drukker (geen AI, een regelmotor)
- De opmerkingen staan in `strings.ts`. Elke opmerking heeft een voorwaarde, een gewicht en 2 tot 4 varianten. Hij is droog, warm en eigenwijs, en spreekt Nederlands met drukkerstermen.
- Hij reageert op:
  - het **paar**: "Twee schreefletters? Gewaagd.";
  - het **zetsel**: regellengte, broodtekst onder 16px, interlinie, weduwen en wezen;
  - **ontbrekende delen**: geen vet of geen cursief, waardoor de browser er een verzint;
  - **het doel**: "Een handschrift voor een boek? Dan leest niemand verder dan bladzijde twee.";
  - **Nederlands**: "IJsselmeer met een losse I en J? Dat doen we hier niet.";
  - **inkt op papier**: gekoppeld aan de echte WCAG-check;
  - **lof**, als iets klopt.
- Elke kritiek komt met een **oplossing in één tik** ("Zet de broodtekst op 17px", "Pak de cursief erbij", "Wissel de kop voor X").
- Hij praat via een papieren `.tag`, alles wat hij zegt komt ook in `aria-live`, en hij is stil te zetten.
- Waarom geen LLM: dat kost geld, heeft een backend nodig, en zijn karakter moet precies kloppen. Zet dat in `DECISIONS.md`.

### Inkt en papier
- Ongeveer 8 inktsoorten en 8 papiersoorten, elk met een eigen textuur in de shader.
- De contrastcheck is WCAG 2.2: 4,5:1 voor broodtekst, 3:1 voor koppen vanaf 24px. AAA alleen vanaf 7:1. APCA staat er als extra informatie bij. Neem deze code over uit Kleurenalchemist.
- **Koppeling met Kleurenalchemist**: plak een flesjeslink of plankenlink. Lees die volgens `docs/LINKFORMAAT.md` in de kleurenalchemist-repo (`codeFromLink`, `inkAndPaper`). `tekst`, `achtergrond` en `accent` worden inkt, papier en tweede inkt. Ondersteun ook de nieuwere flesjesversie als die er is, en geef `null` (met een nette melding) bij een versie die je niet kent.

## Het vel

- **Tab Vel**: het sjabloon van het doel, live, met jouw zin erin.
  - website-hero met navigatie en knop;
  - boekpagina;
  - affiche;
  - een dia;
  - visitekaartje en briefpapier;
  - appscherm.
  
  Elk sjabloon heeft koppen op meerdere niveaus, broodtekst, een citaat en een klein bijschrift, zodat de hele schaal te zien is.
- **De winkelhaak**: je eigen zin, plus de instellingen grootte, interlinie, spatiëring, gewicht, cursief, uitlijning en sliders voor variabele assen. Bij elk drukkerswoord staat een uitleg, met de muis of met een tik.
- **Tab Leesbaar**: contrast van inkt op papier, regellengte, kleinste maat, ontbrekende delen en de opmerkingen van de drukker, elk met een oplossing.
- **Tab Meenemen**, één menu:
  - Tailwind v4 `@theme` (`--font-display`, `--font-sans`, en de schaal als `--text-*` met hun interlinie);
  - CSS met `clamp()`-maten;
  - de `npm install @fontsource/...`-regels en de imports;
  - Figma-tekststijlen (JSON);
  - een PNG van het vel;
  - de link;
  - een kort briefje van de drukker over waarom dit werkt.

## De drukkerij (3D)

- Alles wordt in code gebouwd en gebakken:
  - letterkast met laatjes en vakjes;
  - handpers met hendel, inktplaat en rol;
  - galei, waslijn met knijpers, stapels papier, inktblikken en een lamp;
  - een **zetboek** op de werkbank, met de recepten uit `pairings.json`.
- **Loden letters**: je kop wordt in 3D gezet als echte letters. De glyphpaden komen uit opentype.js en worden geëxtrudeerd op loden blokjes, **in spiegelbeeld**. Alleen de kop (hooguit ongeveer 40 tekens), gecachet per font en tekst.
- **De pers trekken**: sleep de hendel omlaag of druk op Enter. De rol gaat over het zetsel en het vel komt omhoog.
- **De afdrukshader**: ongelijke inkt, randen die uitlopen, de letters zijn in het papier gedrukt (de normaal komt uit een vervaagd tekstmasker), en papiertextuur.
- **De waslijn**: hooguit 6 vellen in de wind (`air.wind`). Vergelijken gebeurt in de DOM: kies 2 of 3 vellen en zie ze naast elkaar, leesbaar.
- **De drukker**: gebouwd en gebakken zoals Rotom, met een schort met inktvlekken, een bril en mouwophouders. Hij beweegt via draaipunten.
- Dag en nacht volgen de klok. De postprocessing is de InkPaper-pass. `frameloop="demand"` zolang er niets beweegt, en DPR wordt begrensd.

## Delen

- `/vel/<code>`: base64url, binair, met een versienummer, zoals het flesje.
  - Erin staan de font-id's, instellingen, doel, schaal, sjabloon, inkt, papier en tekst.
  - De tekst is hooguit 280 tekens, en de UI zegt dat de tekst in de link staat.
- `/waslijn/<code>` voor alle vellen. Vercel herschrijft beide paden naar `index.html`.
- Schrijf het formaat uit in `docs/LINKFORMAAT.md` en zet een bevroren code van versie 1 in de tests.
- De waslijn wordt per apparaat bewaard in `localStorage`, met try/catch.

## Ontwerpregels

- Eén idee, helemaal doorgezet: drukkerij, lood, inkt en papier.
- Nooit een lege pagina: de inktrol rolt in de hoek en de getekende pers staat klaar.
- Zonder 3D werkt alles nog.
- Het toetsenbord bereikt alles, en de `aria-live`-regio vertelt wat er gebeurt.
- Bij `prefers-reduced-motion` blijven de stappen hetzelfde, maar verdwijnt de beweging.
- Geluid (het klak van de pers, ritselend papier, synthetisch) staat standaard uit.
- Gebouwd voor een telefoon. Daar worden de laatjes een lijst, het vel een vel dat van onder omhoog schuift, en de waslijn een strook die je opzij veegt.

## Tests (Vitest)

- Koppelregels met bekende goede en slechte paren.
- Het voorstel per doel bevat geen paren die de harde regels breken.
- De schaal geeft per doel de juiste verhouding en monotone `clamp()`-waarden.
- Elke opmerking van de drukker hoort bij zijn situatie, en elke oplossing lost de klacht ook echt op.
- Contrast: zwart op wit = 21:1, en AAA alleen vanaf 7:1.
- De link codeert en decodeert zonder verlies, en de bevroren versie 1 blijft leesbaar.
- Een flesjeslink uit Kleurenalchemist geeft de goede inkt en het goede papier.
- De netwerktest: `dist/` bevat geen Google- of jsDelivr-adressen buiten de magazijncode.

## Klaar is pas klaar als deze vijf scenario's werken (test ze zelf in de browser)

1. **"Ik maak een portfoliosite, iets rustigs."** Doel website + stemming warm. Neem een voorstel, zet je eigen kop en tik op Meenemen. De Tailwind-export plak je zo in een project, met fonts, schaal en interlinie.
2. **"Mijn merkletter is Inter, wat past erbij voor koppen?"** Inter uit de kast, klem erop. De drukker stelt drie koppen voor, elk met een reden.
3. **"Ik heb een eigen fontbestand."** Sleep een `.woff2` op de werkbank. Het werkt in het vel, er gaat niets het netwerk op, en de deellink zegt netjes dat dit font niet meegaat.
4. **"Affiche voor een concert, met mijn kleuren."** Doel affiche + een geplakte flesjeslink uit Kleurenalchemist. De inkt en het papier komen uit het flesje, en de contrastcheck klopt.
5. **"Ik twijfel tussen drie combinaties."** Drie vellen aan de waslijn, naast elkaar vergelijken, de beste delen. De ontvanger ziet precies hetzelfde vel en krijgt een welkom.

Test daarnaast elke fase op 1024×768, 1440×900 en 375×812, met de muis én alleen met het toetsenbord.

## Fases

Lever per fase. Elk onderdeel krijgt een eigen commit en wordt gepusht. Sluit elke fase af met `beslissingen fase N`.

1. **Fundament**: repo klaarzetten, Vite + React 19 + TS + Tailwind v4 + oxlint + Vitest + Vercel-config, de tokens, fonts, filters en de inktrol uit het portfolio. Schrijf `PRODUCT.md` in mijn toon.
2. **De kast vullen**: `npm run case`, metrieken, specimens, `fonts.json`, `pairings.json`, plus de netwerktest.
3. **De kern**: `lib/type` compleet en getest: koppelregels, doelen, stemmingen, schaal, de drukker met oplossingen, contrast, linkformaat en exports.
4. **Papieren versie**: werkbank (jouw letter, doel, stemming), kast, winkelhaak, het vel met tabs, de waslijn, delen, ongedaan maken, het welkom en het colofon. Dit is meteen de fallback.
5. **Drukkerij bouwen en bakken**: kast, pers, waslijn, zetboek en de drukker als statische `.glb`, met de toon-materialen, de InkPaper-pass en de getekende pers als placeholder.
6. **Leven erin**: loden letters in spiegelbeeld, de pers trekken (met hint), de afdrukshader, de wapperende waslijn, de drukker die beweegt en de mist tussen de plekken.
7. **Koppeling en eigen fonts**: flesjeslinks uit Kleurenalchemist, eigen fontbestanden, en de vijf scenario's doorlopen en oplossen.
8. **Afwerking**: het magazijn met toestemming, geluid, dag en nacht, telefoon, reduced motion, prestatiebudget (eerste tekst binnen 1,5 s op 4G, `.glb` kleiner dan 500 KB), OG-tags met volledige URL's, en de README in mijn toon.

## Wat je níet doet

- Niets laden van Google-servers, ook niet "even om te testen".
- Geen font-logica in componenten of shaders. Die staat alleen in `lib/type`.
- Het vel niet als plaatje renderen voor de DOM. Het is echte tekst.
- Geen modellen met de hand maken of downloaden, en geen textures van internet.
- Niets opnieuw gooien zonder dat iemand erom vraagt.
- Geen grote commits met "diverse wijzigingen". Eén onderdeel per commit, en daarna pushen.
- Nooit force-pushen.
