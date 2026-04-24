# Vibe Coding Guide

> Use AI to build faster with less friction

## Vibe Mode

Enable vibe coding features:

```bash
export AETHERMIND_VIBE_MODE=true
npm run dev
```

## Commands

### /scaffold - Generate Project

Describe what you want to build:

```
/scaffold "React todo app with SQLite backend"
/scaffold "Next.js blog with MDX support"
/scaffold "Express API with PostgreSQL"
/scaffold "Vue dashboard with charts"
```

**Detected Frameworks:**
- React, Next.js
- Express, Fastify, NestJS
- Vue, Svelte, Astro
- Vite, any Node.js project

**What it creates:**
- `package.json` with dependencies
- `tsconfig.json` for TypeScript
- Basic `src/index.ts` entry point
- Installs dependencies automatically

### /deploy - One-Command Deploy

```
/deploy
```

**Supported Platforms:**
- Vercel (detects `vercel.json`)
- Railway (detects `railway.json`)
- Render (detects `render.yaml`)
- Netlify (detects `netlify.toml`)
- Fly.io (detects `fly.toml`)
- Surge (static sites)

### /undo - Revert Changes

```
/undo
```

Shows last changed files and suggests git revert.

### /auto-fix - Smart Retry

```
/auto-fix
```

When a command fails, automatically tries fixes and retries.

### /swarm - Multi-Agent Parallel Execution

```
/swarm "Build a complete e-commerce platform"
/swarm --fullstack Build me a blog with users
```

**How it works:**
1. Analyzes your task and splits it into 2-5 subtasks
2. Spawns multiple agents in parallel
3. Each agent works on their specialized task simultaneously
4. Agents communicate results to each other
5. Final result is merged from all agents

**Templates:**
- `/swarm --fullstack` - Frontend + Backend + DB + Tests
- `/swarm --webapp` - UI + API + Auth + Review
- `/swarm --debug` - Investigate + Fix + Test
- `/swarm --research` - Research + Build + Review

**Agent Roles:**
- `explorer` - Research and gather info
- `builder` - Write code and implement
- `tester` - Verify and test
- `reviewer` - Check quality
- `debugger` - Fix issues

**Communication:**
- `/send <agent> <message>` - Message specific agent
- `/broadcast <message>` - Send to all agents
- `/status` - View all agent progress
- `/merge` - Combine results

## Examples

### Build a React App

```bash
$ /scaffold "React app with authentication"
✓ Detected: React + Vite
✓ Created project structure
✓ Installing dependencies...
✓ Done! Run: npm run dev
```

### Deploy to Vercel

```bash
$ /deploy
✓ Detected Vercel config
✓ Running vercel deploy...
✓ Deployed: https://your-app.vercel.app
```

## Philosophy

Vibe coding = describe intent, let AI handle the rest.

- Less configuration
- More automation
- Try ideas fast
- Fix later if needed

**Rule:** If you wouldn't ask a senior dev to explain it, don't explain it to AI. Just say what you want.

## Tips

1. **Be vague first** - "React todo app" not "React 18 with TypeScript"
2. **Iterate** - Start simple, add complexity as needed
3. **Trust auto-fix** - Let AI fix mistakes automatically
4. **Deploy early** - Get URL, share progress
5. **Ignore files** - `/scaffold "ignore node_modules"` if needed

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AETHERMIND_VIBE_MODE` | Enable all vibe features |
| `AUTO_OPEN_BROWSER` | Open preview after dev server starts |
| `AUTO_APPROVE_SAFE` | Skip confirmations for safe ops |
| `MAX_RETRIES` | Auto-fix retry count (default: 3) |