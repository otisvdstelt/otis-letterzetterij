import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export interface Tab {
  id: string
  label: string
  content: ReactNode
}

/** Tabbladen als ezelsoren aan een vel. Pijltjes links en rechts wisselen, zoals het hoort bij tabs */
export function Tabs({ tabs, label, open: controlled, onOpen }: { tabs: readonly Tab[]; label: string; open?: string; onOpen?: (id: string) => void }) {
  const id = useId()
  const [own, setOwn] = useState(tabs[0]?.id)
  const open = controlled ?? own
  const setOpen = (next: string) => {
    setOwn(next)
    onOpen?.(next)
  }
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const current = tabs.find((t) => t.id === open) ?? tabs[0]

  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    const to = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : step ? (index + step + tabs.length) % tabs.length : -1
    if (to < 0) return
    event.preventDefault()
    setOpen(tabs[to].id)
    buttons.current[to]?.focus()
  }

  return (
    <div className="tabs">
      <div className="tabs-rij" role="tablist" aria-label={label}>
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => void (buttons.current[i] = el)}
            type="button"
            role="tab"
            id={`${id}-${tab.id}`}
            aria-selected={tab.id === current.id}
            aria-controls={`${id}-${tab.id}-vel`}
            tabIndex={tab.id === current.id ? 0 : -1}
            className="tab"
            onClick={() => setOpen(tab.id)}
            onKeyDown={(event) => onKey(event, i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" id={`${id}-${tab.id}-vel`} aria-labelledby={`${id}-${tab.id}`} hidden={tab.id !== current.id} tabIndex={0} className="tab-vel">
          {tab.id === current.id && tab.content}
        </div>
      ))}
    </div>
  )
}
