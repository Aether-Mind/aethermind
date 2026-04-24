# AetherMind

> Advanced agentic AI system with hash-pointer context management and self-discovery capabilities

**Context-aware intelligence. Zero boundaries.**

[![PR Checks](https://github.com/Aether-Mind/aethermind/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/Aether-Mind/aethermind/actions/workflows/pr-checks.yml) [![Release](https://github.com/Aether-Mind/aethermind/actions/workflows/release.yml/badge.svg)](https://github.com/Aether-Mind/aethermind/releases) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AetherMind is an open-source coding-agent CLI for cloud and local model providers.

Use OpenAI-compatible APIs, Gemini, GitHub Models, Codex OAuth, Codex, Ollama, Atomic Chat, and other supported backends while keeping one terminal-first workflow: prompts, tools, agents, MCP, slash commands, and streaming output.

## Documentation

| Guide | Description |
|-------|-------------|
| [Quick Start (Windows)](docs/quick-start-windows.md) | Windows installation and setup |
| [Quick Start (macOS/Linux)](docs/quick-start-mac-linux.md) | macOS/Linux installation and setup |
| [Non-Technical Setup](docs/non-technical-setup.md) | Beginner-friendly setup guide |
| [Advanced Setup](docs/advanced-setup.md) | Source builds, Bun workflows, diagnostics |
| [LiteLLM Setup](docs/litellm-setup.md) | LiteLLM integration guide |
| [Android Install](ANDROID_INSTALL.md) | Android/Termux installation |
| [Vibe Coding Guide](VIBE_GUIDE.md) | /scaffold, /deploy, /swarm, /undo commands |
| [Playbook](PLAYBOOK.md) | Agent behavior and protocols |
| [Differences from Claude Code](DIFFERENCES.md) | Key differences from upstream |

## Quick Start

### Install

```bash
npm install -g @aethermind-ai/aethermind
```

### Start

```bash
aethermind
```

Inside AetherMind:
- Run `/provider` for guided provider setup and saved profiles
- Run `/onboard-github` for GitHub Models onboarding

## Fastest Setup Examples

### OpenAI Setup

```bash
# macOS / Linux
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-your-key-here
export OPENAI_MODEL=gpt-4o
aethermind

# Windows PowerShell
$env:CLAUDE_CODE_USE_OPENAI="1"
$env:OPENAI_API_KEY="sk-your-key-here"
$env:OPENAI_MODEL="gpt-4o"
aethermind
```

### Local Ollama Setup

```bash
# macOS / Linux
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_MODEL=qwen2.5-coder:7b
aethermind

# Windows PowerShell
$env:CLAUDE_CODE_USE_OPENAI="1"
$env:OPENAI_BASE_URL="http://localhost:11434/v1"
$env:OPENAI_MODEL="qwen2.5-coder:7b"
aethermind
```

### Using Ollama's launch command

```bash
ollama launch aethermind --model qwen2.5-coder:7b
```

## Vibe Coding Mode

Enable with `AETHERMIND_VIBE_MODE=true`:

```bash
export AETHERMIND_VIBE_MODE=true
npm run dev
```

Vibe mode enables:
- **/scaffold** - Auto-generate project structures from natural language
- **/deploy** - One-command deployment to any platform
- **/undo** - Revert last changes via git rollback
- **/swarm** - Multi-agent parallel execution for complex tasks
- **Auto-Fix Mode** - Automatically retries failed commands with smart fixes

See the [Vibe Coding Guide](VIBE_GUIDE.md) for full documentation.

## Core AI Capabilities

- **Hash-Pointer Context Management** - Two-tier retrieval system with O(1) routing via SHA-256 hash prefixes
- **16-Shard Architecture** - Distributed context storage across configurable shards
- **User Behavior Learning** - Psychology-based query intent analysis
- **Persistent Cross-Session Memory** - User profiles and topic affinities
- **Proactive Verification** - Built-in verification agents
- **DuckDuckGo Web Search** - Free, no API key required for real-time information retrieval

## Supported Providers

| Provider | Setup | Notes |
|----------|-------|-------|
| OpenAI-compatible | `/provider` or env vars | Works with OpenAI, OpenRouter, DeepSeek, Groq, Mistral, LM Studio |
| Gemini | `/provider` or env vars | API key, access token, or local ADC |
| GitHub Models | `/onboard-github` | Interactive onboarding |
| Codex OAuth | `/provider` | Browser sign-in, secure storage |
| Ollama | `/provider`, env vars, or `ollama launch` | Local inference |
| Atomic Chat | `/provider`, env vars | Auto-detects loaded models |
| Bedrock / Vertex / Foundry | env vars | Enterprise environments |

See the [Provider Guide](docs/advanced-setup.md#provider-configuration) for detailed setup instructions.

## Agent Routing

AetherMind can route different agents to different models through settings-based routing:

```json
{
  "agentModels": {
    "deepseek-chat": {
      "base_url": "https://api.deepseek.com/v1",
      "api_key": "sk-your-key"
    }
  },
  "agentRouting": {
    "Explore": "deepseek-chat",
    "Plan": "deepseek-chat",
    "general-purpose": "deepseek-chat",
    "default": "deepseek-chat"
  }
}
```

## Web Search and Fetch

By default, WebSearch works on non-Anthropic models using DuckDuckGo. Configure Firecrawl for more reliable options:

```bash
export FIRECRAWL_API_KEY=your-key-here
```

## Headless gRPC Server

AetherMind can run as a headless gRPC service for CI/CD pipelines and custom UIs.

```bash
# Start the gRPC server
npm run dev:grpc

# Run the CLI client (separate terminal)
npm run dev:grpc:cli
```

## Source Build and Local Development

```bash
git clone https://github.com/Aether-Mind/aethermind.git
cd aethermind/openclaude-core

bun install
bun run build
node dist/cli.mjs
```

## Development Commands

```bash
bun run dev          # Development mode
bun test             # Run tests
bun run build        # Build for production
bun run smoke        # Smoke test
bun run doctor:runtime  # System check
```

## Repository Structure

```
openclaude-core/
├── src/
│   ├── commands/          # CLI commands (scaffold, deploy, undo, swarm, etc.)
│   ├── components/         # UI components (StartupScreen, Spinner, etc.)
│   ├── constants/          # Constants, prompts, tool definitions
│   ├── hooks/              # React hooks
│   ├── services/           # Core services
│   │   ├── contextManager/ # Hash-pointer context system (16 shards)
│   │   ├── skillDiscovery/ # Web-based skill discovery
│   │   ├── swarm/          # Multi-agent orchestration
│   │   └── userProfile/    # User behavior learning
│   ├── tools/              # Tool implementations
│   └── utils/              # Utilities
├── scripts/                # Build, verification, maintenance
├── docs/                   # Setup and contributor guides
├── bin/                    # CLI launcher
└── .github/                # CI/CD configuration
```

## Community

- [Discussions](https://github.com/Aether-Mind/aethermind/discussions) - Q&A, ideas, and conversation
- [Issues](https://github.com/Aether-Mind/aethermind/issues) - Confirmed bugs and actionable work
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines

## Contributing

Contributions welcome. For larger changes, open an issue first so scope is clear before implementation.

Helpful validation commands before opening a PR:

```bash
bun run build
bun run smoke
bun test path/to/file.test.ts
```

## Security

If you believe you found a security issue, see [SECURITY.md](SECURITY.md).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and changes.

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Built with the AetherMind architecture for next-generation AI coding assistants.**