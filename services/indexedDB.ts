import { ref } from 'vue'

interface AttributeOption {
  value: string
  label: string
  type: string
}

interface OptionValue {
  id: number
  attribute: string
  value: string
  visual: string
  type: string
}

const DB_NAME = 'optionsDB'
const DB_VERSION = 1
const STORE_NAMES = {
  attributes: 'attributes',
  options: 'options'
}

export const dbStatus = ref<'loading' | 'ready' | 'error'>('loading')

let db: IDBDatabase | null = null

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      dbStatus.value = 'error'
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      dbStatus.value = 'ready'
      resolve()
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create attributes store
      if (!db.objectStoreNames.contains(STORE_NAMES.attributes)) {
        db.createObjectStore(STORE_NAMES.attributes, { keyPath: 'value' })
      }

      // Create options store
      if (!db.objectStoreNames.contains(STORE_NAMES.options)) {
        db.createObjectStore(STORE_NAMES.options, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

// Attributes CRUD operations
export const saveAttributes = async (attributes: AttributeOption[]): Promise<void> => {
  if (!db) throw new Error('Database not initialized')
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAMES.attributes, 'readwrite')
    const store = tx.objectStore(STORE_NAMES.attributes)

    // Clear existing attributes
    store.clear()

    // Convert reactive objects to plain objects and add them
    attributes.forEach(attribute => {
      const plainAttribute = {
        value: attribute.value,
        label: attribute.label,
        type: attribute.type
      }
      store.add(plainAttribute)
    })

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const getAttributes = async (): Promise<AttributeOption[]> => {
  if (!db) throw new Error('Database not initialized')

  const tx = db.transaction(STORE_NAMES.attributes, 'readonly')
  const store = tx.objectStore(STORE_NAMES.attributes)
  const request = store.getAll()

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Options CRUD operations
export const saveOptions = async (options: OptionValue[]): Promise<void> => {
  if (!db) throw new Error('Database not initialized')

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAMES.options, 'readwrite')
    const store = tx.objectStore(STORE_NAMES.options)

    // Clear existing options
    store.clear()

    // Convert reactive objects to plain objects and add them
    options.forEach(option => {
      const plainOption = {
        id: option.id,
        attribute: option.attribute,
        value: option.value,
        visual: option.visual,
        type: option.type
      }
      store.add(plainOption)
    })

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const getOptions = async (): Promise<OptionValue[]> => {
  if (!db) throw new Error('Database not initialized')

  const tx = db.transaction(STORE_NAMES.options, 'readonly')
  const store = tx.objectStore(STORE_NAMES.options)
  const request = store.getAll()

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
} 