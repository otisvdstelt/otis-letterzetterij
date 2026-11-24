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
