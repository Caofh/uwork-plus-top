const fs = require('fs')
const path = require('path')

const CONFIG_PATH =
  process.env.CFH_CONFIG_PATH ||
  path.join(process.env.HOME, 'UWORK-PLUS/dataSql/dataSnippet.json')
const CONFIG_KEY = 'CFH-CONFIG'

function readDeployConfigFromEnv() {
  const aliIp = process.env.DEPLOY_HOST || process.env.ALI_IP
  const password = process.env.DEPLOY_PASSWORD || process.env.ECS_PASSWORD

  if (!aliIp || !password) {
    return null
  }

  return { aliIp, password }
}

function readDeployConfigFromFile() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`配置文件不存在: ${CONFIG_PATH}`)
  }

  const snippets = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  const entry = snippets.find(item => item.article_name === CONFIG_KEY)

  if (!entry) {
    throw new Error(`未找到 ${CONFIG_KEY} 配置项`)
  }

  const content = JSON.parse(entry.article_content)
  const { aliIp, EcsPassword: password } = content

  if (!aliIp) {
    throw new Error(`${CONFIG_KEY} 中缺少 aliIp`)
  }

  if (!password) {
    throw new Error(`${CONFIG_KEY} 中缺少 EcsPassword`)
  }

  return { aliIp, password }
}

function readDeployConfig() {
  const fromEnv = readDeployConfigFromEnv()
  if (fromEnv) {
    return fromEnv
  }

  return readDeployConfigFromFile()
}

module.exports = {
  CONFIG_PATH,
  CONFIG_KEY,
  readDeployConfig,
}
