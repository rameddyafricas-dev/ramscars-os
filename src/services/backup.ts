import { DBStores, getAllRecords, deleteRecord } from './db'

const storeNames: (keyof DBStores)[] = [
  'dealershipProfile',
  'inspections',
  'vehicles',
  'customers',
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


}

export async function clearAllData(): Promise<void> {
  const allRecords: Record<string, any[]> = {}
  for (const store of storeNames) {
    allRecords[store] = await getAllRecords<any>(store)
  }
  for (const store of storeNames) {
    for (const record of allRecords[store]) {
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
