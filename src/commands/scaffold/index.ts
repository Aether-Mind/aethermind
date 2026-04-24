import type { Command } from '../../commands.js'
import { isVibeModeEnabled } from '../../utils/envUtils.js'

const scaffold = {
  type: 'local',
  name: 'scaffold',
  description:
    'Scaffold a new project from a description. Example: /scaffold "React todo app with SQLite"',
  aliases: ['create', 'new'],
  argumentHint: '"<project description>"',
  supportsNonInteractive: true,
  isEnabled: () => isVibeModeEnabled(),
  load: () => import('./scaffold.js'),
} satisfies Command

export default scaffold
