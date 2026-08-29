const DB_NAME = 'ramscars-os'
const DB_VERSION = 4

export interface DBStores {
  dealershipProfile: any
  inspections: any
  vehicles: any
  customers: any
  leads: any
  sales: any
  payments: any
}

let db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db)
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains('dealershipProfile')) {
        database.createObjectStore('dealershipProfile', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('inspections')) {
        const store = database.createObjectStore('inspections', { keyPath: 'id' })
        store.createIndex('vehicleId', 'vehicleId', { unique: false })
        store.createIndex('status', 'status', { unique: false })
      }
      if (!database.objectStoreNames.contains('vehicles')) {
        const store = database.createObjectStore('vehicles', { keyPath: 'id' })
        store.createIndex('status', 'status', { unique: false })
      }
      if (!database.objectStoreNames.contains('customers')) {
        const store = database.createObjectStore('customers', { keyPath: 'id' })
        store.createIndex('role', 'role', { unique: false })
      }
      if (!database.objectStoreNames.contains('leads')) {
        const store = database.createObjectStore('leads', { keyPath: 'id' })
        store.createIndex('status', 'status', { unique: false })
      }
      if (!database.objectStoreNames.contains('sales')) {
        const store = database.createObjectStore('sales', { keyPath: 'id' })
        store.createIndex('vehicleId', 'vehicleId', { unique: false })
        store.createIndex('status', 'status', { unique: false })
      }
      if (!database.objectStoreNames.contains('payments')) {
        const store = database.createObjectStore('payments', { keyPath: 'id' })
        store.createIndex('saleId', 'saleId', { unique: false })
      }
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function addRecord<T>(storeName: keyof DBStores, record: T): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    store.add(record)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function getAllRecords<T>(storeName: keyof DBStores): Promise<T[]> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

export async function updateRecord<T>(storeName: keyof DBStores, record: T): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    store.put(record)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function deleteRecord(storeName: keyof DBStores, id: string): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    store.delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}
