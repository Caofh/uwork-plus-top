// pinia仓库数据
// import { useVersionStore } from '@/stores/electrionVersion'
import { v4 as uuidv4 } from 'uuid'
import { toRaw } from 'vue'

const default_func = () => {
  console.log('调用原生electron的api')
}

function isInElectron() {
  // console.log('(window as any).electronAPI')
  // console.log((window as any).electronAPI)

  return (window as any).electronAPI ? true : false
}

// electron唤起默认浏览器
const openExternal = (window as any).electronAPI?.openExternal || default_func
// electron获取mac电脑的芯片类型（apple 或 inter）
const getChipInfo = (window as any).electronAPI?.getChipInfo || default_func
// 设置electron的版本，到js的pinia内
const getVersion = (window as any).electronAPI?.getVersion || default_func
// 检查更新相关方法
const checkUpdate = (window as any).electronAPI?.checkUpdate || default_func
const downloadUpdate = (window as any).electronAPI?.downloadUpdate || default_func
const downloadUpdateWithProgress =
  (window as any).electronAPI?.downloadUpdateWithProgress || default_func
const downloadRemoteFile = (window as any).electronAPI?.downloadRemoteFile || default_func
const abortDownload = (window as any).electronAPI?.abortDownload || default_func
const getDownloadTasks = (window as any).electronAPI?.getDownloadTasks || default_func
const cleanupDownloadTask = (window as any).electronAPI?.cleanupDownloadTask || default_func
const installUpdate = (window as any).electronAPI?.installUpdate || default_func
const getUpdateStatus = (window as any).electronAPI?.getUpdateStatus || default_func

const receiveMethodsPools: any = {
  // 将当前electron版本记录到pinia中
  receiveVersion(version: any) {
    // const versionStore = useVersionStore()
    // versionStore.increment(version)
    // console.log(`当前版本：${versionStore.version}`)
  },
}

// 接收electrion的触发函数
function listenElectronEvent() {
  // 接收electrion版本号函数
  ;(window as any).receiveElectron = (name = '', jsonParams = '') => {
    receiveMethodsPools[name](jsonParams)
  }
}

const jsBridge = {
  /**
   *
   * @param method electron主进程的方法
   * @param json 传入electron主进程的数据参数 object
   * @param callback 回调函数
   */
  register(options: any) {
    if (!isInElectron()) return

    const { method, json, callback = () => {} } = options
    // 处理数据
    this.handleJson(json)

    const funcName: any = uuidv4()
    // 注册到window上的js方法名，用于electron回调直接调用
    ;(window as any)[funcName] = callback

    if ((window as any)?.electronAPI && (window as any)?.electronAPI[method]) {
      const sendJson = { json, funcName }
      ;(window as any).electronAPI[method](sendJson)
    } else {
      throw new Error(`electron主进程没有注册“${method}”方法的函数`)
    }
  },

  registerSync({ method = '', json = {} }) {
    // 处理数据
    this.handleJson(json)
    return new Promise(resolve => {
      this.register({
        method: method,
        json,
        callback: (data: any) => {
          resolve(data)
        },
      })
    })
  },
  handleJson(json: any) {
    if (json?.data?.item) {
      json.data.item = toRaw(json.data.item)
    }
    if (Array.isArray(json?.data?.items)) {
      json.data.items = json.data.items.map((item: any) => toRaw(item))
    }
  },
}

type ElectronWebviewOptions = {
  url: string
  title?: string
  width?: string | number
  height?: string | number
  minWidth?: string | number
  minHeight?: string | number
}

type ElectronModuleWindowOptions = {
  url: string
  title?: string
  width?: string | number
  height?: string | number
}

/**
 * 打开一个新的 Electron webview 窗口
 */
function openElectronWebview(options: ElectronWebviewOptions) {
  return (window as any).electronAPI?.openElectronWebview?.(options)
}

/**
 * 新开 Electron 窗口，直接加载当前应用页面
 */
function openModuleWindow(options: ElectronModuleWindowOptions) {
  return (window as any).electronAPI?.openModuleWindow?.(options)
}

export {
  isInElectron,
  openExternal,
  listenElectronEvent,
  getChipInfo,
  getVersion,
  checkUpdate,
  downloadUpdate,
  downloadUpdateWithProgress,
  downloadRemoteFile,
  abortDownload,
  getDownloadTasks,
  cleanupDownloadTask,
  installUpdate,
  getUpdateStatus,
  jsBridge,
  openElectronWebview,
  openModuleWindow,
}
