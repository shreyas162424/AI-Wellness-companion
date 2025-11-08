interface SessionData {
  id: string
  timestamp: number
  score: number
  emotion: string
  suggestions: string[]
  ambient: {
    noise: number
    light: number
    timeOfDay: string
  }
}

const DB_NAME = "HealthCompanion"
const STORE_NAME = "sessions"
const DB_VERSION = 1

export async function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("timestamp", "timestamp", { unique: false })
        store.createIndex("score", "score", { unique: false })
      }
    }
  })
}

export async function saveSessions(sessions: SessionData[]): Promise<void> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    // Clear existing data
    store.clear()

    // Add new data
    sessions.forEach((session) => {
      store.add(session)
    })

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function loadSessions(): Promise<SessionData[]> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function getSessionsByDateRange(startTime: number, endTime: number): Promise<SessionData[]> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("timestamp")
    const range = IDBKeyRange.bound(startTime, endTime)
    const request = index.getAll(range)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function deleteSession(id: string): Promise<void> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function exportSessions(): Promise<string> {
  const sessions = await loadSessions()
  return JSON.stringify(sessions, null, 2)
}

export async function importSessions(jsonData: string): Promise<void> {
  const sessions = JSON.parse(jsonData) as SessionData[]
  await saveSessions(sessions)
}
