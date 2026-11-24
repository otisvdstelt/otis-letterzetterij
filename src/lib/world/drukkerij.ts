// De drukkerij, in code gebouwd. Een kamer met een raam, de handpers in het midden, de letterkast links,
// de werkbank met het zetboek rechts, een waslijn erboven, een lamp boven de pers, en de drukker zelf.
// npm run world bakt dit naar één Draco-bestand. Stukken die bewegen hebben een eigen naam en een draaipunt

import type { BufferGeometry } from 'three'
import { box, blob, cyl, extrude, join, lathe, limb, part, put, ring, roughen, slab, type Part, type Tint } from './kit.ts'
import { seeded } from './noise.ts'
import { BENCH, DRAWER_HEIGHT, DRUKKER, KAST, LAMP, PRESS, ROOM, WASLIJN, WINDOW, ZETBOEK, drawerAt, lineAt } from './spec.ts'

const C = {
  oak: '#6b4a33',
  oakLight: '#80593c',
  oakDeep: '#3e271a',
  iron: '#33363b',
  ironLight: '#4b4e52',
  lead: '#7d8186',
  brass: '#b08a4a',
  plaster: ['#d9ccb2', '#efe6d3'] as Tint,
  floor: '#7d5c42',
  floorDark: '#6a4b35',
  paper: '#f4eedf',
  paperWarm: '#ebe1c9',
  apron: '#d6c9a8',
  shirt: '#e6dfd0',
  trousers: '#3a3f4a',
  skin: '#e0b394',
  hair: '#6b5443',
  garter: '#8f4526',
  ink: '#1d1b19',
  moss: '#3b533e',
  terracotta: '#b8623b',
  sky: '#f4f1dc',
  rope: '#c8b48c',
  shade: '#3b533e',
}

/** Een boog van punten rond (cx, cy), van hoek a naar b */
function arc(cx: number, cy: number, rx: number, ry: number, a: number, b: number, steps = 10): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = a + ((b - a) * i) / steps
    return [cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]
  })
}

/** De kamer: vloer van planken, de achtermuur met een raam, een stukje zijmuur en een plint */
function room(): Part[] {
  const pieces: BufferGeometry[] = []
  const random = seeded(7)
  // Planken van voor naar achter
  for (let x = ROOM.left; x < ROOM.right; x += 0.36) {
    pieces.push(roughen(slab(x + 0.008, Math.min(ROOM.right, x + 0.352), -0.04, 0, ROOM.back, ROOM.front, random() > 0.5 ? C.floor : C.floorDark), 0.004, Math.floor(x * 10)))
  }
  // De achtermuur, met een gat voor het raam
  pieces.push(slab(ROOM.left, WINDOW.x0, 0, ROOM.height, ROOM.back - 0.12, ROOM.back, C.plaster))
  pieces.push(slab(WINDOW.x1, ROOM.right, 0, ROOM.height, ROOM.back - 0.12, ROOM.back, C.plaster))
  pieces.push(slab(WINDOW.x0, WINDOW.x1, 0, WINDOW.y0, ROOM.back - 0.12, ROOM.back, C.plaster))
  pieces.push(slab(WINDOW.x0, WINDOW.x1, WINDOW.y1, ROOM.height, ROOM.back - 0.12, ROOM.back, C.plaster))
  // De zijmuur links
  pieces.push(slab(ROOM.left - 0.12, ROOM.left, 0, ROOM.height, ROOM.back - 0.12, 0.6, C.plaster))
  // Plint en een balk onder het plafond
  pieces.push(slab(ROOM.left, ROOM.right, 0, 0.12, ROOM.back, ROOM.back + 0.03, C.oakDeep))
  pieces.push(slab(ROOM.left, ROOM.right, ROOM.height - 0.25, ROOM.height - 0.05, ROOM.back, ROOM.back + 0.22, C.oakDeep))
  // Het raam: kozijn en roeden
  const frame = (x0: number, x1: number, y0: number, y1: number) => slab(x0, x1, y0, y1, ROOM.back - 0.08, ROOM.back + 0.04, C.oak)
  pieces.push(frame(WINDOW.x0 - 0.06, WINDOW.x1 + 0.06, WINDOW.y0 - 0.08, WINDOW.y0), frame(WINDOW.x0 - 0.06, WINDOW.x1 + 0.06, WINDOW.y1, WINDOW.y1 + 0.06))
  pieces.push(frame(WINDOW.x0 - 0.06, WINDOW.x0, WINDOW.y0, WINDOW.y1), frame(WINDOW.x1, WINDOW.x1 + 0.06, WINDOW.y0, WINDOW.y1))
  const midX = (WINDOW.x0 + WINDOW.x1) / 2
  const midY = (WINDOW.y0 + WINDOW.y1) / 2
  pieces.push(frame(midX - 0.025, midX + 0.025, WINDOW.y0, WINDOW.y1), frame(WINDOW.x0, WINDOW.x1, midY - 0.025, midY + 0.025))
  // Een vensterbank met een inktblik
  pieces.push(slab(WINDOW.x0 - 0.12, WINDOW.x1 + 0.12, WINDOW.y0 - 0.12, WINDOW.y0 - 0.08, ROOM.back, ROOM.back + 0.2, C.oakLight))
  pieces.push(inkCan([WINDOW.x0 + 0.25, WINDOW.y0 - 0.08, ROOM.back + 0.1], C.moss))

  const pane = slab(WINDOW.x0, WINDOW.x1, WINDOW.y0, WINDOW.y1, ROOM.back - 0.1, ROOM.back - 0.09, C.sky)
  // De bundel zonlicht die door het raam schuin naar binnen valt
  const shaft = extrude(
    [
      [WINDOW.x0, WINDOW.y1],
      [WINDOW.x1, WINDOW.y1],
      [WINDOW.x1 + 1.4, 0.02],
      [WINDOW.x0 + 1.1, 0.02],
    ],
    1.1,
    ['#fff3d6', '#fff8e8'],
    { at: [0, 0, ROOM.back + 0.65] },
  )
  return [part('kamer', pieces), part('raam', [pane], 'glow'), part('licht', [shaft], 'light')]
}

function inkCan(at: readonly [number, number, number], label: string): BufferGeometry {
  return join([cyl(0.07, 0.07, 0.11, C.ironLight, { at }, 14), cyl(0.071, 0.071, 0.06, label, { at: [at[0], at[1] + 0.03, at[2]] }, 14), cyl(0.06, 0.068, 0.012, C.lead, { at: [at[0], at[1] + 0.11, at[2]] }, 14)])
}

/** De handpers: poten, bed, de ijzeren boog, de veerkast, en apart de degel, de hendel en de rol */
function press(): Part[] {
  const { bedY, bedX, bedDepth, cheekX, archTop, platen, lever, roller } = PRESS
  const d = bedDepth / 2
  const frame: BufferGeometry[] = []
  // Vier poten en een onderregel
  for (const x of [bedX[0] + 0.08, bedX[1] - 0.08]) {
    for (const z of [-d + 0.05, d - 0.05]) frame.push(box(0.08, bedY - 0.08, 0.08, C.iron, { at: [x, 0, z] }))
  }
  frame.push(slab(bedX[0] + 0.08, bedX[1] - 0.08, 0.16, 0.22, -d + 0.03, -d + 0.09, C.iron), slab(bedX[0] + 0.08, bedX[1] - 0.08, 0.16, 0.22, d - 0.09, d - 0.03, C.iron))
  // De rails en het bed
  frame.push(slab(bedX[0], bedX[1], bedY - 0.1, bedY - 0.06, -d, d, C.iron))
  frame.push(slab(bedX[0] + 0.05, bedX[1] - 0.05, bedY - 0.06, bedY - 0.02, -d + 0.04, d - 0.04, C.ironLight))
  // De inktplaat links op het bed, al zwart van de inkt
  frame.push(slab(bedX[0] + 0.04, bedX[0] + 0.42, bedY - 0.02, bedY + 0.005, -d + 0.08, d - 0.08, C.ink))
  // Het tympaan, het raam waar het vel in ligt, en het zetsel eronder
  frame.push(slab(-0.36, 0.36, bedY - 0.02, bedY + 0.012, -0.27, 0.27, C.lead))
  // De ijzeren boog, een stuk gegoten ijzer met een gat erin
  const outer: [number, number][] = [[-cheekX - 0.08, bedY - 0.1], ...arc(0, archTop - 0.32, cheekX + 0.08, 0.32, Math.PI, 0, 14), [cheekX + 0.08, bedY - 0.1]]
  const inner: [number, number][] = [[cheekX - 0.04, bedY - 0.1], ...arc(0, archTop - 0.36, cheekX - 0.04, 0.24, 0, Math.PI, 14), [-cheekX + 0.04, bedY - 0.1]]
  frame.push(roughen(extrude([...outer, ...inner], 0.16, C.iron), 0.003, 2))
  // Een sierrand op de boog, zoals bij een Albion
  frame.push(extrude(arc(0, archTop - 0.32, cheekX + 0.02, 0.28, Math.PI * 0.85, Math.PI * 0.15, 12).concat(arc(0, archTop - 0.32, cheekX - 0.02, 0.24, Math.PI * 0.15, Math.PI * 0.85, 12)), 0.18, C.brass))
  // De veerkast bovenop
  frame.push(cyl(0.09, 0.09, 0.22, C.ironLight, { at: [0, archTop - 0.02, 0] }, 14), cyl(0.11, 0.11, 0.03, C.iron, { at: [0, archTop + 0.18, 0] }, 14))
  // Het draaipunt van de hendel en de as naar de degel
  frame.push(cyl(0.035, 0.035, 0.5, C.lead, { at: [0, archTop - 0.65, 0] }, 10))
  frame.push(cyl(0.06, 0.06, 0.09, C.iron, { at: [lever.pivot[0], lever.pivot[1], lever.pivot[2] - 0.05], rot: [Math.PI / 2, 0, 0] }, 12))

  // De degel, apart, omdat hij zakt
  const [pw, ph, pd] = platen.size
  const degel = [box(pw, ph, pd, C.lead, { at: [platen.pivot[0], platen.pivot[1] - ph, platen.pivot[2]] }), box(pw * 0.6, 0.05, pd * 0.6, C.ironLight, { at: [platen.pivot[0], platen.pivot[1], platen.pivot[2]] })]

  // De hendel, apart, omdat hij om zijn draaipunt draait
  const handle = [
    limb(lever.pivot, lever.tip, 0.03, 0.022, C.iron),
    limb(lever.tip, [lever.tip[0] + 0.24, lever.tip[1] + 0.09, lever.tip[2] + 0.02], 0.035, 0.03, C.oak),
    ring(0.045, 0.018, C.iron, { at: lever.pivot, rot: [0, 0, 0] }),
  ]

  // De inktrol: een rubberen cilinder met een ijzeren beugel en een houten handvat
  const r = roller.radius
  const rol = [
    cyl(r, r, roller.length, C.ink, { at: [roller.pivot[0], roller.pivot[1], roller.pivot[2] - roller.length / 2], rot: [Math.PI / 2, 0, 0] }, 16),
    limb([roller.pivot[0], roller.pivot[1], roller.pivot[2] - roller.length / 2 - 0.02], [roller.pivot[0] - 0.12, roller.pivot[1] + 0.22, roller.pivot[2]], 0.012, 0.012, C.iron),
    limb([roller.pivot[0], roller.pivot[1], roller.pivot[2] + roller.length / 2 + 0.02], [roller.pivot[0] - 0.12, roller.pivot[1] + 0.22, roller.pivot[2]], 0.012, 0.012, C.iron),
    limb([roller.pivot[0] - 0.12, roller.pivot[1] + 0.22, roller.pivot[2]], [roller.pivot[0] - 0.3, roller.pivot[1] + 0.36, roller.pivot[2]], 0.025, 0.022, C.oak),
  ]

  return [part('pers', frame), part('degel', degel, 'paint', platen.pivot), part('hendel', handle, 'paint', lever.pivot), part('rol', rol, 'paint', roller.pivot)]
}

/** De letterkast: een eiken kast met zes laatjes, en bovenop een schuine kast vol vakjes */
function kast(): Part[] {
  const { x0, x1, z0, depth, height } = KAST
  const body: BufferGeometry[] = [
    roughen(slab(x0, x1, 0, height, z0, z0 + depth - 0.02, C.oakDeep), 0.004, 3),
    slab(x0 - 0.03, x1 + 0.03, height - 0.04, height, z0, z0 + depth + 0.02, C.oak),
    slab(x0 - 0.03, x1 + 0.03, 0, 0.08, z0, z0 + depth + 0.02, C.oak),
  ]
  // De schuine kast met vakjes: een bak, op zijn achterkant opgetild
  const w = x1 - x0
  const cd = KAST.case.depth
  const tray: BufferGeometry[] = [slab(-w / 2, w / 2, 0, 0.03, -cd / 2, cd / 2, C.oak)]
  tray.push(slab(-w / 2, w / 2, 0, 0.07, -cd / 2, -cd / 2 + 0.025, C.oak), slab(-w / 2, w / 2, 0, 0.07, cd / 2 - 0.025, cd / 2, C.oak))
  tray.push(slab(-w / 2, -w / 2 + 0.025, 0, 0.07, -cd / 2, cd / 2, C.oak), slab(w / 2 - 0.025, w / 2, 0, 0.07, -cd / 2, cd / 2, C.oak))
  // Vakjes: rijen en kolommen, de grote vakken in het midden voor de e en de spatie
  for (let i = 1; i < 12; i++) {
    const x = -w / 2 + (w * i) / 12
    tray.push(slab(x - 0.006, x + 0.006, 0.03, 0.06, -cd / 2, cd / 2, C.oakLight))
  }
  for (let j = 1; j < 6; j++) {
    const z = -cd / 2 + (cd * j) / 6
    tray.push(slab(-w / 2, w / 2, 0.03, 0.06, z - 0.006, z + 0.006, C.oakLight))
  }
  // Wat lood in de vakjes
  const random = seeded(11)
  for (let i = 0; i < 40; i++) {
    const x = -w / 2 + ((Math.floor(random() * 12) + 0.5) * w) / 12
    const z = -cd / 2 + ((Math.floor(random() * 6) + 0.5) * cd) / 6
    tray.push(box(0.05 + random() * 0.04, 0.012, 0.03 + random() * 0.03, C.lead, { at: [x, 0.03, z] }))
  }
  const caseGeometry = put(join(tray), { at: [(x0 + x1) / 2, height + 0.08, z0 + depth / 2], rot: [KAST.case.tilt, 0, 0] })
  // Twee steunen die de bak schuin houden
  body.push(box(0.04, 0.22, 0.04, C.oakDeep, { at: [x0 + 0.08, height, z0 + 0.12] }), box(0.04, 0.22, 0.04, C.oakDeep, { at: [x1 - 0.08, height, z0 + 0.12] }))

  // Zes laatjes, elk apart, zodat ze open kunnen schuiven
  const drawers = Array.from({ length: KAST.drawers }, (_, i) => {
    const at = drawerAt(i)
    const front = box(w - 0.08, DRAWER_HEIGHT - 0.035, 0.04, i % 2 ? C.oak : C.oakLight, { at: [0, -(DRAWER_HEIGHT - 0.035) / 2, -0.02] })
    const knob = cyl(0.022, 0.026, 0.035, C.brass, { at: [0, -0.012, 0], rot: [Math.PI / 2, 0, 0] }, 10)
    const card = box(0.22, 0.07, 0.006, C.paper, { at: [0, -0.035 + 0.05, 0.003] })
    return part(`laatje-${i}`, [put(front, { at }), put(knob, { at: [at[0], at[1] - 0.06, at[2] + 0.02] }), put(card, { at: [at[0], at[1] - 0.02, at[2]] })], 'paint', at)
  })
  return [part('kast', [...body, caseGeometry]), ...drawers]
}

/** De werkbank, met papier, inktblikken, een galei en het zetboek */
function bench(): Part[] {
  const { x0, x1, z0, z1, height } = BENCH
  const pieces: BufferGeometry[] = [roughen(slab(x0, x1, height - 0.06, height, z0, z1, C.oakLight), 0.004, 5)]
  for (const x of [x0 + 0.08, x1 - 0.08]) for (const z of [z0 + 0.08, z1 - 0.08]) pieces.push(box(0.07, height - 0.06, 0.07, C.oak, { at: [x, 0, z] }))
  pieces.push(slab(x0 + 0.08, x1 - 0.08, 0.18, 0.22, z0 + 0.06, z1 - 0.06, C.oak))
  // Stapels papier, elk vel een beetje scheef
  const random = seeded(19)
  for (const [px, pz, n] of [[3.2, -1.1, 14], [3.25, -0.8, 8]] as const) {
    for (let i = 0; i < n; i++) pieces.push(box(0.42, 0.006, 0.3, i % 3 ? C.paper : C.paperWarm, { at: [px + (random() - 0.5) * 0.02, height + i * 0.007, pz], rot: [0, (random() - 0.5) * 0.12, 0] }))
  }
  // Stapels onder de bank
  for (let i = 0; i < 10; i++) pieces.push(box(0.5, 0.008, 0.36, C.paperWarm, { at: [2.9, 0.22 + i * 0.009, -1.0], rot: [0, (random() - 0.5) * 0.08, 0] }))
  // Inktblikken
  pieces.push(inkCan([2.75, height, -1.3], C.terracotta), inkCan([2.92, height, -1.32], C.ink), inkCan([2.83, height, -1.18], C.moss))
  // De galei: een plat ijzeren bakje met wat regels lood erin
  pieces.push(slab(1.85, 2.0, height, height + 0.025, -0.72, -0.62, C.ironLight))
  pieces.push(slab(2.55, 2.95, height, height + 0.02, -0.75, -0.6, C.iron))
  for (let i = 0; i < 5; i++) pieces.push(slab(2.58, 2.58 + 0.12 + random() * 0.2, height + 0.02, height + 0.035, -0.74 + i * 0.026, -0.72 + i * 0.026, C.lead))
  // De winkelhaak, het bakje waarin de zetter een regel zet
  pieces.push(slab(2.05, 2.35, height, height + 0.015, -0.68, -0.6, C.brass), slab(2.05, 2.065, height, height + 0.04, -0.68, -0.6, C.brass))

  // Het zetboek, open, met zijn draaipunt in de rug
  const { at, rot, width, depth } = ZETBOEK
  const book: BufferGeometry[] = []
  for (const side of [-1, 1]) {
    book.push(box(width / 2, 0.012, depth, C.moss, { at: [(side * width) / 4, -0.03, 0], rot: [0, 0, side * -0.05] }))
    book.push(box(width / 2 - 0.02, 0.03, depth - 0.02, C.paper, { at: [(side * (width / 2 - 0.02)) / 2, -0.022, 0], rot: [0, 0, side * -0.05] }))
  }
  book.push(cyl(0.012, 0.012, depth, C.moss, { at: [0, -0.03, -depth / 2], rot: [Math.PI / 2, 0, 0] }, 8))
  const zetboek = part('zetboek', [put(join(book), { at, rot: [0, rot, 0] })], 'paint', at)

  return [part('bank', pieces), zetboek]
}

/** De waslijn: een touw met twee haken, licht doorhangend */
function line(): Part[] {
  const pieces: BufferGeometry[] = []
  const steps = 16
  for (let i = 0; i < steps; i++) pieces.push(limb(lineAt(i / steps), lineAt((i + 1) / steps), 0.007, 0.007, C.rope, 5))
  pieces.push(cyl(0.02, 0.02, 0.1, C.iron, { at: [WASLIJN.from[0], WASLIJN.from[1] - 0.05, WASLIJN.from[2]] }, 8))
  pieces.push(box(0.12, 0.06, 0.04, C.oakDeep, { at: [WASLIJN.to[0], WASLIJN.to[1] - 0.03, WASLIJN.to[2]] }))
  // Het touw naar de pers is vastgemaakt aan een paal
  pieces.push(box(0.05, WASLIJN.from[1], 0.05, C.oakDeep, { at: [WASLIJN.from[0], 0, WASLIJN.from[2]] }))
  return [part('waslijn', pieces)]
}

/** De lamp boven de pers: een snoer, een groene kap en een gloeiende peer */
function lamp(): Part[] {
  const [x, y, z] = LAMP.at
  const shade = lathe(
    [
      [0.02, 0.12],
      [0.05, 0.11],
      [0.18, 0.0],
      [0.19, -0.01],
    ],
    C.shade,
    { at: [x, y, z] },
    18,
  )
  const cord = limb([x, ROOM.height, z], [x, y + 0.12, z], 0.008, 0.008, C.ink, 5)
  const bulb = blob(0.05, '#ffe8b0', { at: [x, y + 0.01, z] }, 0.05, 1, 1)
  return [part('lamp', [shade, cord]), part('lamp-gloed', [bulb], 'glow')]
}

/**
 * De drukker, in zijn eigen ruimte (voeten op de oorsprong, kijkend naar +z). De app zet hem op zijn plek.
 * Een schort met inktvlekken, een bril en mouwophouders. Hoofd en armen zijn apart, met hun draaipunt
 */
function drukker(): Part[] {
  const body: BufferGeometry[] = [
    // Benen en schoenen
    limb([-0.09, 0.06, 0], [-0.1, 0.82, 0], 0.07, 0.08, C.trousers),
    limb([0.09, 0.06, 0], [0.1, 0.82, 0], 0.07, 0.08, C.trousers),
    box(0.11, 0.07, 0.2, C.ink, { at: [-0.09, 0, 0.03] }),
    box(0.11, 0.07, 0.2, C.ink, { at: [0.09, 0, 0.03] }),
    // Het lijf, een hemd
    lathe(
      [
        [0.001, 0.8],
        [0.17, 0.82],
        [0.2, 1.0],
        [0.22, 1.3],
        [0.2, 1.44],
        [0.09, 1.5],
        [0.001, 1.51],
      ],
      C.shirt,
      undefined,
      14,
    ),
    // De schort, met een paar vlekken inkt
    put(
      extrude(
        [
          [-0.17, 0.45],
          [0.17, 0.45],
          [0.2, 1.05],
          [0.13, 1.3],
          [-0.13, 1.3],
          [-0.2, 1.05],
        ],
        0.02,
        C.apron,
      ),
      { at: [0, 0, 0.215] },
    ),
    blob(0.035, C.ink, { at: [0.06, 0.85, 0.226], scale: [1, 1, 0.15] }, 0.3, 1, 1),
    blob(0.022, C.ink, { at: [-0.08, 0.66, 0.226], scale: [1, 1, 0.15] }, 0.3, 2, 1),
    blob(0.018, C.terracotta, { at: [-0.02, 1.1, 0.222], scale: [1, 1, 0.15] }, 0.3, 3, 1),
    // Het bandje van de schort om zijn nek
    limb([-0.12, 1.3, 0.2], [-0.05, 1.5, 0.08], 0.008, 0.008, C.apron, 4),
    limb([0.12, 1.3, 0.2], [0.05, 1.5, 0.08], 0.008, 0.008, C.apron, 4),
  ]

  const [nx, ny, nz] = DRUKKER.neck
  const head: BufferGeometry[] = [
    cyl(0.045, 0.05, 0.08, C.skin, { at: [nx, ny - 0.02, nz] }, 10),
    blob(0.13, C.skin, { at: [nx, ny + 0.16, nz + 0.01], scale: [1, 1.12, 1] }, 0.06, 4, 2),
    // Haar, een beetje dun bovenop
    blob(0.135, C.hair, { at: [nx, ny + 0.2, nz - 0.03], scale: [1.02, 0.9, 0.95] }, 0.12, 5, 2),
    // De neus
    blob(0.028, '#d39f80', { at: [nx, ny + 0.15, nz + 0.13] }, 0.1, 6, 1),
    // De bril: twee ronde glazen en een brug
    ring(0.036, 0.006, C.iron, { at: [nx - 0.05, ny + 0.19, nz + 0.125] }, 14, 4),
    ring(0.036, 0.006, C.iron, { at: [nx + 0.05, ny + 0.19, nz + 0.125] }, 14, 4),
    limb([nx - 0.015, ny + 0.195, nz + 0.13], [nx + 0.015, ny + 0.195, nz + 0.13], 0.005, 0.005, C.iron, 4),
    limb([nx - 0.085, ny + 0.19, nz + 0.12], [nx - 0.12, ny + 0.2, nz + 0.02], 0.004, 0.004, C.iron, 4),
    limb([nx + 0.085, ny + 0.19, nz + 0.12], [nx + 0.12, ny + 0.2, nz + 0.02], 0.004, 0.004, C.iron, 4),
    // Een snor, want hij drukt al veertig jaar
    blob(0.04, C.hair, { at: [nx, ny + 0.105, nz + 0.115], scale: [1.4, 0.45, 0.6] }, 0.2, 7, 1),
  ]

  const arm = (side: -1 | 1, shoulder: readonly [number, number, number]) => {
    const [sx, sy, sz] = shoulder
    const elbow: [number, number, number] = [sx + side * 0.06, sy - 0.3, sz + 0.03]
    const wrist: [number, number, number] = [sx + side * 0.04, sy - 0.58, sz + 0.1]
    return part(
      side < 0 ? 'drukker-arm-l' : 'drukker-arm-r',
      [
        limb(shoulder, elbow, 0.055, 0.05, C.shirt),
        // De mouwophouder, een rood bandje boven de elleboog
        ring(0.054, 0.012, C.garter, { at: [sx + side * 0.04, sy - 0.2, sz + 0.02], rot: [Math.PI / 2, 0, 0] }, 12, 4),
        limb(elbow, wrist, 0.045, 0.04, C.shirt),
        blob(0.045, C.skin, { at: [wrist[0], wrist[1] - 0.03, wrist[2]] }, 0.1, side + 9, 1),
      ],
      'paint',
      shoulder,
    )
  }

  return [part('drukker-lijf', body), part('drukker-hoofd', head, 'paint', DRUKKER.neck), arm(-1, DRUKKER.shoulderL), arm(1, DRUKKER.shoulderR)]
}

/** De hele drukkerij, stuk voor stuk */
export function buildDrukkerij(): Part[] {
  return [...room(), ...press(), ...kast(), ...bench(), ...line(), ...lamp(), ...drukker()]
}
