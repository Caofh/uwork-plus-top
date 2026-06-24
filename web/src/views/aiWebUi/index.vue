<template>
  <div
    v-if="nodeVersionOk"
    class="ai-web-ui"
    v-loading="iframeReloading"
  >
    <div
      v-if="showInitProgress"
      class="ai-web-ui-init-progress"
    >
      <p class="init-progress-text">模块正在初始化{{ initProgress }}%</p>
      <el-progress :percentage="initProgress" :show-text="false" :stroke-width="8" />
      <p v-if="!quickForgeStore.displayedInitSteps.length" class="init-progress-detail">
        正在准备初始化...
      </p>
      <ul v-else class="init-step-list">
        <li
          v-for="step in quickForgeStore.displayedInitSteps"
          :key="step.key"
          class="init-step-item"
          :class="`is-${step.status}`"
        >
          <span class="init-step-label">{{ step.label }}</span>
          <span class="init-step-detail">{{ step.detail }}</span>
        </li>
      </ul>
    </div>

    <iframe
      v-if="ready"
      :key="iframeKey"
      class="ai-web-ui-iframe"
      :src="iframeSrc"
      frameborder="0"
      allow="clipboard-read; clipboard-write; fullscreen"
      allowfullscreen
      @load="handleIframeLoad"
    />
    <div v-else-if="error" class="ai-web-ui-error">
      <p>网络错误，请稍后重试</p>
      <el-button type="primary" @click="initQuickForge">重试</el-button>
    </div>
  </div>
</template>

<script setup>
  import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { jsBridge, isInElectron } from '@/utils/electron'
  import { waitForQuickForgeRunning, sleep } from '@/utils/ensureQuickForgeRepo'
  import { envInfo } from '@/config/index.js'
  import { useQuickForgeStore } from '@/store/quickForge'
  import { getLocalNodeVersion, isNodeVersionAtLeast, MIN_NODE_VERSION } from '@/utils/nodeVersion'

  const quickForgeStore = useQuickForgeStore()
  const inElectron = isInElectron()
  const nodeVersionOk = ref(false)
  const iframeSrc = ref('')
  const iframeKey = ref(0)
  const loading = ref(false)
  const iframeReloading = ref(false)
  const ready = ref(false)
  const error = ref(false)
  const initProgress = ref(0)
  const showInitProgress = ref(false)

  const PROGRESS_MAX = 90
  const PROGRESS_INTERVAL_MS = 2600
  const PROGRESS_STEP = 2
  const SHOW_INIT_PROGRESS_INTERVAL_MS = 3000
  let progressTimer = null
  let iframeReloadFallbackTimer = null

  function stopProgressTimer() {
    if (progressTimer != null) {
      clearInterval(progressTimer)
      progressTimer = null
    }
  }

  function startProgressTimer() {
    stopProgressTimer()
    showInitProgress.value = true
    initProgress.value = 0
    progressTimer = window.setInterval(() => {
      if (initProgress.value < PROGRESS_MAX) {
        initProgress.value = Math.min(PROGRESS_MAX, initProgress.value + PROGRESS_STEP)
      }
    }, PROGRESS_INTERVAL_MS)
  }

  function finishInitProgress() {
    stopProgressTimer()
    initProgress.value = 100
    setTimeout(() => {
      showInitProgress.value = false
    }, SHOW_INIT_PROGRESS_INTERVAL_MS)
  }

  watch(loading, val => {
    if (val) {
      startProgressTimer()
    } else {
      finishInitProgress()
    }
  })

  onUnmounted(() => {
    stopProgressTimer()
    stopIframeReloadFallbackTimer()
  })

  function stopIframeReloadFallbackTimer() {
    if (iframeReloadFallbackTimer != null) {
      clearTimeout(iframeReloadFallbackTimer)
      iframeReloadFallbackTimer = null
    }
  }

  function getQuickForgePort() {
    return envInfo.isDev || envInfo.isStaging ? 5190 : 5188
  }

  function getQuickForgePortCandidates() {
    return Array.from(new Set([getQuickForgePort(), 5188, 5190]))
  }

  function initIframeSrc(port = getQuickForgePort()) {
    iframeSrc.value = `http://localhost:${port}?timestamp=${Date.now()}`
  }

  async function showIframe() {
    // 如果iframe已经加载，则不重新加载
    if (ready.value) {
      return
    }
    iframeReloading.value = true
    stopIframeReloadFallbackTimer()

    // 加载iframe
    ready.value = false
    await nextTick()
    const port = await waitForIframePortReady()
    initIframeSrc(port)
    iframeKey.value = Date.now()
    ready.value = true

    // 如果iframe加载失败，则8秒后重新加载iframe
    iframeReloadFallbackTimer = window.setTimeout(() => {
      iframeReloading.value = false
      iframeReloadFallbackTimer = null
    }, 8000)
  }

  function handleIframeLoad() {
    stopIframeReloadFallbackTimer()
    iframeReloading.value = false
  }

  watch(
    () => quickForgeStore.initQuickForgeInBackground,
    async (finished, wasFinished) => {
      // console.log('finished', finished)
      if (!finished || wasFinished) {
        loading.value = true
        return
      }
      // 如果后台初始化完成，则显示初始化进度为100%，3秒后重新加载iframe
      loading.value = false
      await sleep(SHOW_INIT_PROGRESS_INTERVAL_MS)
      await showIframe()
    },
    {
      immediate: true,
    }
  )

  async function ensureNodeVersion() {
    if (!inElectron) {
      if (envInfo.isDev || envInfo.isStaging) {
        nodeVersionOk.value = true
        return true
      }

      await ElMessageBox.alert(
        `AI 会话需要在桌面客户端中使用，且本机 Node.js 版本需 >= ${MIN_NODE_VERSION}。`,
        '环境不满足',
        { confirmButtonText: '确定' }
      )
      return false
    }

    try {
      const version = await getLocalNodeVersion()
      if (!version || !isNodeVersionAtLeast(version)) {
        await ElMessageBox.alert(
          version
            ? `AI 会话需要本机 Node.js 版本 >= ${MIN_NODE_VERSION}，当前版本为 v${version}。请先升级 Node 后再使用。`
            : `未检测到本机 Node.js，AI 会话需要 Node.js >= ${MIN_NODE_VERSION}。请先安装或配置 Node 后再使用。`,
          'Node 版本不满足',
          { confirmButtonText: '确定' }
        )
        return false
      }

      nodeVersionOk.value = true
      return true
    } catch (err) {
      console.error('[QuickForge] Node 版本检测失败:', err)
      await ElMessageBox.alert(
        `无法检测本机 Node.js 版本，AI 会话需要 Node.js >= ${MIN_NODE_VERSION}。`,
        'Node 版本检测失败',
        { confirmButtonText: '确定' }
      )
      return false
    }
  }

  async function isLocalPortOpen(port) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3000)
      await fetch(`http://localhost:${port}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timer)
      await sleep(200)
      return true
    } catch {
      return false
    }
  }

  async function waitForIframePortReady() {
    const ports = getQuickForgePortCandidates()
    for (let count = 0; count < 20; count += 1) {
      for (const port of ports) {
        if (await isLocalPortOpen(port)) {
          return port
        }
      }
      await sleep(500)
    }
    return getQuickForgePort()
  }

  async function initDevQuickForge() {
    // loading.value = true
    iframeReloading.value = true
    error.value = false
    ready.value = false

    const portOpen = await isLocalPortOpen(5190)
    loading.value = false

    if (portOpen) {
      await showIframe()
    } else {
      await ElMessageBox.alert(
        '请本地启动quickforge项目（5190端口）-pnpm dev。启动完成后，请刷新页面！',
        '提示',
        {
          confirmButtonText: '确定',
        }
      )
      error.value = true
    }
  }

  async function initQuickForge() {
    if (!inElectron) {
      await showIframe()
      return
    }

    error.value = false
    ready.value = false

    try {
      const { data: projectPath } = await jsBridge.registerSync({
        method: 'getHomeProjectPath',
      })

      const running = await waitForQuickForgeRunning(projectPath)

      if (running) {
        if (!quickForgeStore.initQuickForgeInBackground) {
          loading.value = true
          return
        } else {
          await showIframe()
        }
      } else {
        error.value = true
        ElMessage.error('网络错误，请稍后重试')
      }
    } catch (err) {
      error.value = true
      console.error('[QuickForge] 状态检测失败:', err)
      ElMessage.error('网络错误，请稍后重试')
    }
  }

  onMounted(async () => {
    if (!(await ensureNodeVersion())) {
      return
    }

    initIframeSrc()
    if (envInfo.isDev || envInfo.isStaging) {
      await initDevQuickForge()
    } else {
      await initQuickForge()
    }
  })
</script>

<style lang="scss" scoped>
  .ai-web-ui {
    width: 100%;
    height: 100%;
    min-height: calc(100vh - 88px);
    overflow: hidden;
    background: transparent;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .ai-web-ui-init-progress {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 24px 48px;
    background: rgba(0, 0, 0, 0.45);
    pointer-events: none;
  }

  .init-progress-text {
    margin: 0;
    font-size: 14px;
    color: #e5eaf3;
  }

  .init-progress-detail {
    margin: 0;
    font-size: 13px;
    color: #c0c4cc;
    text-align: center;
    max-width: min(420px, 90%);
  }

  .init-step-list {
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
    width: min(420px, 90%);
  }

  .init-step-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 10px;
    margin-bottom: 4px;
    border-radius: 4px;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.06);

    &.is-running {
      background: rgba(64, 158, 255, 0.2);
    }

    &.is-success {
      opacity: 0.85;
    }

    &.is-skipped {
      opacity: 0.55;
    }

    &.is-failed {
      background: rgba(245, 108, 108, 0.2);
    }
  }

  .init-step-label {
    color: #e5eaf3;
    font-weight: 500;
  }

  .init-step-detail {
    color: #909399;
  }

  .ai-web-ui-init-progress :deep(.el-progress) {
    width: min(360px, 80%);
  }

  .ai-web-ui-iframe {
    flex: 1;
    width: 100%;
    min-height: 0;
    border: none;
    background: transparent;
    color-scheme: normal;
  }

  .ai-web-ui-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    width: 100%;
    height: 100%;
    color: #909399;
    font-size: 14px;
  }
</style>
