const fs = require("fs");
const path = require("path");
const os = require("os");
const { getRootConfigPath } = require("../util.js");

// 判断环境，开发用dataMock.json，生产用data.json
const isDev = process.env.NODE_ENV === "development";
// const DATA_FILE = path.join(__dirname, isDev ? 'dataMock.json' : 'data.json');
// 获取根路径path: UWORK-PLUS-dev（开发环境） 或 UWORK-PLUS（线上环境）
const projectPath = getRootConfigPath();
const DATA_FILE = path.join(
  `${os.homedir()}/${projectPath}/dataSql`,
  "data.json"
);

// 获取数据库文件
function getSqlName(sql = "") {
  let result = "";

  // 区分是不是当作数据库调用，数据库有默认路径，其他没有
  if (sql.indexOf("/") >= 0) {
    result = `${os.homedir()}/${projectPath}/${sql}`;
  } else {
    const sqlName = sql || "data";
    result = path.join(
      `${os.homedir()}/${projectPath}/dataSql`,
      `${sqlName}.json`
    );
  }
  return result;
}

// 读取数据文件
function readDataFile(sql) {
  const dataFile = getSqlName(sql);
  const data = fs.readFileSync(dataFile, "utf-8");
  if (!data) {
    fs.writeFileSync(dataFile, JSON.stringify([]));
  }
  const dataNow = fs.readFileSync(dataFile, "utf-8");
  return JSON.parse(dataNow);
}

// 写入数据文件
function writeDataFile(data, sql) {
  const dataFile = getSqlName(sql);
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// 创建
function create(item, sql) {
  const data = readDataFile(sql);
  item.id = Date.now(); // 简单自增ID
  data.push(item);
  writeDataFile(data, sql);
  return item;
}

// 读取全部
function readAll(sql) {
  return readDataFile(sql);
}

// 读取单个
function readById(id, sql) {
  const data = readDataFile(sql);
  return data.find((item) => item.id === id);
}

// 更新
function update(id, newItem, sql) {
  const data = readDataFile(sql);
  const idx = data.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...newItem, id };
  writeDataFile(data, sql);
  return data[idx];
}

// 删除
function remove(id, sql) {
  let data = readDataFile(sql);
  const idx = data.findIndex((item) => item.id === id);
  if (idx === -1) return false;
  data.splice(idx, 1);
  writeDataFile(data, sql);
  return true;
}

// 覆盖写入全部数据（用于排序等场景）
function writeAll(items, sql) {
  const data = Array.isArray(items) ? items : [];
  writeDataFile(data, sql);
  return data;
}

module.exports = {
  create,
  readAll,
  readById,
  update,
  remove,
  writeAll,
  getSqlName,
};
