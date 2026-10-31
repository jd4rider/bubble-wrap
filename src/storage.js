const DB_NAME = 'bubble-wrap'
const STORE_NAME = 'journey'
const FALLBACK_KEY = 'bubble-wrap-journey'

let dbPromise = null

function openDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is unavailable'))
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  return dbPromise
}

async function readWebState() {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get('state')
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

async function writeWebState(state) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(state, 'state')
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function loadJourney() {
  if (window.bubbleStore?.load) {
    try {
      return await window.bubbleStore.load()
    } catch {
      return null
    }
  }

  try {
    return await readWebState()
  } catch {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
}

export async function saveJourney(state) {
  if (window.bubbleStore?.save) {
    try {
      await window.bubbleStore.save(state)
    } catch {
      // Progress is not worth breaking the game over.
    }
    return
  }

  try {
    await writeWebState(state)
  } catch {
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(state))
    } catch {
      // Storage can be unavailable in private browsing.
    }
  }
}

export async function resetJourney() {
  if (window.bubbleStore?.reset) {
    try {
      await window.bubbleStore.reset()
    } catch {
      // Ignore a failed reset.
    }
    return
  }

  try {
    await writeWebState(null)
  } catch {
    try {
      localStorage.removeItem(FALLBACK_KEY)
    } catch {
      // Ignore.
    }
  }
}
