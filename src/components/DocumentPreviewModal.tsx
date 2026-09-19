import { useEffect, useState } from 'react'

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent)
}

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
  const [generating, setGenerating] = useState(false)
  const [displaySrc, setDisplaySrc] = useState<string | undefined>(src)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!src) { setDisplaySrc(undefined); return }
    if (type === 'pdf' && src.startsWith('data:application/pdf')) {
      try {
        const b64 = src.split(',')[1]
        const byteChars = atob(b64)
        const bytes = new Uint8Array(byteChars.length)
        for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        setDisplaySrc(url)
        return () => URL.revokeObjectURL(url)
      } catch (err) {
        console.error('PDF blob conversion failed:', err)
        setDisplaySrc(src)
      }
    } else {
      setDisplaySrc(src)
    }
  }, [src, type])

  const safeFilename = (ext: string) => {
    const base = title.replace(/[^\w\s-]/g, '').trim() || 'document'
    return base + '.' + ext
  }

  const generatePdfBlob = async (): Promise<Blob | null> => {
    if (type !== 'html' || !html) return null
    try {
      const html2pdfModule: any = await import('html2pdf.js')
      const html2pdf = html2pdfModule.default || html2pdfModule
      const container = document.createElement('div')
      container.innerHTML = html
      container.style.background = 'white'
      container.style.padding = '0'

      const opt = {
        margin: [10, 10, 10, 10],
        filename: safeFilename('pdf'),
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }

      const blob: Blob = await html2pdf().set(opt).from(container).outputPdf('blob')
      return blob
    } catch (err) {
      console.error('PDF generation failed:', err)
      return null
    }
  }

  const getHtmlFile = (): File | null => {
    if (type !== 'html' || !html) return null
    try {
      const blob = new Blob([html], { type: 'text/html' })
      return new File([blob], safeFilename('html'), { type: 'text/html' })
    } catch {
      return null
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = async () => {
    if (type === 'pdf' && src) {
      // already a PDF – just download
      window.open(src, '_blank')
      return
    }
    setGenerating(true)
    try {
      const blob = await generatePdfBlob()
      if (blob) downloadBlob(blob, safeFilename('pdf'))
      else alert('PDF generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleSharePdf = async () => {
    if (type === 'pdf' && src) {
      window.open(src, '_blank')
      return
    }
    setGenerating(true)
    try {
      const blob = await generatePdfBlob()
      if (!blob) {
        alert('PDF generation failed')
        return
      }
      const file = new File([blob], safeFilename('pdf'), { type: 'application/pdf' })

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title, files: [file] })
        } catch (err) {
          console.error('Share failed:', err)
          downloadBlob(blob, safeFilename('pdf'))
        }
      } else {
        downloadBlob(blob, safeFilename('pdf'))
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadHtml = () => {
    const file = getHtmlFile()
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
        setTimeout(() => win.print(), 200)
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
            <iframe srcDoc={html} title={title} className="w-full h-[65vh] bg-white" />
          ) : type === 'pdf' ? (
            isMobileDevice() ? (
              <div className="flex flex-col items-center justify-center h-[65vh] bg-gray-50 rounded-xl px-6 text-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="font-semibold text-gray-800 mb-1">{title}</p>
                <p className="text-sm text-gray-500 mb-6">PDF document ready</p>
                <button
                  onClick={() => { if (displaySrc) window.open(displaySrc, '_blank') }}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 text-sm font-medium"
                >
                  📖 Open PDF
                </button>
                <p className="text-xs text-gray-400 mt-3 max-w-xs">
                  Mobile browsers can't render PDFs inside the app. Tapping "Open PDF" uses your phone's built-in PDF viewer.
                </p>
              </div>
            ) : (
              <iframe src={displaySrc} title={title} className="w-full h-[65vh] bg-white" />
            )
          ) : (
            <img src={src} alt={title} className="max-w-full max-h-[65vh] object-contain mx-auto" />
          )}
        </div>
        <div className="p-3 flex gap-2 border-t flex-wrap">
          <button
            onClick={handleSharePdf}
            disabled={generating}
            className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {generating ? 'Generating PDF…' : '📤 Share PDF'}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={generating}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {generating ? 'Generating PDF…' : '⬇️ Download PDF'}
          </button>
          <button onClick={handlePrint} className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm hover:bg-gray-900">Print</button>
          {type === 'html' && (
            <button onClick={handleDownloadHtml} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm hover:bg-gray-300">Download HTML</button>
          )}
        </div>
      </div>
    </div>
  )
}
