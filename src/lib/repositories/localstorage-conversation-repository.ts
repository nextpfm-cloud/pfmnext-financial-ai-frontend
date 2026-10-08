import { ConversationRepository } from "./conversation-repository"
import { Conversation } from "@/types"

class LocalStorageConversationRepository implements ConversationRepository {
  private storageKey = "nextpfm-ai-conversations"

  private getAllFromStorage(): Array<Conversation> {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.warn("Failed to parse conversation data from localStorage", e)
      return []
    }
  }

  private saveToStorage(conversations: Array<Conversation>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(conversations))
    } catch (e) {
      console.error("Failed to save conversation data to localStorage", e)
    }
  }

  async getAll(): Promise<Array<any>> {
    return Promise.resolve(this.getAllFromStorage())
  }

  async get(id: string): Promise<any | null> {
    const conversations = this.getAllFromStorage()
    const conversation = conversations.find(c => c.id === id)
    return conversation || null
  }

  async create(): Promise<string> {
    const conversations = this.getAllFromStorage()
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

    conversations.push(conversation)
    this.saveToStorage(conversations)

    return Promise.resolve(id)
  }

  async update(id: string, data: Partial<any>): Promise<void> {
    const conversations = this.getAllFromStorage()
    const index = conversations.findIndex(c => c.id === id)
    if (index === -1) {
      return Promise.reject(new Error(`Conversation not found: ${id}`))
    }

    conversations[index] = {
      ...conversations[index],
      ...data,
      updatedAt: Date.now(),
    }

    this.saveToStorage(conversations)
    return Promise.resolve()
  }

  async delete(id: string): Promise<void> {
    let conversations = this.getAllFromStorage()
    conversations = conversations.filter(c => c.id !== id)
    this.saveToStorage(conversations)
    return Promise.resolve()
  }
}

export { LocalStorageConversationRepository }
