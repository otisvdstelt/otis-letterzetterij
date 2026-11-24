import { useEffect, useId, useRef, useState } from 'react'
import { strings } from '../../content/strings'
import { store } from '../../lib/store'

/**
 * Een knop die tekst op het klembord zet. Mag dat niet (een oude browser, geen toestemming),
 * dan komt de tekst eronder te staan, al geselecteerd, om zelf te kopiëren
 */
export function Kopieer({ text, what, label = strings.meenemen.kopieer }: { text: string; what: string; label?: string }) {
  const [state, setState] = useState<'rust' | 'gekopieerd' | 'zelf'>('rust')
  useEffect(() => {
    if (state !== 'gekopieerd') return
    const timer = window.setTimeout(() => setState('rust'), 1600)
    return () => window.clearTimeout(timer)
  }, [state])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('gekopieerd')
      store.say(strings.nieuws.gekopieerd(what))
    } catch {
      setState('zelf')
    }
  }

  return (
    <>
      <button type="button" className="inked klein" onClick={() => void copy()}>
        {state === 'gekopieerd' ? strings.meenemen.gekopieerd : label}
      </button>
      {state === 'zelf' && <ZelfKopieren text={text} />}
    </>
  )
}

function ZelfKopieren({ text }: { text: string }) {
  const id = useId()
  const field = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    field.current?.focus()
    field.current?.select()
  }, [text])
  return (
    <div className="zelf-kopieren field">
      <label htmlFor={id}>{strings.meenemen.zelfKopieren}</label>
      <textarea id={id} ref={field} readOnly value={text} rows={Math.min(8, text.split('\n').length)} onFocus={(event) => event.currentTarget.select()} />
    </div>
  )
}
