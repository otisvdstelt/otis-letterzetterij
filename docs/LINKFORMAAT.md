# Het linkformaat van een vel

Een vel uit de Letterzetterij reist als link: `/vel/<code>`. Een hele waslijn reist als `/waslijn/<code>`. Er is geen server: alles wat nodig is, zit in de code zelf. De code staat in `src/lib/type/share.ts`.

De code is base64url zonder opvulling (`A–Z a–z 0–9 - _`). Daaronder zit dit, byte voor byte.

## Vel, versie 1

| Veld | Vorm |
|---|---|
| versie | 1 byte, nu `1` |
| kop | een letter, zie hieronder |
| tekst | een letter |
| doel | 1 byte: 0 website, 1 boek, 2 affiche, 3 presentatie, 4 huisstijl, 5 app |
| stemmingen | 1 byte aantal (0 tot 2), dan per stemming 1 byte: 0 klassiek, 1 modern, 2 speels, 3 technisch, 4 warm, 5 statig. De volgorde blijft |
| sjabloon | 1 byte: 0 website, 1 boek, 2 affiche, 3 dia, 4 briefpapier, 5 app |
| klem | 1 byte: 0 geen, 1 kop, 2 tekst |
| stijl van de kop | een stijl, zie hieronder |
| stijl van de tekst | een stijl |
| maat | varint, broodtekst in px maal 10 |
| interlinie | varint, maal 100 |
| verhouding | varint, maal 1000 |
| regel | varint, tekens per regel |
| uitlijning | 1 byte: 0 links, 1 midden, 2 uitvullen |
| vlaggen | 1 byte: bit 0 tabelcijfers, bit 1 mooi afbreken (`text-wrap: pretty`), bit 2 er is een tweede inkt |
| inkt | 3 bytes sRGB |
| papier | 3 bytes sRGB |
| tweede inkt | 3 bytes sRGB, alleen als bit 2 van de vlaggen aan staat |
| zin | varint lengte, dan UTF-8, hooguit 280 tekens |

**Een letter** is 1 byte soort, dan:

- soort 0, uit de kast: varint lengte en de Fontsource-id in UTF-8 (`fraunces`, `inter`);
- soort 1, een eigen font: varint lengte en de naam in UTF-8 (hooguit 60 tekens), dan de id van een vervanger uit de kast. **Het fontbestand zelf gaat nooit mee.** Wie de link opent, ziet de vervanger, met de naam van het eigen font erbij.

**Een stijl** is:

| Veld | Vorm |
|---|---|
| gewicht | varint |
| cursief | 1 byte, 0 of 1 |
| spatiëring | signed varint, in em maal 1000 |
| assen | 1 byte aantal (hooguit 8), dan per as 4 bytes tag in ASCII (`opsz`, `wdth`) en een signed varint, de stand maal 10 |

Een varint is zeven bits per byte, de laagste eerst, met de hoogste bit aan zolang er nog een byte volgt. Een signed varint is eerst zigzag (0, -1, 1, -2, 2 … wordt 0, 1, 2, 3, 4) en dan een varint. Dat is hetzelfde als in het flesje van de Kleurenalchemist.

**De tekst staat erin.** Wie de link opent, ziet dezelfde zin op hetzelfde vel. De pagina zegt daarom ook, bij het delen, dat de zin in de link staat.

Een gewoon vel past in ongeveer 100 tekens, plus de zin.

## Vel, versie 2

Versie 2 is versie 1 (met versiebyte `2`), met na de zin nog vier teksten, elk als varint lengte en UTF-8:

| Veld | Vorm |
|---|---|
| naam | de naam van je project, hooguit 40 tekens |
| alinea | een alinea, hooguit 800 tekens, regeleinden mogen |
| knop | de tekst op een knop, hooguit 40 tekens |
| menu | een menu, de onderdelen met komma's ertussen, hooguit 80 tekens |

Een lege tekst is lengte 0: dan zet het sjabloon zijn eigen voorbeeld. Een link van versie 1 opent met lege teksten. Nieuwe links zijn altijd versie 2.

## Waslijn, versie 1

| Veld | Vorm |
|---|---|
| versie | 1 byte, nu `1` |
| aantal vellen | varint, hooguit 24 |
| per vel | varint lengte, dan de bytes van een vel zoals hierboven (met zijn eigen versiebyte) |

## Nieuwe versies

Een nieuwe versie krijgt een nieuw versienummer en een eigen lezer. De oude lezers blijven staan. In `share.test.ts` staan bevroren codes van versie 1 en versie 2 die altijd gelezen moeten blijven worden. Een lezer die een onbekende versie tegenkomt, of bytes over heeft, geeft `null` terug en struikelt niet.

## Een flesje uit de Kleurenalchemist

De Letterzetterij leest ook flesjes- en plankenlinks uit de Kleurenalchemist (`/fles/<code>`, `/plank/<code>`), volgens het [linkformaat van de Kleurenalchemist](https://github.com/otisvdstelt/otis-kleurenalchemist/blob/main/docs/LINKFORMAAT.md). Dat gebeurt in `src/lib/type/flesje.ts`:

- `codeFromLink` haalt de code uit een hele link (van welke site ook), een pad, of de code zelf;
- de rol `tekst` wordt de inkt, `achtergrond` het papier en `accent` de tweede inkt;
- een plank geeft alle flesjes, om er een uit te kiezen;
- een versie die we niet kennen geeft `null`, en de pagina zegt dan netjes dat dit flesje te nieuw is.

De test leest het bevroren flesje "Mos na regen" uit de Kleurenalchemist, zodat een verandering daar hier meteen opvalt.
