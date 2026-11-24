import qrcode from 'qrcode-generator'
import { useMemo } from 'react'

/** Een QR-code als SVG, in de inkt van de drukkerij. Scan hem en je ziet het vel op je telefoon */
export function Qr({ text, label }: { text: string; label: string }) {
  const path = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(text, 'Byte')
    qr.make()
    const n = qr.getModuleCount()
    let d = ''
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`
    return { d, n }
  }, [text])
  return (
    <svg className="qr" viewBox={`-2 -2 ${path.n + 4} ${path.n + 4}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={path.n + 4} height={path.n + 4} fill="#fcfaf3" />
      <path d={path.d} fill="#2c2823" />
    </svg>
  )
}
