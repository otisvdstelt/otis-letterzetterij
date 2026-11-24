import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { crc32, makeZip } from './zip'

describe('zip', () => {
  it('rekent de CRC-32 goed uit', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
  })

  it('geeft een zip die unzip kan lezen, met de bestanden ongeschonden', () => {
    const text = new TextEncoder().encode('Hallo, drukker.')
    const bytes = Uint8Array.from({ length: 300 }, (_, i) => (i * 7) % 256)
    const zip = makeZip([
      { name: 'letters.css', data: text },
      { name: 'fonts/inter-latin.woff2', data: bytes },
    ])
    const dir = mkdtempSync(join(tmpdir(), 'lz-zip-'))
    writeFileSync(join(dir, 'vel.zip'), zip)
    execFileSync('unzip', ['-qo', join(dir, 'vel.zip'), '-d', join(dir, 'uit')])
    expect(readFileSync(join(dir, 'uit', 'letters.css'), 'utf8')).toBe('Hallo, drukker.')
    expect([...readFileSync(join(dir, 'uit', 'fonts', 'inter-latin.woff2'))]).toEqual([...bytes])
  })
})
