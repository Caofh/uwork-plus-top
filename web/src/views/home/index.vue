<template>
  <div class="home flex flex-col">
    <div class="home-top c-flex-x-start">
      <div class="home-card-1" ref="homeCard1Ref">
        <CarouselHome :carouselWidth="carouselWidth" />
      </div>
      <div class="home-card-2 c-flex-x-start">
        <div class="home-card-2-left">
          <BaiduHot />
        </div>
        <div class="home-card-2-right">
          <BaiduHot title="微博热搜" :type="2" />
        </div>
      </div>
    </div>
    <div class="home-bottom c-flex-x-start flex-1">
      <div class="home-card-3-container c-flex-y-between">
        <div class="home-card-3 c-flex-y-center">
          <div class="command-list">
            <!-- <div class="list-title">集成指令</div> -->
            <div class="list-items c-flex-x-between">
              <div class="list-item c-flex-x-between" @click="handleExecute">
                <div class="list-item-title c-flex-x-start">
                  <span class="list-item-title-span">安装开发环境</span>
                  <el-tooltip placement="top" effect="customized" :show-arrow="true">
                    <template #default>
                      <el-icon class="info-icon cursor-auto" @click.stop><InfoFilled /></el-icon>
                    </template>
                    <template #content>
                      <div
                        class="custom-tooltip-content"
                        style="text-align: left; line-height: 1.5"
                      >
                        <div>从列表选择工具，在独立终端中逐个安装【macOS】</div>
                        <div>包括 Brew、Git、Nvm、Node.js、Nrm、Yarn、pnpm 等</div>
                      </div>
                    </template>
                  </el-tooltip>
                </div>
                <!-- <MultiStepLoader
                  :steps="asyncLoadingSteps"
                  :loading="uiState.isAfterTextLoading"
                  @state-change="handleStateChange"
                  @complete="handleComplete"
                  @close="uiState.closeAsync"
                /> -->
                <!-- <el-button class="btn" @click="handleExecute">执行</el-button> -->
              </div>
              <div class="list-item c-flex-x-between" @click="installSoftware">
                <div class="list-item-title c-flex-x-start">
                  <span class="list-item-title-span">安装软件</span>
                  <el-tooltip placement="top" effect="customized" :show-arrow="true">
                    <template #default>
                      <el-icon class="info-icon cursor-auto" @click.stop><InfoFilled /></el-icon>
                    </template>
                    <template #content>
                      <div
                        class="custom-tooltip-content"
                        style="text-align: left; line-height: 1.5"
                      >
                        <div>从列表选择软件，自动下载 dmg 并安装【macOS】</div>
                        <div>安装过程会在独立终端窗口中执行</div>
                      </div>
                    </template>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
        <TaskList />
      </div>
      <div class="home-card-4">
        <HomeCharts title="gitHub热门项目【star 排行】" :type="3" />
      </div>
    </div>

    <Terminal ref="terminalRef" />

    <InstallSoftwareDialog
      v-model="installDevEnvDialogVisible"
      title="安装开发环境"
      empty-text="暂无可用开发环境"
      batch-selectable
      :list="devEnvList"
      :installing-name="installingDevEnvName"
      :is-batch-installing="isBatchInstallingDevEnv"
      @install="handleInstallDevEnvItem"
      @batch-install="handleBatchInstallDevEnv"
    />

    <InstallSoftwareDialog
      v-model="installSoftwareDialogVisible"
      title="安装软件"
      empty-text="暂无可用软件"
      batch-selectable
      header-link-text="各个软件官网"
      :header-link-url="docUrls.softwareOfficial"
      :list="softwareList"
      :installing-name="installingSoftwareName"
      :is-batch-installing="isBatchInstallingSoftware"
      @install="handleInstallSoftwareItem"
      @batch-install="handleBatchInstallSoftware"
      @header-link-click="openExternal"
    />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref, reactive, computed, nextTick, h, inject } from 'vue'
  import MultiStepLoader from '@/components/ui/multi-step-loader/MultiStepLoader.vue'
  import { jsBridge, isInElectron, openExternal } from '@/utils/electron'
  import { Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'
  import CarouselHome from './components/CarouselHome.vue'
  import BaiduHot from './components/BaiduHot.vue'
  import HomeCharts from './components/homeCharts/HomeCharts.vue'
  import TaskList from './components/TaskList.vue'
  import InstallSoftwareDialog from './components/InstallSoftwareDialog.vue'
  import { buildSoftwareInstallCommand } from './softwareInstall'
  import { buildDevEnvInstallCommand } from './devEnvInstall'
  import { loadSoftwareList, type SoftwareItem } from './service/softwareApi'
  import { loadDevEnvList, type DevEnvItem } from './service/devEnvApi'
  import { docUrls } from '@/config/docs'

  // 终端组件
  import Terminal from '@/components/terminal/Terminal.vue'
  import InstallCompleteModal from '@/components/InstallCompleteModal.vue'
  import { sh_script } from './scriptSh'

  import { useCommonStore } from '@/store/common'
  import { ElMessageBox, ElMessage, ElTooltip } from 'element-plus'
  const commonStore = useCommonStore()
  const parentProvide = inject<any>('parentProvide', null)

  // TypeScript 类型声明
  declare global {
    interface Window {
      electronAPI: {
        openMacTerminal: (args: any) => Promise<any>
        [key: string]: any
      }
      onTerminalResult: (result: any) => void
    }
  }

  // 执行状态管理
  const executionState = reactive({
    isRunning: false,
    isCompleted: false,
    success: false,
    showOutput: false,
    output: [] as Array<{
      time: string
      content: string
      type: 'info' | 'success' | 'error'
    }>,
    error: '',
  })

  // State management
  // const loaderStates = reactive({
  //   // installBrew: false,
  //   // installGit: false,
  //   // installNvm: false,
  //   // installNrm: false,
  // });
  // sh_script.forEach((item: any) => {
  //   loaderStates[item.name] = false;
  // });
  const uiState = reactive({
    isSimpleLoading: false,
    isAfterTextLoading: false,
    closeSimple: () => {
      uiState.isSimpleLoading = false
    },
    closeAsync: () => {
      uiState.isAfterTextLoading = false
      controlShowDock(true)
    },
  })

  const homeCard1Ref = ref<HTMLElement>()
  let carouselWidth = ref(0)

  const terminalRef = ref(null)
  const installDevEnvDialogVisible = ref(false)
  const installingDevEnvName = ref('')
  const isBatchInstallingDevEnv = ref(false)
  const devEnvList = ref<DevEnvItem[]>([])
  const installSoftwareDialogVisible = ref(false)
  const installingSoftwareName = ref('')
  const isBatchInstallingSoftware = ref(false)
  const softwareList = ref<SoftwareItem[]>([])

  async function loadDevEnvListData() {
    if (!isInElectron()) {
      devEnvList.value = []
      return
    }

    try {
      devEnvList.value = await loadDevEnvList()
    } catch (err) {
      console.error('[loadDevEnvList]', err)
      devEnvList.value = []
    }
  }

  async function loadSoftwareListData() {
    if (!isInElectron()) {
      softwareList.value = []
      return
    }

    try {
      softwareList.value = await loadSoftwareList()
    } catch (err) {
      console.error('[loadSoftwareList]', err)
      softwareList.value = []
    }
  }

  const asyncLoadingSteps = reactive(handleAsyncLoadingSteps())
  function handleAsyncLoadingSteps() {
    const arr = sh_script.map((item: any) => {
      return {
        ...item,
        name: item.name,
        text: `${item.name} 安装中...`,
        async: false,
        afterText: `${item.name} 完成`,
      }
    })

    // let arr: any = Object.keys(loaderStates).map((key) => {
    //   return {
    //     name: key,
    //     text: `${key} 安装中...`,
    //     async: loaderStates[key],
    //     afterText: `${key} 完成`,
    //   };
    // });
    arr.push({
      text: '安装完成',
      duration: 1000,
      action: handleAsyncLoadingComplete,
    })
    return arr
  }

  // 添加日志到输出
  function addLog(content: string, type: 'info' | 'success' | 'error' = 'info') {
    const time = new Date().toLocaleTimeString()
    executionState.output.push({ time, content, type })
  }

  // 清空输出
  function clearOutput() {
    executionState.output = []
    executionState.isCompleted = false
    executionState.success = false
    executionState.error = ''
  }

  // 重置执行状态
  function resetExecutionState() {
    executionState.isRunning = false
    executionState.isCompleted = false
    executionState.success = false
    executionState.showOutput = true // 自动显示输出区域
    executionState.output = []
    executionState.error = ''
  }

  async function handleExecute() {
    // 重置执行状态
    // startAsyncLoading();
    // return

    // 安装mac-init初始化脚本
    // await handleInstall(asyncLoadingSteps)
    // await handleInstallV1(asyncLoadingSteps)
    await handleInstallV2()
  }

  async function handleInstallV2() {
    if (!isInElectron()) {
      ElMessage.warning('请在桌面客户端中使用')
      return
    }
    await loadDevEnvListData()
    installDevEnvDialogVisible.value = true
  }

  async function handleInstallDevEnvItem(item: DevEnvItem) {
    installingDevEnvName.value = item.name

    try {
      const result = await openDevEnvTerminal(item)
      if (result?.code === 0) {
        ElMessage.success(`已在独立终端中开始安装 ${item.name}`)
      } else {
        ElMessage.error(result?.message || `${item.name} 打开终端失败`)
      }
    } catch (error) {
      console.error('[installDevEnv]', error)
      ElMessage.error(`${item.name} 打开终端失败`)
    } finally {
      installingDevEnvName.value = ''
    }
  }

  function openDevEnvTerminal(item: DevEnvItem) {
    const command = buildDevEnvInstallCommand(item)
    return openMacTerminalPromise(command)
  }

  async function handleBatchInstallDevEnv(items: DevEnvItem[]) {
    await runBatchTerminalInstall(items, buildDevEnvInstallCommand, isBatchInstallingDevEnv, {
      emptyWarning: '请选择开发环境工具',
      entityLabel: '工具',
    })
  }

  async function installSoftware() {
    if (!isInElectron()) {
      ElMessage.warning('请在桌面客户端中使用')
      return
    }
    installSoftwareDialogVisible.value = true
  }

  async function handleInstallSoftwareItem(item: SoftwareItem) {
    installingSoftwareName.value = item.name

    try {
      if (item.type === 'document') {
        const docUrl = item.url?.trim() || docUrls.softwareOfficial
        if (!docUrl) {
          ElMessage.warning(`${item.name} 未配置链接`)
          return
        }
        openExternal(docUrl)
        ElMessage.success(`已在浏览器中打开 ${item.name}`)
        return
      }

      const result = await openSoftwareTerminal(item)
      if (result?.code === 0) {
        ElMessage.success(`已在独立终端中开始安装 ${item.name}`)
      } else {
        ElMessage.error(result?.message || `${item.name} 打开终端失败`)
      }
    } catch (error) {
      console.error('[installSoftware]', error)
      const action = item.type === 'document' ? '打开链接' : '打开终端'
      ElMessage.error(`${item.name} ${action}失败`)
    } finally {
      installingSoftwareName.value = ''
    }
  }

  function openSoftwareTerminal(item: SoftwareItem) {
    const command = buildSoftwareInstallCommand(item)
    return openMacTerminalPromise(command)
  }

  async function handleBatchInstallSoftware(items: SoftwareItem[]) {
    const installItems = items.filter(item => item.type !== 'document')
    await runBatchTerminalInstall(installItems, buildSoftwareInstallCommand, isBatchInstallingSoftware, {
      emptyWarning: '请选择可安装的软件',
      entityLabel: '软件',
    })
  }

  async function runBatchTerminalInstall<T extends { name: string }>(
    items: T[],
    buildCommand: (item: T) => string,
    batchInstalling: { value: boolean },
    options?: { emptyWarning?: string; entityLabel?: string }
  ) {
    if (!items.length) {
      ElMessage.warning(options?.emptyWarning ?? '请选择要安装的项')
      return
    }

    batchInstalling.value = true
    let successCount = 0
    const failedNames: string[] = []

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        try {
          const result = await openMacTerminalPromise(buildCommand(item))
          if (result?.code === 0) {
            successCount += 1
          } else {
            failedNames.push(item.name)
          }
        } catch (error) {
          console.error('[batchTerminalInstall]', item.name, error)
          failedNames.push(item.name)
        }

        if (i < items.length - 1) {
          await sleep(300)
        }
      }

      const label = options?.entityLabel ?? '项'
      if (successCount === items.length) {
        ElMessage.success(`已为 ${successCount} 个${label}打开独立终端`)
      } else if (successCount > 0) {
        ElMessage.warning(
          `已打开 ${successCount} 个终端，${failedNames.length} 个失败：${failedNames.join('、')}`
        )
      } else {
        ElMessage.error('批量安装失败，未能打开终端')
      }
    } finally {
      batchInstalling.value = false
    }
  }

  async function handleInstall(shContent) {
    // controlShowDock(false);

    // Reset states
    uiState.isAfterTextLoading = true

    shContent.forEach((item: any) => {
      item.async = true
    })

    // 核心逻辑
    for (let i = 0; i < shContent.length; i++) {
      if (shContent[i].text === '安装完成') {
        // 触发UI效果节点
        const key = shContent[i].name
        handleInstallComplete(key)
      } else {
        let recodeList = []
        let runStatue = true

        const commandRes = await terminalRef.value.executeWithoutModal(shContent[i].preCommand)
        recodeList.push(...commandRes.dataRecord)

        console.log('level1', commandRes, commandRes.data)

        if (commandRes?.data?.code === 0) {
          shContent[i].recodeList = recodeList
          shContent[i].runStatue = true

          console.log('level2', '通过')
        } else {
          const terminalFunc = shContent[i].needDialog
            ? terminalRef.value.executeWithModal
            : terminalRef.value.executeWithoutModal

          const commandResV1 = await terminalFunc(shContent[i].command)
          recodeList.push(...commandResV1.dataRecord)

          console.log('level2', commandResV1, commandResV1.data)

          if (commandResV1?.data?.code === 0) {
            // ...
          } else {
            runStatue = false

            // 改变失败文案
            const key = shContent[i].name
            changeAsyncLoadingSteps(key)
          }
          shContent[i].recodeList = recodeList
          shContent[i].runStatue = runStatue
        }

        // 触发UI效果节点
        const key = shContent[i].name
        handleInstallComplete(key)
      }
    }
    console.log('结果')
    console.log(shContent)
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function openMacTerminalPromise(command: string) {
    return new Promise<any>(resolve => {
      jsBridge.register({
        method: 'openMacTerminal',
        json: { command },
        callback: result => resolve(result),
      })
    })
  }

  function buildStepTerminalCommand(step: any) {
    if (step.needDialog) {
      return step.command
    }

    return [
      'source ~/.bash_profile 2>/dev/null || true',
      'source ~/.zshrc 2>/dev/null || true',
      `echo ">>> ${step.name} 开始"`,
      `if ${step.preCommand} >/dev/null 2>&1; then`,
      `  echo ">>> ${step.name} 已安装，版本如下："`,
      `  ${step.preCommand}`,
      'else',
      `  ${step.command}`,
      'fi',
    ].join('\n')
  }

  async function handleInstallV1(steps: typeof asyncLoadingSteps) {
    if (!isInElectron()) {
      ElMessage.warning('请在桌面客户端中使用')
      return
    }

    try {
      await ElMessageBox.confirm(
        '将依次打开 5 个独立终端，分别安装 Brew、Git、Nvm、Nrm、Yarn。是否继续？',
        '自动化安装开发环境',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
    } catch {
      return
    }

    controlShowDock(false)
    // uiState.isAfterTextLoading = true

    const installSteps = steps.filter((item: any) => item.preCommand || item.command)
    const TERMINAL_OPEN_INTERVAL_MS = 800

    installSteps.forEach((item: any) => {
      item.async = true
    })

    for (let i = 0; i < installSteps.length; i++) {
      const item = installSteps[i]
      const command = buildStepTerminalCommand(item)

      if (i > 0) {
        await sleep(TERMINAL_OPEN_INTERVAL_MS)
      }

      const result = await openMacTerminalPromise(command)
      if (result?.code !== 0) {
        changeAsyncLoadingSteps(item.name)
      }
      handleInstallComplete(item.name)
    }
  }

  function handleInstallComplete(key) {
    asyncLoadingSteps.forEach((item: any) => {
      if (item.name === key) {
        item.async = false
      }
    })
  }

  function changeAsyncLoadingSteps(key: string) {
    asyncLoadingSteps.forEach((item: any) => {
      if (item.name === key) {
        item.afterText = `${item.name} 安装失败`
      }
    })
  }

  async function handleCommand(command: string) {
    const recodeList = []
    let runStatue = true
    const commandRes = await terminalRef.value.executeWithoutModal(command)
    recodeList.push(...commandRes.dataRecord)

    if (commandRes?.data?.code === 0) {
      // 成功
      console.log('success')
    } else {
      console.log('fail')
      runStatue = false
    }
    return {
      recodeList,
      runStatue,
    }
  }

  function handleStateChange(state: number) {
    // Handle Loading State Change
    // console.log(state);
  }

  function handleComplete() {
    // Handle Loading Complete
  }

  function handleAsyncLoadingComplete() {
    const installDetails = asyncLoadingSteps.map((item: any) => {
      const str = item.afterText ? item.afterText.replace(/install/g, '') : ''
      return str
    })
    const customContent = h(InstallCompleteModal, {
      installDetails: installDetails,
      // additionalInfo: '系统将在3秒后自动重启以应用所有配置'
    })

    ElMessageBox.alert(customContent, '', {
      // confirmButtonText: '打开终端验证',
      confirmButtonText: '确定',
      showCancelButton: false,
      center: true,
      customClass: 'custom-message-box-home',
      beforeClose: (action, instance, done) => {
        // 在弹窗关闭前执行
        if (action === 'confirm') {
          // 点击确定按钮时执行
          // onConfirmClick()
        }
        // 继续关闭弹窗
        done()
      },
    })

    uiState.isAfterTextLoading = false
    controlShowDock()
  }

  // 点击确定后的回调函数
  function onConfirmClick() {
    // 打开终端校验sh脚本
    let command = sh_script
      .map((item: any) => {
        const name = item.name.replace(/install/g, '')
        return `echo ${name}版本 && ${item.preCommand}`
      })
      .join(' && ')

    command = `source ~/.bash_profile && ${command}`

    jsBridge.register({
      method: 'openMacTerminal',
      json: {
        command: command,
      },
      callback: result => {
        console.log('Terminal 打开结果:', result)
      },
    })
  }

  // 控制dock的显示
  function controlShowDock(show: boolean = true) {
    commonStore.updateShowDock(show)
  }

  // 获取动态宽度
  function getHomeCard1Width() {
    if (homeCard1Ref.value) {
      return homeCard1Ref.value.offsetWidth // 单位px
    }
    return 0
  }

  // 简单的 resize 监听实现
  let resizeObserver: ResizeObserver | null = null
  let debounceTimer: number | null = null

  // 更新 carousel 宽度的函数
  function updateCarouselWidth() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = window.setTimeout(() => {
      const width = getHomeCard1Width()
      carouselWidth.value = width
    }, 0)
  }

  // 挂载时的操作
  onMounted(async () => {
    // console.log('组件已挂载');
    await loadDevEnvListData()
    await loadSoftwareListData()
    await nextTick() // 确保DOM已渲染

    // 计算carousel的宽度
    const width = getHomeCard1Width()
    carouselWidth.value = width

    // 设置元素 resize 监听
    if (homeCard1Ref.value) {
      resizeObserver = new ResizeObserver(() => {
        updateCarouselWidth()
      })
      resizeObserver.observe(homeCard1Ref.value)
    }
  })

  // 卸载时的操作
  onUnmounted(() => {
    // 清理元素 resize 监听
    if (resizeObserver) {
      resizeObserver.disconnect()
    }

    // 清理防抖定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })
</script>

<style lang="scss" scoped>
  // 全局样式
  :global(.custom-message-box) {
    .el-message-box__content {
      padding: 0;
    }

    .el-message-box__message {
      padding: 0;
    }

    .el-message-box__header {
      background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
      color: white;

      .el-message-box__title {
        color: white;
        font-weight: 600;
      }

      .el-message-box__headerbtn {
        .el-message-box__close {
          color: white;

          &:hover {
            color: #f0f9ff;
          }
        }
      }
    }

    .el-message-box__btns {
      .el-button--primary {
        background: #67c23a;
        border-color: #67c23a;

        &:hover {
          background: #85ce61;
          border-color: #85ce61;
        }
      }
    }
  }

  .home {
    --home-panel: #1a1a1a;
    --home-panel-soft: #202020;
    --home-border: #2e2e2e;
    --home-border-soft: rgba(255, 255, 255, 0.08);
    --home-text: #e0e0e0;
    --home-muted: #9a9a9a;
    --home-primary: #42b983;
    --home-primary-soft: rgba(66, 185, 131, 0.14);
    --home-shadow-soft: 0 20px 44px -34px rgba(0, 0, 0, 0.85);

    min-width: 1032px;
    height: 100%;
    color: var(--home-text);

    .home-top {
      width: 100%;
      height: calc((100vh - 40px) / 2 - 48px);
      margin-bottom: 18px;

      .home-card-1 {
        width: 53%;
        height: 100%;
        margin-right: 18px;
        overflow: hidden;
        border: 1px solid var(--home-border);
        border-radius: 18px;
        background: var(--home-panel);
        box-shadow: var(--home-shadow-soft);
      }

      .home-card-2 {
        width: calc(100% - 53% - 18px);
        height: 100%;
        border-radius: 18px;

        .home-card-2-left,
        .home-card-2-right {
          width: calc(50% - 9px);
          height: 100%;
          overflow: hidden;
          border: 1px solid var(--home-border);
          border-radius: 18px;
          background: var(--home-panel);
          box-shadow: var(--home-shadow-soft);
        }

        .home-card-2-left {
          margin-right: 18px;
        }
      }
    }

    .home-bottom {
      height: calc((100vh - 40px) / 2 - 48px);

      .home-card-3-container {
        height: 100%;

        .home-card-3 {
          width: 350px;
          height: 80px;
          margin-right: 18px;
          padding: 18px;
          border: 1px solid var(--home-border);
          border-radius: 18px;
          background: var(--home-panel);
          box-shadow: var(--home-shadow-soft);

          .command-list {
            width: 100%;

            .list-title {
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid var(--home-border);
              color: var(--home-text);
              font-size: 15px;
              font-weight: 600;
            }

            .list-items {
              gap: 10px;
              width: 100%;

              .list-item {
                justify-content: center;
                min-height: 44px;
                padding: 0 14px;
                border: 1px solid rgba(66, 185, 131, 0.34);
                border-radius: 12px;
                background: linear-gradient(
                  135deg,
                  rgba(66, 185, 131, 0.16),
                  rgba(66, 185, 131, 0.08)
                );
                box-shadow:
                  inset 0 1px 0 rgba(255, 255, 255, 0.04),
                  0 10px 24px -22px rgba(66, 185, 131, 0.9);
                width: 100%;
                color: var(--home-text);
                cursor: pointer;
                transition:
                  transform 0.18s ease,
                  border-color 0.18s ease,
                  background 0.18s ease,
                  box-shadow 0.18s ease,
                  color 0.18s ease;

                &:hover {
                  transform: translateY(-1px);
                  border-color: rgba(66, 185, 131, 0.58);
                  background: linear-gradient(
                    135deg,
                    rgba(66, 185, 131, 0.24),
                    rgba(66, 185, 131, 0.12)
                  );
                  box-shadow:
                    inset 0 1px 0 rgba(255, 255, 255, 0.06),
                    0 14px 30px -24px rgba(66, 185, 131, 0.95);
                  color: #91e7bd;
                }

                &:active {
                  transform: translateY(0);
                  border-color: rgba(66, 185, 131, 0.42);
                  background: rgba(66, 185, 131, 0.14);
                }

                .list-item-title-span {
                  margin-right: 6px;
                  font-size: 14px;
                  font-weight: 500;
                }

                .info-icon {
                  color: var(--home-muted);
                  cursor: pointer;
                  transition: color 0.2s ease;

                  &:hover {
                    color: #7ee2ad;
                  }
                }

                :deep(.el-button.btn) {
                  border: 1px solid rgba(66, 185, 131, 0.34);
                  border-radius: 9px;
                  background: var(--home-primary-soft);
                  color: #7ee2ad;
                  box-shadow: none;

                  &:hover {
                    border-color: rgba(66, 185, 131, 0.54);
                    background: rgba(66, 185, 131, 0.2);
                    color: #91e7bd;
                  }
                }
              }
            }
          }
        }

        :deep(.task-list) {
          width: 350px;
          height: calc(100% - 98px);
          margin-right: 18px;
          padding: 18px;
          border: 1px solid var(--home-border);
          border-radius: 18px;
          background: var(--home-panel);
          box-shadow: var(--home-shadow-soft);
        }
      }

      .home-card-4 {
        width: calc(100% - 350px);
        height: 100%;
        overflow: hidden;
        padding: 18px;
        border: 1px solid var(--home-border);
        border-radius: 18px;
        background: var(--home-panel);
        box-shadow: var(--home-shadow-soft);
      }
    }
  }
</style>

<style lang="scss">
  .install-software-messagebox {
    .install-software-result {
      line-height: 1.7;
      word-break: break-all;
      text-align: left;
    }
  }

  .custom-message-box-home {
    .el-message-box__content {
      padding: 0;
    }

    .install-complete-modal {
      padding: 0;
    }
    .el-message-box__btns {
      padding-bottom: var(--el-messagebox-padding-primary);
    }
  }

  .el-popper.is-customized {
    padding: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    background: #1f1f1f;
    box-shadow: 0 18px 44px -28px rgba(0, 0, 0, 0.85);
  }

  .el-popper.is-customized .el-popper__arrow::before {
    background: #1f1f1f;
    border-color: rgba(255, 255, 255, 0.08);
    right: 0;
  }

  .custom-tooltip-content {
    padding: 10px;
    border-radius: 10px;
    background-color: #202020;
    color: #e0e0e0;
    font-weight: 500;
  }
  .cursor-auto {
    cursor: auto !important;
  }
</style>
