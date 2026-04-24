/**
 * AetherMind Swarm Command
 *
 * Divides complex tasks into multiple subagents that:
 * - Execute in parallel
 * - Communicate with each other
 * - Collaborate to complete the task end-to-end
 *
 * Use --template or describe your task for automatic splitting
 */

import type { Command, PromptCommand } from '../../types/command.js'
import { SWARM_TEMPLATES } from '../../services/swarm/index.js'

export const swarmCommand: Command = {
  type: 'local-jsx',
  name: 'swarm',
  description: 'Divide complex task into parallel subagents that collaborate',
  loadedFrom: 'commands_DEPRECATED',
  async getPromptForCommand(args, context) {
    const task = args?.join(' ') || ''

    // Check for template usage
    const useTemplate = args?.[0]?.startsWith('--')
    const templateName = useTemplate ? args?.[0]?.slice(2) : null

    if (templateName && templateName in SWARM_TEMPLATES) {
      const template = SWARM_TEMPLATES[templateName as keyof typeof SWARM_TEMPLATES]
      return `## Swarm: ${template.name}

**Using template: ${templateName}**

${template.agents.length} agents will execute in parallel:
${template.agents.map(a => `- **${a.name}** (${a.role}): ${a.task}`).join('\n')}

**Execution Flow:**
1. All agents start simultaneously
2. Each agent specializes in their domain
3. Agents communicate via /send <agent> <message>
4. Results are shared and merged
5. Coordinator agent combines all outputs

**Available Commands:**
- \`/send <agent> <msg>\` - Message specific agent
- \`/broadcast <msg>\` - Send to all agents
- \`/status\` - View all agent progress
- \`/merge\` - Combine all results

**To execute:**
\`/swarm --${templateName}\`

**To customize:**
\`/swarm Build a full-stack app with React frontend and Node.js backend\``
    }

    return `## Swarm Mode

Divide complex tasks across multiple parallel agents.

**Available Templates:**
${Object.entries(SWARM_TEMPLATES).map(([key, t]) =>
  `  /swarm --${key}: ${t.name} (${t.agents.length} agents)`
).join('\n')}

**Or describe your task:**
\`/swarm Build a complete e-commerce platform\`

**How it works:**
1. **Analyze** - Break task into specialized subtasks
2. **Spawn** - Create 2-5 agents in parallel
3. **Execute** - All agents work simultaneously
4. **Communicate** - Agents share results via messaging
5. **Merge** - Combine into final deliverable

**Agent Roles:**
- \`explorer\` - Research & gather info
- \`builder\` - Write code & implement
- \`tester\` - Verify & test
- \`reviewer\` - Check quality
- \`debugger\` - Fix issues

**Example:**
\`/swarm --fullstack Build me a blog with users and comments\`

**Output:**
Each agent produces output, final result is the combined solution.`
  },
} satisfies PromptCommand

export default swarmCommand