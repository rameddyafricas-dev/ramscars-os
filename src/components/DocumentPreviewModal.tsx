import { useEffect } from 'react'

interface DocumentPreviewModalProps {
  type: 'image' | 'pdf' | 'html'
  src?: string
  html?: string
  title?: string
  onClose: () => void
}

export default function DocumentPreviewModal({
  type,
  src,
  html,
  title = 'Document',
  onClose,
}: DocumentPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const getReportFile = (): File | null => {
    try {
      let content = ''
      let mimeType = 'text/html'
      let extension = 'html'

      if (type === 'html' && html) {
        content = html
        mimeType = 'text/html'
        extension = 'html'
      } else if (src) {
        if (src.startsWith('data:')) {
          const [meta, data] = src.split(',')
          const mimeMatch = meta.match(/data:([^;]+)/)
          if (mimeMatch) mimeType = mimeMatch[1]
          content = atob(data)
        } else {
          // For non-data URLs, we cannot reliably create a file without fetching.
          return null
        }
      } else {
        return null
      }

      const blob = new Blob([content], { type: mimeType })
      return new File([blob], `${title.replace(/[^\w\s-]/g, '')}.${extension}`, { type: mimeType })
    } catch (err) {
      console.error('Failed to create report file:', err)
      return null
    }
  }

  const handleShareFile = async () => {
    const file = getReportFile()
    if (!file) {
      handleDownloadFile()
      return
    }

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title,
          files: [file],
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    } else {
      handleDownloadFile()
    }
  }

  const handleDownloadFile = () => {
    const file = getReportFile()
    if (!file) return
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    if (type === 'html' && html) {
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        win.print()
      }
    } else if (src) {
      const win = window.open(src, '_blank')
      if (win) win.print()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-preview-title"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 flex items-center justify-between border-b">
          <h3 id="document-preview-title" className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close preview">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {type === 'html' ? (
            <iframe srcDoc={html} title={title} className="w-full h-[65vh]" />
          ) : type === 'pdf' ? (
            <iframe src={src} title={title} className="w-full h-[65vh]" />
          ) : (
            <img src={src} alt={title} className="max-w-full max-h-[65vh] object-contain mx-auto" />
          )}
        </div>
        <div className="p-3 flex gap-2 border-t flex-wrap">
          <button onClick={handlePrint} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm">Print</button>
          <button onClick={handleShareFile} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm">Share File</button>
          <button onClick={handleDownloadFile} className="bg-gray-600 text-white px-4 py-2 rounded-xl text-sm">Download</button></div>
      </div>
    </div>
  )
}
