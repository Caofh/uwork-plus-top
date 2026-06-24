const {
  app,
  screen,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  Tray,
  Menu,
  nativeImage,
  session,
  systemPreferences,
  clipboard,
} = require("electron");

const path = require("path");
const fs = require("fs");
const vm = require("vm");
// var exec = require("child_process").exec;
const AutoLaunch = require("auto-launch");
const os = require("os");
const child_process = require("child_process");
const { spawn, execSync } = require("child_process");
const fsExtra = require("fs-extra");

let ptyModuleCache = undefined;

function canUsePtyTerminal() {
  if (ptyModuleCache === false) return false;
  if (ptyModuleCache) return true;
  try {
    ptyModuleCache = require("node-pty");
    return true;
  } catch (err) {
    console.warn("[terminal] node-pty unavailable, fallback to spawn:", err.message);
    ptyModuleCache = false;
    return false;
  }
}

function getPtyModule() {
  if (!canUsePtyTerminal()) {
    throw new Error("node-pty is not available");
  }
  return ptyModuleCache;
}

function writeTerminalInput(input) {
  if (!terminalProcess) return;
  if (typeof terminalProcess.write === "function") {
    terminalProcess.write(input);
    return;
  }
  terminalProcess.stdin?.write(input);
}

// 代理server（前端代理proxy 功能）
const server = require("./server.js");

// hosts 管理（SwitchHosts 功能）
const hostsManager = require("./hostsManager.js");
const { sendApiRequest } = require("./apiRequest.js");

// 爬虫功能
const serverSpider = require("./serverSpider.js");

// 自动更新管理器
const UpdateManager = require("./update-manager.js");
const { resolveProductionDocUrl, getRemoteOrigin } = require("./remote-config");

// 本地方法
const packageJson = require("./package.json");
const { home } = require("./spider_template.js");

const timestamp = new Date().getTime();
// 判断当前构建环境
let resourcePath = "";
let docUrl = "";
const Env = process.env.NODE_ENV;
if (Env === "development") {
  resourcePath = "./resources";
  docUrl = "http://localhost:5173/uworkplus/";
} else {
  resourcePath = "../resources";
  docUrl = resolveProductionDocUrl(timestamp);
}
// console.log('process.env.NODE_ENV')
// console.log(process.env.NODE_ENV)

const { exiteDir, getStaticFullEnv, getRootConfigPath, quoteShellArg, normalizeShellScriptForExecution } = require(path.join(
  __dirname,
  `${resourcePath}/util.js`
));
const { cmd } = require("./utils");
const preloadPath = path.join(__dirname, `${resourcePath}/preload.js`);

function getTencentAsrConfig() {
  return {
    secretId: process.env.TENCENT_SECRET_ID || "",
    secretKey: process.env.TENCENT_SECRET_KEY || "",
    region: process.env.TENCENT_ASR_REGION || "ap-beijing",
  };
}

// curd相关接口
const curd = require(path.join(__dirname, `${resourcePath}/curd/curd.js`));

// 正式环境，才执行开机自启动逻辑
if (Env !== "development") {
  // 创建一个名为 'switchproxy' 的 AutoLaunch 实例
  // const myAppLauncher = new AutoLaunch({
  //   name: "switchproxy",
  // });
  // // 启用开机自启动
  // myAppLauncher.enable();
}

let loadingWindow = null;
/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {Tray | null} */
let tray = null;

function getTrayIconImage() {
  const logoPath = path.join(__dirname, "assets", "logo", "logo.png");
  if (!fs.existsSync(logoPath)) {
    return null;
  }
  const image = nativeImage.createFromPath(logoPath);
  if (image.isEmpty()) {
    return null;
  }
  // 菜单栏区域常用尺寸；高分屏用略大图由系统缩放
  return image.resize({ width: 22, height: 22 });
}

function createTray() {
  if (process.platform !== "darwin") {
    return;
  }
  if (tray) {
    return;
  }
  const icon = getTrayIconImage();
  if (!icon) {
    console.warn("[Tray] assets/logo/logo.png 缺失或无效，已跳过菜单栏图标");
    return;
  }

  tray = new Tray(icon);
  tray.setToolTip(packageJson.productName || packageJson.name || "UworkPlus");

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "语音唤起",
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send("voice-wakeup", {
              type: "voice-wakeup",
              timestamp: Date.now(),
            });
          }
        },
      },
      { type: "separator" },
      {
        label: `退出 ${packageJson.productName || packageJson.name || "UworkPlus"}`,
        click: () => {
          app.quit();
        },
      },
    ])
  );
}
const createLoadingWindow = () => {
  const { winWidth, winHeight, x, y } = getWindowSize();

  loadingWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: x,
    y: y,
    show: false,
    backgroundColor: "#0f0f23",
    frame: false, // 无边框窗口，更美观
    transparent: false,
    resizable: false, // 禁止调整窗口大小
    maximizable: false, // 禁止最大化
    minimizable: false, // 禁止最小化
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 加载loading页面
  loadingWindow.loadFile(path.join(__dirname, "loading.html"));

  // 显示loading窗口
  loadingWindow.once("ready-to-show", () => {
    loadingWindow.show();

    // if (Env == "development") {
    //   loadingWindow.webContents.openDevTools();
    // }
  });

  return loadingWindow;
};

// 获取窗口尺寸和位置
function getWindowSize() {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  // const winWidth = 1170;
  // const winHeight = 720;
  const winWidth = screenWidth - 100;
  const winHeight = screenHeight - 30;

  // const x = screenWidth - winWidth - 20;
  // const y = 50;
  // const x = Math.floor((screenWidth - winWidth) / 2);
  // const y = Math.floor((screenHeight - winHeight) / 2);
  const x = 0;
  const y = 0;

  return {
    screenWidth,
    screenHeight,
    winWidth,
    winHeight,
    x,
    y,
  };
}

function toWindowInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

/** 创建与主窗口相同配置的 BrowserWindow */
function createAppBrowserWindow(options = {}) {
  const { winWidth, winHeight, x, y } = getWindowSize();
  const {
    url = docUrl,
    width = winWidth,
    height = winHeight,
    focusable = true,
    title,
  } = options;

  const win = new BrowserWindow({
    width: toWindowInt(width, winWidth),
    height: toWindowInt(height, winHeight),
    x,
    y,
    backgroundColor: "#000000",
    titleBarStyle: "hiddenInset",
    focusable,
    ...(title ? { title: String(title) } : {}),
    webPreferences: {
      nodeIntegration: true,
      preload: preloadPath,
    },
  });

  if (url) {
    win.loadURL(url);
  }

  return win;
}

/** 主窗口 / 模块窗口共用的后置初始化 */
function setupAppWindow(win) {
  if (!win || win.isDestroyed()) {
    return;
  }

  setupQuickForgeClipboardPatch(win);

  if (Env == "development") {
    win.webContents.openDevTools();
  }
}

const createMainWindow = (callback) => {
  const win = createAppBrowserWindow({
    url: docUrl,
    focusable: false,
  });
  win.once("ready-to-show", () => {
    // 显示主窗口
    // win.show();
    // win.focus();

    callback && callback();
  });

  return win;
};

const startTransitionAnimation = (loadingWin, mainWin) => {
  let opacity = 1;
  const fadeOutStep = 0.03; // 淡出步长
  const animationInterval = 20; // 约50fps

  const fadeAnimation = setInterval(() => {
    if (opacity > 0) {
      // 淡出loading窗口
      opacity -= fadeOutStep;
      loadingWin.setOpacity(Math.max(0, opacity));
    } else {
      // 销毁loading窗口
      clearInterval(fadeAnimation);

      // 销毁loading窗口
      setTimeout(() => {
        if (loadingWin && !loadingWin.isDestroyed()) {
          // 销毁loading窗口
          loadingWin.hide();
          loadingWin.destroy();
          loadingWin = null;
        }

        // 启用主窗口操作
        if (mainWin && !mainWin.isDestroyed()) {
          mainWin.setFocusable(true); // 允许获得焦点
          // mainWin.setAlwaysOnTop(false); // 取消置顶
          mainWin.focus(); // 获得焦点
        }
      }, 300);
    }
  }, animationInterval);
};
const createWindow = async () => {
  // 先创建loading窗口
  createLoadingWindow();

  // 等待主窗口创建完毕
  const win = createMainWindow(async () => {
    // 窗口完全加载完之后，销毁loading窗口
    if (loadingWindow && !loadingWindow.isDestroyed()) {
      // 延迟销毁loading窗口
      setTimeout(() => {
        startTransitionAnimation(loadingWindow, win);
        // 显示主窗口
        // win.show();
        // win.focus();
      }, 1200);
    }
  });

  // 返回主窗口引用（用于后续操作）
  return win;
};

// 设置 CSP 以消除安全警告
function setupCSP(win) {
  const remoteConnectOrigin = (() => {
    const origin = getRemoteOrigin();
    if (!origin) return "";
    return origin.startsWith("http") ? origin.replace(/\/+$/, "") : `https://${origin.replace(/\/+$/, "")}`;
  })();

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' 'unsafe-inline' data: blob:; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob: https:; " +
            "media-src 'self' data: blob: https:; " +
            "font-src 'self' data:; " +
            `connect-src 'self' http://localhost:*${remoteConnectOrigin ? ` ${remoteConnectOrigin}` : ""}; ` +
            "frame-src 'none'; " +
            "object-src 'none'; " +
            "base-uri 'self';",
        ],
      },
    });
  });

  // const currentPath = app.getAppPath();
  // console.log(currentPath);

  return win;
}

function registerClipboardHandlers() {
  if (registerClipboardHandlers.registered) {
    return;
  }
  registerClipboardHandlers.registered = true;

  ipcMain.handle("writeClipboard", async (event, text) => {
    clipboard.writeText(String(text ?? ""));
    return { ok: true };
  });

  ipcMain.handle("readClipboard", async () => {
    return { text: clipboard.readText() };
  });
}

const QUICK_FORGE_URL_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1):(5190|5188)/i;

const QUICK_FORGE_CLIPBOARD_PATCH_SCRIPT = `
(function () {
  if (window.__uworkClipboardPatched) return;
  window.__uworkClipboardPatched = true;
  const writeViaParent = (text) => {
    window.parent.postMessage(
      { type: "uwork-clipboard-write", text: String(text ?? "") },
      "*"
    );
    return Promise.resolve();
  };
  const clipboardApi = {
    writeText: writeViaParent,
    readText: () => Promise.resolve(""),
  };
  try {
    Object.defineProperty(navigator, "clipboard", {
      value: clipboardApi,
      configurable: true,
      writable: true,
    });
  } catch (error) {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText = writeViaParent;
      }
    } catch (_) {}
  }
})();
`;

const MAIN_APP_CLIPBOARD_PATCH_SCRIPT = `
(function () {
  if (window.__uworkMainClipboardPatched || !window.electronAPI?.writeClipboard) return;
  window.__uworkMainClipboardPatched = true;
  const writeText = (text) => window.electronAPI.writeClipboard(String(text ?? ""));
  const clipboardApi = {
    writeText,
    readText: () => Promise.resolve(""),
  };
  try {
    Object.defineProperty(navigator, "clipboard", {
      value: clipboardApi,
      configurable: true,
      writable: true,
    });
  } catch (error) {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText = writeText;
      }
    } catch (_) {}
  }
})();
`;

function patchMainAppClipboard(webContents) {
  if (!webContents || webContents.isDestroyed()) {
    return;
  }

  let url = "";
  try {
    url = webContents.getURL() || "";
  } catch {
    return;
  }

  if (!url || url === "about:blank" || QUICK_FORGE_URL_PATTERN.test(url)) {
    return;
  }

  webContents
    .executeJavaScript(MAIN_APP_CLIPBOARD_PATCH_SCRIPT, true)
    .catch((error) => {
      console.warn("[clipboard] patch main app failed:", error.message);
    });
}

function patchQuickForgeClipboardFrames(webContents) {
  if (!webContents || webContents.isDestroyed()) {
    return;
  }

  let frames = [];
  try {
    frames = webContents.mainFrame?.framesInSubtree || [];
  } catch (error) {
    console.warn("[clipboard] read frames failed:", error.message);
    return;
  }

  frames.forEach((frame) => {
    if (!frame || frame.isDestroyed?.()) {
      return;
    }

    let url = "";
    try {
      url = frame.url || "";
    } catch {
      return;
    }

    if (!QUICK_FORGE_URL_PATTERN.test(url)) {
      return;
    }

    frame
      .executeJavaScript(QUICK_FORGE_CLIPBOARD_PATCH_SCRIPT, true)
      .catch((error) => {
        console.warn("[clipboard] patch frame failed:", url, error.message);
      });
  });
}

function setupQuickForgeClipboardPatch(win) {
  if (!win || win.isDestroyed()) {
    return;
  }

  let patchTimer1 = null;
  let patchTimer2 = null;

  const safePatch = () => {
    if (!win || win.isDestroyed()) {
      return;
    }
    let contents;
    try {
      contents = win.webContents;
    } catch {
      return;
    }
    patchMainAppClipboard(contents);
    patchQuickForgeClipboardFrames(contents);
  };

  const schedulePatch = () => {
    safePatch();
    if (patchTimer1) {
      clearTimeout(patchTimer1);
    }
    if (patchTimer2) {
      clearTimeout(patchTimer2);
    }
    patchTimer1 = setTimeout(safePatch, 300);
    patchTimer2 = setTimeout(safePatch, 1200);
  };

  win.webContents.on("dom-ready", schedulePatch);
  win.webContents.on("did-frame-navigate", schedulePatch);
  win.webContents.on("did-navigate-in-page", schedulePatch);

  win.once("closed", () => {
    if (patchTimer1) {
      clearTimeout(patchTimer1);
      patchTimer1 = null;
    }
    if (patchTimer2) {
      clearTimeout(patchTimer2);
      patchTimer2 = null;
    }
  });
}

app.whenReady().then(async () => {
  registerClipboardHandlers();

  // 校验HH-TOOLS配置文件
  await checkHhToolsConfig();

  const isLocalQuickForgeOrigin = (origin = "") =>
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

  // 允许页面请求麦克风、剪贴板等权限（iframe/webview 内 QuickForge 复制链接依赖 clipboard-write）
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      const origin = details?.requestingUrl || details?.securityOrigin || "";
      if (
        isLocalQuickForgeOrigin(origin) &&
        (permission === "clipboard-read" ||
          permission === "clipboard-sanitized-write" ||
          permission === "clipboard-write")
      ) {
        callback(true);
        return;
      }
      if (permission === "media" || permission === "microphone") {
        callback(true);
      } else {
        callback(false);
      }
    }
  );
  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin) => {
      if (
        isLocalQuickForgeOrigin(requestingOrigin) &&
        (permission === "clipboard-read" ||
          permission === "clipboard-sanitized-write" ||
          permission === "clipboard-write")
      ) {
        return true;
      }
      if (permission === "media" || permission === "microphone") {
        return true;
      }
      return false;
    }
  );
  // macOS：主动请求麦克风权限（配合 Info.plist 使用说明）
  if (process.platform === "darwin") {
    try {
      await systemPreferences.askForMediaAccess("microphone");
    } catch (e) {
      console.warn("[Microphone] askForMediaAccess failed:", e);
    }
  }

  const win = await createWindow();
  mainWindow = win;
  createTray();

  if (win && !win.isDestroyed()) {
    setupAppWindow(win);

    // 设置CSP
    // setupCSP(win);

    // 注册客户端的jsbridge方法
    await registerJsbridgeProxyFunc(win);
  }
});
// 检查HH-TOOLS所需要的初始化配置文件
async function checkHhToolsConfig() {
  // 获取根路径path: UWORK-PLUS-dev（开发环境） 或 UWORK-PLUS（线上环境）
  const projectPath = getRootConfigPath();

  const dirs = [
    // { name: "UWORK-PLUS", type: "dir" },
    { name: `${projectPath}/dataSql`, type: "dir" },
    { name: `${projectPath}/codeDirGitStore`, type: "dir" },
    { name: `${projectPath}/gitStore`, type: "dir" },
    { name: `${projectPath}/dataSpider/record`, type: "dir" },
    { name: `${projectPath}/cache/dmg`, type: "dir" },
    { name: `${projectPath}/dataSql/data.json`, type: "file" },
    { name: `${projectPath}/dataSql/dataGroup.json`, type: "file" },
    { name: `${projectPath}/dataSql/document.json`, type: "file" },
    { name: `${projectPath}/dataSpider/record/latest.json`, type: "file" },
  ];
  await pushDirOrFile(dirs);
}
// 创建初始化配置文件相关
// pathType: part 部分路径，all 全部路径
async function pushDirOrFile(dirs, options = { pathType: "part" }) {
  const { pathType } = options || {};

  for (let i = 0; i < dirs.length; i++) {
    const item = dirs[i];
    const currentPath =
      pathType === "part" ? `${os.homedir()}/${item.name}` : `${item.name}`;

    if (!(await exiteDir(currentPath))) {
      if (item.type == "dir") {
        await cmd(`mkdir -p ${currentPath}`);
      } else if (item.type == "file") {
        await cmd(`touch ${currentPath}`);
      }
    }
  }
}

let terminalProcess = null;
let loop = null;

function resolveShellPath() {
  if (process.platform === "win32") {
    return process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe";
  }

  const candidates = [process.env.SHELL, "/bin/zsh", "/bin/bash"].filter(Boolean);
  for (const shell of candidates) {
    if (shell.startsWith("/") && fs.existsSync(shell)) {
      return shell;
    }
  }

  return "/bin/zsh";
}

function buildShellInvokeArgs(cmdStr) {
  // -i: 交互式 shell，加载 .zshrc / .bashrc（别名、自定义 PATH 等）
  // -l: 登录 shell，加载 .zprofile / .bash_profile
  return ["-ilc", cmdStr];
}

function spawnTerminalCommandFallback(event, cmdStr, mergedEnv) {
  const shellPath = resolveShellPath();
  const child = child_process.spawn(shellPath, buildShellInvokeArgs(cmdStr), {
    cwd: process.env.HOME,
    env: mergedEnv,
    stdio: ["pipe", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    event.sender.send("terminal-output", {
      type: "stdout",
      data: data.toString(),
    });
  });

  child.stderr.on("data", (data) => {
    event.sender.send("terminal-output", {
      type: "stderr",
      data: data.toString(),
    });
  });

  child.on("close", (code) => {
    event.sender.send("terminal-output", { type: "close", code });
    terminalProcess = null;
  });

  child.on("error", (err) => {
    event.sender.send("terminal-output", {
      type: "stderr",
      data: `${err.message}\n`,
    });
    event.sender.send("terminal-output", { type: "close", code: 1 });
    terminalProcess = null;
  });

  terminalProcess = child;
  return child;
}

// proxy相关ICP
// 增删改查proxy数据
// 注册客户端的jsbridge方法
function getWebContentsFromEvent(event, fallbackWin) {
  try {
    const senderWin = BrowserWindow.fromWebContents(event?.sender);
    if (senderWin && !senderWin.isDestroyed()) {
      return senderWin.webContents;
    }
  } catch (error) {
    // ignore
  }
  const fallback = fallbackWin || mainWindow;
  if (fallback && !fallback.isDestroyed()) {
    return fallback.webContents;
  }
  return null;
}

function escapeFuncName(funcName) {
  return String(funcName).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function runJsCallback(event, funcName, payload, fallbackWin) {
  if (!funcName) {
    return;
  }
  const webContents = getWebContentsFromEvent(event, fallbackWin);
  if (!webContents) {
    return;
  }

  const name = escapeFuncName(funcName);
  let script;

  if (payload === undefined || payload === null) {
    script = `window['${name}'] && window['${name}']()`;
  } else if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (trimmed === "") {
      script = `window['${name}'] && window['${name}']()`;
    } else if (
      trimmed.startsWith("{") ||
      trimmed.startsWith("[") ||
      trimmed.startsWith('"')
    ) {
      // proxySql 等已序列化的 JSON 文本
      script = `window['${name}'] && window['${name}'](${payload})`;
    } else {
      script = `window['${name}'] && window['${name}'](${JSON.stringify(payload)})`;
    }
  } else {
    script = `window['${name}'] && window['${name}'](${JSON.stringify(payload)})`;
  }

  webContents.executeJavaScript(script).catch((err) => {
    console.warn("[runJsCallback]", name, err.message);
  });
}

async function registerJsbridgeProxyFunc(win) {
  ipcMain.handle("getVersion", async (event, options = null) => {
    const result = { code: 0, data: packageJson.version };
    if (options) {
      const { funcName } = options;
      runJsCallback(event, funcName, result);
    } else {
      return result;
    }
  });

  // jsbridge控制文件夹或文件的创建
  ipcMain.handle("createDirectoryOrFile", async (event, options) => {
    const { json, funcName } = options;

    const dirs = json.dirs || [];
    console.log("dirs");
    console.log(dirs);

    await pushDirOrFile(dirs, { pathType: "all" });

    runJsCallback(event, funcName, 'electron文件夹校验完成');
  });

  // 打开默认浏览器
  ipcMain.handle("openExternal", (event, url) => {
    shell.openExternal(url);
  });

  // 新开 Electron 窗口，使用 webview 打开指定 URL
  ipcMain.handle("openElectronWebview", async (event, options = {}) => {
    const {
      url = "",
      title = "网页预览",
      width = 1200,
      height = 800,
      minWidth = 480,
      minHeight = 360,
    } = options || {};

    const rawUrl = String(url || "").trim();
    if (!rawUrl) {
      return { ok: false, error: "url 不能为空" };
    }

    const normalizedUrl = /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : `https://${rawUrl}`;

    try {
      // 校验 URL 格式，避免 loadURL 抛异常
      new URL(normalizedUrl);
    } catch (e) {
      return { ok: false, error: "url 格式不合法" };
    }

    const toInt = (value, fallback) => {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
    };
    const winWidth = toInt(width, 1200);
    const winHeight = toInt(height, 800);
    const winMinWidth = toInt(minWidth, 480);
    const winMinHeight = toInt(minHeight, 360);

    const webviewWindow = new BrowserWindow({
      width: winWidth,
      height: winHeight,
      minWidth: winMinWidth,
      minHeight: winMinHeight,
      resizable: false,
      maximizable: false,
      fullscreenable: false,
      zoomable: false, // macOS 绿色按钮缩放
      title: String(title || "网页预览"),
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webviewTag: true,
      },
    });

    webviewWindow.webContents.on("did-attach-webview", (event, contents) => {
      // webview 内打开新窗口时，统一走系统浏览器
      contents.setWindowOpenHandler(({ url: target }) => {
        shell.openExternal(target);
        return { action: "deny" };
      });
    });

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${String(title || "网页预览")}</title>
    <style>
      html, body { margin: 0; width: 100%; height: 100%; background: #0f1720; overflow: hidden; }
      #wv { width: 100%; height: 100%; border: 0; }
    </style>
  </head>
  <body>
    <webview id="wv" allowpopups src="${normalizedUrl}"></webview>
  </body>
</html>`;

    await webviewWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );
    return { ok: true };
  });

  // 新开 Electron 窗口，直接加载应用页面（与主窗口相同配置）
  ipcMain.handle("openModuleWindow", async (event, options = {}) => {
    const { url = "" } = options || {};

    const rawUrl = String(url || "").trim();
    if (!rawUrl) {
      return { ok: false, error: "url 不能为空" };
    }

    try {
      new URL(rawUrl);
    } catch (e) {
      return { ok: false, error: "url 格式不合法" };
    }

    const moduleWindow = createAppBrowserWindow({
      url: rawUrl,
      width: options.width,
      height: options.height,
      focusable: true,
      title: options.title,
    });

    setupAppWindow(moduleWindow);

    moduleWindow.once("ready-to-show", () => {
      if (moduleWindow.isDestroyed()) {
        return;
      }
      moduleWindow.focus();
    });

    return { ok: true };
  });

  // 新增：打开 Mac Terminal 并执行命令
  ipcMain.handle("openMacTerminal", async (event, options) => {
    /**
     options: {
       json: {
         command: 'brew -v', // 要执行的命令
         cwd: process.env.HOME, // 工作目录（可选）
       },
       funcName: 'xxx' // 回调函数名
     }
    */
    const { json, funcName } = options;
    const { command = "", cwd = process.env.HOME } = json || {};

    let result = { code: 0, message: "Terminal opened successfully" };

    const escapeForAppleScript = (str) =>
      String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    let tempFile;
    try {
      const tempDir = os.tmpdir();
      tempFile = path.join(tempDir, `terminal_script_${Date.now()}.scpt`);

      // 单次 do script：未运行时会自动启动 Terminal 并新开带命令的窗口
      // 不要用「先 do script "" 再 in front window」——前者会多一个空窗口，后者在 Terminal 未打开时会失败
      const normalizedCommand = normalizeShellScriptForExecution(command);
      const shellLine = normalizedCommand
        ? `cd ${quoteShellArg(cwd)} && ${normalizedCommand}`
        : "";
      const appleScript = normalizedCommand
        ? `
        tell application "Terminal"
          activate
          do script "${escapeForAppleScript(shellLine)}"
        end tell
      `
        : `
        tell application "Terminal"
          activate
        end tell
      `;

      fs.writeFileSync(tempFile, appleScript);
      execSync(`osascript "${tempFile}"`, { encoding: "utf8" });
    } catch (err) {
      result.code = 1;
      result.message = `Failed to open Terminal: ${err.message}`;
      console.error("openMacTerminal error:", err);
    } finally {
      try {
        if (tempFile && fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (e) {}
    }

    runJsCallback(event, funcName, result);
  });

  // 初始化 express node服务
  ipcMain.handle("startExpressApp", async (event, options) => {
    const { json, funcName } = options;
    try {
      await server.startExpressApp(json.newRoutes);
    } catch (err) {
      console.error("[startExpressApp]", err);
    }
    runJsCallback(event, funcName);
  });
  // 重启 express node服务
  ipcMain.handle("restartExpressApp", async (event, options) => {
    const { json, funcName } = options;
    try {
      await server.restartExpressApp(json.newRoutes);
    } catch (err) {
      console.error("[restartExpressApp]", err);
    }
    runJsCallback(event, funcName);
  });

  ipcMain.handle("enableSystemProxy", async (event, options) => {
    const { json, funcName } = options || {};
    let result = { code: 0, data: null };
    try {
      result.data = await server.enableSystemProxy(json?.routes || []);
    } catch (err) {
      result = { code: -1, message: err?.message || "开启系统代理失败" };
    }
    runJsCallback(event, funcName, result);
    return result;
  });

  ipcMain.handle("disableSystemProxy", async (event, options) => {
    const { funcName } = options || {};
    let result = { code: 0, data: null };
    try {
      result.data = await server.disableSystemProxy();
    } catch (err) {
      result = { code: -1, message: err?.message || "关闭系统代理失败" };
    }
    runJsCallback(event, funcName, result);
    return result;
  });

  ipcMain.handle("updateSystemProxyRoutes", async (event, options) => {
    const { json, funcName } = options || {};
    let result = { code: 0, data: null };
    try {
      result.data = await server.updateSystemProxyRoutes(json?.routes || []);
    } catch (err) {
      result = { code: -1, message: err?.message || "更新系统代理规则失败" };
    }
    runJsCallback(event, funcName, result);
    return result;
  });

  ipcMain.handle("getSystemProxyStatus", async (event, options) => {
    const { funcName } = options || {};
    let result = { code: 0, data: null };
    try {
      result.data = await server.getSystemProxyStatus();
    } catch (err) {
      result = { code: -1, message: err?.message || "获取系统代理状态失败" };
    }
    runJsCallback(event, funcName, result);
    return result;
  });

  ipcMain.handle("installMitmCa", async (event, options) => {
    const { funcName } = options || {};
    let result = { code: 0, data: null };
    try {
      result.data = await server.installMitmCa();
    } catch (err) {
      result = { code: -1, message: err?.message || "安装 MITM 证书失败" };
    }
    runJsCallback(event, funcName, result);
    return result;
  });

  ipcMain.handle("revealMitmCa", async (event, options) => {
    const { funcName } = options || {};
    let result = { code: 0, data: null };
    try {
      result.data = server.revealMitmCa();
    } catch (err) {
      result = { code: -1, message: err?.message || "打开证书失败" };
    }
    runJsCallback(event, funcName, result);
    return result;
  });
  // 读取系统 hosts 文件
  ipcMain.handle("isHostsWriteReady", async (event, options) => {
    const { funcName } = options || {};
    let result = { code: 0, data: false };
    try {
      result.data = Boolean(hostsManager.canWriteHostsWithoutPassword?.());
    } catch (err) {
      result = { code: -1, message: err?.message || "检测 hosts 写入权限失败" };
    }
    runJsCallback(event, funcName, result);
  });

  // 读取系统 hosts 文件
  ipcMain.handle("readSystemHosts", async (event, options) => {
    const { funcName } = options || {};
    let result = { code: 0, data: "" };
    try {
      result.data = hostsManager.readSystemHosts();
    } catch (err) {
      result = { code: -1, message: err?.message || "读取 hosts 失败" };
    }
    runJsCallback(event, funcName, result);
  });

  // 将启用的 hosts 配置写入系统 hosts
  ipcMain.handle("applyHostsProfiles", async (event, options) => {
    const { json, funcName } = options || {};
    const profiles = json?.profiles || [];
    let result = { code: 0 };
    try {
      const applyResult = hostsManager.applyHostsProfiles(profiles);
      result = { code: 0, ...applyResult };
    } catch (err) {
      result = { code: -1, message: err?.message || "写入 hosts 失败" };
    }
    runJsCallback(event, funcName, result);
  });

  // 增删改查代理数据
  ipcMain.handle("proxySql", async (event, options) => {
    /**
     json: {
        methods: 'create', // create, readAll, readById, update, remove
        data: {
          id: '', // methods 等于 readById 和 update 和 remove 时必传
          item: {} // methods 等于 create 和 update
        }
      }
     */
    const { json, funcName } = options;

    const methods = json.methods || "";
    const { id = "", item = {}, sql = "", items = [] } = json.data || {};
    /*
      create,
      readAll,
      readById,
      update,
      remove,
      writeAll,
    */
    let resultStr = "";
    if (methods === "create") {
      const result = curd.create(item, sql);
      resultStr = JSON.stringify(result);
    } else if (methods === "readAll") {
      const result = curd.readAll(sql);
      resultStr = JSON.stringify(result);
    } else if (methods === "readById") {
      const result = curd.readById(id, sql);
      resultStr = JSON.stringify(result);
    } else if (methods === "update") {
      curd.update(id, item, sql);
    } else if (methods === "remove") {
      curd.remove(id, sql);
    } else if (methods === "writeAll") {
      const result = curd.writeAll(items, sql);
      resultStr = JSON.stringify(result);
    }
    runJsCallback(event, funcName, resultStr);
  });

  ipcMain.handle("sendApiRequest", async (event, options) => {
    const { json, funcName } = options;
    let result = { code: -1, message: "请求失败" };
    try {
      result = await sendApiRequest(json || {});
    } catch (err) {
      result = { code: -1, message: err?.message || "请求失败" };
    }
    runJsCallback(event, funcName, result);
  });

  // 初始化 express node服务（爬虫功能）
  ipcMain.handle("startExpressAppSpider", async (event, options) => {
    const { json, funcName } = options;

    function callback() {
      runJsCallback(event, funcName, '爬虫服务启动成功');
    }

    serverSpider.startExpressAppSpider(() => {
      callback();

      // 启动定时任务
      serverSpider.startScheduledTask(() => {
        callback();
      });
    });
  });
  // 刷新 爬虫服务
  ipcMain.handle("refreshSpiderData", async (event, options) => {
    const { json, funcName } = options;

    await serverSpider.refreshSpiderData();

    runJsCallback(event, funcName, '爬虫数据刷新完成，sql已更新');
  });
  ipcMain.handle("runTerminalCommand", async (event, options) => {
    /**
     options: {
       json: {
         command: 'ls -al', // 要执行的shell命令
       },
       funcName: 'xxx' // 回调函数名
     }
    */
    const { json, funcName } = options;
    const { command = "" } = json || {};
    const normalizedCommand = normalizeShellScriptForExecution(command);
    let result = { code: 0, stdout: "", stderr: "" };
    if (normalizedCommand) {
      try {
        const env =
          typeof getStaticFullEnv === "function"
            ? { ...process.env, ...getStaticFullEnv() }
            : process.env;
        const { stdout, stderr } = await new Promise((resolve, reject) => {
          child_process.exec(
            normalizedCommand,
            {
              encoding: "utf-8",
              maxBuffer: 50 * 1024 * 1024,
              env,
            },
            (err, out, errOut) => {
              if (err) {
                reject(err);
                return;
              }
              resolve({ stdout: out || "", stderr: errOut || "" });
            }
          );
        });
        result.stdout = stdout;
        result.stderr = stderr;
      } catch (err) {
        result.code = 1;
        result.stderr = err.message || String(err);
        if (err.stdout) {
          result.stdout = err.stdout;
        }
      }
    } else {
      result.code = 2;
      result.stderr = "No command provided";
    }
    runJsCallback(event, funcName, result);
  });
  ipcMain.on("runTerminalCommandStream", (event, { command, args = [] }) => {
    if (loop) clearTimeout(loop);
    if (win && !win.isDestroyed()) {
      win.setAlwaysOnTop(true);
    }
    loop = setTimeout(() => {
      if (win && !win.isDestroyed()) {
        win.setAlwaysOnTop(false);
        win.focus();
      }
    }, 1000);

    if (terminalProcess) {
      try {
        terminalProcess.kill();
      } catch (_err) {
        // ignore
      }
      terminalProcess = null;
    }

    const cmdStr = normalizeShellScriptForExecution([command, ...args].join(" "));
    const env =
      typeof getStaticFullEnv === "function" ? getStaticFullEnv() : {};
    const mergedEnv = {
      ...process.env,
      ...env,
    };

    if (!canUsePtyTerminal()) {
      spawnTerminalCommandFallback(event, cmdStr, mergedEnv);
      return;
    }

    const shellPath = resolveShellPath();

    try {
      terminalProcess = getPtyModule().spawn(shellPath, buildShellInvokeArgs(cmdStr), {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: mergedEnv,
      });

      terminalProcess.on("data", (data) => {
        event.sender.send("terminal-output", { type: "stdout", data });
      });

      terminalProcess.on("exit", (code) => {
        event.sender.send("terminal-output", { type: "close", code });
        terminalProcess = null;
      });
    } catch (err) {
      console.error(
        "[runTerminalCommandStream] pty.spawn failed, fallback:",
        err.message
      );
      spawnTerminalCommandFallback(event, cmdStr, mergedEnv);
    }
  });
  ipcMain.on("terminal-input", (event, input) => {
    writeTerminalInput(input);
  });

  // 读取指定文件夹的一级目录
  ipcMain.handle("readScaffoldDirectory", async (event, options) => {
    const { funcName, json } = options;

    // 获取根路径path: UWORK-PLUS-dev（开发环境） 或 UWORK-PLUS（线上环境）
    const projectPath = getRootConfigPath();
    const scaffoldPath = `${os.homedir()}/${projectPath}/gitStore/${json.path}`;

    let result = { code: 0, data: [], message: "Success" };
    try {
      // 检查目录是否存在
      if (!fs.existsSync(scaffoldPath)) {
        result.code = 1;
        result.message = "Directory does not exist";
        runJsCallback(event, funcName, result);
        return;
      }

      // 读取目录内容
      const items = fs.readdirSync(scaffoldPath, { withFileTypes: true });

      // 过滤出一级目录（只包含文件夹）
      const directories = items
        .filter((item) => item.isDirectory())
        .map((item) => ({
          name: item.name,
          path: path.join(scaffoldPath, item.name),
          type: "directory",
        }));

      result.data = directories;
      result.message = `Found ${directories.length} directories`;
    } catch (error) {
      result.code = 1;
      result.message = `Error reading directory: ${error.message}`;
    }

    runJsCallback(event, funcName, result);
  });

  // 选择路径弹窗
  ipcMain.handle("choosePath", async (event, options) => {
    const { funcName } = options;

    try {
      const result = await dialog.showOpenDialog(win, {
        properties: ["openDirectory"],
        title: "选择项目路径",
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        runJsCallback(event, funcName, { path: selectedPath });
      } else {
        runJsCallback(event, funcName, { path: null });
      }
    } catch (error) {
      runJsCallback(event, funcName, { error: error.message });
    }
  });

  // 测试 Git 仓库连通性
  ipcMain.handle("testGitRepository", async (event, options) => {
    const { funcName, json } = options;
    const { repositoryUrl = "" } = json || {};

    let result = {
      success: false,
      message: "Repository connectivity test failed",
    };

    try {
      if (!repositoryUrl) {
        result.message = "Repository URL is required";

        runJsCallback(event, funcName, result);
        return;
      }

      // 使用 git ls-remote 命令测试仓库连通性
      const command = `git ls-remote --heads ${repositoryUrl}`;

      try {
        const execResult = child_process.execSync(command, {
          encoding: "utf-8",
          timeout: 2000, // 2秒超时
          stdio: "pipe",
        });

        // 如果命令执行成功，说明仓库可以访问
        result.success = true;
        result.message = "Repository is accessible";
        result.data = {
          branches: execResult.split("\n").filter((line) => line.trim()).length,
          output: execResult,
        };
      } catch (execError) {
        // 根据错误类型返回不同的消息
        if (execError.message.includes("Repository not found")) {
          result.message = "Repository not found or does not exist";
        } else if (execError.message.includes("Authentication failed")) {
          result.message =
            "Authentication failed - repository requires authentication";
        } else if (execError.message.includes("Permission denied")) {
          result.message =
            "Permission denied - repository is private or requires access";
        } else if (execError.message.includes("timeout")) {
          result.message =
            "Connection timeout - please check your network connection";
        } else if (execError.message.includes("Could not resolve host")) {
          result.message =
            "Could not resolve host - please check the repository URL";
        } else {
          result.message = `Connection failed: ${execError.message}`;
        }

        result.data = {
          error: execError.message,
          stderr: execError.stderr,
        };
      }
    } catch (error) {
      result.message = `Error during connectivity test: ${error.message}`;
      result.data = {
        error: error.message,
      };
    }

    runJsCallback(event, funcName, result);
  });

  // 下载 Git 仓库
  ipcMain.handle("downloadGitRepository", async (event, options) => {
    const { funcName, json } = options;
    const {
      repositoryUrl = "https://gitee.com/redorc/scaffold-2025.git",
      targetPath = `${os.homedir()}/${getRootConfigPath()}/gitStore`,
    } = json || {};

    let result = {
      code: 0,
      message: "Repository download started",
      data: null,
    };

    try {
      // 确保目标目录存在
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }

      // 从 URL 中提取仓库名称
      const repoName = repositoryUrl.split("/").pop().replace(".git", "");
      const clonePath = path.join(targetPath, repoName);

      // 检查目录是否已存在
      if (fs.existsSync(clonePath)) {
        result.code = 1;
        result.message = `Repository already exists at ${clonePath}`;
        result.data = { path: clonePath };

        runJsCallback(event, funcName, result);
        return;
      }

      // 执行 git clone 命令
      const command = `git clone ${repositoryUrl} "${clonePath}"`;

      try {
        const execResult = child_process.execSync(command, {
          encoding: "utf-8",
          cwd: targetPath,
          stdio: "pipe",
        });

        result.message = "Repository downloaded successfully";
        result.data = {
          path: clonePath,
          output: execResult,
        };
      } catch (cloneError) {
        result.code = 2;
        result.message = `Failed to clone repository: ${cloneError.message}`;
        result.data = { error: cloneError.message };
      }
    } catch (error) {
      result.code = 3;
      result.message = `Error during download process: ${error.message}`;
      result.data = { error: error.message };
    }

    runJsCallback(event, funcName, result);
  });

  ipcMain.handle("getHomePath", async (event, options) => {
    const { funcName } = options;
    const result = { code: 0, data: os.homedir() };
    runJsCallback(event, funcName, result);
  });
  ipcMain.handle("getHomeProjectPath", async (event, options) => {
    const { funcName } = options;
    const result = { code: 0, data: `${os.homedir()}/${getRootConfigPath()}` };
    runJsCallback(event, funcName, result);
  });
  ipcMain.handle("existsSync", async (event, options) => {
    const { funcName, json } = options;
    const { path } = json;
    const result = { code: 0, data: fs.existsSync(path) };
    runJsCallback(event, funcName, result);
  });
  ipcMain.handle("copyDirectory", async (event, options) => {
    const { funcName, json } = options;
    const { source = "", destination = "" } = json || {};
    let result = { code: 0, message: "ok" };

    try {
      if (!source || !destination) {
        throw new Error("source and destination are required");
      }
      if (fs.existsSync(destination)) {
        throw new Error("目标路径已存在");
      }
      await fsExtra.copy(source, destination);
    } catch (err) {
      result = { code: 1, message: err.message || String(err) };
    }

    runJsCallback(event, funcName, result);
  });

  // 关闭应用
  ipcMain.handle("close-app", async (event, options) => {
    app.quit();
  });

  /**
   * 将录音二进制转文字（腾讯云 ASR：一句话识别）
   * 需要环境变量：
   * - TENCENT_SECRET_ID
   * - TENCENT_SECRET_KEY
   * 可选：
   * - TENCENT_ASR_REGION（默认 ap-beijing）
   */
  ipcMain.handle(
    "transcribe-audio",
    async (event, { bufferBase64, voiceFormat = "pcm", sampleRate = 16000 }) => {
      const { secretId, secretKey, region } = getTencentAsrConfig();

      if (!secretId || !secretKey) {
        return {
          ok: false,
          error:
            "未配置腾讯云 ASR 密钥，请设置环境变量 TENCENT_SECRET_ID 与 TENCENT_SECRET_KEY。",
        };
      }
      if (!bufferBase64) {
        return { ok: false, error: "empty audio" };
      }

      try {
        const tencentcloud = require("tencentcloud-sdk-nodejs");
        const AsrClient = tencentcloud.asr.v20190614.Client;
        const client = new AsrClient({
          credential: { secretId, secretKey },
          region,
          profile: { httpProfile: { endpoint: "asr.tencentcloudapi.com" } },
        });

        const request = {
          ProjectId: 0,
          SubServiceType: 2,
          EngSerViceType: sampleRate === 8000 ? "8k_zh" : "16k_zh",
          SourceType: 1,
          VoiceFormat: voiceFormat,
          UsrAudioKey: `uwork-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          Data: bufferBase64,
          DataLen: Buffer.from(bufferBase64, "base64").length,
        };

        const result = await client.SentenceRecognition(request);
        return {
          ok: true,
          text: result?.Result || "",
          raw: result,
        };
      } catch (err) {
        return { ok: false, error: err.message || String(err) };
      }
    }
  );

  // 初始化自动更新管理器（初始化一些 ipcMain.handle 事件）
  const updateManager = new UpdateManager({ win });
  // updateManager.startUpdateCheck();

  let proxyShutdownDone = false;
  app.on("before-quit", (event) => {
    if (proxyShutdownDone) {
      return;
    }
    event.preventDefault();
    Promise.resolve()
      .then(() => {
        if (typeof server.shutdownSystemProxy === "function") {
          return server.shutdownSystemProxy();
        }
      })
      .catch((err) => {
        console.error("[system-proxy] shutdown error:", err);
      })
      .then(() => {
        if (typeof server.shutdownProxyServer === "function") {
          return server.shutdownProxyServer();
        }
      })
      .catch((err) => {
        console.error("[proxy] shutdown error:", err);
      })
      .finally(() => {
        proxyShutdownDone = true;
        app.quit();
      });
  });
}
