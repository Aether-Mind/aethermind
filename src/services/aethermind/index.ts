/**
 * AetherMind Session Initialization
 *
 * Initializes AetherMind-specific systems on startup.
 * Called from setup.ts during CLI startup.
 */

import { clearEphemeralContext } from '../contextManager/index.js'
import {
  getUserPsychologyProfile,
  updatePsychologyProfile,
  getResponseTailoring,
} from '../userProfile/psychology.js'
import { clearSkillCache } from '../skillDiscovery/index.js'

// Session state - set during init
let sessionContext: { sessionId: string } | null = null

/**
 * Initialize AetherMind systems for a new session
 */
export function initAetherMind(sessionId: string): void {
  sessionContext = { sessionId }

  // Pre-warm user profile
  getUserPsychologyProfile(sessionId)

  // Clear expired skill cache
  clearSkillCache()

  console.log('[AetherMind] Context manager initialized for session:', sessionId.slice(0, 8))
}

/**
 * Clean up AetherMind systems
 */
export function shutdownAetherMind(): void {
  clearEphemeralContext()
  sessionContext = null
  console.log('[AetherMind] Context manager shut down')
}

/**
 * Record user interaction for profile learning
 */
export function recordAetherMindInteraction(
  sessionId: string,
  query: string,
  quality?: number
): void {
  updatePsychologyProfile(sessionId, query, quality)
}

/**
 * Get current session context
 */
export function getCurrentSession(): { sessionId: string } | null {
  return sessionContext
}

// Re-export context manager utilities
export {
  clearEphemeralContext,
  storeInShortContext,
  storePersistent,
  resolveHash,
  compressShortContext,
  expandShortContext,
  analyzeQueryIntent,
  getUserProfile,
} from '../contextManager/index.js'

// Re-export user profile utilities
export {
  getUserPsychologyProfile,
  updatePsychologyProfile,
  getResponseTailoring,
  analyzeQueryPsychology,
  extractTopicAffinity,
  detectExpertise,
} from '../userProfile/psychology.js'

// Re-export skill discovery
export {
  discoverSkillsForTask,
  buildSkillPrompt,
  getCachedSkills,
} from '../skillDiscovery/index.js'