// De afdruk: een vel papier met jouw zin erop, zoals hij uit een handpers komt.
// Het tekstmasker wordt op een canvas gezet met de echte letter (die heeft de pagina al geladen).
// De shader maakt er drukwerk van: ongelijke inkt, randen die een beetje uitlopen, letters die in het papier
// gedrukt zijn (de normaal komt uit een vervaagd masker), en een papiertextuur per soort papier

import { CanvasTexture, Color, DoubleSide, LinearFilter, PlaneGeometry, ShaderMaterial, SRGBColorSpace } from 'three'
import { strings } from '../../content/strings'
import { air } from '../../lib/air'

/** Een vel is een vlak met genoeg punten om te wapperen. In de pers liggend, aan de lijn hangend aan zijn bovenrand */
export const sheetGeometry = new PlaneGeometry(0.52, 0.36, 16, 12)
export const hangingGeometry = new PlaneGeometry(0.42, 0.56, 12, 16).translate(0, -0.28, 0)

/** De papiersoorten, in de volgorde van de potjes. Een eigen kleur krijgt de eerste */
const PAPERS = Object.keys(strings.inkt.papieren)
export const paperKind = (hex: string) => Math.max(0, PAPERS.indexOf(hex))

export interface PrintText {
  zin: string
  /** De CSS-fontnaam van de kopletter, en zijn gewicht en stijl */
  family: string
  weight: number
  italic: boolean
  /** Een regel eronder, in de tekstletter */
  onder: string
  onderFamily: string
}

/** Zet de zin op een canvas: wit op zwart, als masker. Het kleuren doet de shader */
export async function printMask(text: PrintText, width = 1024, height = 720): Promise<CanvasTexture> {
  const kop = `${text.italic ? 'italic ' : ''}${text.weight} 96px ${text.family}`
  await Promise.allSettled([document.fonts.load(kop, text.zin), document.fonts.load(`400 32px ${text.onderFamily}`, text.onder)])
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'alphabetic'
  const margin = width * 0.09
  const room = width - margin * 2
  // De kop zo groot als past, in hooguit vier regels
  let size = 110
  let lines: string[] = []
  for (; size >= 36; size -= 6) {
    ctx.font = `${text.italic ? 'italic ' : ''}${text.weight} ${size}px ${text.family}`
    lines = []
    let line = ''
    for (const word of text.zin.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width > room && line) {
        lines.push(line)
        line = word
      } else line = next
    }
    if (line) lines.push(line)
    if (lines.length <= 4 && lines.length * size * 1.12 < height * 0.62) break
  }
  let y = margin + size
  for (const line of lines) {
    ctx.fillText(line, margin, y)
    y += size * 1.12
  }
  ctx.font = `400 34px ${text.onderFamily}`
  ctx.globalAlpha = 0.85
  ctx.fillText(text.onder, margin, Math.min(height - margin * 0.7, y + 30))
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.generateMipmaps = false
  return texture
}

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  uniform vec2 uWindDir;
  uniform float uSeed;
  varying vec2 vUv;
  varying float vShade;

  void main() {
    vUv = uv;
    vec3 p = position;
    // Een vel aan de lijn hangt aan zijn bovenrand en wappert onderaan het meest
    float hang = pow(1.0 - uv.y, 1.6);
    float gust = sin(uTime * 1.7 + uSeed * 6.0 + p.x * 3.0) * 0.6 + sin(uTime * 2.9 + uSeed * 3.1 + p.x * 7.0) * 0.4;
    p.z += uWind * hang * gust * 0.08 * (0.6 + uWindDir.x * 0.4);
    p.x += uWind * hang * uWindDir.y * 0.02 * gust;
    // Een vel ligt nooit helemaal plat: een zachte bolling
    p.z += sin(uv.x * 3.14159) * sin(uv.y * 3.14159) * 0.006;
    vShade = 1.0 - uWind * hang * abs(gust) * 0.12;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform sampler2D uMask;
  uniform vec3 uInk;
  uniform vec3 uPaper;
  uniform float uKind;
  uniform float uSeed;
  uniform float uInked;
  uniform vec2 uTexel;
  varying vec2 vUv;
  varying float vShade;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      s += a * noise(p);
      p = p * 2.03 + 7.1;
      a *= 0.5;
    }
    return s;
  }
  float mask(vec2 uv) {
    return texture2D(uMask, uv).r;
  }
  /** Een vervaagd masker: het lood duwt het papier in, en de inkt loopt een beetje uit */
  float soft(vec2 uv, float r) {
    float s = 0.0;
    s += mask(uv + vec2(r, 0.0) * uTexel);
    s += mask(uv - vec2(r, 0.0) * uTexel);
    s += mask(uv + vec2(0.0, r) * uTexel);
    s += mask(uv - vec2(0.0, r) * uTexel);
    s += mask(uv + vec2(r, r) * 0.7 * uTexel);
    s += mask(uv - vec2(r, r) * 0.7 * uTexel);
    s += mask(uv + vec2(r, -r) * 0.7 * uTexel);
    s += mask(uv - vec2(r, -r) * 0.7 * uTexel);
    return s / 8.0;
  }

  void main() {
    vec2 uv = vUv;
    // Per soort papier een eigen tand: glad krijtwit, vezelig kraft, gespikkeld haver
    float k = uKind;
    float scale = 180.0 + mod(k, 3.0) * 90.0;
    float tooth = fbm(uv * scale + uSeed);
    float fibre = k == 5.0 ? fbm(vec2(uv.x * 40.0, uv.y * 700.0) + uSeed) : 0.0;
    float speck = (k == 4.0 || k == 2.0) ? step(0.985, hash(floor(uv * 520.0) + uSeed)) : 0.0;
    vec3 paper = uPaper * (0.93 + tooth * 0.12 + fibre * 0.08) - speck * 0.12;

    // De letters zijn in het papier gedrukt: de rand van een vervaagd masker is een helling
    float blur = soft(uv, 3.0);
    float dx = soft(uv + vec2(uTexel.x * 2.0, 0.0), 2.0) - soft(uv - vec2(uTexel.x * 2.0, 0.0), 2.0);
    float dy = soft(uv + vec2(0.0, uTexel.y * 2.0), 2.0) - soft(uv - vec2(0.0, uTexel.y * 2.0), 2.0);
    float relief = clamp(dot(normalize(vec3(-dx, -dy, 0.25)), normalize(vec3(-0.5, 0.6, 0.6))), 0.0, 1.0);
    paper *= 0.94 + relief * 0.1;

    // Ongelijke inkt: hier wat dikker, daar wat dunner, en een rand die een beetje uitloopt
    float m = mask(uv);
    float bleed = smoothstep(0.15, 0.6, soft(uv, 1.6)) * (0.35 + 0.4 * noise(uv * 90.0 + uSeed));
    float ink = max(m, bleed * 0.55);
    float even = 0.72 + 0.34 * fbm(uv * 26.0 + uSeed * 3.0);
    // Waar het lood het papier net niet raakte, blijft wit over
    float bare = smoothstep(0.62, 0.78, noise(uv * 140.0 + uSeed * 7.0)) * 0.55;
    ink *= clamp(even - bare, 0.0, 1.0) * uInked;

    vec3 colour = mix(paper, uInk, clamp(ink, 0.0, 0.96));
    gl_FragColor = vec4(colour * vShade, 1.0);
    #include <colorspace_fragment>
  }
`

/** De wind langs de lijn, gedeeld door elk vel dat er hangt. De waslijn zet hem; een vel in de pers voelt hem niet */
export const windUniform = { value: 0 }

export interface PrintOptions {
  ink: string
  paper: string
  seed: number
  /** Hangt het aan de lijn? Dan wappert het mee met de wind */
  hanging?: boolean
}

/** Het materiaal van een afdruk. De textuur komt later, als de letter er is */
export function printMaterial({ ink, paper, seed, hanging = false }: PrintOptions): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    side: DoubleSide,
    uniforms: {
      uMask: { value: null },
      uInk: { value: new Color(ink) },
      uPaper: { value: new Color(paper) },
      uKind: { value: paperKind(paper) },
      uSeed: { value: seed % 97 },
      uInked: { value: 1 },
      uTexel: { value: [1 / 1024, 1 / 720] },
      uTime: air.time,
      uWind: hanging ? windUniform : { value: 0 },
      uWindDir: { value: [air.wind.x, air.wind.z] },
    },
  })
}
