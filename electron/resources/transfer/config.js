const os = require("os");
const path = require("path");

// 项目路径，可通过 TRANSFER_SOURCE_PATH 环境变量覆盖
const sourcePath =
  process.env.TRANSFER_SOURCE_PATH ||
  path.join(os.homedir(), "projects", "your-project");

// 已经有如下字符串的文件，不执行替换逻辑
// const extraHas = [`lang="scss`];
// 不存在如下字符串的文件，不执行替换逻辑
// const extraNoHas = [`<style`];

const oldConetntReg = /<style\s/g; // 要替换的旧内容(正则)
const newContent = `<style lang="scss" `; // 要替换掉的新内容

// 项目目录黑名单，数组里面的目录或文件会过滤掉
const blackList = [];

// 目标文件后缀(默认.vue)，可自行追加
const suffix = [`.vue`];

module.exports = {
  sourcePath,
  // extraHas,
  // extraNoHas,
  oldConetntReg,
  newContent,
  blackList,
  suffix,
};
