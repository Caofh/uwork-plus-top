#!/usr/bin/env node

const { spawnSync } = require('child_process')
const path = require('path')
const { readDeployConfig, CONFIG_PATH, CONFIG_KEY } = require('./read-deploy-config')

function usage() {
  console.error('用法: node scripts/scp-deploy.js <local-path> <remote-path>')
  console.error('示例: node scripts/scp-deploy.js dist /data/web/pro/uworkplus')
  console.error('')
  console.error('部署账号优先读取环境变量 DEPLOY_HOST / DEPLOY_PASSWORD')
  console.error('也可从本地配置文件读取，见 scripts/read-deploy-config.js')
  process.exit(1)
}

const local = process.argv[2]
const remotePath = process.argv[3]

if (!local || !remotePath) {
  usage()
}

try {
  const { aliIp, password } = readDeployConfig()
  const remote = `root@${aliIp}:${remotePath}`

  console.log(`SCP 上传: ${local} -> ${remote}`)

  const result = spawnSync('expect', [path.join(__dirname, 'scp-upload.exp')], {
    stdio: 'inherit',
    env: {
      ...process.env,
      SCP_PASSWORD: password,
      SCP_LOCAL: local,
      SCP_REMOTE: remote,
    },
  })

  if (result.status !== 0) {
    throw new Error('SCP 部署失败')
  }

  console.log('SCP 上传完成')
} catch (error) {
  console.error(error.message || error)
  process.exit(1)
}
