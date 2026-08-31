interface DocumentPreviewModalProps {
  type: 'image' | 'pdf' | 'html'
  src?: string
  html?: string
  title?: string
  onClose: () => void
}

export default function DocumentPreviewModal({ type, src, html, title = 'Document', onClose }: DocumentPreviewModalProps) {
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

  const handleEmail = () => {
    const subject = encodeURIComponent(title)
    const body = encodeURIComponent(`Please find attached: ${title}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Please find attached: ${title}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 flex items-center justify-between border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
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
        <div className="p-3 flex gap-2 border-t">
          <button onClick={handlePrint} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm">Print</button>
          <button onClick={handleEmail} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm">Email</button>
          <button onClick={handleWhatsApp} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm">WhatsApp</button>
        </div>
      </div>
    </div>
  )
}
