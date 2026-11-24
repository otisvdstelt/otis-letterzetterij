// Bakt src/lib/world tot src/assets/drukkerij.glb: benoemde stukken met geschilderde hoekpunten.
// Draai met npm run world. Node draait dit bestand zoals het is, zodat het bakken en de app het eens zijn
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Document, NodeIO } from '@gltf-transform/core'
import { KHRDracoMeshCompression } from '@gltf-transform/extensions'
import { draco } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import { buildDrukkerij } from '../src/lib/world/drukkerij.ts'

/** Het prestatiebudget: de drukkerij blijft onder de 500 KB */
const BUDGET = 500 * 1024

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const parts = buildDrukkerij()

const doc = new Document()
doc.getRoot().getAsset().generator = 'letterzetterij build-world.ts'
const buffer = doc.createBuffer()
const scene = doc.createScene('Drukkerij')

// Materialen zodat het bestand in elke viewer leesbaar is. De app wisselt ze op naam voor zijn eigen
const materials = {
  paint: doc.createMaterial('paint').setRoughnessFactor(1).setMetallicFactor(0),
  glow: doc.createMaterial('glow').setRoughnessFactor(1).setMetallicFactor(0).setEmissiveFactor([0.8, 0.7, 0.4]),
  light: doc.createMaterial('light').setRoughnessFactor(1).setMetallicFactor(0).setAlphaMode('BLEND').setBaseColorFactor([1, 0.9, 0.7, 0.2]),
  paper: doc.createMaterial('paper').setRoughnessFactor(1).setMetallicFactor(0),
}

let triangles = 0
const weights: [string, number][] = []
const names = new Set<string>()
for (const { name, geometry, material, pivot } of parts) {
  if (names.has(name)) throw new Error(`${name} staat er twee keer in`)
  names.add(name)
  const index = geometry.getIndex()
  if (!index) throw new Error(`${name} heeft geen index`)
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals()
  triangles += index.count / 3
  weights.push([name, index.count / 3])
  const primitive = doc
    .createPrimitive()
    .setMaterial(materials[material])
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(index.array)).setBuffer(buffer))
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(geometry.getAttribute('position').array)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(geometry.getAttribute('normal').array)).setBuffer(buffer))
    .setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(new Float32Array(geometry.getAttribute('color').array)).setBuffer(buffer))
  const node = doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(primitive))
  if (pivot) node.setTranslation([pivot[0], pivot[1], pivot[2]])
  scene.addChild(node)
}

const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
})
const uncompressed = (await io.writeBinary(doc)).byteLength
await doc.transform(draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 9, quantizeColor: 8 }))
const glb = await io.writeBinary(doc)

const out = resolve(root, 'src/assets/drukkerij.glb')
await mkdir(dirname(out), { recursive: true })
await writeFile(out, glb)
console.log(`drukkerij.glb  ${parts.length} stukken, ${Math.round(triangles)} driehoeken, ${(uncompressed / 1024).toFixed(0)} KB -> ${(glb.byteLength / 1024).toFixed(0)} KB met Draco`)
for (const [name, count] of weights.sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${name} ${Math.round(count)}`)
if (glb.byteLength > BUDGET) {
  console.error('Te groot: de drukkerij moet onder de 500 KB blijven')
  process.exit(1)
}
