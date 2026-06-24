const fs = require("fs");
const fsPromise = require("fs").promises;
const path = require("path");

// 判断 文件名 是否在黑名单里
function blackList(srcPath, configJson) {
  const defaultBlackList = [
    "git",
    "node_modules",
    "dist",
    "yarn.lock",
    "package-lock",
  ];

  const blackList = defaultBlackList.concat(configJson.blackList || []);

  let isBlack = false;
  for (let i = 0; i < blackList.length; i++) {
    if (srcPath.includes(blackList[i])) {
      isBlack = true;
      break;
    }
  }

  return isBlack;
}

/**
 * 过滤文件: 判断 path 中是否包含 filterArr 内的任意字符串
 * @param {*} path 要过滤的文件路径
 * @param {*} filterArr 数组，过滤的文件名字符串
 * @returns
 */
function filterPath(path, filterArr) {
  let isCheck = false;
  for (let i = 0; i < filterArr.length; i++) {
    if (path.includes(filterArr[i])) {
      isCheck = true;
      break;
    }
  }

  return isCheck;
}

// 代码转换核心逻辑（递归）
async function codeTransfer(src, configJson, callback) {
  const entries = await fsPromise.readdir(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);

    // 不在黑名单里的目录文件，继续同步拷贝
    if (!blackList(srcPath, configJson)) {
      // 递归跳过目录
      if (entry.isDirectory()) {
        await codeTransfer(srcPath, configJson, callback);
      } else {
        let reg = /\.vue/g;
        // 过滤出.vue文件
        const suffix = configJson.suffix || [];
        // if (reg.test(srcPath)) {
        if (filterPath(srcPath, suffix)) {
          // console.log(srcPath);
          const msg = await replaceContent(srcPath, configJson);
          callback && callback(msg);
        }
      }
    }
  }
}

// 正则代码转换
function replaceContent(path, configJson) {
  let oldReg = configJson.oldConetntReg; // 要替换的旧内容
  let content = configJson.newContent; // 要替换掉的新内容

  let extraHas = configJson.extraHas;
  let extraNoHas = configJson.extraNoHas;

  return new Promise((resolve, reject) => {
    // 读取文件
    fs.readFile(path, "utf8", (err, data) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      // 判断存在
      if (extraNoHas) {
        const checkHasNoVal = checkHas(data, extraNoHas);
        if (!checkHasNoVal.check) {
          let msg = `当前文件不存在标签"${extraNoHas.join(",")}";  ${path}`;
          cacheInfo.failFilesArr.push(path);
          // console.log(msg);
          resolve(msg);
          return;
        }
      }

      // 判断存在
      if (extraHas) {
        const checkHasVal = checkHas(data, extraHas);
        if (checkHasVal.check) {
          let msg = `当前文件已经存在${checkHasVal.codeString};  ${path}`;
          cacheInfo.failFilesArr.push(path);
          // console.log(msg);
          resolve(msg);
          return;
        }
      }

      // 替换内容
      let newData = data.replace(oldReg, content);
      // 写回文件
      fs.writeFile(path, newData, "utf8", (err) => {
        if (err) {
          console.error(err);
          return;
        }
        let msg = `文件设置成功;  ${path}`;
        cacheInfo.successFilesArr.push(path);
        // console.log(msg);
        resolve(msg);
      });
    });
  });
}
// 判断存在
function checkHas(data, extraHas) {
  let check = false;
  let codeString = "";
  extraHas.map((item) => {
    if (data.indexOf(item) >= 0) {
      check = true;
      codeString = item;
    }
  });
  return {
    check,
    codeString,
  };
}

// 校验文件夹是否存在
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
 *
 * @param {*} cbProgress 进度回掉函数
 * @param {*} cbComplete 完成回掉函数
 * @returns
 */
async function init(configPath, cbProgress, cbComplete) {
  console.log("init执行");

  const resolvedConfigPath = path.resolve(configPath);
  delete require.cache[resolvedConfigPath];
  const configJson = require(resolvedConfigPath);

  // 校验配置文件数据
  const sourcePath = configJson.sourcePath;
  if (!sourcePath) {
    console.log(
      `"sourcePath"文件名路径不存在，请去"config.json"文件中去配置文件`
    );
    return false;
  }

  // 检查文件夹是否存在
  const hasSourcePath = await exiteDir(sourcePath);
  if (!hasSourcePath) {
    console.log(`项目路径不存在，请确保配置的项目路径存在`);
    return false;
  }

  try {
    // 清空暂存数据
    cacheInfo.clearCache();

    // 代码转换核心逻辑
    await codeTransfer(sourcePath, configJson, (msg) => {
      cbProgress(msg);
    });

    const completeMsg = "文件替换完成";
    cbComplete(completeMsg, cacheInfo);
  } catch (err) {
    console.error("发生错误:", err);
  }
}

let cacheInfo = {
  successFilesArr: [],
  failFilesArr: [],

  clearCache() {
    this.successFilesArr = [];
    this.failFilesArr = [];
  },
};

module.exports = {
  init,
  cacheInfo,
};
