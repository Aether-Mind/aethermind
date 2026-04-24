import chalk from 'chalk'
import { execFileNoThrow } from '../../utils/execFileNoThrow.js'
import { isVibeModeEnabled } from '../../utils/envUtils.js'
import type { LocalCommandCall, LocalCommandResult } from '../../types/command.js'
import { logError } from '../../utils/log.js'
import { readFileSync, existsSync } from 'fs'

interface DeployPlatform {
  name: string
  detectFiles: string[]
  deployCommand: string
  buildCommand: string
  devCommand: string
}

const PLATFORM_CONFIGS: Record<string, DeployPlatform> = {
  vercel: {
    name: 'Vercel',
    detectFiles: ['vercel.json', 'next.config.js', '.vercelignore'],
    deployCommand: 'npx vercel --yes',
    buildCommand: 'npx vercel --yes --prod',
    devCommand: 'npx vercel dev',
  },
  railway: {
    name: 'Railway',
    detectFiles: ['railway.toml'],
    deployCommand: 'npx railway up',
    buildCommand: 'npx railway up --prod',
    devCommand: 'npx railway dev',
  },
  render: {
    name: 'Render',
    detectFiles: ['render.yaml', 'render.yaml'],
    deployCommand: 'render deploy',
    buildCommand: 'render deploy --prod',
    devCommand: 'render dev',
  },
  netlify: {
    name: 'Netlify',
    detectFiles: ['netlify.toml'],
    deployCommand: 'npx netlify deploy --yes',
    buildCommand: 'npx netlify deploy --prod --yes',
    devCommand: 'npx netlify dev',
  },
  flyio: {
    name: 'Fly.io',
    detectFiles: ['Dockerfile', 'fly.toml'],
    deployCommand: 'fly launch && fly deploy',
    buildCommand: 'fly deploy',
    devCommand: 'fly dev',
  },
  surge: {
    name: 'Surge',
    detectFiles: [],
    deployCommand: 'npx surge .',
    buildCommand: 'npx surge . --domain',
    devCommand: 'npx surge dev',
  },
  render_static: {
    name: 'Render (Static)',
    detectFiles: ['package.json'],
    deployCommand: 'npx render-deploy-s3',
    buildCommand: 'npx render-deploy-s3 --prod',
    devCommand: 'npx render-deploy-s3 dev',
  },
}

function detectFramework(): string | null {
  // Check package.json for framework hints
  const packageJsonPath = 'package.json'
  if (existsSync(packageJsonPath)) {
    try {
      const content = readFileSync(packageJsonPath, 'utf-8')
      const pkg = JSON.parse(content)
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }

      if (deps.next) return 'nextjs'
      if (deps.express) return 'express'
      if (deps.fastify) return 'fastify'
      if (deps.nestjs || deps['@nestjs/common']) return 'nestjs'
      if (deps.vue) return 'vue'
      if (deps.svelte) return 'svelte'
      if (deps.astro) return 'astro'
      if (deps.vite) return 'vite'
      if (deps.react) return 'react'
    } catch {
      // Ignore parse errors
    }
  }
  return null
}

function detectPlatform(): string | null {
  for (const [platform, config] of Object.entries(PLATFORM_CONFIGS)) {
    for (const file of config.detectFiles) {
      if (existsSync(file)) {
        return platform
      }
    }
  }
  return null
}

function suggestPlatform(framework: string | null): string {
  // Default platform suggestions based on framework
  if (framework === 'nextjs') return 'vercel'
  if (framework === 'express' || framework === 'fastify' || framework === 'nestjs') return 'railway'
  if (framework === 'react' || framework === 'vue' || framework === 'svelte' || framework === 'astro') return 'netlify'
  return 'vercel' // Default to Vercel
}

export const call: LocalCommandCall = async (args, _context): Promise<LocalCommandResult> => {
  const vibeMode = isVibeModeEnabled()

  if (!vibeMode) {
    return {
      type: 'text',
      value: `Vibe Mode is not enabled. Set AETHERMIND_VIBE_MODE=true to use deploy command.`,
    }
  }

  let output = chalk.bold('\nDetecting project for deployment...\n')

  // Detect framework
  const framework = detectFramework()
  if (framework) {
    output += `Detected framework: ${chalk.cyan(framework)}\n`
  }

  // Detect platform
  let platform = detectPlatform()
  if (!platform) {
    // Suggest platform based on framework
    platform = suggestPlatform(framework)
    output += `No platform config detected. Suggested platform: ${chalk.cyan(platform)}\n`
  } else {
    output += `Detected platform: ${chalk.cyan(PLATFORM_CONFIGS[platform]?.name || platform)}\n`
  }

  try {
    const config = PLATFORM_CONFIGS[platform || 'vercel']
    if (!config) {
      return {
        type: 'text',
        value: `Unknown platform: ${platform}`,
      }
    }

    output += `\n${chalk.yellow('Deploying to')} ${chalk.bold(config.name)}...\n`
    output += `${chalk.dim('Build command:')} ${config.buildCommand}\n\n`

    // Run deploy command
    const deployArgs = config.deployCommand.split(' ').slice(1)
    const deployCmd = config.deployCommand.split(' ')[0]
    await execFileNoThrow(deployCmd, deployArgs, { stdio: 'inherit', timeout: 300000 })

    output += `\n${chalk.green('Deployment initiated successfully!')}\n`
    output += `Check your ${config.name} dashboard for deployment status.\n`

    return { type: 'text', value: output }
  } catch (error) {
    logError(`Deploy error: ${error}`)
    return {
      type: 'text',
      value: `Deployment failed: ${error}\n\nCheck your ${platform ? PLATFORM_CONFIGS[platform]?.name : 'platform'} configuration and try again.`,
    }
  }
}
