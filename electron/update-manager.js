const { app, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const AdmZip = require("adm-zip");
const axios = require("axios");
const semver = require("semver");
const packageJson = require("./package.json");
const { getUpdatesInfoUrl } = require("./remote-config");

class UpdateManager {
  constructor({ win }) {
    this.currentVersion = packageJson.version;
    // this.updateServerUrl = 'https://your-update-server.com'; // 替换为你的更新服务器地址
    this.updateServerUrl = "http://localhost:3000"; // 替换为你的更新服务器地址
    this.updateCheckInterval = 1000 * 60 * 60 * 24; // 24小时检查一次
    // this.updateCheckInterval = 60000; // 24小时检查一次
    this.isUpdating = false;
    this.win = win;

    // 存储下载任务的Map，key为下载ID，value为下载信息
    this.downloadTasks = new Map();
    this.downloadCounter = 0; // 下载任务计数器

    this.init();
  }

  init() {
    // 注册IPC事件
    this.registerIpcEvents();

    // 启动定时检查更新
    this.startUpdateCheck();

    // 应用启动时检查更新
    this.checkForUpdates();
  }

  registerIpcEvents() {
    // 手动检查更新
    ipcMain.handle("check-for-updates", async () => {
      return await this.checkForUpdates();
    });

    // 开始下载更新
    ipcMain.handle("download-update", async () => {
      return await this.downloadUpdate();
    });

    // 开始下载更新（支持进度回调）
    // ipcMain.handle(
    //   "download-update-with-progress",
    //   async (onProgressCallback) => {
    //     return await this.downloadUpdateWithProgress(onProgressCallback);
    //   }
    // );

    // 下载远程文件（支持进度回调）
    // ipcMain.handle("download-remote-file", async ({ url, targetPath, onProgressCallback }) => {
    //   return await this.downloadRemoteFile(url, targetPath, onProgressCallback);
    //   // return await this.checkForUpdates();
    // });

    ipcMain.handle("download-remote-file", async (event, options) => {
      const { funcName, json } = options;
      const { url, targetPath } = json;

      try {
        const resultAxios = await this.downloadRemoteFile(
          url,
          targetPath,
          (resProgress) => {
            if (this.win && !this.win.isDestroyed()) {
              this.win.webContents.executeJavaScript(
                `window['${funcName}'] && window['${funcName}'](${JSON.stringify(
                  resProgress
                )})`
              );
            }
          }
        );

        // 返回结果，包含中断方法
        return resultAxios;
      } catch (error) {
        console.error("下载失败:", error.message);
        throw error;
      }
    });

    // 中断下载
    ipcMain.handle("abort-download", async (event, options) => {
      const { json } = options;
      const { downloadId } = json;
      console.log("中断下载:", downloadId);
      return await this.abortDownloadById(downloadId);
    });

    // 获取下载任务列表
    ipcMain.handle("get-download-tasks", async () => {
      return this.getDownloadTasksList();
    });

    // 清理下载任务
    ipcMain.handle("cleanup-download-task", async (event, options) => {
      const { downloadId } = options;
      return await this.cleanupDownloadTask(downloadId);
    });

    // 安装更新
    ipcMain.handle("install-update", async () => {
      return await this.installUpdateV1();
    });

    // 获取更新状态
    ipcMain.handle("get-update-status", () => {
      return {
        currentVersion: this.currentVersion,
        isUpdating: this.isUpdating,
        lastCheckTime: this.lastCheckTime,
      };
    });
  }

  async checkForUpdates() {
    try {
      console.log("检查更新...");
      // 获取更新信息
      const updatesUrl = getUpdatesInfoUrl();
      if (!updatesUrl) {
        console.warn("未配置更新地址（UWORK_UPDATES_INFO_URL 或 UWORK_REMOTE_ORIGIN）");
        return { hasUpdate: false };
      }
      const response = await axios.get(
        `${updatesUrl}?t=${new Date().getTime()}`,
        {
          params: {
            platform: process.platform,
            arch: process.arch,
            version: this.currentVersion,
          },
          timeout: 10000,
        }
      );

      const updateInfo = response.data;
      if (updateInfo && semver.gt(updateInfo.version, this.currentVersion)) {
        console.log(`发现新版本: ${updateInfo.version}`);

        // 发送更新通知到渲染进程
        this.sendUpdateNotification(updateInfo);

        return {
          ...updateInfo,
          hasUpdate: true,
        };
      } else {
        console.log("当前已是最新版本");
        return { hasUpdate: false };
      }
    } catch (error) {
      console.error("检查更新失败:", error.message);
      return { hasUpdate: false, error: error.message };
    } finally {
      this.lastCheckTime = new Date();
    }
  }

  async downloadUpdate() {
    if (this.isUpdating) {
      throw new Error("更新已在进行中");
    }

    try {
      this.isUpdating = true;

      // 获取更新信息
      const updateInfo = await this.checkForUpdates();
      if (!updateInfo.hasUpdate) {
        throw new Error("没有可用的更新");
      }

      console.log(updateInfo.downloadUrl);

      // 创建临时目录
      // const tempDir = path.join(app.getPath("temp"), "uwork-plus-update");
      // await fs.ensureDir(tempDir);

      // // 下载更新包
      // const updatePath = path.join(tempDir, "update.zip");
      // console.log("开始下载更新包...");
      // console.log(updateInfo.downloadUrl);

      // const response = await axios({
      //   method: "GET",
      //   url: updateInfo.downloadUrl,
      //   responseType: "stream",
      //   timeout: 300000, // 5分钟超时
      // });

      // const writer = fs.createWriteStream(updatePath);
      // response.data.pipe(writer);

      // await new Promise((resolve, reject) => {
      //   writer.on("finish", resolve);
      //   writer.on("error", reject);
      // });

      // console.log("更新包下载完成");

      // // 验证文件完整性
      // const stats = await fs.stat(updatePath);
      // if (stats.size !== updateInfo.size) {
      //   throw new Error("更新包大小不匹配");
      // }

      return {
        success: true,
        updatePath,
        version: updateInfo.version,
      };
    } catch (error) {
      console.error("下载更新失败:", error);
      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  async installUpdateV1() {
    try {
      const updateResult = await this.downloadUpdate();
      if (!updateResult.success) {
        throw new Error("下载更新失败");
      }

      console.log(updateResult.updatePath);
      console.log(updateResult.version);

      return { success: true, version: updateResult.version };
    } catch (error) {
      console.error("安装更新失败:", error);
      throw error;
    }
  }

  // 下载远程文件，支持实时进度回调
  async downloadRemoteFile(url, targetPath, onProgress = null) {
    // 创建 AbortController 用于中断请求
    const abortController = new AbortController();

    // 生成下载任务ID
    const downloadId = `download_${++this.downloadCounter}_${Date.now()}`;

    try {
      console.log(`开始下载文件: ${url}`);
      console.log(`目标路径: ${targetPath}`);
      console.log(`下载任务ID: ${downloadId}`);

      // 确保目标目录存在
      const targetDir = path.dirname(targetPath);
      await fs.ensureDir(targetDir);

      // 创建写入流
      const writer = fs.createWriteStream(targetPath);

      // 发起HTTP请求
      const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream",
        timeout: 300000, // 5分钟超时
        signal: abortController.signal, // 添加中断信号
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress({
              downloadId,
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percent: percent,
              speed: progressEvent.rate || 0,
            });
          }
        },
      });

      // 获取文件总大小
      const totalSize = parseInt(response.headers["content-length"] || "0");
      let downloadedSize = 0;
      let lastProgressTime = Date.now();
      let lastDownloadedSize = 0;

      // 处理下载流
      response.data.on("data", (chunk) => {
        downloadedSize += chunk.length;

        // 计算下载速度
        const now = Date.now();
        const timeDiff = (now - lastProgressTime) / 1000; // 转换为秒
        if (timeDiff >= 0.5) {
          // 每0.5秒更新一次进度
          const speed = (downloadedSize - lastDownloadedSize) / timeDiff; // bytes/s

          if (onProgress) {
            onProgress({
              downloadId,
              loaded: downloadedSize,
              total: totalSize,
              percent:
                totalSize > 0
                  ? Math.round((downloadedSize * 100) / totalSize)
                  : 0,
              speed: speed,
              remainingTime:
                totalSize > 0
                  ? Math.round((totalSize - downloadedSize) / speed)
                  : 0,
            });
          }

          lastProgressTime = now;
          lastDownloadedSize = downloadedSize;
        }
      });

      // 处理流结束
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        // 创建下载任务记录并存储到内存中
        const downloadTask = {
          id: downloadId,
          url: url,
          targetPath: targetPath,
          status: "downloading", // downloading, completed, aborted, failed
          startedAt: new Date(),
          abortController: abortController,
          writer: writer,
          response: null,
        };

        // 存储到内存中
        this.downloadTasks.set(downloadId, downloadTask);
        console.log(`下载任务已创建: ${downloadId}`);

        // 监听中断信号
        abortController.signal.addEventListener("abort", () => {
          console.log(`下载任务 ${downloadId} 被中断`);
          writer.end(); // 关闭写入流

          // 从内存中移除下载任务
          this.cleanupDownloadTask(downloadId);

          reject(new Error("下载被用户中断"));
        });

        writer.on("finish", () => {
          console.log(`文件下载完成: ${targetPath}`);
          if (onProgress) {
            onProgress({
              downloadId,
              loaded: totalSize,
              total: totalSize,
              percent: 100,
              speed: 0,
              remainingTime: 0,
            });
          }

          // 下载完成后，将任务标记为完成
          if (this.downloadTasks.has(downloadId)) {
            this.downloadTasks.get(downloadId).status = "completed";
            this.downloadTasks.get(downloadId).completedAt = new Date();
          }

          resolve({
            success: true,
            path: targetPath,
            size: totalSize,
            downloadId: downloadId, // 返回下载任务ID
            abort: () => abortController.abort(), // 返回中断方法
          });
        });

        writer.on("error", (error) => {
          console.error(`文件写入失败: ${error.message}`);
          reject(new Error(`文件写入失败: ${error.message}`));
        });

        response.data.on("error", (error) => {
          console.error(`下载流错误: ${error.message}`);
          // reject(new Error(`下载流错误: ${error.message}`));

          if (onProgress) {
            onProgress({
              status: "failed",
              statusMessage: "下载流错误",
              downloadId,
              loaded: totalSize,
              total: totalSize,
              percent: 100,
              speed: 0,
              remainingTime: 0,
            });
          }
        });
      });
    } catch (error) {
      console.error(`下载文件失败: ${error.message}`);
      throw new Error(`下载文件失败: ${error.message}`);
    }
  }

  // 下载更新包，支持进度回调
  async downloadUpdateWithProgress(onProgress = null) {
    if (this.isUpdating) {
      throw new Error("更新已在进行中");
    }

    try {
      this.isUpdating = true;

      // 获取更新信息
      const updateInfo = await this.checkForUpdates();
      if (!updateInfo.hasUpdate) {
        throw new Error("没有可用的更新");
      }

      console.log("开始下载更新包...");
      console.log("下载地址:", updateInfo.downloadUrl);
      console.log("文件大小:", updateInfo.size);

      // 创建临时目录
      const tempDir = path.join(app.getPath("temp"), "uwork-plus-update");
      await fs.ensureDir(tempDir);

      // 下载更新包
      const updatePath = path.join(tempDir, "update.zip");

      const downloadResult = await this.downloadRemoteFile(
        updateInfo.downloadUrl,
        updatePath,
        onProgress
      );

      console.log("更新包下载完成");

      // 验证文件完整性
      if (updateInfo.size && downloadResult.size !== updateInfo.size) {
        throw new Error(
          `更新包大小不匹配: 期望 ${updateInfo.size}，实际 ${downloadResult.size}`
        );
      }

      return {
        success: true,
        updatePath: downloadResult.path,
        version: updateInfo.version,
        size: downloadResult.size,
      };
    } catch (error) {
      console.error("下载更新失败:", error);
      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  async installUpdate() {
    try {
      const updateResult = await this.downloadUpdate();
      if (!updateResult.success) {
        throw new Error("下载更新失败");
      }

      console.log("开始安装更新...");

      // 解压更新包
      const tempDir = path.dirname(updateResult.updatePath);
      const extractDir = path.join(tempDir, "extracted");
      await fs.ensureDir(extractDir);

      const zip = new AdmZip(updateResult.updatePath);
      zip.extractAllTo(extractDir, true);

      // 读取更新清单
      const manifestPath = path.join(extractDir, "update-manifest.json");
      if (!(await fs.pathExists(manifestPath))) {
        throw new Error("更新包格式错误：缺少更新清单");
      }

      const manifest = await fs.readJson(manifestPath);

      // 备份当前应用
      const backupDir = path.join(
        app.getPath("userData"),
        "backup",
        Date.now().toString()
      );
      await fs.ensureDir(backupDir);

      // 执行文件更新
      for (const fileInfo of manifest.files) {
        const sourcePath = path.join(extractDir, fileInfo.path);
        let targetPath = path.join(app.getAppPath(), fileInfo.path);

        console.log("targetPath");
        console.log(targetPath);

        // 检查文件是否可以安全更新
        if (!this.canSafelyUpdateFile(fileInfo.path, process.platform)) {
          console.log(`跳过受保护的文件: ${fileInfo.path}`);
          continue;
        }

        // 获取安全的更新目标路径
        const safeTargetPath = this.getSafeUpdatePath(
          fileInfo.path,
          process.platform
        );
        if (safeTargetPath !== fileInfo.path) {
          targetPath = path.join(
            app.getPath("userData"),
            "updates",
            path.basename(fileInfo.path)
          );
          console.log(
            `将文件更新到安全位置: ${fileInfo.path} -> ${targetPath}`
          );
        }

        try {
          // 确保目标目录存在
          const targetDir = path.dirname(targetPath);
          console.log("await fs.pathExists(targetDir)");
          console.log(await fs.pathExists(targetDir));

          if (!(await fs.pathExists(targetDir))) {
            await fs.ensureDir(targetDir);
          }

          // 如果目标文件已存在，先备份
          if (await fs.pathExists(targetPath)) {
            const backupPath = path.join(
              backupDir,
              path.basename(fileInfo.path)
            );
            await fs.ensureDir(path.dirname(backupPath));
            await fs.copy(targetPath, backupPath);
            console.log(`已备份原文件: ${backupPath}`);
          }

          // 复制新文件
          console.log("复制文件前");
          await fs.copy(sourcePath, targetPath);
          console.log(`文件更新成功: ${fileInfo.path} -> ${targetPath}`);
        } catch (fileError) {
          console.error(`更新文件失败: ${fileInfo.path}`, fileError);

          // 如果是目录已存在的错误，尝试直接复制文件
          if (fileError.code === "EEXIST" && fileError.syscall === "mkdir") {
            try {
              await fs.copy(sourcePath, targetPath);
              console.log(`文件更新成功(重试): ${fileInfo.path}`);
            } catch (retryError) {
              console.error(`重试更新文件失败: ${fileInfo.path}`, retryError);
              throw new Error(
                `无法更新文件 ${fileInfo.path}: ${retryError.message}`
              );
            }
          } else {
            throw new Error(
              `无法更新文件 ${fileInfo.path}: ${fileError.message}`
            );
          }
        }
      }

      // 清理临时文件
      await fs.remove(tempDir);

      console.log("更新安装完成");

      // 提示用户重启应用
      const result = await dialog.showMessageBox({
        type: "info",
        title: "更新完成",
        message: "更新已安装完成，需要重启应用以应用更新。",
        detail: `新版本: ${updateResult.version}`,
        buttons: ["立即重启", "稍后重启"],
        defaultId: 0,
      });

      if (result.response === 0) {
        app.relaunch();
        app.exit(0);
      }

      return { success: true, version: updateResult.version };
    } catch (error) {
      console.error("安装更新失败:", error);
      throw error;
    }
  }

  sendUpdateNotification(updateInfo) {
    // 这里可以通过IPC发送通知到渲染进程
    // 或者显示系统通知
    if (process.platform === "darwin") {
      // macOS系统通知
      const { Notification } = require("electron");
      new Notification({
        title: "UworkPlus 更新可用",
        body: `新版本 ${updateInfo.version} 已可用，点击查看详情`,
        silent: false,
      }).show();
    }
  }

  startUpdateCheck() {
    // setTimeout(() => {
    //   this.checkForUpdates();
    // }, 10000);

    setInterval(() => {
      this.checkForUpdates();
    }, this.updateCheckInterval);
  }

  // 获取更新日志
  async getUpdateLog() {
    try {
      const response = await axios.get(
        `${this.updateServerUrl}/api/updates/log`
      );
      return response.data;
    } catch (error) {
      console.error("获取更新日志失败:", error);
      return [];
    }
  }

  // 检查文件是否可以安全更新
  canSafelyUpdateFile(filePath, platform) {
    if (platform === "darwin") {
      // 在macOS上，以下文件/目录不应该在运行时更新
      const protectedPaths = [
        "app.asar",
        "Contents/Resources/app.asar",
        "Contents/MacOS",
        "Contents/Info.plist",
      ];

      return !protectedPaths.some((protectedPath) =>
        filePath.includes(protectedPath)
      );
    }

    if (platform === "win32") {
      // 在Windows上，以下文件/目录不应该在运行时更新
      const protectedPaths = ["UworkPlus.exe", "resources/app.asar"];

      return !protectedPaths.some((protectedPath) =>
        filePath.includes(protectedPath)
      );
    }

    return true;
  }

  // 获取安全的更新目标路径
  getSafeUpdatePath(filePath, platform) {
    if (platform === "darwin") {
      // 在macOS上，将更新文件放到用户数据目录，而不是应用目录
      if (
        filePath.includes("app.asar") ||
        filePath.includes("Contents/Resources")
      ) {
        return path.join(
          app.getPath("userData"),
          "updates",
          path.basename(filePath)
        );
      }
    }

    return filePath;
  }

  // 通过ID中断下载
  async abortDownloadById(downloadId) {
    try {
      if (!this.downloadTasks.has(downloadId)) {
        return { success: false, message: `下载任务 ${downloadId} 不存在` };
      }

      const downloadTask = this.downloadTasks.get(downloadId);
      console.log(`中断下载任务: ${downloadId}`);

      if (downloadTask.status === "downloading") {
        // 中断下载
        downloadTask.abortController.abort();
        downloadTask.status = "aborted";
        downloadTask.abortedAt = new Date();

        return { success: true, message: `下载任务 ${downloadId} 已中断` };
      } else {
        return {
          success: false,
          message: `下载任务 ${downloadId} 状态为 ${downloadTask.status}，无法中断`,
        };
      }
    } catch (error) {
      console.error(`中断下载任务失败: ${downloadId}`, error);
      return { success: false, message: `中断下载失败: ${error.message}` };
    }
  }

  // 获取下载任务列表
  getDownloadTasksList() {
    const tasks = [];
    for (const [id, task] of this.downloadTasks) {
      tasks.push({
        id: task.id,
        url: task.url,
        targetPath: task.targetPath,
        status: task.status,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        abortedAt: task.abortedAt,
      });
    }
    return tasks;
  }

  // 清理下载任务
  async cleanupDownloadTask(downloadId) {
    try {
      if (!this.downloadTasks.has(downloadId)) {
        return { success: false, message: `下载任务 ${downloadId} 不存在` };
      }

      const downloadTask = this.downloadTasks.get(downloadId);
      console.log(`清理下载任务: ${downloadId}`);

      // 关闭写入流
      if (downloadTask.writer && !downloadTask.writer.destroyed) {
        downloadTask.writer.end();
      }

      // 从内存中移除任务
      this.downloadTasks.delete(downloadId);

      return { success: true, message: `下载任务 ${downloadId} 已清理` };
    } catch (error) {
      console.error(`清理下载任务失败: ${downloadId}`, error);
      return { success: false, message: `清理下载失败: ${error.message}` };
    }
  }

  // 获取下载任务状态
  getDownloadTaskStatus(downloadId) {
    if (!this.downloadTasks.has(downloadId)) {
      return null;
    }

    const task = this.downloadTasks.get(downloadId);
    return {
      id: task.id,
      status: task.status,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      abortedAt: task.abortedAt,
    };
  }
}

module.exports = UpdateManager;
