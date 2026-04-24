/**
 * AetherMind Discover Skills Tool
 *
 * On-demand skill discovery via web search.
 * When the agent needs a capability, it searches online to find relevant skills.
 */

import { z } from 'zod/v4'
import {
  buildTool,
  type Tool,
} from '../../Tool.js'
import { logForDebugging } from '../../utils/debug.js'
import { discoverSkillsForTask, buildSkillPrompt } from '../../services/skillDiscovery/index.js'

export const DISCOVER_SKILLS_TOOL_NAME = 'discover_skills'

const inputSchema = z.object({
  task: z.string().describe('Description of the task you need skills for'),
  context: z.string().optional().describe('Optional context about current project or conversation'),
})

const outputSchema = z.object({
  skills: z.array(z.object({
    name: z.string(),
    description: z.string(),
    source: z.string(),
    url: z.string(),
    relevance: z.number(),
  })),
  prompts: z.array(z.string()),
  discovered: z.number(),
})

type Input = z.infer<typeof inputSchema>
type Output = z.infer<typeof outputSchema>

async function handler(
  args: Input,
  _permissionContext: unknown,
): Promise<Output> {
  try {
    const skills = await discoverSkillsForTask({
      task: args.task,
      context: args.context,
    })

    const prompts = skills.map(buildSkillPrompt)

    return {
      skills: skills.map(s => ({
        name: s.name,
        description: s.description,
        source: s.source,
        url: s.url,
        relevance: s.relevance,
      })),
      prompts,
      discovered: skills.length,
    }
  } catch (error) {
    logForDebugging('[discover_skills] error:', error)
    return { skills: [], prompts: [], discovered: 0 }
  }
}

export const DiscoverSkillsTool: Tool = buildTool({
  name: DISCOVER_SKILLS_TOOL_NAME,
  inputSchema,
  outputSchema,
  handler,
  prompt: async () => 'Discover relevant skills from the internet for the current task. Use when you need capabilities not covered by loaded skills.',
})