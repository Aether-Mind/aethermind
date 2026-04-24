/**
 * AetherMind Query Integration Layer
 *
 * Connects hash-pointer context management to the query pipeline.
 * This module is imported by query.ts to provide contextual memory
 * retrieval before each API call.
 */

import {
  storeInShortContext,
  storePersistent,
  resolveHash,
  compressShortContext,
  expandShortContext,
  clearEphemeralContext,
  analyzeQueryIntent,
  updateUserProfile,
  getUserProfile,
  type HashPointer,
} from '../contextManager/index.js'

// Session-scoped context storage
let currentSessionId: string | null = null
let conversationPointers: HashPointer[] = []

/**
 * Initialize a new session context
 */
export function initSessionContext(sessionId: string): void {
  currentSessionId = sessionId
  conversationPointers = []
  clearEphemeralContext()
}

/**
 * Add a memory chunk to the session context
 */
export function addToContext(
  content: string,
  gist: string,
  conversationId?: string
): HashPointer {
  const cid = conversationId || currentSessionId || 'default'
  const pointer = storeInShortContext(content, gist, cid)
  conversationPointers.push(pointer)
  return pointer
}

/**
 * Add a persistent memory (cross-session)
 */
export function addPersistentMemory(
  content: string,
  gist: string,
  conversationId?: string
): HashPointer {
  const cid = conversationId || currentSessionId || 'default'
  return storePersistent(content, gist, cid)
}

/**
 * Get compressed context for system prompt injection
 */
export function getCompressedContext(): string {
  return compressShortContext(conversationPointers.slice(-20)) // Last 20 pointers
}

/**
 * Get context window for query augmentation
 */
export function getContextWindow(count: number = 5): HashPointer[] {
  return conversationPointers.slice(-count)
}

/**
 * Resolve hash pointers to actual content
 */
export function resolvePointers(hashes: string[]): string[] {
  return hashes
    .map(h => resolveHash(h))
    .filter((p): p is HashPointer => p !== undefined)
    .map(p => p.gist)
}

/**
 * Pre-query hook: analyze intent and augment with context
 */
export function preQueryAugment(
  userQuery: string,
  sessionId: string
): {
  intent: { depth: string; style: string; intent: string }
  contextHints: string[]
  userPrefs: { preferredDepth: string; responseStyle: string } | null
} {
  // Analyze user intent
  const intent = analyzeQueryIntent(userQuery)

  // Get recent context
  const recentPointers = getContextWindow(5)
  const contextHints = recentPointers.map(p => p.gist)

  // Get user preferences if available
  const userPrefs = getUserProfile(sessionId)

  return {
    intent,
    contextHints,
    userPrefs: userPrefs
      ? {
          preferredDepth: userPrefs.preferredDepth,
          responseStyle: userPrefs.responseStyle,
        }
      : null,
  }
}

/**
 * Post-response hook: update user profile based on interaction
 */
export function postResponseHook(
  sessionId: string,
  query: string,
  responseQuality: number
): void {
  updateUserProfile(sessionId, query, responseQuality)
}

/**
 * On-demand skill discovery using web search
 */
export async function discoverRelevantSkills(
  taskDescription: string
): Promise<string[]> {
  const { discoverSkills } = await import('../contextManager/index.js')
  return discoverSkills(taskDescription)
}

// Re-export context manager utilities
export {
  storeInShortContext,
  storePersistent,
  resolveHash,
  clearEphemeralContext,
  analyzeQueryIntent,
  updateUserProfile,
  getUserProfile,
}

export type { HashPointer }