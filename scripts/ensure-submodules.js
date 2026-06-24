#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const gitmodulesPath = path.join(rootDir, '.gitmodules')

function parseGitmodules(content) {
  const submodules = []
  let current = null

  for (const line of content.split('\n')) {
    const submoduleMatch = line.match(/^\[submodule "(.+)"\]$/)
    if (submoduleMatch) {
      current = { name: submoduleMatch[1] }
      submodules.push(current)
      continue
    }

    const pathMatch = line.match(/^\s*path\s*=\s*(.+)$/)
    if (pathMatch && current) {
      current.path = pathMatch[1].trim()
      continue
    }

    const urlMatch = line.match(/^\s*url\s*=\s*(.+)$/)
    if (urlMatch && current) {
      current.url = urlMatch[1].trim()
    }
  }

  return submodules.filter(item => item.path)
}

function isSubmoduleReady(submodulePath) {
  const fullPath = path.join(rootDir, submodulePath)

  if (!fs.existsSync(fullPath)) {
    return { ok: false, reason: '目录不存在' }
  }

  if (!fs.existsSync(path.join(fullPath, '.git'))) {
    return { ok: false, reason: '尚未初始化或未拉取代码' }
  }

  const entries = fs.readdirSync(fullPath).filter(name => name !== '.git')
  if (entries.length === 0) {
    return { ok: false, reason: '目录为空' }
  }

  return { ok: true }
}

function main() {
  if (!fs.existsSync(gitmodulesPath)) {
    console.error('[submodule] 未找到 .gitmodules')
    process.exit(1)
  }

  const filterPaths = process.argv.slice(2)
  let submodules = parseGitmodules(fs.readFileSync(gitmodulesPath, 'utf8'))

  if (filterPaths.length > 0) {
    submodules = submodules.filter(item => filterPaths.includes(item.path))
    const missing = filterPaths.filter(name => !submodules.some(item => item.path === name))
    if (missing.length > 0) {
      console.error(`[submodule] .gitmodules 中未找到: ${missing.join(', ')}`)
      process.exit(1)
    }
  }

  if (submodules.length === 0) {
    console.error('[submodule] .gitmodules 中没有可检查的 submodule')
    process.exit(1)
  }

  const failed = []

  for (const submodule of submodules) {
    const result = isSubmoduleReady(submodule.path)
    if (!result.ok) {
      failed.push({ ...submodule, reason: result.reason })
    }
  }

  if (failed.length > 0) {
    console.error('[submodule] 以下子模块尚未拉取完成:')
    for (const item of failed) {
      console.error(`  - ${item.path} (${item.reason})`)
      console.error(`    仓库: ${item.url || item.name}`)
    }
    console.error('')
    console.error('请先执行: git submodule update --init --recursive')
    console.error('或在 clone 时使用: git clone --recursive <repo-url>')
    process.exit(1)
  }

  console.log(`[submodule] 已就绪: ${submodules.map(item => item.path).join(', ')}`)
}

main()
