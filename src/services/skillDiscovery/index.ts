/**
 * AetherMind Skill Discovery Service
 *
 * On-demand skill discovery via web search - replaces static skill loading.
 * When the agent needs a capability, it searches online to find relevant skills.
 */

import { searchWeb, type WebSearchResult } from '../contextManager/index.js'

// Cache discovered skills to avoid repeated searches
const skillCache = new Map<string, DiscoveredSkill>()
const SKILL_CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

export interface DiscoveredSkill {
  name: string
  description: string
  source: string
  url: string
  relevance: number
  discoveredAt: number
}

export interface SkillQuery {
  task: string
  context?: string
  requiredCapabilities?: string[]
}

/**
 * Search for relevant skills based on task description
 */
export async function discoverSkillsForTask(query: SkillQuery): Promise<DiscoveredSkill[]> {
  const cacheKey = `${query.task}:${query.context || ''}`

  // Check cache first
  const cached = skillCache.get(cacheKey)
  if (cached && Date.now() - cached.discoveredAt < SKILL_CACHE_TTL) {
    return [cached]
  }

  // Build search query
  const searchParts = [query.task]

  if (query.requiredCapabilities?.length) {
    searchParts.push(...query.requiredCapabilities.slice(0, 3))
  }

  if (query.context) {
    searchParts.push(query.context)
  }

  const searchQuery = searchParts.join(' ') + ' AI agent skill automation'

  try {
    const results = await searchWeb(searchQuery)
    const skills = extractSkillsFromResults(results, query.task)

    if (skills.length > 0) {
      skillCache.set(cacheKey, skills[0])
    }

    return skills
  } catch (error) {
    console.error('[AetherMind] Skill discovery failed:', error)
    return []
  }
}

/**
 * Extract skill information from search results
 */
function extractSkillsFromResults(results: WebSearchResult[], task: string): DiscoveredSkill[] {
  return results
    .filter(r => r.relevance > 0.4)
    .map((r, index) => ({
      name: extractSkillName(r.title, task),
      description: r.snippet || r.title,
      source: new URL(r.url).hostname,
      url: r.url,
      relevance: r.relevance * (1 - index * 0.1), // Penalize lower results
      discoveredAt: Date.now(),
    }))
    .slice(0, 5)
}

/**
 * Extract a clean skill name from search result title
 */
function extractSkillName(title: string, fallback: string): string {
  // Clean up common patterns
  let name = title
    .replace(/\s*[-|]\s*(skill|tool|plugin|integration|guide|tutorial).*$/i, '')
    .replace(/^How to\s+/i, '')
    .replace(/^What is\s+/i, '')
    .trim()

  if (name.length < 3 || name.length > 60) {
    name = fallback
  }

  // Convert to kebab-case for consistency
  name = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return name || fallback
}

/**
 * Build a skill prompt from discovered skill info
 */
export function buildSkillPrompt(skill: DiscoveredSkill): string {
  return `## ${skill.name}

Source: ${skill.source}
Reference: ${skill.url}

${skill.description}

Use this skill when the task involves: ${skill.name.replace(/-/g, ' ')}`
}

/**
 * Clear expired entries from skill cache
 */
export function clearSkillCache(): void {
  const now = Date.now()
  for (const [key, skill] of skillCache.entries()) {
    if (now - skill.discoveredAt > SKILL_CACHE_TTL) {
      skillCache.delete(key)
    }
  }
}

/**
 * Get all cached skills
 */
export function getCachedSkills(): DiscoveredSkill[] {
  return Array.from(skillCache.values())
}