// draco3dgltf levert geen types. Alleen wat het bakscript gebruikt
declare module 'draco3dgltf' {
  const draco3d: {
    createEncoderModule(): Promise<unknown>
    createDecoderModule(): Promise<unknown>
  }
  export default draco3d
}
