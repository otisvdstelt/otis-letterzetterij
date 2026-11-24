// fontkit levert geen types. Dit is alleen wat de drukkerij ervan gebruikt; de vorm staat in lib/type/metrics.ts (FontLike)

declare module 'fontkit/core' {
  export function create(buffer: Uint8Array, postscriptName?: string): unknown
  export function registerFormat(format: unknown): void
}

declare module 'fontkit/formats/TTFFont' {
  export const TTFFont: unknown
}

declare module 'fontkit/formats/WOFFFont' {
  export const WOFFFont: unknown
}

declare module 'fontkit/formats/WOFF2Font' {
  export const WOFF2Font: unknown
}
