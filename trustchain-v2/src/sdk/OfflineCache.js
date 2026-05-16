/**
 * OfflineCache.js
 * Stores behavioral sessions in IndexedDB when offline.
 * Auto-syncs when connectivity returns.
 * Nigeria-first: handles unstable network gracefully.
 */

const DB_NAME = 'trustchain_offline'
const DB_VERSION = 1
const STORE_SESSIONS = 'pending_sessions'

class OfflineCache {
  constructor() {
    this.db = null
    this.isOnline = navigator.onLine
    this.syncInProgress = false
    this._init()
    this._listenNetwork()
  }

  async _init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = e => {
        const db = e.target.result
        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          const store = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id', autoIncrement: true })
          store.createIndex('synced', 'synced', { unique: false })
          store.createIndex('created_at', 'created_at', { unique: false })
        }
      }
      req.onsuccess = e => { this.db = e.target.result; resolve() }
      req.onerror = () => reject(req.error)
    })
  }

  _listenNetwork() {
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('[TrustChain] Back online — syncing cached sessions...')
      this.syncPending()
      window.dispatchEvent(new CustomEvent('trustchain:online'))
    })
    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('[TrustChain] Offline — sessions will be cached locally')
      window.dispatchEvent(new CustomEvent('trustchain:offline'))
    })
  }

  // Save a behavioral session to IndexedDB
  async savePending(sessionData) {
    await this._init()
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_SESSIONS, 'readwrite')
      const store = tx.objectStore(STORE_SESSIONS)
      const record = {
        ...sessionData,
        synced: false,
        created_at: new Date().toISOString(),
        retry_count: 0,
      }
      const req = store.add(record)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  // Get all unsynced sessions
  async getPending() {
    await this._init()
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_SESSIONS, 'readonly')
      const store = tx.objectStore(STORE_SESSIONS)
      const index = store.index('synced')
      const req = index.getAll(false)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  // Mark session as synced
  async markSynced(id) {
    await this._init()
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_SESSIONS, 'readwrite')
      const store = tx.objectStore(STORE_SESSIONS)
      const req = store.get(id)
      req.onsuccess = () => {
        const record = req.result
        if (record) {
          record.synced = true
          record.synced_at = new Date().toISOString()
          store.put(record)
        }
        resolve()
      }
      req.onerror = () => reject(req.error)
    })
  }

  // Sync all pending sessions to backend
  async syncPending() {
    if (this.syncInProgress || !this.isOnline) return
    this.syncInProgress = true

    try {
      const pending = await this.getPending()
      if (pending.length === 0) { this.syncInProgress = false; return }

      console.log(`[TrustChain] Syncing ${pending.length} cached session(s)...`)

      const token = localStorage.getItem('tc_token')
      if (!token) { this.syncInProgress = false; return }

      for (const session of pending) {
        try {
          const res = await fetch('/api/payments/verify-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(session.payload),
          })
          if (res.ok) {
            await this.markSynced(session.id)
            console.log(`[TrustChain] Session ${session.id} synced`)
            window.dispatchEvent(new CustomEvent('trustchain:session-synced', { detail: session }))
          }
        } catch (err) {
          console.warn(`[TrustChain] Failed to sync session ${session.id}:`, err)
        }
      }
    } finally {
      this.syncInProgress = false
    }
  }

  // Count pending sessions
  async pendingCount() {
    const pending = await this.getPending()
    return pending.length
  }

  // Clear all synced sessions (cleanup)
  async clearSynced() {
    await this._init()
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_SESSIONS, 'readwrite')
      const store = tx.objectStore(STORE_SESSIONS)
      const index = store.index('synced')
      const req = index.openCursor(true)
      req.onsuccess = e => {
        const cursor = e.target.result
        if (cursor) { cursor.delete(); cursor.continue() }
        else resolve()
      }
      req.onerror = () => reject(req.error)
    })
  }
}

// Singleton export
const offlineCache = new OfflineCache()
export default offlineCache
