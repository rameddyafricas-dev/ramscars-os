import { DBStores, getAllRecords, addRecord, deleteRecord } from './db'

const storeNames: (keyof DBStores)[] = [
  'dealershipProfile',
  'inspections',
  'vehicles',
  'customers',
  'sales',
  'payments',
  'documents',
  'reminders',
  'auditLogs',
]

export interface BackupFile {
  version: number
  exportedAt: string
  data: Record<string, any[]>
}

export async function exportAllData(): Promise<BackupFile> {
  const data: Record<string, any[]> = {}
  for (const store of storeNames) {
    data[store] = await getAllRecords<any>(store)
  }
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export async function importAllData(backup: BackupFile): Promise<void> {
  if (!backup || !backup.data) throw new Error('Invalid backup file')

  // Clear existing stores first
  for (const store of storeNames) {
    const existing = await getAllRecords<any>(store)
    for (const record of existing) {
      await deleteRecord(store, record.id)
    }
  }

  // Insert imported records
  for (const store of storeNames) {
    const records = backup.data[store]
    if (!Array.isArray(records)) continue
    for (const record of records) {
      if (!record || !record.id) continue
      await addRecord(store, record)
    }
  }
}

export async function clearAllData(): Promise<void> {
  for (const store of storeNames) {
    const records = await getAllRecords<any>(store)
    for (const record of records) {
      await deleteRecord(store, record.id)
    }
  }
}

export async function getStoreCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const store of storeNames) {
    const records = await getAllRecords<any>(store)
    counts[store] = records.length
  }
  return counts
}
