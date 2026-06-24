#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
  echo "用法:"
  echo "  yarn publishAli2 -- \"本次更新描述\""
  echo "  yarn publishAli2 -- 1.11.3 \"本次更新描述\""
  echo ""
  echo "说明:"
  echo "  - 传入版本号时使用指定版本并写入 package.json"
  echo "  - 未传版本号时自动 patch +1"
  exit 1
}

if [ $# -eq 0 ]; then
  usage
fi

VERSION_ARG=""
if [[ "${1:-}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  VERSION_ARG="$1"
  shift
fi

DESCRIPTION="${*:-}"
if [ -z "$DESCRIPTION" ]; then
  usage
fi

if [ -n "$VERSION_ARG" ]; then
  VERSION="$(node -e "
const fs = require('fs');
const semver = require('semver');
const pkgPath = './package.json';
const next = process.argv[1];
if (!semver.valid(next)) {
  console.error('版本号格式错误: ' + next);
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(next);
" "$VERSION_ARG")"
  VERSION_LABEL="指定版本"
else
  VERSION="$(node -e "
const fs = require('fs');
const semver = require('semver');
const pkgPath = './package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const next = semver.inc(pkg.version, 'patch');
if (!next) {
  console.error('无法递增版本号: ' + pkg.version);
  process.exit(1);
}
pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(next);
")"
  VERSION_LABEL="已自动 +1 小版本"
fi

echo "=========================================="
echo "Electron 发布流程"
echo "版本号: ${VERSION} (${VERSION_LABEL})"
echo "更新描述: ${DESCRIPTION}"
echo "=========================================="
echo ""

echo "[1/5] 清理 build 目录..."
yarn rm-build

echo "[2/5] 构建 Apple Silicon 包..."
yarn rebuild-native-arm64 && yarn build-unsigned

echo "[3/5] 构建 Intel 包..."
yarn rebuild-native-x64 && yarn build-x64-unsigned

echo "[4/5] 生成自动更新包..."
node scripts/build-update.js "${VERSION}" "${DESCRIPTION}"

echo "[5/5] 上传更新文件到服务器..."
yarn build-update-upload

echo ""
echo "✅ Electron 发布完成: v${VERSION} — ${DESCRIPTION}"
