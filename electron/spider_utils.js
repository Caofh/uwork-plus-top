const fs = require("fs").promises;
const path = require("path");
const os = require("os");

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
// 获取根路径path: UWORK-PLUS-dev（开发环境） 或 UWORK-PLUS（线上环境）
const projectPath = getRootConfigPath();
// 爬虫数据存放路径
const dataDir = `${os.homedir()}/${projectPath}/dataSpider/record`;

/**
 * 工具函数集合
 */
class Utils {
  /**
   * 格式化时间
   */
  static formatTime(date) {
    const now = new Date(date);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 获取相对时间
   */
  static getRelativeTime(date) {
    const now = new Date();
    const target = new Date(date);
    const diff = now - target;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;

    return this.formatTime(date);
  }

  /**
   * 清理旧数据文件
   */
  static async cleanupOldData(keepDays = 7) {
    try {
      // const dataDir = path.join(dataDir, "../data");
      const files = await fs.readdir(dataDir);

      const now = new Date();
      const cutoffDate = new Date(
        now.getTime() - keepDays * 24 * 60 * 60 * 1000
      );

      for (const file of files) {
        if (file.startsWith("baidu_hot_") && file.endsWith(".json")) {
          const filePath = path.join(dataDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            console.log(`已删除旧数据文件: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error("清理旧数据失败:", error.message);
    }
  }

  /**
   * 获取数据统计信息
   */
  static async getDataStats() {
    try {
      // const dataDir = path.join(dataDir, "../data");
      const files = await fs.readdir(dataDir);

      const dataFiles = files.filter(
        (file) => file.startsWith("baidu_hot_") && file.endsWith(".json")
      );

      let totalSize = 0;
      for (const file of dataFiles) {
        const filePath = path.join(dataDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return {
        totalFiles: dataFiles.length,
        totalSize: totalSize,
        averageSize:
          dataFiles.length > 0 ? Math.round(totalSize / dataFiles.length) : 0,
        oldestFile: dataFiles.length > 0 ? dataFiles[0] : null,
        newestFile:
          dataFiles.length > 0 ? dataFiles[dataFiles.length - 1] : null,
      };
    } catch (error) {
      console.error("获取数据统计失败:", error.message);
      return null;
    }
  }

  /**
   * 验证URL格式
   */
  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * 清理文本内容
   */
  static cleanText(text) {
    if (!text) return "";

    return text
      .replace(/\s+/g, " ") // 合并多个空格
      .replace(/\n+/g, " ") // 替换换行为空格
      .trim();
  }

  /**
   * 生成唯一ID
   */
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 延迟函数
   */
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 重试函数
   */
  static async retry(fn, maxRetries = 3, delayMs = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        console.log(`重试第 ${i + 1} 次...`);
        await this.delay(delayMs * (i + 1));
      }
    }
  }

  /**
   * 检查网络连接
   */
  static async checkNetwork() {
    try {
      const https = require("https");
      return new Promise((resolve) => {
        const req = https.get("https://www.baidu.com", (res) => {
          resolve(res.statusCode === 200);
        });

        req.on("error", () => {
          resolve(false);
        });

        req.setTimeout(5000, () => {
          req.destroy();
          resolve(false);
        });
      });
    } catch (error) {
      return false;
    }
  }
}

module.exports = Utils;
