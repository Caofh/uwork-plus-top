// import "./assets/main.css";
import { createApp, defineAsyncComponent } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElIcons from '@element-plus/icons'
import './main.css'
import { jsBridge, getVersion, isInElectron } from '@/utils/electron'
import { setupClipboardBridge } from '@/utils/clipboardBridge'
import { scheduleInitQuickForgeInBackground } from '@/utils/ensureQuickForgeRepo'
import { useCommonStore } from '@/store/common'
import { versionDirective } from '@/utils/directives/version'
import { compareVersions } from '@/utils/version'
import { setupMonacoEnvironment } from './monacoEnvironment'
import { ensureSoftwareListInitialized } from '@/views/home/service/softwareApi'
import { ensureDevEnvListInitialized } from '@/views/home/service/devEnvApi'

setupMonacoEnvironment()

async function init() {
  try {
    if (isInElectron()) {
      setupClipboardBridge()
    }

    const { data: currentVersion } = isInElectron() ? await getVersion() : { data: undefined }
    // 判断当前版本是否大于等于1.5.8
    const isAfterVersion158 = compareVersions(currentVersion, '1.5.8') >= 0
    let homeProjectPath = ''

    if (isInElectron()) {
      const { data: projectPath } = await jsBridge.registerSync({
        method: 'getHomeProjectPath',
      })
      homeProjectPath = projectPath

      // 1.5.8版本后，创建文件夹或文件
      if (isAfterVersion158) {
        await jsBridge.registerSync({
          method: 'createDirectoryOrFile',
          json: {
            dirs: [
              { name: `${projectPath}/dataSql/dataSnippet.json`, type: 'file' },
              { name: `${projectPath}/dataSql/dataSnippetType.json`, type: 'file' },
              { name: `${projectPath}/dataSql/codeDirList.json`, type: 'file' },
              { name: `${projectPath}/dataSql/apiCompareList.json`, type: 'file' },
              { name: `${projectPath}/dataSql/homeTaskList.json`, type: 'file' },
              { name: `${projectPath}/dataSql/webview-manager.json`, type: 'file' },
              { name: `${projectPath}/dataSql/proxyList.json`, type: 'file' },
              { name: `${projectPath}/dataSql/hostsList.json`, type: 'file' },
              { name: `${projectPath}/dataSql/hostsTrash.json`, type: 'file' },
              { name: `${projectPath}/dataSql/apiDebugList.json`, type: 'file' },
              { name: `${projectPath}/dataSql/apiDebugSessionCache.json`, type: 'file' },
              { name: `${projectPath}/dataSql/jsonViewSaved.json`, type: 'file' },
              { name: `${projectPath}/dataSql/software.json`, type: 'file' },
              { name: `${projectPath}/dataSql/devEnv.json`, type: 'file' },
              { name: `${projectPath}/ai`, type: 'dir' },
            ],
          },
        })
        await ensureSoftwareListInitialized()
        await ensureDevEnvListInitialized()
      }
    }

    // 创建 app 实例
    const app = createApp(App)
    const pinia = createPinia()

    app.use(pinia)
    app.use(router)
    app.use(ElementPlus, { locale: zhCn })

    // 1.5.8版本后，注册版本控制指令
    if (isAfterVersion158) {
      // 注册版本控制指令
      app.directive('version', versionDirective)
    }

    Object.keys(ElIcons).forEach(icon_info => {
      app.component(icon_info, ElIcons[icon_info])
    })
    app.component(
      'CommonDialog',
      defineAsyncComponent(() => import('@/components/commonDialog/CommonDialog.vue'))
    )
    app.component(
      'APlus',
      defineAsyncComponent(() => import('@/components/aPlus/APlus.vue'))
    )
    app.mount('#app')

    // QuickForge 在挂载后再后台初始化（避免 clone/启动 阻塞首屏）
    if (homeProjectPath) {
      scheduleInitQuickForgeInBackground(homeProjectPath)
    }

    // 1.5.8版本后，更新当前版本号
    if (isAfterVersion158) {
      const commonStore = useCommonStore()
      commonStore.updateCurrentVersion(currentVersion)
    }
  } catch (error) {
    console.error(error)
  }
}

init()
