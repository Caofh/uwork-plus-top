import { jsBridge } from '@/utils/electron'
import { envInfo } from '@/config/index'
import { useQuickForgeStore } from '@/store/quickForge'

const QUICK_FORGE_REPO_URL = 'https://gitee.com/redorc/quick-forge.git'

export function getQuickForgeRepoPath(projectPath: string) {
  return `${projectPath}/ai/quick-forge`
}

export function getQuickForgeDistPath(projectPath: string) {
  return `${getQuickForgeRepoPath(projectPath)}/dist/index.html`
}

/** 判断 QuickForge 是否已就绪（dist/index.html 是否存在） */
export async function isQuickForgeReady(projectPath: string) {
  const result: any = await jsBridge.registerSync({
    method: 'existsSync',
    json: { path: getQuickForgeDistPath(projectPath) },
  })
  return Boolean(result.data)
}

const GIT_PULL_UP_TO_DATE_PATTERN = /already up to date|已经是最新的/i

function gitPullHasUpdates(result: { stdout?: string; stderr?: string; code?: number }) {
  if (result.code !== 0) {
    return false
  }
  const output = `${result.stdout || ''}\n${result.stderr || ''}`
  return !GIT_PULL_UP_TO_DATE_PATTERN.test(output)
}

/**
 * 初始化 QuickForge：clone 到 ~/UWORK-PLUS[-dev]/ai/quick-forge
 * @returns 是否新 clone 了仓库
 */
export async function ensureQuickForgeRepo(projectPath: string): Promise<boolean> {
  const aiDir = `${projectPath}/ai`
  const repoPath = getQuickForgeRepoPath(projectPath)

  const gitExists: any = await jsBridge.registerSync({
    method: 'existsSync',
    json: { path: `${repoPath}/.git` },
  })
  if (gitExists.data) {
    return false
  }

  await jsBridge.registerSync({
    method: 'createDirectoryOrFile',
    json: {
      dirs: [{ name: aiDir, type: 'dir' }],
    },
  })

  const command = `git clone ${QUICK_FORGE_REPO_URL} "${repoPath}"`
  const result: any = await jsBridge.registerSync({
    method: 'runTerminalCommand',
    json: { command },
  })

  if (result.code !== 0) {
    console.warn('[QuickForge] 仓库 clone 失败:', result.stderr)
    return false
  }

  console.log('[QuickForge] 仓库 clone 完成:', repoPath)
  return true
}

/** 拉取 QuickForge 最新代码，@returns 是否有更新 */
export async function pullQuickForgeRepo(projectPath: string): Promise<boolean> {
  const repoPath = getQuickForgeRepoPath(projectPath)
  const command = `cd "${repoPath}" && git pull origin master`
  const result: any = await jsBridge.registerSync({
    method: 'runTerminalCommand',
    json: { command },
  })

  if (result.code !== 0) {
    console.warn('[QuickForge] git pull 失败:', result.stderr)
    return false
  }

  const hasUpdates = gitPullHasUpdates(result)
  if (hasUpdates) {
    console.log('[QuickForge] git pull 有更新:', repoPath)
  } else {
    console.log('[QuickForge] git pull 已是最新，跳过重启:', repoPath)
  }
  return hasUpdates
}

const QUICK_FORGE_POLL_INTERVAL_MS = 1000
const QUICK_FORGE_POLL_TIMEOUT_MS = 60000 * 5 // 默认5分钟过期

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const QUICK_FORGE_RUNNING_PATTERN = /QuickForge is running/i

function parseQuickForgeStatusOutput(result: { stdout?: string; stderr?: string; code?: number }) {
  const output = `${result.stdout || ''}\n${result.stderr || ''}`
  return QUICK_FORGE_RUNNING_PATTERN.test(output)
}

/** 执行 npm run quickforgeStatus，输出含 "QuickForge is running" 视为已启动 */
export async function isQuickForgeProcessRunning(projectPath: string) {
  const repoPath = getQuickForgeRepoPath(projectPath)
  const result: any = await jsBridge.registerSync({
    method: 'runTerminalCommand',
    json: { command: `cd "${repoPath}" && npm run quickforgeStatus 2>&1` },
  })
  return parseQuickForgeStatusOutput(result)
}

/** 启动 QuickForge 服务 */
export async function startQuickForge(projectPath: string) {
  const repoPath = getQuickForgeRepoPath(projectPath)

  const command = `cd "${repoPath}" && lsof -ti :5188 | xargs kill -9 && npm run quickforgeStop && npm run quickforgeStart`
  const result: any = await jsBridge.registerSync({
    method: 'runTerminalCommand',
    json: { command },
  })

  if (result.code !== 0) {
    console.warn('[QuickForge] 启动失败:', result.stderr)
    return false
  }

  console.log('[QuickForge] 启动命令已执行:', repoPath)
  return true
}

/** 轮询 quickforgeStatus，未启动则先 start，直到启动或超时 */
export async function waitForQuickForgeRunning(
  projectPath: string,
  options: { intervalMs?: number; timeoutMs?: number } = {}
) {
  const { intervalMs = QUICK_FORGE_POLL_INTERVAL_MS, timeoutMs = QUICK_FORGE_POLL_TIMEOUT_MS } =
    options
  const deadline = Date.now() + timeoutMs

  if (await isQuickForgeProcessRunning(projectPath)) {
    return true
  }

  startQuickForge(projectPath)

  while (Date.now() < deadline) {
    if (await isQuickForgeProcessRunning(projectPath)) {
      await sleep(200)
      return true
    }
    await sleep(intervalMs)
  }
  return false
}

/** 重启 QuickForge 服务（quickforgeStop && quickforgeStart） */
export async function restartQuickForge(projectPath: string) {
  // 本地/测试环境不重启 QuickForge 服务
  if (envInfo.isDev || envInfo.isStaging) {
    console.log('[QuickForge] 本地/测试环境不重启 QuickForge 服务')
    return
  }
  const repoPath = getQuickForgeRepoPath(projectPath)
  const command = `cd "${repoPath}" && lsof -ti :5188 | xargs kill -9 && npm run quickforgeStop && NODE_ENV=development npm i && npm run quickforgeStart`
  const result: any = await jsBridge.registerSync({
    method: 'runTerminalCommand',
    json: { command },
  })

  if (result.code !== 0) {
    console.warn('[QuickForge] 重启失败:', result.stderr)
    return
  }

  console.log('[QuickForge] 重启完成:', repoPath)
}

/** 同步 QuickForge 默认 skills 与 AGENT.md 到 ~/UWORK-PLUS/.quickforge */
export async function syncQuickForgeDefaultConfig(projectPath: string) {
  const targetSkillsPath = `${projectPath}/.quickforge/skills`
  const defaultSkillsPath = `${projectPath}/ai/quick-forge/uworkPlus-default-skills`
  const targetAgentPath = `${projectPath}/.quickforge/AGENT.md`
  const defaultAgentMdPath = `${projectPath}/ai/quick-forge/uworkPlus-default-agent-md/AGENT.md`

  await jsBridge.registerSync({
    method: 'createDirectoryOrFile',
    json: {
      dirs: [{ name: targetSkillsPath, type: 'dir' }],
    },
  })

  const defaultSkillsExists: any = await jsBridge.registerSync({
    method: 'existsSync',
    json: { path: defaultSkillsPath },
  })
  if (defaultSkillsExists.data) {
    const copySkillsCommand = `for dir in "${defaultSkillsPath}"/*; do if [ -d "$dir" ]; then cp -Rp "$dir" "${targetSkillsPath}/"; fi; done`
    const skillsResult: any = await jsBridge.registerSync({
      method: 'runTerminalCommand',
      json: { command: copySkillsCommand },
    })
    if (skillsResult.code !== 0) {
      console.warn('[QuickForge] 默认 skills 复制失败:', skillsResult.stderr)
    } else {
      console.log('[QuickForge] 默认 skills 已同步:', targetSkillsPath)
    }
  }

  const defaultAgentExists: any = await jsBridge.registerSync({
    method: 'existsSync',
    json: { path: defaultAgentMdPath },
  })
  if (defaultAgentExists.data) {
    const copyAgentCommand = `cp -p "${defaultAgentMdPath}" "${targetAgentPath}"`
    const agentResult: any = await jsBridge.registerSync({
      method: 'runTerminalCommand',
      json: { command: copyAgentCommand },
    })
    if (agentResult.code !== 0) {
      console.warn('[QuickForge] 默认 AGENT.md 复制失败:', agentResult.stderr)
    } else {
      console.log('[QuickForge] 默认 AGENT.md 已同步:', targetAgentPath)
    }
  }
}

const DEFAULT_GLOBAL_SKILL = 'local-database'

function encodeUtf8ToBase64(text: string) {
  return btoa(unescape(encodeURIComponent(text)))
}

/** 通过 shell 写入 JSON 文件，避免引号/换行被转义破坏 */
async function writeJsonFileViaTerminal(configPath: string, data: Record<string, any>) {
  const content = JSON.stringify(data, null, 2)
  const base64Content = encodeUtf8ToBase64(content)
  const script =
    'require("fs").writeFileSync(process.argv[1], Buffer.from(process.argv[2], "base64").toString("utf8"))'
  const writeCommand = `node -e ${JSON.stringify(script)} ${JSON.stringify(configPath)} ${JSON.stringify(base64Content)}`
  return jsBridge.registerSync({
    method: 'runTerminalCommand',
    json: { command: writeCommand },
  })
}

/** 确保 config.json 的 projects.globalSkills 包含 local-database */
export async function ensureGlobalSkillInQuickForgeConfig(projectPath: string) {
  const configPath = `${projectPath}/.quickforge/config/config.json`

  const configExists: any = await jsBridge.registerSync({
    method: 'existsSync',
    json: { path: configPath },
  })
  if (!configExists.data) {
    console.warn('[QuickForge] config.json 不存在，跳过 globalSkills 更新:', configPath)
    return
  }

  const readResult: any = await jsBridge.registerSync({
    method: 'runTerminalCommand',
    json: { command: `cat "${configPath}"` },
  })
  if (readResult.code !== 0 || !readResult.stdout?.trim()) {
    console.warn('[QuickForge] 读取 config.json 失败:', readResult.stderr)
    return
  }

  let config: Record<string, any>
  try {
    config = JSON.parse(readResult.stdout)
  } catch {
    console.warn('[QuickForge] config.json 解析失败:', configPath)
    return
  }

  const globalSkills: string[] = Array.isArray(config?.projects?.globalSkills)
    ? config.projects.globalSkills
    : []
  if (globalSkills.includes(DEFAULT_GLOBAL_SKILL)) {
    return
  }

  if (!config.projects) {
    config.projects = {}
  }
  config.projects.globalSkills = [DEFAULT_GLOBAL_SKILL, ...globalSkills]

  const writeResult: any = await writeJsonFileViaTerminal(configPath, config)
  if (writeResult.code !== 0) {
    console.warn('[QuickForge] 更新 config.json 失败:', writeResult.stderr)
  } else {
    console.log('[QuickForge] 已追加 globalSkills:', DEFAULT_GLOBAL_SKILL)
  }
}

/** 后台初始化 QuickForge（不阻塞应用启动） */
export async function initQuickForgeInBackground(projectPath: string) {
  const quickForgeStore = useQuickForgeStore()
  quickForgeStore.resetInitSteps()

  try {
    const quickForgeReady = await isQuickForgeReady(projectPath)
    if (quickForgeReady) {
      quickForgeStore.beginStep('pullQuickForgeRepo', '正在 git pull...')
      const hasUpdates = await pullQuickForgeRepo(projectPath)
      quickForgeStore.finishStep(
        'pullQuickForgeRepo',
        hasUpdates ? '拉取完成，检测到更新' : '拉取完成，已是最新'
      )

      if (hasUpdates) {
        quickForgeStore.beginStep('restartQuickForgeAfterPull', '正在安装依赖并启动服务...')
        await restartQuickForge(projectPath)
        quickForgeStore.finishStep('restartQuickForgeAfterPull', '重启完成')

        await sleep(3000)
        quickForgeStore.finishStep('initQuickForgeInBackground', '模块初始化完成')
      } else {
        quickForgeStore.finishStep('initQuickForgeInBackground', '模块初始化完成')
      }
    } else {
      quickForgeStore.beginStep('ensureQuickForgeRepo', '正在 git clone...')
      const cloned = await ensureQuickForgeRepo(projectPath)
      quickForgeStore.finishStep(
        'ensureQuickForgeRepo',
        cloned ? '模块加载成功' : '仓库已存在或模块加载'
      )

      if (cloned) {
        quickForgeStore.beginStep('restartQuickForgeAfterClone', '正在安装依赖并启动服务...')
        await restartQuickForge(projectPath)
        quickForgeStore.finishStep('restartQuickForgeAfterClone', '重启完成')
      } else {
        quickForgeStore.skipStep('restartQuickForgeAfterClone', '项目拉取失败')
      }

      await sleep(3000)
      quickForgeStore.finishStep('initQuickForgeInBackground', '模块初始化完成')
    }

    // 同步默认skills 和 默认agent.md
    await syncQuickForgeDefaultConfig(projectPath)
    // 确保 config.json 的 projects.globalSkills 包含 local-database
    await ensureGlobalSkillInQuickForgeConfig(projectPath)
  } catch (error) {
    const message = error instanceof Error ? error.message : '初始化失败'
    if (quickForgeStore.currentStepKey) {
      quickForgeStore.failStep(quickForgeStore.currentStepKey, message)
    }
    console.error('[QuickForge] 初始化失败:', error)
  }
}

/** 延迟到下一帧再初始化，确保先完成 Vue 挂载 */
export function scheduleInitQuickForgeInBackground(projectPath: string) {
  setTimeout(() => {
    void initQuickForgeInBackground(projectPath)
  }, 0)
}
