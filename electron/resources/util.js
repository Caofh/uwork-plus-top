const child_process = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
// const ip = require("ip");

const { dialog, Notification } = require("electron");

// 校验文件夹/文件是否存在
function exiteDir(dirPath) {
  return new Promise((resolve, reject) => {
    // 检查文件夹是否存在
    fs.access(dirPath, fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

// 读取文件数据
function readFile(filePath) {
  return new Promise(async (resolve, reject) => {
    if (!(await exiteDir(filePath))) {
      reject(`${filePath}文件不存在`);
      return;
    }

    // 读取文件内容
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("读取文件时出错:", err);
        return;
      }

      let result = "";
      try {
        // 将 JSON 字符串解析为对象
        const jsonData = JSON.parse(data);
        result = jsonData;
      } catch (err) {
        result = data;
      }

      resolve(result);
    });
  });
}

/**
 * 同步读取文件方法
 * @param {*} filePath 文件路径
 * @returns
 */
function readFileSync(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return data;
  } catch (err) {
    return "";
  }
}

function writeFileSync(filePath, newData) {
  return new Promise((resolve) => {
    // 写回文件
    fs.writeFile(filePath, newData, "utf8", (err) => {
      if (err) {
        console.error(err);
        return;
      }
      resolve({ filePath, newData });
    });
  });
}

function showDialog(win, options, callback) {
  dialog.showMessageBox(win, options).then((response) => {
    console.log("提示弹窗响应", response);
    callback && callback(response);
  });
}

/**
 * Apple:苹果芯片； Inter:英特尔芯片
 */
function chipInfo() {
  const { execSync } = require("child_process");

  function getMacChipType() {
    try {
      const output = execSync("sysctl -n machdep.cpu.brand_string")
        .toString()
        .trim();
      if (output.includes("Apple")) {
        return "Apple";
      } else {
        return "Intel";
      }
    } catch (error) {
      console.error("无法获取芯片信息");
      return null;
    }
  }

  // console.log(getMacChipType());
  return getMacChipType();
}

/**
 * 查看当前客户端运行平台
 * @returns mac: 苹果系统； windows: windows系统； other: 其他系统
 */
function getPlatform() {
  const currentPlatform = process.platform;
  if (currentPlatform === "darwin") {
    // console.log("当前是 macOS 系统");
    return "mac";
  } else if (currentPlatform.indexOf("win") >= 0) {
    // console.log("当前是 windows 系统");
    return "windows";
  } else {
    return "other";
  }
}

/**
 * example: 
    showNotification({
      title: '花擦',
      body: '则不改'
    }).then((data) => {
      console.log('点击')
    })
 * mac弹出提示消息
 * @param {*} title 标题
 * @param {*} body 内容
 * @returns
 */
function showNotification(options = {}) {
  return new Promise((resolve, reject) => {
    const { title = "", body = "" } = options;
    if (!title) {
      reject(`title参数必填项`);
      return;
    }

    const notification = new Notification({
      title: title,
      body: body,
    });

    notification.on("click", () => {
      resolve(options);
    });

    notification.show();
  });
}

/**
 * 获取当前网络ip
 * @returns string ip地址
 */
function getIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const key in interfaces) {
    for (const item of interfaces[key]) {
      if (!item.internal && item.family === "IPv4") {
        return item.address;
      }
    }
  }
  // return ip.address();
}

/**
 * 动态检测系统中安装的开发工具路径
 * @returns {Array} 路径数组
 */
function detectDevelopmentTools() {
  const paths = [];
  const homeDir = os.homedir();

  // 检测常见的开发工具安装路径
  const toolPaths = [
    // Cursor 编辑器
    "/Applications/Cursor.app/Contents/MacOS",
    "/Applications/Cursor.app/Contents/Resources/app/bin",

    // VS Code
    "/Applications/Visual Studio Code.app/Contents/Resources/app/bin",

    // Homebrew (Intel)
    "/usr/local/bin",
    "/usr/local/sbin",

    // Homebrew (Apple Silicon)
    "/opt/homebrew/bin",
    "/opt/homebrew/sbin",

    // Node.js 相关
    "/usr/local/node/bin",
    `${homeDir}/.nvm/versions/node/current/bin`,
    `${homeDir}/.nvm/current/bin`,

    // Python 相关
    `${homeDir}/.pyenv/bin`,
    `${homeDir}/.pyenv/shims`,

    // Ruby 相关
    `${homeDir}/.rvm/bin`,
    `${homeDir}/.rbenv/bin`,

    // Go 相关
    "/usr/local/go/bin",
    `${homeDir}/go/bin`,

    // Rust 相关
    `${homeDir}/.cargo/bin`,

    // 用户自定义路径
    `${homeDir}/.local/bin`,
    `${homeDir}/bin`,

    // 其他常见开发工具
    "/usr/local/opt/coreutils/libexec/gnubin",
    "/usr/local/opt/findutils/libexec/gnubin",
    "/usr/local/opt/gnu-sed/libexec/gnubin",
    "/usr/local/opt/gnu-tar/libexec/gnubin",
    "/usr/local/opt/grep/libexec/gnubin",
  ];

  // 检查路径是否存在并添加到列表中
  toolPaths.forEach((toolPath) => {
    try {
      if (fs.existsSync(toolPath)) {
        paths.push(toolPath);
      }
    } catch (error) {
      // 忽略错误，继续检查下一个路径
    }
  });

  return paths;
}

/**
 * 获取完整的环境变量配置（增强版）
 * @returns {Object} 环境变量对象
 */
async function getFullEnvironment() {
  // 动态 import shell-env，兼容 default 导出和直接导出
  const imported = await import("shell-env");
  const shellEnv = imported.shellEnvSync || imported;
  const env = await shellEnv();
  env.NODE_ENV = process.env.NODE_ENV || "production";
  // ... 其他自定义
  return env;
}

let cachedExecEnv = null;

function mergePathSegments(...segments) {
  const pathSet = new Set();

  segments.forEach((segment) => {
    if (!segment) return;
    String(segment)
      .split(path.delimiter)
      .forEach((item) => {
        const trimmed = item.trim();
        if (trimmed) {
          pathSet.add(trimmed);
        }
      });
  });

  return Array.from(pathSet).join(path.delimiter);
}

/** 从登录 shell 同步读取环境变量（macOS / Linux） */
function loadShellEnvSync() {
  if (process.platform === "win32") {
    return null;
  }

  try {
    const shell = process.env.SHELL || "/bin/bash";
    const output = child_process.execFileSync(shell, ["-ilc", "env"], {
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "ignore"],
    });

    const env = {};
    output.split("\n").forEach((line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex <= 0) return;
      env[line.slice(0, separatorIndex)] = line.slice(separatorIndex + 1);
    });

    return env;
  } catch (error) {
    console.warn("[env] load shell env failed:", error.message);
    return null;
  }
}

function getStaticFullEnv() {
  if (cachedExecEnv) {
    return cachedExecEnv;
  }

  const shellEnv = loadShellEnvSync();
  const devToolPaths = detectDevelopmentTools();
  const baseEnv = shellEnv || process.env;
  const mergedPath = mergePathSegments(
    baseEnv.PATH,
    process.env.PATH,
    devToolPaths.join(path.delimiter)
  );

  cachedExecEnv = {
    ...process.env,
    ...baseEnv,
    PATH: mergedPath,
    NODE_ENV: process.env.NODE_ENV || "production",
  };

  return cachedExecEnv;
}

// 获取当前配置文件根路径
function getRootConfigPath() {
  let rootConfigPath = "";

  // 判断环境，开发用dataMock.json，生产用data.json
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    rootConfigPath = "UWORK-PLUS-dev";
  } else {
    rootConfigPath = "UWORK-PLUS";
  }
  return rootConfigPath;
}

/** 为 shell 单参数加双引号 */
function quoteShellArg(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

const PATH_ARG_COMMANDS = [
  "open",
  "cd",
  "code",
  "cursor",
  "ls",
  "cat",
  "touch",
  "mkdir",
  "rm",
  "cp",
  "mv",
];

/** 为未加引号且含空格的路径参数自动补引号 */
function quoteUnquotedPathsInLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return line;
  }

  let result = line;
  for (const cmd of PATH_ARG_COMMANDS) {
    const pattern = new RegExp(
      `\\b${cmd}\\s+((?:\\/|~)[^\\s"'\\\`|;&]+(?:\\s[^\\s"'\\\`|;&]+)+)(?=\\s*(?:$|&&|\\|\\||;|\\||&))`,
      "g"
    );
    result = result.replace(pattern, (match, pathPart) => {
      const normalizedPath = pathPart.trim();
      return `${cmd} ${quoteShellArg(normalizedPath)}`;
    });
  }

  // open -a App Name
  result = result.replace(
    /\bopen\s+-a\s+([^"'`\s][^&;|`\n"']*?)(?=\s*(?:$|&&|\|\||;|\||&|\s+-))/g,
    (match, appName) => {
      const normalizedName = appName.trim();
      if (!normalizedName.includes(" ")) {
        return match;
      }
      return `open -a ${quoteShellArg(normalizedName)}`;
    }
  );

  return result;
}

/** 执行前规范化 sh 脚本，避免路径含空格时被 shell 拆分 */
function normalizeShellScriptForExecution(script) {
  return String(script || "")
    .split("\n")
    .map(quoteUnquotedPathsInLine)
    .join("\n");
}

module.exports = {
  exiteDir,
  readFile,
  readFileSync,
  writeFileSync,
  showDialog,
  chipInfo,
  getPlatform,
  showNotification,
  getIPAddress,
  detectDevelopmentTools, // 新增导出
  getFullEnvironment, // 新增导出
  getStaticFullEnv,
  getRootConfigPath,
  quoteShellArg,
  normalizeShellScriptForExecution,
};
