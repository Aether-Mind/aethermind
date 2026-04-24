import chalk from 'chalk'
import { execFileNoThrow } from '../../utils/execFileNoThrow.js'
import { isVibeModeEnabled } from '../../utils/envUtils.js'
import type { LocalCommandCall, LocalCommandResult } from '../../types/command.js'
import { logError } from '../../utils/log.js'

interface FrameworkConfig {
  name: string
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun'
  buildCommand: string
  devCommand: string
  files: Record<string, string>
}

const FRAMEWORK_CONFIGS: Record<string, Partial<FrameworkConfig>> = {
  react: {
    name: 'React',
    packageManager: 'npm',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  nextjs: {
    name: 'Next.js',
    packageManager: 'npm',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  'next.js': {
    name: 'Next.js',
    packageManager: 'npm',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  express: {
    name: 'Express',
    packageManager: 'npm',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  vue: {
    name: 'Vue',
    packageManager: 'npm',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  svelte: {
    name: 'Svelte',
    packageManager: 'npm',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  nuxt: {
    name: 'Nuxt',
    packageManager: 'npm',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  nestjs: {
    name: 'NestJS',
    packageManager: 'npm',
    buildCommand: 'npm run build',
    devCommand: 'npm run start:dev',
  },
  fastify: {
    name: 'Fastify',
    packageManager: 'npm',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  astro: {
    name: 'Astro',
    packageManager: 'npm',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  vite: {
    name: 'Vite',
    packageManager: 'npm',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
}

function detectFramework(prompt: string): string | null {
  const lowerPrompt = prompt.toLowerCase()
  for (const keyword of Object.keys(FRAMEWORK_CONFIGS)) {
    if (lowerPrompt.includes(keyword)) {
      return keyword
    }
  }
  return null
}

function getProjectName(prompt: string): string {
  // Extract project name from prompt, default to 'my-app'
  const words = prompt.trim().split(/\s+/)
  // Skip common words and find a suitable name
  const skipWords = ['app', 'application', 'project', 'with', 'using', 'create', 'new', 'build', 'make']
  for (const word of words) {
    const cleaned = word.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (cleaned.length > 2 && !skipWords.includes(cleaned)) {
      return cleaned
    }
  }
  return 'my-app'
}

function generateProjectFiles(
  framework: string,
  projectName: string,
): Record<string, string> {
  const baseFiles: Record<string, string> = {}

  // Generate README.md
  baseFiles['README.md'] = `# ${projectName}\n\nCreated with AetherMind Vibe Mode\n`

  // Generate package.json based on framework
  if (framework === 'react' || framework === 'nextjs' || framework === 'next.js') {
    baseFiles['package.json'] = JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: framework === 'nextjs' || framework === 'next.js' ? 'next dev' : 'vite',
          build: framework === 'nextjs' || framework === 'next.js' ? 'next build' : 'vite build',
          preview: 'vite preview',
        },
        dependencies: framework === 'nextjs' || framework === 'next.js'
          ? { next: '^14.0.0', react: '^18.0.0', 'react-dom': '^18.0.0' }
          : { react: '^18.0.0', 'react-dom': '^18.0.0' },
        devDependencies: framework === 'nextjs' || framework === 'next.js'
          ? { '@types/node': '^20.0.0', '@types/react': '^18.0.0', typescript: '^5.0.0' }
          : { '@vitejs/plugin-react': '^4.0.0', vite: '^5.0.0', typescript: '^5.0.0' },
      },
      null,
      2,
    )
  } else if (framework === 'express' || framework === 'fastify') {
    baseFiles['package.json'] = JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'tsx watch src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js',
        },
        dependencies: framework === 'express'
          ? { express: '^4.18.0', cors: '^2.8.0' }
          : { fastify: '^4.24.0', cors: '^6.0.0' },
        devDependencies: { typescript: '^5.0.0', '@types/node': '^20.0.0', tsx: '^4.0.0' },
      },
      null,
      2,
    )
  } else if (framework === 'nestjs') {
    baseFiles['package.json'] = JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'nest start --watch',
          build: 'nest build',
          start: 'nest start',
        },
        dependencies: { '@nestjs/common': '^10.0.0', '@nestjs/core': '^10.0.0', reflect_metadata: '^0.1.0' },
        devDependencies: { '@nestjs/cli': '^10.0.0', typescript: '^5.0.0' },
      },
      null,
      2,
    )
  } else if (framework === 'vue' || framework === 'svelte' || framework === 'astro' || framework === 'vite') {
    baseFiles['package.json'] = JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {},
        devDependencies: { vite: '^5.0.0', typescript: '^5.0.0' },
      },
      null,
      2,
    )
  } else {
    // Default package.json
    baseFiles['package.json'] = JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'echo "Add your dev command"',
          build: 'echo "Add your build command"',
        },
        dependencies: {},
        devDependencies: {},
      },
      null,
      2,
    )
  }

  // Generate TypeScript config
  baseFiles['tsconfig.json'] = JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ['src/**/*'],
    },
    null,
    2,
  )

  // Generate basic structure
  baseFiles['src/index.ts'] = `// ${projectName} - Main entry point
console.log('Hello from ${projectName}!')
`

  return baseFiles
}

async function writeFile(path: string, content: string): Promise<void> {
  const { writeFileSync, mkdirSync, existsSync } = await import('fs')
  const { dirname } = await import('path')
  const fullPath = path
  const dir = dirname(fullPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(fullPath, content, 'utf-8')
}

async function installDependencies(packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun', cwd?: string): Promise<boolean> {
  try {
    const cmd = packageManager === 'yarn' ? 'yarn'
      : packageManager === 'pnpm' ? 'pnpm'
      : packageManager === 'bun' ? 'bun'
      : 'npm'
    const args = packageManager === 'yarn' ? ['install']
      : packageManager === 'pnpm' ? ['install']
      : packageManager === 'bun' ? ['install']
      : ['install']

    logError(`Running: ${cmd} ${args.join(' ')}`)
    const result = await execFileNoThrow(cmd, args, {
      cwd,
      stdio: 'inherit',
      timeout: 120000,
    })
    return result.code === 0
  } catch (error) {
    logError(`Failed to install dependencies: ${error}`)
    return false
  }
}

export const call: LocalCommandCall = async (args, context): Promise<LocalCommandResult> => {
  const vibeMode = isVibeModeEnabled()

  if (!args.trim()) {
    return {
      type: 'text',
      value: `Please provide a project description.\n\nUsage: /scaffold "React todo app with SQLite"\n\nDetected frameworks: React, Next.js, Express, Vue, Svelte, Astro, NestJS, Fastify, Vite`,
    }
  }

  const prompt = args.trim()
  const framework = detectFramework(prompt)
  const projectName = getProjectName(prompt)

  if (!vibeMode) {
    return {
      type: 'text',
      value: `Vibe Mode is not enabled. Set AETHERMIND_VIBE_MODE=true to use scaffold command.`,
    }
  }

  let output = `Scaffolding project "${projectName}"...\n`
  if (framework) {
    output += `Detected framework: ${FRAMEWORK_CONFIGS[framework]?.name || framework}\n`
  } else {
    output += `No specific framework detected, using defaults\n`
  }

  try {
    const files = generateProjectFiles(framework || 'default', projectName)

    // Write all files
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = filePath
      await writeFile(fullPath, content)
      output += `Created: ${chalk.green(filePath)}\n`
    }

    // Install dependencies
    const pm = (framework && FRAMEWORK_CONFIGS[framework]?.packageManager) || 'npm'
    output += `\nInstalling dependencies with ${pm}...\n`
    const installSuccess = await installDependencies(pm)

    if (installSuccess) {
      output += chalk.green(`\nProject "${projectName}" scaffolded successfully!\n`)
      output += `Run: cd ${projectName} && npm run dev\n`
    } else {
      output += chalk.yellow(`\nProject files created but dependency installation failed.`)
      output += `\nRun manually: cd ${projectName} && npm install\n`
    }

    return { type: 'text', value: output }
  } catch (error) {
    logError(`Scaffold error: ${error}`)
    return {
      type: 'text',
      value: `Failed to scaffold project: ${error}`,
    }
  }
}
