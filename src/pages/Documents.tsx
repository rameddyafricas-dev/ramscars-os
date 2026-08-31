import { useEffect, useRef, useState } from 'react'
import { useDocumentStore } from '../store/useDocumentStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { generateId } from '../utils/id'
import { compressImage } from '../utils/image'
import type { Document } from '../types'
import DocumentPreviewModal from '../components/DocumentPreviewModal'

export default function Documents() {
  const { documents, loadDocuments, createDocument, deleteDocument } = useDocumentStore()
  const { vehicles, loadVehicles } = useVehicleStore()
  const [vehicleId, setVehicleId] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState('legal')
  const [fileData, setFileData] = useState('')
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDocuments()
    loadVehicles()
  }, [loadDocuments, loadVehicles])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const data = await compressImage(file, 1600, 1600, 0.8)
    setFileData(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return
    const now = new Date().toISOString()
    const doc: Document = {
      id: generateId('doc'),
      vehicleId: vehicleId || undefined,
      type,
      title,
      fileUrl: fileData,
      createdAt: now,
      updatedAt: now,
    }
    await createDocument(doc)
    setTitle('')
    setType('legal')
    setVehicleId('')
    setFileData('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {documents.length} document(s)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Document</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              placeholder="Document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
              required
            />
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5">
              <option value="legal">Legal</option>
              <option value="service">Service</option>
              <option value="invoice">Invoice</option>
              <option value="other">Other</option>
            </select>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5">
              <option value="">No vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFile}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
            />
            <button type="submit" className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700">
              Add Document
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">All Documents</h2>
          {documents.length === 0 ? (
            <p className="text-gray-500 text-sm">No documents added yet.</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const vehicle = vehicles.find((v) => v.id === doc.vehicleId)
                return (
                  <div key={doc.id} className="bg-gray-50 rounded-xl p-4 flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{doc.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{doc.type}</p>
                      {vehicle && <p className="text-sm text-gray-600">{vehicle.year} {vehicle.make} {vehicle.model}</p>}
                    </div>
                    <div className="flex gap-2">
                      {doc.fileUrl && (
                        <button onClick={() => setPreviewDoc(doc)} className="text-indigo-600 text-sm hover:underline">
                          View
                        </button>
                      )}
                      <button onClick={() => { if (window.confirm('Delete this document?')) deleteDocument(doc.id) }} className="text-red-600 text-sm hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {previewDoc && previewDoc.fileUrl && (
        <DocumentPreviewModal
          type={previewDoc.fileUrl.startsWith('data:image') ? 'image' : 'pdf'}
          src={previewDoc.fileUrl}
          title={previewDoc.title}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  )
}
