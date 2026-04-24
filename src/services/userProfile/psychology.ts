/**
 * AetherMind User Psychology Profiler
 *
 * Learns user communication patterns over time.
 * Uses psychological heuristics to understand query intent and adapt responses.
 */

import { LRUCache } from 'lru-cache'

export interface UserPsychologyProfile {
  // Query patterns observed
  questionPatterns: QuestionPattern[]

  // Communication preferences
  preferredDepth: 'shallow' | 'medium' | 'deep'
  responseStyle: 'concise' | 'balanced' | 'detailed'
  explanationLevel: 'simple' | 'moderate' | 'technical'

  // Topic affinities (for context prediction)
  topicAffinities: string[]
  domainExpertise: Map<string, number>

  // Interaction quality tracking
  interactionCount: number
  lastInteraction: number
  satisfactionScore: number | null
}

export type QuestionPattern =
  | 'learning'      // "how do I...", "explain..."
  | 'debugging'     // "fix", "bug", "error", "doesn't work"
  | 'creation'      // "create", "build", "make", "implement"
  | 'improvement'   // "improve", "optimize", "refactor"
  | 'understanding' // "what", "which", "what's", "tell me about"
  | 'planning'      // "plan", "strategy", "approach"
  | 'review'        // "review", "check", "validate"
  | 'general'       // default for unclear patterns

// Profile storage (30 day TTL)
const profiles = new LRUCache<string, UserPsychologyProfile>({
  max: 100,
  ttl: 1000 * 60 * 60 * 24 * 30,
})

/**
 * Get or create user profile
 */
export function getUserPsychologyProfile(userId: string): UserPsychologyProfile {
  let profile = profiles.get(userId)

  if (!profile) {
    profile = {
      questionPatterns: [],
      preferredDepth: 'medium',
      responseStyle: 'balanced',
      explanationLevel: 'moderate',
      topicAffinities: [],
      domainExpertise: new Map(),
      interactionCount: 0,
      lastInteraction: Date.now(),
      satisfactionScore: null,
    }
    profiles.set(userId, profile)
  }

  return profile
}

/**
 * Analyze query for psychological pattern
 */
export function analyzeQueryPsychology(query: string): {
  pattern: QuestionPattern
  depth: 'shallow' | 'medium' | 'deep'
  style: 'concise' | 'balanced' | 'detailed'
  confidence: number
} {
  const lower = query.toLowerCase()
  const words = query.split(/\s+/)
  const wordCount = words.length

  // Pattern detection with confidence scoring
  const patternScores: Record<QuestionPattern, number> = {
    learning: 0,
    debugging: 0,
    creation: 0,
    improvement: 0,
    understanding: 0,
    planning: 0,
    review: 0,
    general: 0.1, // Base score for general
  }

  // Learning patterns
  if (/\bhow\s+(do|can|to|should)\b/i.test(lower)) patternScores.learning += 0.8
  if (/\bexplain\s+(me)?/i.test(lower)) patternScores.learning += 0.7
  if (/\bwhat\s+is\s+a\b/i.test(lower)) patternScores.learning += 0.6
  if (/\blearn\b/i.test(lower)) patternScores.learning += 0.5

  // Debugging patterns
  if (/\b(fix|bug|error|issue|problem|broken)\b/i.test(lower)) patternScores.debugging += 0.9
  if (/\bdoesn't?\s+(work|run|start)\b/i.test(lower)) patternScores.debugging += 0.8
  if (/\bfaile[ds]\b/i.test(lower)) patternScores.debugging += 0.7
  if (/\bexception\b/i.test(lower)) patternScores.debugging += 0.6

  // Creation patterns
  if (/\b(create|build|make|implement|add)\b/i.test(lower)) patternScores.creation += 0.8
  if (/\bnew\s+(file|function|class|component)\b/i.test(lower)) patternScores.creation += 0.7
  if (/\bgenerate\b/i.test(lower)) patternScores.creation += 0.6

  // Improvement patterns
  if (/\b(improve|optimize|refactor|enhance|upgrade)\b/i.test(lower)) patternScores.improvement += 0.9
  if (/\bbett?[er]\b/i.test(lower)) patternScores.improvement += 0.6
  if (/\bperformance\b/i.test(lower)) patternScores.improvement += 0.5

  // Understanding patterns
  if (/^\s*what/i.test(lower)) patternScores.understanding += 0.8
  if (/^\s*which/i.test(lower)) patternScores.understanding += 0.8
  if (/\bwhat'?s?\s+(the\s+)?(best|right|latest)\b/i.test(lower)) patternScores.understanding += 0.7
  if (/\btell\s+me\s+about\b/i.test(lower)) patternScores.understanding += 0.6

  // Planning patterns
  if (/\b(plan|strategy|roadmap|approach)\b/i.test(lower)) patternScores.planning += 0.9
  if (/\bshould\s+I\b/i.test(lower)) patternScores.planning += 0.7
  if (/\bnext\s+steps?\b/i.test(lower)) patternScores.planning += 0.6

  // Review patterns
  if (/\b(review|check|validate|verify|test)\b/i.test(lower)) patternScores.review += 0.8
  if (/\baudit\b/i.test(lower)) patternScores.review += 0.7
  if (/\bsecurity\b/i.test(lower) && patternScores.review > 0) patternScores.review += 0.4

  // Find highest scoring pattern
  let maxPattern: QuestionPattern = 'general'
  let maxScore = 0
  for (const [pattern, score] of Object.entries(patternScores)) {
    if (score > maxScore) {
      maxScore = score
      maxPattern = pattern as QuestionPattern
    }
  }

  // Depth detection based on query characteristics
  let depth: 'shallow' | 'medium' | 'deep' = 'medium'
  if (wordCount < 8 && !lower.includes(' and ') && !lower.includes(' also ')) {
    depth = 'shallow'
  } else if (wordCount > 30 || lower.includes(' and ') || lower.includes(' also ') || lower.includes(' plus ')) {
    depth = 'deep'
  }

  // Response style based on punctuation and structure
  let style: 'concise' | 'balanced' | 'detailed' = 'balanced'
  if (query.endsWith('?')) style = 'concise'
  if (style === 'balanced') {
    // Technical queries get more detail
    if (/[{}()=<>\[\]]/g.test(query)) style = 'detailed'
    if (/[;:]\s*\w+/g.test(query)) style = 'detailed'
  }

  return {
    pattern: maxPattern,
    depth,
    style,
    confidence: Math.min(maxScore, 1),
  }
}

/**
 * Update profile based on interaction
 */
export function updatePsychologyProfile(
  userId: string,
  query: string,
  responseQuality?: number
): void {
  const profile = getUserPsychologyProfile(userId)
  const analysis = analyzeQueryPsychology(query)

  // Update question patterns
  if (!profile.questionPatterns.includes(analysis.pattern)) {
    profile.questionPatterns.push(analysis.pattern)
    // Keep only last 10 patterns
    if (profile.questionPatterns.length > 10) {
      profile.questionPatterns.shift()
    }
  }

  // Update depth preference based on query patterns
  if (analysis.depth === 'deep' && profile.preferredDepth === 'shallow') {
    profile.preferredDepth = 'medium'
  }

  // Update style preference
  profile.responseStyle = analysis.style

  // Update interaction stats
  profile.interactionCount++
  profile.lastInteraction = Date.now()

  // Update satisfaction if provided
  if (responseQuality !== undefined) {
    if (profile.satisfactionScore === null) {
      profile.satisfactionScore = responseQuality
    } else {
      // Moving average
      profile.satisfactionScore = (profile.satisfactionScore * 0.7) + (responseQuality * 0.3)
    }
  }
}

/**
 * Extract topic affinity from query
 */
export function extractTopicAffinity(query: string): string[] {
  // Common topic keywords
  const topics: string[] = []
  const lower = query.toLowerCase()

  const topicKeywords = {
    'web-development': ['html', 'css', 'javascript', 'react', 'vue', 'angular', 'frontend', 'backend', 'api'],
    'mobile-development': ['android', 'ios', 'react native', 'flutter', 'mobile', 'app'],
    'devops': ['docker', 'kubernetes', 'ci/cd', 'deployment', 'infrastructure', 'aws', 'gcp', 'azure'],
    'database': ['sql', 'postgres', 'mysql', 'mongodb', 'redis', 'database', 'query'],
    'security': ['security', 'auth', 'encryption', 'oauth', 'jwt', 'ssl', 'https'],
    'machine-learning': ['ml', 'ai', 'model', 'train', 'predict', 'neural', 'deep learning'],
    'testing': ['test', 'unit', 'integration', 'jest', 'pytest', 'coverage'],
    'architecture': ['design', 'pattern', 'architecture', 'microservice', 'monolith', 'system'],
  }

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        topics.push(topic)
        break
      }
    }
  }

  return topics
}

/**
 * Get tailoring instructions for response formatting
 */
export function getResponseTailoring(userId: string): {
  shouldInclude: {
    explanations: boolean
    examples: boolean
    stepByStep: boolean
    caveats: boolean
  }
  preferredLength: 'short' | 'medium' | 'long'
  technicalLevel: 'simple' | 'moderate' | 'technical'
} {
  const profile = getUserPsychologyProfile(userId)

  // Determine what to include based on preferences
  const shouldInclude = {
    explanations: profile.explanationLevel !== 'simple',
    examples: profile.responseStyle === 'detailed' || profile.satisfactionScore === null,
    stepByStep: profile.preferredDepth === 'deep',
    caveats: profile.responseStyle === 'detailed',
  }

  // Preferred length based on depth and style
  let preferredLength: 'short' | 'medium' | 'long' = 'medium'
  if (profile.preferredDepth === 'shallow') preferredLength = 'short'
  if (profile.preferredDepth === 'deep') preferredLength = 'long'

  return {
    shouldInclude,
    preferredLength,
    technicalLevel: profile.explanationLevel,
  }
}

/**
 * Detect user expertise level per domain
 */
export function detectExpertise(query: string): { domain: string; level: 'beginner' | 'intermediate' | 'expert' } | null {
  const lower = query.toLowerCase()

  // Beginner indicators (basic questions)
  const beginnerIndicators = ['what is', 'how do i', 'beginner', 'new to', 'started', 'tutorial']
  // Expert indicators (complex topics, specific terminology)
  const expertIndicators = ['optimize', 'architecture', 'performance', 'scale', 'concurrency', 'distributed']

  let beginnerScore = 0
  let expertScore = 0

  for (const indicator of beginnerIndicators) {
    if (lower.includes(indicator)) beginnerScore++
  }
  for (const indicator of expertIndicators) {
    if (lower.includes(indicator)) expertScore++
  }

  if (beginnerScore > expertScore) {
    return { domain: 'general', level: 'beginner' }
  }
  if (expertScore > beginnerScore) {
    return { domain: 'general', level: 'expert' }
  }

  return { domain: 'general', level: 'intermediate' }
}