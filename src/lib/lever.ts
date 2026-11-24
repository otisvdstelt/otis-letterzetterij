// Hoe ver de hendel nu omlaag is, 0 tot 1, terwijl iemand hem in de papieren laag sleept.
// De drukkerij in 3D leest dit elk frame, zodat de gebakken hendel meebeweegt met je hand

let angle = 0
let holding = false

export const lever = {
  set(value: number, held: boolean) {
    angle = Math.max(0, Math.min(1, value))
    holding = held
  },
  angle: () => angle,
  held: () => holding,
}
