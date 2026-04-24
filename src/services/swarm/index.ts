/**
 * AetherMind Swarm - Multi-Agent Parallel Execution
 *
 * Built on existing teammate/agent infrastructure:
 * - Uses existing runAgent() for spawning agents
 * - SendMessageTool for inter-agent communication
 * - Team/Swarm utilities for coordination
 */

import { runAgent } from '../../tools/AgentTool/runAgent.js'
import type { AgentDefinition } from '../../tools/AgentTool/loadAgentsDir.js'
import type { Message, ToolUseContext } from '../../types/message.js'
import type { Tools, ToolUseContext as TUC } from '../../Tool.js'
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
import type { QuerySource } from '../../constants/querySource.js'

export interface SwarmAgent {
  id: string
  name: string
  role: 'explorer' | 'builder' | 'tester' | 'reviewer' | 'debugger' | 'coordinator'
  task: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  progress: number
}

export interface SwarmMessage {
  from: string
  to: string
  type: 'request' | 'response' | 'update' | 'done'
  payload: unknown
  timestamp: number
}

export interface SwarmConfig {
  task: string
  agents: SwarmAgent[]
  maxParallel: number
  onProgress?: (agent: SwarmAgent) => void
  onMessage?: (msg: SwarmMessage) => void
  onComplete?: (results: Map<string, string>) => void
  onError?: (agentId: string, error: Error) => void
}

/**
 * SwarmOrchestrator - Coordinates multiple agents working in parallel
 * Uses existing teammate infrastructure for inter-agent communication
 */
export class SwarmOrchestrator {
  private agents: Map<string, SwarmAgent> = new Map()
  private messages: SwarmMessage[] = []
  private results: Map<string, string> = new Map()
  private config: SwarmConfig

  constructor(config: SwarmConfig) {
    this.config = config
    config.agents.forEach(agent => this.agents.set(agent.id, agent))
  }

  /**
   * Send message between agents via SendMessageTool
   */
  sendMessage(from: string, to: string, type: SwarmMessage['type'], payload: unknown) {
    const msg: SwarmMessage = { from, to, type, payload, timestamp: Date.now() }
    this.messages.push(msg)
    this.config.onMessage?.(msg)
  }

  /**
   * Broadcast to all agents
   */
  broadcast(from: string, type: SwarmMessage['type'], payload: unknown) {
    for (const [id] of this.agents) {
      if (id !== from) {
        this.sendMessage(from, id, type, payload)
      }
    }
  }

  /**
   * Update agent status
   */
  updateAgent(id: string, update: Partial<SwarmAgent>) {
    const agent = this.agents.get(id)
    if (agent) {
      Object.assign(agent, update)
      this.config.onProgress?.(agent)
    }
  }

  /**
   * Run all agents in parallel
   */
  async run(options: {
    availableTools: Tools
    canUseTool: CanUseToolFn
    toolUseContext: TUC
    querySource: QuerySource
  }): Promise<Map<string, string>> {
    const { availableTools, canUseTool, toolUseContext, querySource } = options

    // Run all agents in parallel
    const promises = this.config.agents.map(async (agent) => {
      try {
        this.updateAgent(agent.id, { status: 'running' })

        // Build prompt for this agent with swarm context
        const prompt = this.buildAgentPrompt(agent)
        const context = this.buildSharedContext(agent.id)

        // Create messages
        const promptMessages: Message[] = [
          {
            type: 'user',
            role: 'user',
            content: [{ type: 'text', text: prompt }],
          },
          ...(context ? [{
            type: 'user' as const,
            role: 'user' as const,
            content: [{ type: 'text' as const, text: context }]
          }] : [])
        ]

        // Run agent
        let result = ''
        for await (const event of runAgent({
          agentDefinition: this.getAgentDefinition(agent.role),
          promptMessages,
          toolUseContext: toolUseContext as ToolUseContext,
          canUseTool,
          isAsync: true,
          querySource,
          availableTools,
          description: agent.task,
        })) {
          if (event.type === 'done' && event.result) {
            result = String(event.result)
          }
        }

        this.updateAgent(agent.id, { status: 'completed', result, progress: 100 })
        this.results.set(agent.id, result)
        this.broadcast(agent.id, 'done', { result })

        return result
      } catch (error) {
        const err = error as Error
        this.updateAgent(agent.id, { status: 'failed' })
        this.config.onError?.(agent.id, err)
        return ''
      }
    })

    await Promise.all(promises)
    this.config.onComplete?.(this.results)
    return this.results
  }

  private getAgentDefinition(role: string): AgentDefinition {
    return {
      name: role,
      agentType: role,
      description: `${role} agent`,
      tools: ['*'],
    } as AgentDefinition
  }

  private buildAgentPrompt(agent: SwarmAgent): string {
    const others = Array.from(this.agents.values())
      .filter(a => a.id !== agent.id)
      .map(a => `- **${a.name}** (${a.role}): ${a.task}`)
      .join('\n')

    return `# ${agent.name} (${agent.role})

## Your Task
${agent.task}

## Swarm Team
${others ? `Other agents:\n${others}` : 'You are working alone.'}

## Instructions
1. Focus on your specific task
2. Use /send to communicate with other agents when needed
3. Report completion when done

Work autonomously. Coordinate via messaging.`
  }

  private buildSharedContext(excludeAgentId: string): string {
    const completed = Array.from(this.agents.values())
      .filter(a => a.id !== excludeAgentId && a.result)
      .map(a => `**From ${a.name}:**\n${a.result}`)
      .join('\n\n')
    return completed ? `# Shared Results\n\n${completed}` : ''
  }

  getAgents(): SwarmAgent[] {
    return Array.from(this.agents.values())
  }

  getMessages(): SwarmMessage[] {
    return this.messages
  }
}

/**
 * Execute swarm with custom agents
 */
export async function executeSwarm(
  task: string,
  subagents: { name: string; role: string; task: string }[],
  options: {
    availableTools: Tools
    canUseTool: CanUseToolFn
    toolUseContext: TUC
    querySource: QuerySource
  }
): Promise<Map<string, string>> {
  const agents: SwarmAgent[] = subagents.map((sa, i) => ({
    id: `swarm_${i}`,
    name: sa.name,
    role: sa.role as SwarmAgent['role'],
    task: sa.task,
    status: 'pending',
    progress: 0,
  }))

  const orchestrator = new SwarmOrchestrator({
    task,
    agents,
    maxParallel: agents.length,
  })

  return orchestrator.run(options)
}

// Pre-built templates
export const SWARM_TEMPLATES = {
  fullstack: {
    name: 'Full-Stack App',
    agents: [
      { name: 'frontend', role: 'builder', task: 'Build React frontend with components and styling' },
      { name: 'backend', role: 'builder', task: 'Create Express.js API with routes and middleware' },
      { name: 'database', role: 'builder', task: 'Design database schema and write migrations' },
      { name: 'tester', role: 'tester', task: 'Write integration tests for all endpoints' },
    ],
  },
  webapp: {
    name: 'Web Application',
    agents: [
      { name: 'ui', role: 'builder', task: 'Create UI components and responsive layout' },
      { name: 'api', role: 'builder', task: 'Implement REST API endpoints' },
      { name: 'auth', role: 'builder', task: 'Add authentication and authorization' },
      { name: 'reviewer', role: 'reviewer', task: 'Review code quality and security' },
    ],
  },
  debug: {
    name: 'Debug & Fix',
    agents: [
      { name: 'investigator', role: 'explorer', task: 'Identify root cause of the issue' },
      { name: 'fixer', role: 'builder', task: 'Implement the fix' },
      { name: 'tester', role: 'tester', task: 'Verify the fix works and no regressions' },
    ],
  },
  research: {
    name: 'Research & Build',
    agents: [
      { name: 'researcher', role: 'explorer', task: 'Research best practices and gather requirements' },
      { name: 'builder', role: 'builder', task: 'Implement the solution based on research' },
      { name: 'reviewer', role: 'reviewer', task: 'Review and refine the implementation' },
    ],
  },
} as const

export type SwarmTemplate = keyof typeof SWARM_TEMPLATES