# AetherMind: Key Differences

> Quick reference for understanding what makes each part of AetherMind distinct.

---

## Modes: Standard vs Vibe

| Aspect | Standard Mode | Vibe Mode |
|--------|--------------|-----------|
| **Activation** | Default (no env var) | `AETHERMIND_VIBE_MODE=true` |
| **Philosophy** | Precise, controlled | Describe intent, AI handles rest |
| **Commands** | `/help`, `/clear`, `/model` | `/scaffold`, `/deploy`, `/undo` |
| **Use Case** | Careful, deliberate work | Fast prototyping, iterations |
| **Auto-fix** | Off | On (retry failed commands) |

### Vibe Mode Commands

| Command | What It Does | Example |
|---------|-------------|---------|
| `/scaffold` | Generate project from description | `/scaffold "React todo app"` |
| `/deploy` | One-command deploy to any platform | `/deploy` |
| `/undo` | Revert last changes via git | `/undo` |
| `/auto-fix` | Retry failed command with smart fixes | `/auto-fix` |

---

## Context Management: Hash-Pointer vs Semantic-Only

AetherMind uses a **two-tier retrieval** system, not pure semantic search.

```
TIER 1 (O(1)): Hash Pointer Resolution
┌─────────────────────────────────────┐
│ Short Context → Hash Prefix → Shard │
│ No search, direct routing          │
└─────────────────────────────────────┘
                    ↓
TIER 2: Semantic Search (within shard)
┌─────────────────────────────────────┐
│ Pre-filtered → ANN → Top-k results  │
│ 90%+ precision vs 50% full search   │
└─────────────────────────────────────┘
```

### Why Hash-Pointer is Better

| Approach | Speed | Precision | Scalability |
|----------|-------|-----------|-------------|
| Pure Semantic | O(n) full search | ~50-70% | Limited |
| Hash-Pointer | O(1) + O(log n) | ~90% | Excellent |

**Key insight**: Don't search what you can address directly.

---

## Skill Discovery: Static vs Dynamic

| Type | Behavior | Use Case |
|------|----------|----------|
| **Static** | Pre-defined skill list | Simple, predictable |
| **Dynamic (AetherMind)** | Web search on-demand | Unknown requirements, novel tasks |

```
Agent needs capability
    ↓
discover_skills tool
    ↓
DuckDuckGo search
    ↓
Extract & cache (24h TTL)
    ↓
Use skill
```

---

## Shard Architecture: 16 Shards

Context storage is distributed across **16 configurable shards**:

| Shard Type | Content | Routing |
|------------|---------|---------|
| Product | Feature docs, specs | Hash prefix 0x0-0xF |
| Sales | Pricing, deals | Hash prefix specific |
| Support | FAQs, tickets | Hash prefix specific |
| General | Cross-domain | Hash prefix fallback |

---

## Memory Types

| Type | Scope | Duration | Storage |
|------|-------|----------|---------|
| **Short Context** | Session | Current | In-memory (Redis) |
| **Hash Pointers** | Session | Hot | Cache |
| **Long-term** | Cross-session | Persistent | Vector DB + Object store |
| **Team Memory** | Project | Persistent | Shared files |

---

## Hash-Pointer Lifecycle

```
CREATION:
content + timestamp + conversation_id → SHA-256 hash
Hash stored as pointer in short context

RETRIEVAL:
Hash → routing table → shard → semantic search → result

EVOLUTION:
New version → new hash
Old hash → redirect chain (or tombstone)
```

---

## Comparison: AetherMind vs Standard RAG

| Feature | Standard RAG | AetherMind Hash-Pointer |
|---------|-------------|------------------------|
| **Latency** | High (full search) | Low (O(1) routing) |
| **Precision** | ~70% | ~90% |
| **Routing** | Probabilistic | Deterministic |
| **Scaling** | Linear slowdown | Horizontal (shards) |
| **Failure mode** | Query drift, semantic ambiguity | Hash collision (negligible) |

---

## Provider Support

AetherMind is **provider-agnostic**:

```bash
# Default: Anthropic
export ANTHROPIC_API_KEY=...

# OpenAI
export OPENAI_MODEL=gpt-4o
export OPENAI_BASE_URL=https://api.openai.com/v1

# Local Ollama
export OPENAI_BASE_URL=http://localhost:11434/v1

# Google Gemini
export CLAUDE_CODE_USE_GEMINI=true

# GitHub Copilot
export CLAUDE_CODE_USE_GITHUB=true
```

---

## Environment Variables Quick Ref

| Variable | Default | Purpose |
|----------|---------|---------|
| `AETHERMIND_VIBE_MODE` | `false` | Enable vibe coding |
| `AETHERMIND_SKILL_SEARCH` | `true` | Enable web skill discovery |
| `AETHERMIND_SKILL_CACHE_TTL` | `3600000` | 1 hour cache |
| `AUTO_OPEN_BROWSER` | `false` | Open preview after dev |
| `AUTO_APPROVE_SAFE` | `false` | Skip safe confirmations |
| `MAX_RETRIES` | `3` | Auto-fix retry count |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    AetherMind                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐    ┌──────────────┐              │
│  │ Short Context │ ←→ │ Hash Pointers│              │
│  │ (Active Mem)  │    │ (O(1) routing)              │
│  └──────┬───────┘    └──────────────┘              │
│         │                                          │
│         ▼                                          │
│  ┌─────────────────────────────────────────┐       │
│  │         Context Manager                  │       │
│  │  ┌────┬────┬────┬────┬────┬────┬────┐  │       │
│  │  │Shard│Shard│Shard│... │Shard│Shard│  │       │
│  │  │ 0   │ 1   │ 2   │    │ 14  │ 15  │  │       │
│  │  └──┬──┴──┬──┴──┬──┴────┴──┬──┴──┬──┘  │       │
│  └─────┼─────┼─────┼──────────┼─────┼─────┘       │
│        ▼     ▼     ▼          ▼     ▼             │
│  ┌────────┬────────┬────────┬────────────┐        │
│  │Product │ Sales  │Support │  General   │        │
│  │  Docs  │  Docs  │  Docs  │  (fallback)│        │
│  └────────┴────────┴────────┴────────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │         Skill Discovery (Dynamic)        │       │
│  │  DuckDuckGo → cache → agent use         │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Quick Start Commands

```bash
# Standard mode
npm run dev

# Vibe mode
export AETHERMIND_VIBE_MODE=true
npm run dev

# Build
npm run build

# System check
npm run doctor:runtime
```

---

**Rule of thumb**: Use Vibe when exploring, Standard when precision matters.