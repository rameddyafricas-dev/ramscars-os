import { useState, ReactNode } from 'react'

interface CollapsibleCardProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export default function CollapsibleCard({ title, children, defaultOpen = false }: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
          {title}
        </h2>
        <span className="text-gray-500 text-xl">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-4 space-y-6">{children}</div>}
    </div>
  )
}
