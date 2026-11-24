// Bytes schrijven en lezen voor een deellink, en base64url eromheen. Hetzelfde als in de Kleurenalchemist,
// zodat een flesjeslink hier precies zo gelezen wordt als daar

export class Writer {
  bytes: number[] = []
  byte(v: number) {
    this.bytes.push(v & 0xff)
  }
  /** Een geheel getal zo kort als het kan, zeven bits per byte */
  varint(v: number) {
    let n = Math.max(0, Math.floor(v))
    while (n >= 0x80) {
      this.byte((n & 0x7f) | 0x80)
      n = Math.floor(n / 128)
    }
    this.byte(n)
  }
  /** Een getal dat ook negatief mag zijn (zigzag) */
  signed(v: number) {
    const n = Math.round(v)
    this.varint(n >= 0 ? n * 2 : -n * 2 - 1)
  }
  uint32(v: number) {
    for (let i = 0; i < 4; i++) this.byte((v >>> (8 * i)) & 0xff)
  }
  hex(hex: string) {
    for (let i = 1; i < 7; i += 2) this.byte(parseInt(hex.slice(i, i + 2), 16))
  }
  text(value: string) {
    const encoded = new TextEncoder().encode(value)
    this.varint(encoded.length)
    for (const b of encoded) this.byte(b)
  }
  raw(bytes: Uint8Array) {
    this.varint(bytes.length)
    for (const b of bytes) this.byte(b)
  }
  done() {
    return Uint8Array.from(this.bytes)
  }
}

export class Reader {
  at = 0
  bytes: Uint8Array
  constructor(bytes: Uint8Array) {
    this.bytes = bytes
  }
  byte() {
    if (this.at >= this.bytes.length) throw new RangeError('link te kort')
    return this.bytes[this.at++]
  }
  varint() {
    let result = 0
    let scale = 1
    for (let i = 0; i < 6; i++) {
      const b = this.byte()
      result += (b & 0x7f) * scale
      if (b < 0x80) return result
      scale *= 128
    }
    throw new RangeError('getal te lang')
  }
  signed() {
    const n = this.varint()
    return n % 2 === 0 ? n / 2 : -(n + 1) / 2
  }
  uint32() {
    let v = 0
    for (let i = 0; i < 4; i++) v += this.byte() * 2 ** (8 * i)
    return v >>> 0
  }
  hex() {
    let out = '#'
    for (let i = 0; i < 3; i++) out += this.byte().toString(16).padStart(2, '0')
    return out
  }
  text(max = Infinity) {
    const length = this.varint()
    if (length > max * 4 || this.at + length > this.bytes.length) throw new RangeError('tekst te lang')
    const slice = this.bytes.subarray(this.at, this.at + length)
    this.at += length
    return new TextDecoder('utf-8', { fatal: true }).decode(slice)
  }
  raw() {
    const length = this.varint()
    if (this.at + length > this.bytes.length) throw new RangeError('stuk te lang')
    const slice = this.bytes.subarray(this.at, this.at + length)
    this.at += length
    return slice
  }
  get done() {
    return this.at === this.bytes.length
  }
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(code: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(code)) throw new RangeError('geen base64url')
  const padded = code.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (code.length % 4)) % 4)
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}
