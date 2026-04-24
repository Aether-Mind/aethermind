import chalk from 'chalk'
import { execFileNoThrow } from '../../utils/execFileNoThrow.js'
import { isVibeModeEnabled } from '../../utils/envUtils.js'
import type { LocalCommandCall, LocalCommandResult } from '../../types/command.js'
import { logError } from '../../utils/log.js'

interface ChangeRecord {
  timestamp: number
  files: string[]
  description: string
  hash: string
}

// In-memory storage for changes (in production, this would be persisted)
const changeHistory: ChangeRecord[] = []
const MAX_HISTORY = 50

function generateHash(files: string[]): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(files.join('')).digest('hex').substring(0, 8)
}

async function getGitDiff(): Promise<string[]> {
  const { stdout } = await execFileNoThrow('git', ['diff', '--name-only', 'HEAD~1..HEAD'], {
    timeout: 10000,
  }).catch(() => ({ stdout: '', code: 1 }))

  if (!stdout.trim()) {
    // Fallback to status for new files
    const { stdout: statusOut } = await execFileNoThrow('git', ['status', '--porcelain'], {
      timeout: 10000,
    }).catch(() => ({ stdout: '', code: 1 }))

    return statusOut
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.substring(3).trim())
  }

  return stdout.split('\n').filter(f => f.trim())
}

async function getGitLastCommitDescription(): Promise<string> {
  const { stdout } = await execFileNoThrow(
    'git',
    ['log', '-1', '--pretty=format:%s'],
    { timeout: 10000 },
  ).catch(() => ({ stdout: 'Last changes', code: 1 }))

  return stdout || 'Last changes'
}

export const call: LocalCommandCall = async (args, _context): Promise<LocalCommandResult> => {
  const vibeMode = isVibeModeEnabled()

  if (!vibeMode) {
    return {
      type: 'text',
      value: `Vibe Mode is not enabled. Set AETHERMIND_VIBE_MODE=true to use undo command.`,
    }
  }

  try {
    // Get the last changed files
    const files = await getGitDiff()
    const description = await getGitLastCommitDescription()

    if (files.length === 0) {
      return {
        type: 'text',
        value: `No recent changes found to undo.`,
      }
    }

    const hash = generateHash(files)
    const record: ChangeRecord = {
      timestamp: Date.now(),
      files,
      description,
      hash,
    }

    changeHistory.push(record)
    if (changeHistory.length > MAX_HISTORY) {
      changeHistory.shift()
    }

    let output = chalk.bold('\nLast changes:\n')
    output += `${chalk.cyan(`Commit: ${description}`)}\n`
    output += `${chalk.gray(`Hash: ${hash}`)}\n\n`
    output += `Changed files:\n`
    for (const file of files) {
      output += `  ${chalk.yellow(file)}\n`
    }

    // In vibe mode, we show the undo capability
    output += `\n${chalk.green('To undo these changes, run:')}\n`
    output += `${chalk.cyan('git revert HEAD')}\n`

    return { type: 'text', value: output }
  } catch (error) {
    logError(`Undo error: ${error}`)
    return {
      type: 'text',
      value: `Failed to get change history: ${error}`,
    }
  }
}
