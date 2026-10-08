import { ConversationRepository } from "./conversation-repository"
import { IndexedDbConversationRepository } from "./indexeddb-conversation-repository"
import { LocalStorageConversationRepository } from "./localstorage-conversation-repository"

// Factory to create the conversation repository
// In a real application, this could be configured based on environment or feature flags
export function createConversationRepository(): ConversationRepository {
  // Try to use IndexedDB first
  try {
    // Test if IndexedDB is available
    if (typeof indexedDB !== "undefined") {
      return new IndexedDbConversationRepository()
    }
  } catch (e) {
    console.warn("IndexedDB not available, falling back to localStorage", e)
  }

  // Fallback to localStorage
  return new LocalStorageConversationRepository()
}