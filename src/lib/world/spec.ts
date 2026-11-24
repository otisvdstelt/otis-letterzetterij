// De afspraak tussen bakken en app: waar alles in de drukkerij staat, waar stukken om draaien,
// en hoe de camera kijkt. Het bakscript bouwt hiermee, de app beweegt hiermee. In meters, de vloer op y = 0

export type Vec3 = readonly [number, number, number]

export const ROOM = {
  left: -4.4,
  right: 4.4,
  back: -2.4,
  front: 3.2,
  height: 3.6,
}

export const WINDOW = { x0: -1.5, x1: 0.1, y0: 1.25, y1: 2.75, z: ROOM.back }

/** De handpers, in het midden. Het bed loopt van links naar rechts, de boog staat er dwars over */
export const PRESS = {
  at: [0, 0, 0] as Vec3,
  /** Bovenkant van het bed, waar het zetsel op ligt */
  bedY: 0.78,
  bedX: [-1.15, 1.15] as const,
  bedDepth: 0.62,
  /** De twee wangen van de boog */
  cheekX: 0.42,
  archTop: 1.95,
  /** De degel hangt hier en zakt bij het trekken */
  platen: { pivot: [0, 1.12, 0] as Vec3, drop: 0.2, size: [0.66, 0.07, 0.5] as Vec3 },
  /** De hendel draait om dit punt, om de z-as. Positief is omlaag */
  lever: { pivot: [0.47, 1.42, 0.22] as Vec3, tip: [1.18, 1.86, 0.32] as Vec3, pull: 0.85 },
  /** De inktrol rust links op het bed, en rolt over het zetsel */
  roller: { pivot: [-0.85, 0.86, 0] as Vec3, radius: 0.07, length: 0.5, travel: [-0.85, -0.05] as const },
  /** Waar het zetsel ligt, en waar het vel uitkomt */
  forme: { at: [-0.02, 0.8, 0] as Vec3, width: 0.56, depth: 0.4 },
}

/** De letterkast tegen de muur links: een schuine kast bovenop, zes laatjes eronder */
export const KAST = {
  x0: -3.95,
  x1: -2.15,
  z0: ROOM.back + 0.05,
  depth: 0.62,
  height: 1.45,
  drawers: 6,
  /** De schuine kast met vakjes bovenop */
  case: { y: 1.45, tilt: 0.42, depth: 0.55 },
}

/** Waar een laatje zit (zijn voorkant, in het midden) */
export function drawerAt(i: number): Vec3 {
  const h = (KAST.height - 0.12) / KAST.drawers
  return [(KAST.x0 + KAST.x1) / 2, 0.08 + h * (KAST.drawers - 1 - i) + h / 2, KAST.z0 + KAST.depth]
}
export const DRAWER_HEIGHT = (KAST.height - 0.12) / KAST.drawers

/** De werkbank rechts, met het zetboek, papier, inktblikken en de galei */
export const BENCH = {
  x0: 1.75,
  x1: 3.75,
  z0: -1.5,
  z1: -0.55,
  height: 0.92,
}

/** De zetbank tussen de kast en de pers: hier legt de drukker drie paren klaar, en hier staat de winkelhaak */
export const ZETBANK = {
  x0: -2.08,
  x1: -1.32,
  z0: -1.05,
  z1: -0.3,
  height: 0.94,
}

/** Waar de drie paren op de zetbank liggen, van achter naar voor */
export const zetbankRow = (i: number): Vec3 => [(ZETBANK.x0 + ZETBANK.x1) / 2, ZETBANK.height, ZETBANK.z0 + 0.17 + i * 0.2]

/** De winkelhaak op de voorkant van de zetbank */
export const WINKELHAAK: Vec3 = [(ZETBANK.x0 + ZETBANK.x1) / 2 + 0.05, ZETBANK.height, ZETBANK.z1 - 0.07]

export const ZETBOEK = { at: [2.2, BENCH.height + 0.035, -0.95] as Vec3, rot: -0.12, width: 0.62, depth: 0.42 }

/** De waslijn hangt van de pers naar de rechtermuur, met plek voor zes vellen */
export const WASLIJN = {
  from: [0.35, 2.75, -1.75] as Vec3,
  to: [4.25, 2.62, -1.35] as Vec3,
  sag: 0.14,
  pins: 6,
}

/** Een punt op de lijn, t van 0 tot 1, met de doorhang */
export function lineAt(t: number): Vec3 {
  const { from, to, sag } = WASLIJN
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * sag, from[2] + (to[2] - from[2]) * t]
}

/** Waar vel i aan de lijn hangt */
export const pinAt = (i: number) => lineAt(0.14 + (i / (WASLIJN.pins - 1)) * 0.74)

/** De lamp boven de pers */
export const LAMP = { at: [0.05, 2.45, 0.15] as Vec3 }

/** De drukker staat rechts naast de pers, half naar je toe */
export const DRUKKER = {
  at: [1.2, 0, -0.35] as Vec3,
  turn: -0.35,
  /** Draaipunten, ten opzichte van zijn voeten */
  neck: [0, 1.52, 0] as Vec3,
  shoulderL: [-0.21, 1.4, 0] as Vec3,
  shoulderR: [0.21, 1.4, 0] as Vec3,
}

/** Hoe de camera kijkt, per plek. Breed de hele drukkerij, smal (een telefoon) wat dichter en wijder */
export interface View {
  position: Vec3
  target: Vec3
  fov: number
}

export const VIEWS: Record<'werkbank' | 'kast' | 'pers' | 'waslijn', { wide: View; narrow: View }> = {
  werkbank: {
    wide: { position: [2.25, 2.25, 2.9], target: [2.2, 0.95, -0.95], fov: 40 },
    narrow: { position: [2.45, 2.3, 3.1], target: [2.6, 0.9, -0.9], fov: 52 },
  },
  kast: {
    wide: { position: [-1.9, 1.85, 1.95], target: [-2.35, 0.95, -1.05], fov: 42 },
    narrow: { position: [-2.3, 2.1, 3.2], target: [-2.6, 0.9, -1.2], fov: 56 },
  },
  pers: {
    wide: { position: [0.3, 2.05, 4.7], target: [0.15, 1.2, -0.35], fov: 38 },
    narrow: { position: [0.3, 2.2, 5.6], target: [0.2, 1.15, -0.3], fov: 52 },
  },
  waslijn: {
    wide: { position: [2.1, 2.2, 1.35], target: [2.1, 2.35, -1.55], fov: 48 },
    narrow: { position: [2.3, 2.2, 3.0], target: [2.3, 2.35, -1.55], fov: 62 },
  },
}
