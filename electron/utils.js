const child_process = require("child_process");
const fs = require("fs");
const os = require("os");

// 执行一行cmd命令
function cmd(text) {
  const encoding = "cp936";
  const binaryEncoding = "binary";

  return new Promise(async (resolve, reject) => {
    // 判断是否使用了nvm，将环境变量追加到指令之前
    const NVM_DIR = `${os.homedir()}/.nvm`;
    if (await exiteDir(NVM_DIR)) {
      text = `[ -s "${NVM_DIR}/nvm.sh" ] &&. "${NVM_DIR}/nvm.sh" && ` + text;
    }

    // 获取完整的环境变量
    const env = await getFullEnvironment();

    child_process.exec(
      text,
      {
        encoding: binaryEncoding,
        env: env, // 使用完整的环境变量
      },
      (err = "", stdout = "", stderr) => {
        if (err) {
          resolve({
            res: err,
            type: "error",
          });
          return;
        }
        resolve({
          res: stdout,
          type: "success",
        });
      }
    );
  });
}

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

module.exports = {
  cmd,
};
