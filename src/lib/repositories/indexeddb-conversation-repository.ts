import { ConversationRepository } from "./conversation-repository"
import { Conversation } from "@/types"

class IndexedDbConversationRepository implements ConversationRepository {
  private dbName = "nextpfm-ai-db"
  private storeName = "conversations"
  private version = 1

  private getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAll(): Promise<Array<any>> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readonly")
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async get(id: string): Promise<any | null> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readonly")
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async create(): Promise<string> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite")
      const store = transaction.objectStore(this.storeName)
      const id = crypto.randomUUID()
      const now = Date.now()
      const conversation: Conversation = {
        id,
        title: "New Chat",
        createdAt: now,
        updatedAt: now,
        selectedCategories: [],
        messages: [],
      }

      const request = store.add(conversation)

      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  }

  async update(id: string, data: Partial<any>): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite")
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        const existing = request.result
        if (!existing) {
          reject(new Error(`Conversation not found: ${id}`))
          return
        }

        const updated = { ...existing, ...data, updatedAt: Date.now() }
        const updateRequest = store.put(updated)

        updateRequest.onsuccess = () => resolve()
        updateRequest.onerror = () => reject(updateRequest.error)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite")
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export { IndexedDbConversationRepository }
