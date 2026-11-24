# Letterzetterij

Een oude drukkerij met een houten letterkast. Je trekt laatjes open, pakt een letter voor de kop en een voor de tekst, zet je eigen zin in de winkelhaak en haalt de pers over. Op het vel dat eruit komt zie je je combinatie aan het werk: in een website, een boekpagina, een affiche, een dia, op briefpapier of in een app.

De drukker kijkt mee. Twee schreefletters? Gewaagd. Broodtekst op 14px? Dan zet iedereen zijn leesbril op. Bij elke klacht heeft hij meteen een oplossing, in één tik. Maar jij beslist.

Het is een spel, maar het gereedschap is echt. Je gaat weg met een lettercombinatie, een typografische schaal die meegroeit van telefoon tot breed scherm, en code die je zo in je project plakt: Tailwind, CSS, de npm-regels, tekststijlen voor Figma.

Het hoort bij mijn portfolio, [otisstelt.vercel.app](https://otisstelt.vercel.app), en het is het zusje van de [Kleurenalchemist](https://github.com/otisvdstelt/otis-kleurenalchemist). Een flesje van daar plak je hier in, en dan is dat je inkt en je papier.

## Hoe ik het gemaakt heb

- De pagina is React 19 en TypeScript, gebouwd met Vite. Het uiterlijk is Tailwind CSS v4, met gescheurd papier en bibberende lijnen uit CSS en SVG-filters.
- **Het vel is echte tekst.** Geen plaatje: wat je ziet, is hoe je browser die letter echt zet. De schaal rekent in `cqi`, zodat het vel zich gedraagt als een pagina die zo breed is als het vel zelf.
- **Geen verzoek naar Google.** 144 families staan op deze site zelf, opgehaald via [Fontsource](https://fontsource.org) door `npm run case`, bij het bouwen. Variabel waar het kan, alleen latin en latin-ext. Ook de metadata wordt dan al opgehaald en gemeten. Een netwerktest laat de build falen zodra er een adres van Google of jsDelivr in `dist/` staat.
- **Alle letterlogica staat in `src/lib/type`**, als pure TypeScript zonder React, three of één woord tekst, en is getest met Vitest:
  - letters meten met [fontkit](https://github.com/foliojs/fontkit) en een eigen vlakvuller: x-hoogte, breedte, stokcontrast, en of `Il1` en `O0` te onderscheiden zijn;
  - veertien koppelregels, en het voorstel van de drukker;
  - de schaal met `clamp()`, interlinie per niveau, en optische correcties;
  - de drukker als regelmotor: 32 opmerkingen, en elke oplossing lost zijn eigen klacht ook echt op;
  - contrast volgens WCAG 2.2, met APCA ernaast (dezelfde code als de Kleurenalchemist);
  - de deellink, en het lezen van flesjes uit de Kleurenalchemist;
  - de exports.
- **De drukkerij is Three.js** met React Three Fiber en drei. Er is niets met de hand gemodelleerd: de pers, de kast, de waslijn, het zetboek en de drukker staan als code in `src/lib/world`, en `npm run world` bakt ze tot één `.glb` van 47 KB met Draco. Je kop ligt als loden letters in spiegelbeeld op het bed, uit de echte glyphpaden. De afdruk heeft een eigen shader: ongelijke inkt, letters die in het papier gedrukt zijn, en een tand per soort papier. Het schilderij eroverheen is de pass uit mijn portfolio.
- De kast komt als `public/data/fonts.json` mee met de site, en wordt opgehaald met TanStack Query.
- Het geluid is Web Audio, zonder één audiobestand, en het staat uit tot je het zelf aanzet.
- Linten gaat met oxlint, de hosting is Vercel.

Waarom ik wat gekozen heb, staat in [DECISIONS.md](DECISIONS.md), per fase. Mijn ontwerpregels staan in [PRODUCT.md](PRODUCT.md). Het linkformaat staat in [docs/LINKFORMAAT.md](docs/LINKFORMAAT.md).

## Draaien

Je hebt Node 22.18 of nieuwer nodig.

```bash
npm install
npm run dev      # starten
npm test         # de letterkern testen
npm run build    # typechecken, bouwen, en de netwerktest
npm run preview  # de build bekijken
npm run lint
npm run case     # de kast opnieuw vullen (haalt bij Fontsource, meet, schrijft naar public/)
npm run world    # de drukkerij opnieuw bakken na een wijziging in src/lib/world
npm run draco    # de Draco-decoder naar public/draco kopiëren
```

Met `?papier` in het adres krijg je de versie zonder 3D. Met `?tijd=dag` of `?tijd=nacht` zet je het uur vast.

## Kleine lettertjes

De code is van mij, en er zit nog geen licentie op. Vraag het me dus even voordat je er een stuk van gebruikt.

Lettertypes van Google Fonts, via Fontsource, onder hun eigen open licenties (meestal OFL). De licentie staat bij elke letter in de kast, en bij Meenemen. fontkit en culori vallen onder de MIT-licentie.

Er is geen backend, geen analytics en er zijn geen cookies. Je waslijn en je keuze voor dag of nacht staan alleen in je eigen browser. Een eigen fontbestand verlaat je apparaat nooit: het wordt in je browser geladen, en een deellink noemt alleen zijn naam. Het magazijn, met het hele archief van Fontsource, haalt letters bij jsDelivr. Dat gebeurt alleen als je daar ja op zegt, en dat geldt alleen voor die sessie.
