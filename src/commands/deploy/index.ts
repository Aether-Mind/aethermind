import type { Command } from '../../commands.js'
import { isVibeModeEnabled } from '../../utils/envUtils.js'

const deploy = {
  type: 'local',
  name: 'deploy',
  description:
    'Deploy the current project to the cloud. Detects framework and pushes to appropriate platform (Vercel, Railway, etc.)',
  argumentHint: '[optional deployment options]',
  supportsNonInteractive: true,
  isEnabled: () => isVibeModeEnabled(),
  load: () => import('./deploy.js'),
} satisfies Command

export default deploy
