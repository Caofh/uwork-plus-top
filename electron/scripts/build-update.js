#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const AdmZip = require("adm-zip");
const packageJson = require("../package.json");
const { execSync } = require("child_process");
const { remoteUrl } = require("../remote-config");

/**
 * 构建更新包的脚本
 * 使用方法: node scripts/build-update.js [版本号] [更新描述]
 */

async function buildUpdatePackage() {
  const args = process.argv.slice(2);
  const version = args[0];
  const description = args[1] || "";

  if (!version) {
    console.error(
      "请提供版本号: node scripts/build-update.js [版本号] [更新描述]"
    );
    process.exit(1);
  }

  // 验证版本号格式
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error("版本号格式错误，应为 x.y.z 格式");
    process.exit(1);
  }

  console.log(`开始构建版本 ${version} 的更新包...`);

  try {
    // // 创建临时目录
    // const tempDir = path.join(__dirname, "../temp-update");
    const outputDir = path.join(__dirname, "../build/update-files");

    // await fs.ensureDir(tempDir);
    await fs.ensureDir(outputDir);

    // // 需要更新的文件列表
    // const filesToUpdate = [
    //   "main.js",
    //   "server.js",
    //   "serverSpider.js",
    //   "spider_crawler.js",
    //   "spider_api.js",
    //   "spider_utils.js",
    //   "spider_template.js",
    //   "utils.js",
    //   "index.html",
    //   "loading.html",
    //   "resources/**/*",
    //   "assets/**/*",
    // ];

    // // 复制需要更新的文件
    // for (const filePattern of filesToUpdate) {
    //   const sourcePath = path.join(__dirname, "..", filePattern);
    //   const targetPath = path.join(tempDir, filePattern);

    //   if (await fs.pathExists(sourcePath)) {
    //     if ((await fs.stat(sourcePath)).isDirectory()) {
    //       await fs.copy(sourcePath, targetPath);
    //     } else {
    //       await fs.ensureDir(path.dirname(targetPath));
    //       await fs.copy(sourcePath, targetPath);
    //     }
    //   }
    // }

    // // 创建更新清单
    // const manifest = {
    //   version: version,
    //   description: description,
    //   buildTime: new Date().toISOString(),
    //   platform: process.platform,
    //   arch: process.arch,
    //   files: [],
    // };

    // // 扫描所有文件并添加到清单
    // async function scanFiles(dir, baseDir = "") {
    //   const items = await fs.readdir(dir);

    //   for (const item of items) {
    //     const fullPath = path.join(dir, item);
    //     const relativePath = path.join(baseDir, item);
    //     const stats = await fs.stat(fullPath);

    //     if (stats.isDirectory()) {
    //       await scanFiles(fullPath, relativePath);
    //     } else {
    //       const fileHash = await calculateFileHash(fullPath);
    //       manifest.files.push({
    //         path: relativePath,
    //         size: stats.size,
    //         hash: fileHash,
    //         modified: stats.mtime.toISOString(),
    //       });
    //     }
    //   }
    // }

    // await scanFiles(tempDir);

    // // 保存更新清单
    // await fs.writeJson(path.join(tempDir, "update-manifest.json"), manifest, {
    //   spaces: 2,
    // });

    // 创建ZIP包
    // const zip = new AdmZip();
    // zip.addLocalFolder(tempDir);

    const updateFileName = `uwork-plus-update-${version}-${process.platform}-${process.arch}.dmg`;
    const updatePath = path.join(outputDir, updateFileName);

    // zip.writeZip(updatePath);
    const dmgSourcePath = path.join(__dirname, `../build/UworkPlus-${version}-arm64.dmg`);
    // console.log(dmgSourcePath);
    // console.log(updatePath);
    const hasAppleDmg = fs.existsSync(dmgSourcePath);
    if (hasAppleDmg) {
      execSync(`cp -rf ${dmgSourcePath} ${updatePath}`);
    }
    // 计算更新包大小
    const updateStats = hasAppleDmg ? await fs.stat(updatePath) : 0;

    // inter芯片的dmg包---
    const updateFileNameInter = `uwork-plus-update-${version}-${process.platform}.dmg`;
    const updatePathInter = path.join(outputDir, updateFileNameInter);
    const dmgSourcePathInter = path.join(__dirname, `../build/UworkPlus-${version}.dmg`);
    const hasInterDmg = fs.existsSync(dmgSourcePathInter);
    if (hasInterDmg) {
      execSync(`cp -rf ${dmgSourcePathInter} ${updatePathInter}`);
    }
    const updateStatsInter = hasInterDmg ? await fs.stat(updatePathInter) : 0;
    // inter芯片的dmg包---

    // 创建更新信息文件
    const updateInfo = {
      version: version,
      description: description,
      size: updateStats.size,
      sizeInter: updateStatsInter.size,
      name: updateFileName,
      nameInter: updateFileNameInter,
      downloadUrl: hasAppleDmg ? remoteUrl(`/updates/${updateFileName}`) : '',
      downloadUrlInter: hasInterDmg ? remoteUrl(`/updates/${updateFileNameInter}`) : '',
      platform: process.platform,
      arch: process.arch,
      // buildTime: manifest.buildTime,
      // files: manifest.files.length,
    };

    const updateInfoPath = path.join(outputDir, `update-info-latest.json`);
    await fs.writeJson(updateInfoPath, updateInfo, { spaces: 2 });

    // // 清理临时目录
    // await fs.remove(tempDir);

    // console.log(`✅ 更新包构建完成!`);
    // console.log(`📦 更新包: ${updatePath}`);
    // console.log(`📋 更新信息: ${updateInfoPath}`);
    // console.log(`📊 文件数量: ${manifest.files.length}`);
    // console.log(`💾 包大小: ${(updateStats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error("构建更新包失败:", error);
    process.exit(1);
  }
}

// 简单的文件哈希计算
async function calculateFileHash(filePath) {
  const crypto = require("crypto");
  const content = await fs.readFile(filePath);
  return crypto.createHash("md5").update(content).digest("hex");
}

// 运行构建
buildUpdatePackage();
