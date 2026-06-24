// node 操作sql

const curd = require("../curd");
const path = require("path");
const os = require("os");
const fs = require("fs");

// 获取根路径path
// const projectPath = `UWORK-PLUS-dev`;
// const sql = "data_copy";
// const DATA_FILE = path.join(
//   `${os.homedir()}/${projectPath}/dataSql`,
//   `${sql}.json`
// );
// const DATA_FILE = path.join(`${os.homedir()}/UWORK-PLUS-dev/dataSql`, "data_copy.json");
const DATA_FILE = path.join(`${os.homedir()}/UWORK-PLUS-dev/dataSql`, "data.json");
// const DATA_FILE = path.join(`${os.homedir()}/UWORK-PLUS/dataSql`, "data.json");

/** 读取所有数据
    const dataAll = readDataFileAll(DATA_FILE);
    console.log(dataAll);
 */
function readDataFileAll(dataFile) {
  const data = fs.readFileSync(dataFile, "utf-8");
  return JSON.parse(data);
}

/** 新建字段
    const result = creaetAllSqlData(DATA_FILE, "alwaysUseNum", 1);
    console.log(result);
*/
function creaetAllSqlData(dataFile, key, value) {
  const dataAll = readDataFileAll(dataFile);
  dataAll.forEach((item) => {
    if (item[key] === undefined) {
      item[key] = value;
    }
  });
  fs.writeFileSync(dataFile, JSON.stringify(dataAll, null, 2));
  return dataAll;
}

/** 设置所有数据
    const result = setAllSqlData(DATA_FILE, "alwaysUseNum", 1);
    console.log(result);
*/
function setAllSqlData(dataFile, key, value) {
  const dataAll = readDataFileAll(dataFile);
  dataAll.forEach((item) => {
    if (item[key] !== undefined) {
      item[key] = value;
    }
  });
  fs.writeFileSync(dataFile, JSON.stringify(dataAll, null, 2));
  return dataAll;
}

/** 删除所有数据
    const result = removeAllSqlData(DATA_FILE, "alwaysUseNum");
    console.log(result);
*/
function removeAllSqlData(dataFile, key) {
  const dataAll = readDataFileAll(dataFile);
  dataAll.forEach((item) => {
    if (item[key] !== undefined) {
      delete item[key];
    }
  });
  fs.writeFileSync(dataFile, JSON.stringify(dataAll, null, 2));
  return dataAll;
}

// const result = setAllSqlData(DATA_FILE, "alwaysUseNum", 0);
// console.log(result);
const result = removeAllSqlData(DATA_FILE, "executeLoading");
// console.log(result);
