// Of er nog iets beweegt. Zolang wel, vraagt de drukkerij om frames, anders staat hij stil (frameloop demand)

let until = 0

export const motion = {
  /** Hou de drukkerij nog zoveel seconden wakker */
  wake(seconds: number) {
    until = Math.max(until, performance.now() + seconds * 1000)
  },
  awake: () => performance.now() < until,
}
