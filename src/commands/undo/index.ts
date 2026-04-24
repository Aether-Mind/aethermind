import type { Command } from '../../commands.js'
import { isVibeModeEnabled } from '../../utils/envUtils.js'

const undo = {
  type: 'local',
  name: 'undo',
  description: 'Revert the last changes made to files. Use /undo to rollback the last set of changes.',
  aliases: ['rollback'],
  argumentHint: '',
  supportsNonInteractive: true,
  isEnabled: () => isVibeModeEnabled(),
  load: () => import('./undo.js'),
} satisfies Command

export default undo
