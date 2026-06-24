/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
const { contextBridge, ipcRenderer } = require("electron");
const { chipInfo } = require("./util");

contextBridge.exposeInMainWorld("electronAPI", {
  openExternal: (args) => ipcRenderer.invoke("openExternal", args),
  openElectronWebview: (args) => ipcRenderer.invoke("openElectronWebview", args),
  openModuleWindow: (args) => ipcRenderer.invoke("openModuleWindow", args),
  // 新增：打开 Mac Terminal 并执行命令
  openMacTerminal: (args) => ipcRenderer.invoke("openMacTerminal", args),
  // js获取当前mac电脑的芯片类型（apple 或 inter）
  getChipInfo: (args) => {
    return chipInfo();
  },
  getVersion: (args) => ipcRenderer.invoke("getVersion", args),
  getHhcliVersion: (args) => ipcRenderer.invoke("getHhcliVersion", args),
  getCptCarryVersion: (args) => ipcRenderer.invoke("getCptCarryVersion", args),
  getProjectVersion: (args) => ipcRenderer.invoke("getProjectVersion", args),
  getProjectVersionFeDemo: (args) =>
    ipcRenderer.invoke("getProjectVersionFeDemo", args),
  getEndVersion: (args) => ipcRenderer.invoke("getEndVersion", args),
  updateHhcli: (args) => ipcRenderer.invoke("updateHhcli", args),
  updateProject: (args) => ipcRenderer.invoke("updateProject", args),
  updateProjectFeDemo: (args) =>
    ipcRenderer.invoke("updateProjectFeDemo", args),
  startCliPro: (args) => ipcRenderer.invoke("startCliPro", args), // 初始化hh-cli脚手架项目
  choosePath: (args) => ipcRenderer.invoke("choosePath", args), // 选择获取本地mac路径弹窗
  openDir: (args) => ipcRenderer.invoke("openDir", args), // 打开本地文件夹
  showNotification: (args) => ipcRenderer.invoke("showNotification", args), // 弹出本地消息提示
  getPlatform: (args) => ipcRenderer.invoke("getPlatform", args), // 查看当前客户端运行平台
  getTransferConfig: (args) => ipcRenderer.invoke("getTransferConfig", args), // 获取transfer脚本的配置文件内容
  startTransfer: (args) => ipcRenderer.invoke("startTransfer", args), // 执行transfer脚本
  openConfigFile: (args) => ipcRenderer.invoke("openConfigFile", args), // 打开transfer的配置文件
  openByVscode: (args) => ipcRenderer.invoke("openByVscode", args), // 用vscode打开本地文件
  getIp: (args) => ipcRenderer.invoke("getIp", args), // 获取ip地址
  readLocalFile: (args) => ipcRenderer.invoke("readLocalFile", args), // 读取本地文件内容，并结构化
  updateLocalFile: (args) => ipcRenderer.invoke("updateLocalFile", args), // 修改本地文件内容
  getHomePath: (args) => ipcRenderer.invoke("getHomePath", args), // 获取home目录在本地的目录路径
  getHomeProjectPath: (args) => ipcRenderer.invoke("getHomeProjectPath", args), // 获取UworkPlus项目目录在本地的目录路径
  getBindDirFiles: (args) => ipcRenderer.invoke("getBindDirFiles", args), // 获取绑定的目录下的所有文件
  openProxyConfigFile: (args) =>
    ipcRenderer.invoke("openProxyConfigFile", args), // 打开 proxy代理 的配置文件
  getProxyConfig: (args) => ipcRenderer.invoke("getProxyConfig", args), // 获取 proxy代理 的配置文件内容
  restartApp: (args) => ipcRenderer.invoke("restartApp", args), // 重启 electron 端
  startExpressApp: (args) => ipcRenderer.invoke("startExpressApp", args), // 重启 express node服务
  restartExpressApp: (args) => ipcRenderer.invoke("restartExpressApp", args), // 重启 express node服务
  enableSystemProxy: (args) => ipcRenderer.invoke("enableSystemProxy", args), // 开启 mac 系统代理
  disableSystemProxy: (args) => ipcRenderer.invoke("disableSystemProxy", args), // 关闭 mac 系统代理
  updateSystemProxyRoutes: (args) =>
    ipcRenderer.invoke("updateSystemProxyRoutes", args), // 更新系统代理规则
  getSystemProxyStatus: (args) =>
    ipcRenderer.invoke("getSystemProxyStatus", args), // 获取系统代理状态
  installMitmCa: (args) => ipcRenderer.invoke("installMitmCa", args), // 安装 MITM 根证书
  revealMitmCa: (args) => ipcRenderer.invoke("revealMitmCa", args), // 在 Finder 中定位 MITM 根证书
  startExpressAppSpider: (args) =>
    ipcRenderer.invoke("startExpressAppSpider", args), // 启动 express 爬虫 node服务
  refreshSpiderData: (args) => ipcRenderer.invoke("refreshSpiderData", args), // 刷新爬虫数据
  proxySql: (args) => ipcRenderer.invoke("proxySql", args), // 调用electron的proxy数据库api，增删改查
  readSystemHosts: (args) => ipcRenderer.invoke("readSystemHosts", args), // 读取系统 hosts
  isHostsWriteReady: (args) => ipcRenderer.invoke("isHostsWriteReady", args), // 是否已安装免密写入
  applyHostsProfiles: (args) => ipcRenderer.invoke("applyHostsProfiles", args), // 应用 hosts 配置到系统
  sendApiRequest: (args) => ipcRenderer.invoke("sendApiRequest", args), // 发送 HTTP 接口调试请求
  runTerminalCommand: (args) => ipcRenderer.invoke("runTerminalCommand", args), // 调用electron主进程执行终端命令
  runTerminalCommandStream: (command, args = []) => {
    ipcRenderer.send("runTerminalCommandStream", { command, args });
  },
  onTerminalOutput: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on("terminal-output", listener);
    // 可选：返回移除监听的方法
    return () => ipcRenderer.removeListener("terminal-output", listener);
  },
  onVoiceWakeup: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on("voice-wakeup", listener);
    return () => ipcRenderer.removeListener("voice-wakeup", listener);
  },
  transcribeAudio: (payload) => ipcRenderer.invoke("transcribe-audio", payload),
  sendTerminalInput: (input) => {
    ipcRenderer.send("terminal-input", input);
  },
  readScaffoldDirectory: (args) =>
    ipcRenderer.invoke("readScaffoldDirectory", args), // 读取脚手架目录
  testGitRepository: (args) => ipcRenderer.invoke("testGitRepository", args), // 测试 Git 仓库连通性
  downloadGitRepository: (args) =>
    ipcRenderer.invoke("downloadGitRepository", args), // 下载 Git 仓库
  existsSync: (args) => ipcRenderer.invoke("existsSync", args), // 校验文件是否存在（文件夹/文件 均可）
  copyDirectory: (args) => ipcRenderer.invoke("copyDirectory", args), // 复制目录
  closeApp: (args) => ipcRenderer.invoke("close-app", args), // 关闭app
  // 检查更新相关方法
  checkUpdate: (args) => ipcRenderer.invoke("check-for-updates", args), // 检查是否有可用更新
  downloadUpdate: (args) => ipcRenderer.invoke("download-update", args), // 开始下载更新
  // downloadUpdateWithProgress: (args) => ipcRenderer.invoke("download-update-with-progress", args), // 开始下载更新（支持进度回调）
  downloadRemoteFile: (args) => ipcRenderer.invoke("download-remote-file", args), // 下载远程文件（支持进度回调）
  abortDownload: (args) => ipcRenderer.invoke("abort-download", args), // 中断下载
  getDownloadTasks: (args) => ipcRenderer.invoke("get-download-tasks", args), // 获取下载任务列表
  cleanupDownloadTask: (args) => ipcRenderer.invoke("cleanup-download-task", args), // 清理下载任务
  installUpdate: (args) => ipcRenderer.invoke("install-update", args), // 安装更新
  getUpdateStatus: (args) => ipcRenderer.invoke("get-update-status", args), // 获取更新状态
  createDirectoryOrFile: (args) => ipcRenderer.invoke("createDirectoryOrFile", args), // 创建文件夹或文件
  writeClipboard: (text) => ipcRenderer.invoke("writeClipboard", text),
  readClipboard: () => ipcRenderer.invoke("readClipboard"),
});
