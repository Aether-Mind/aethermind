/**
 * AetherMind Context Manager
 *
 * Implements hash-pointer based two-tier retrieval system:
 * - Short Context (Active Working Memory): Contains hash pointers to long-context chunks
 * - Hash Resolution: O(1) routing via hash prefix to vector DB shards
 * - Semantic Search: Within-shard ANN search for contextually relevant results
 *
 * Key insight: "Don't search what you can address directly."
 */

import { createHash } from 'crypto';
import { LRUCache } from 'lru-cache';

// Types
export interface HashPointer {
  hash: string;
  gist: string; // Compressed context summary
  timestamp: number;
  conversationId: string;
  shardId: string;
}

export interface ContextChunk {
  content: string;
  hash: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  conversationId: string;
  metadata: Record<string, unknown>;
}

export interface ShardConfig {
  id: string;
  hashPrefix: string; // Hex prefix range (e.g., "0x0000-0x3FFF")
  description: string;
  vectorDbPath: string;
}

// Configuration
const SHARD_COUNT = 16; // Number of shards for hash-based partitioning
const HASH_BITS = 16; // 16 bits = 65536 possible hash values

// In-memory routing table (O(1) lookup)
const routingTable: Map<string, string> = new Map();

// Ephemeral hash cache (Redis-like, single conversation)
const ephemeralCache = new LRUCache<string, HashPointer>({
  max: 500,
  ttl: 1000 * 60 * 30, // 30 minutes
});

// Persistent hash storage (cross-session)
const persistentCache = new LRUCache<string, HashPointer>({
  max: 5000,
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
});

// Shard configurations
const shards: ShardConfig[] = [];

// Initialize routing table and shards
export function initializeContextManager(): void {
  const shardSize = Math.pow(2, HASH_BITS) / SHARD_COUNT;

  for (let i = 0; i < SHARD_COUNT; i++) {
    const start = (i * shardSize).toString(16).padStart(4, '0');
    const end = ((i + 1) * shardSize - 1).toString(16).padStart(4, '0');
    const prefix = start.slice(0, 2); // First 2 hex chars for routing

    const shard: ShardConfig = {
      id: `shard_${i.toString(16).padStart(2, '0')}`,
      hashPrefix: `0x${start}-0x${end}`,
      description: getShardDescription(i),
      vectorDbPath: `.aethermind/shards/shard_${i.toString(16).padStart(2, '0')}`,
    };

    shards.push(shard);
    routingTable.set(prefix, shard.id);
  }

  console.log(`[AetherMind] Context manager initialized with ${SHARD_COUNT} shards`);
}

function getShardDescription(index: number): string {
  const descriptions = [
    'product', 'sales', 'support', 'general',
    'code', 'docs', 'config', 'memory',
    'tasks', 'projects', 'users', 'analytics',
    'external', 'internal', 'archive', 'temp'
  ];
  return descriptions[index % descriptions.length];
}

/**
 * Generate a unique hash for content
 */
export function generateHash(
  content: string,
  conversationId: string,
  timestamp?: number
): string {
  const data = `${content}:${conversationId}:${timestamp || Date.now()}`;
  return createHash('sha256').update(data).digest('hex').slice(0, 32);
}

/**
 * Route hash to correct shard (O(1) operation)
 */
export function routeToShard(hash: string): ShardConfig {
  const prefix = hash.slice(0, 2).toLowerCase();
  const shardId = routingTable.get(prefix);

  if (!shardId) {
    // Fallback to first shard for invalid hashes
    return shards[0];
  }

  return shards.find(s => s.id === shardId) || shards[0];
}

/**
 * Store hash pointer in short context (ephemeral)
 */
export function storeInShortContext(
  content: string,
  gist: string,
  conversationId: string
): HashPointer {
  const hash = generateHash(content, conversationId);
  const shard = routeToShard(hash);

  const pointer: HashPointer = {
    hash,
    gist,
    timestamp: Date.now(),
    conversationId,
    shardId: shard.id,
  };

  // Store in ephemeral cache
  ephemeralCache.set(hash, pointer);

  return pointer;
}

/**
 * Store hash pointer persistently (cross-session)
 */
export function storePersistent(
  content: string,
  gist: string,
  conversationId: string
): HashPointer {
  const pointer = storeInShortContext(content, gist, conversationId);

  // Also persist to long-term storage
  persistentCache.set(pointer.hash, pointer);

  return pointer;
}

/**
 * Resolve hash to content (O(1) lookup)
 */
export function resolveHash(hash: string): HashPointer | undefined {
  // Check ephemeral first
  const ephemeral = ephemeralCache.get(hash);
  if (ephemeral) return ephemeral;

  // Fall back to persistent
  return persistentCache.get(hash);
}

/**
 * Compress short context entries for efficient memory use
 */
export function compressShortContext(pointers: HashPointer[]): string {
  return pointers
    .map(p => `[${p.hash.slice(0, 8)}:${p.gist.slice(0, 50)}]`)
    .join(' ');
}

/**
 * Expand compressed context back to full pointers
 */
export function expandShortContext(compressed: string): HashPointer[] {
  const pointers: HashPointer[] = [];
  const regex = /\[([a-f0-9]{8}):([^\]]+)\]/g;

  let match;
  while ((match = regex.exec(compressed)) !== null) {
    const hash = match[1];
    const resolved = resolveHash(hash);
    if (resolved) {
      pointers.push(resolved);
    }
  }

  return pointers;
}

/**
 * Clear ephemeral context (on conversation end)
 */
export function clearEphemeralContext(): void {
  ephemeralCache.clear();
}

/**
 * Get shard info for debugging
 */
export function getShardInfo(): ShardConfig[] {
  return shards;
}

/**
 * Web search integration for on-demand skill discovery
 * Uses DuckDuckGo (free, no API key required)
 */
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

export async function searchWeb(query: string): Promise<WebSearchResult[]> {
  try {
    // Dynamic import to avoid bundling issues
    const ddg = await import('duck-duck-scrape');
    const results = await ddg.search(query, { safeSearch: false });

    return results.results.slice(0, 10).map((r: { title: string; url: string, snippet: string }) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet || '',
      relevance: 0.8, // Placeholder - could use semantic similarity
    }));
  } catch (error) {
    console.error('[AetherMind] Web search failed:', error);
    return [];
  }
}

/**
 * Discover skills online based on task context
 */
export async function discoverSkills(taskDescription: string): Promise<string[]> {
  const query = `AI agent skill ${taskDescription} automation`;
  const results = await searchWeb(query);

  // Extract potential skill names from results
  const skills = results
    .filter(r => r.relevance > 0.5)
    .map(r => extractSkillName(r.title));

  return skills.filter(Boolean).slice(0, 5);
}

function extractSkillName(title: string): string {
  // Simple extraction - could be enhanced with NLP
  const match = title.match(/[\w\s]+(?:skill|tool|plugin|integration)/i);
  return match ? match[0].trim() : '';
}

// User behavior learning (psychology-based)
export interface UserProfile {
  questionPatterns: string[];
  preferredDepth: 'shallow' | 'medium' | 'deep';
  responseStyle: 'concise' | 'balanced' | 'detailed';
  topicAffinities: string[];
  lastUpdated: number;
}

const userProfiles = new LRUCache<string, UserProfile>({
  max: 100,
  ttl: 1000 * 60 * 60 * 24 * 30, // 30 days
});

/**
 * Analyze user query to understand intent pattern
 */
export function analyzeQueryIntent(query: string): {
  depth: 'shallow' | 'medium' | 'deep';
  style: 'concise' | 'balanced' | 'detailed';
  intent: string;
} {
  // Simple heuristics - could be ML-powered
  const wordCount = query.split(/\s+/).length;
  const hasMultiPart = query.includes(' and ') || query.includes(' also ') || query.includes(' plus ');
  const isTechnical = /[{}()=<>]/g.test(query);

  let depth: 'shallow' | 'medium' | 'deep' = 'medium';
  if (wordCount < 10) depth = 'shallow';
  else if (wordCount > 50 || hasMultiPart) depth = 'deep';

  let style: 'concise' | 'balanced' | 'detailed' = 'balanced';
  if (query.endsWith('?')) style = 'concise';
  else if (isTechnical) style = 'detailed';

  const intent = classifyIntent(query);

  return { depth, style, intent };
}

function classifyIntent(query: string): string {
  const lower = query.toLowerCase();

  if (lower.includes('how do i') || lower.includes('how to') || lower.includes('explain')) {
    return 'learning';
  }
  if (lower.includes('fix') || lower.includes('bug') || lower.includes('error')) {
    return 'debugging';
  }
  if (lower.includes('create') || lower.includes('build') || lower.includes('make') || lower.includes('implement')) {
    return 'creation';
  }
  if (lower.includes('improve') || lower.includes('optimize') || lower.includes('refactor')) {
    return 'improvement';
  }
  if (lower.includes('what') || lower.includes('which') || lower.includes('what\'s')) {
    return 'understanding';
  }

  return 'general';
}

/**
 * Update user profile based on interaction
 */
export function updateUserProfile(userId: string, query: string, responseQuality: number): void {
  let profile = userProfiles.get(userId) || {
    questionPatterns: [],
    preferredDepth: 'medium',
    responseStyle: 'balanced',
    topicAffinities: [],
    lastUpdated: Date.now(),
  };

  const intent = analyzeQueryIntent(query);

  // Update question patterns
  if (!profile.questionPatterns.includes(intent.intent)) {
    profile.questionPatterns.push(intent.intent);
    if (profile.questionPatterns.length > 20) {
      profile.questionPatterns.shift();
    }
  }

  // Adjust preferred depth based on response quality
  if (responseQuality > 0.8) {
    if (profile.preferredDepth === 'shallow') profile.preferredDepth = 'medium';
    else if (profile.preferredDepth === 'deep') profile.preferredDepth = 'medium';
  }

  profile.lastUpdated = Date.now();
  userProfiles.set(userId, profile);
}

/**
 * Get user profile for tailoring responses
 */
export function getUserProfile(userId: string): UserProfile | undefined {
  return userProfiles.get(userId);
}

// Initialize on module load
initializeContextManager();