const express = require("express");
const cors = require("cors");
const path = require("path");
const net = require("net");
const fs = require("fs");
const os = require("os");

const BaiduSpider = require("./spider_crawler.js");
const apiRoutes = require("./spider_api.js");
const Utils = require("./spider_utils.js");
const template = require("./spider_template.js");

// 判断当前构建环境
let resourcePath = "";
const Env = process.env.NODE_ENV;
if (Env === "development") {
  resourcePath = "./resources";
} else {
  resourcePath = "../resources";
}
const { getRootConfigPath } = require(path.join(
  __dirname,
  `${resourcePath}/util.js`
));
const projectPath = getRootConfigPath(); // 获取根路径path: UWORK-PLUS-dev（开发环境） 或 UWORK-PLUS（线上环境）
const dataDir = `${os.homedir()}/${projectPath}/dataSpider/record`; // 爬虫数据存放路径

const app = express();

// 定时爬取任务
let scheduledTask = null;
let timeLoop = 60 * 60 * 1000; // 1小时
// let timeLoop = 1000;
// let timeLoop = 60 * 1000;

function startScheduledTask(callback) {
  const spider = new BaiduSpider();

  // 每小时爬取一次数据
  scheduledTask = setInterval(async () => {
    try {
      console.log("执行定时爬取任务...");
      await spider.crawlAll();

      callback && callback();
      console.log("定时爬取任务完成");
    } catch (error) {
      console.error("定时爬取任务失败:", error.message);
    }
  }, timeLoop); // 定时爬取时间

  console.log("定时爬取任务已启动，每小时执行一次");
}

const checkPortInUse = (port) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer().listen(port);
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(true); // 端口被占用
      } else {
        reject(err);
      }
    });
    server.on("listening", () => {
      server.close();
      resolve(false); // 端口未被占用
    });
  });
};

async function refreshSpiderData() {
  const spider = new BaiduSpider();
  await spider.crawlAll();
}

async function startExpressAppSpider(callback) {
  const expressPort = 7031;

  // 校验端口是否被占用
  const isPortInUse = await checkPortInUse(expressPort);
  if (isPortInUse) {
    console.log(`端口 ${expressPort} 已被占用。`);
    callback && callback();
    return;
  }

  // 中间件
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 静态文件服务
  app.use("/data", express.static(path.join(__dirname, "data")));

  // API路由
  app.use("/api", apiRoutes);

  // 首页
  app.get("/", (req, res) => {
    res.send(template.home);
  });

  app.use(cors());

  // 启动服务器
  app.listen(expressPort, async () => {
    console.log(`🚀 服务器启动成功！`);
    console.log(`📍 访问地址: http://localhost:${expressPort}`);
    console.log(`📊 API文档: http://localhost:${expressPort}/`);

    // 检查网络连接
    const isOnline = await Utils.checkNetwork();
    if (!isOnline) {
      console.warn("⚠️  网络连接可能有问题，爬虫功能可能受影响");
    }

    // 清理旧数据（保留7天）
    Utils.cleanupOldData(7);

    // 首次爬取数据
    try {
      console.log("执行首次数据爬取...");

      // 判断 latest.json 文件是否存在 且 有内容
      const latestJsonPath = path.join(dataDir, "latest.json");
      const latestJsonContent = fs.readFileSync(latestJsonPath, "utf-8");
      if (
        fs.existsSync(latestJsonPath) &&
        latestJsonContent !== "[]" &&
        latestJsonContent !== ""
      ) {
        console.log("latest.json 文件已存在，跳过首次爬取");
        return;
      }

      const spider = new BaiduSpider();
      await spider.crawlAll();
      console.log("首次数据爬取完成");
    } catch (error) {
      console.error("首次数据爬取失败:", error.message);
    } finally {
      callback && callback();
    }
  });
}

module.exports = {
  startExpressAppSpider,
  startScheduledTask,
  refreshSpiderData
};
