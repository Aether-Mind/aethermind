/**
 * Skill Search Feature Check
 *
 * Determines if the skill discovery feature is enabled.
 */

export function isSkillSearchEnabled(): boolean {
  // Check for feature flag or environment variable
  return process.env.AETHERMIND_SKILL_SEARCH !== 'false'
}

export function getSkillSearchConfig(): {
  enabled: boolean
  cacheTtlMs: number
  maxResults: number
} {
  return {
    enabled: isSkillSearchEnabled(),
    cacheTtlMs: parseInt(process.env.AETHERMIND_SKILL_CACHE_TTL ?? '3600000', 10), // 1 hour default
    maxResults: parseInt(process.env.AETHERMIND_SKILL_MAX_RESULTS ?? '5', 10),
  }
}