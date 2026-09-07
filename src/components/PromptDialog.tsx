import { useState } from 'react'

interface PromptField {
  key: string
  label: string
  type?: 'text' | 'number'
  placeholder?: string
}

interface PromptDialogProps {
  open: boolean
  title: string
  fields: PromptField[]
  onSubmit: (values: Record<string, string>) => void
  onCancel: () => void
}

export default function PromptDialog({ open, title, fields, onSubmit, onCancel }: PromptDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
    setValues({})
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type || 'text'}
                placeholder={field.placeholder}
                value={values[field.key] || ''}
                onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                required
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700">OK</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
