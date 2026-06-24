import { jsBridge, isInElectron } from '@/utils/electron'
import { ElMessage } from 'element-plus'
import { cloneDeep } from 'lodash'

/** 去掉语音里的「打开」前缀，得到用于匹配的指令名 */
export function stripVoiceOpenPrefix(raw) {
  let s = String(raw || '').trim()
  if (s.startsWith('打开')) {
    s = s.slice(2).trim()
  }
  return s
}

/** 去掉所有标点符号（Unicode P 类），用于与 data 里 text 对齐匹配 */
export function stripAllPunctuation(str) {
  return String(str || '').replace(/\p{P}/gu, '')
}

/**
 * 语音转写 → 匹配用关键字：去「打开」、去全部标点、trim
 */
export function normalizeVoiceMatchKey(raw) {
  return stripAllPunctuation(stripVoiceOpenPrefix(raw)).trim()
}

function normalizeItemTextForMatch(text) {
  return stripAllPunctuation(String(text || '')).trim()
}

async function fetchShDataList() {
  const res = await jsBridge.registerSync({
    method: 'proxySql',
    json: {
      methods: 'readAll',
      data: { sql: 'data' },
    },
  })
  let arr = []
  try {
    arr = typeof res === 'string' ? JSON.parse(res) : res
  } catch {
    arr = []
  }
  return Array.isArray(arr) ? arr : []
}

function findItemByVoiceText(items, key) {
  if (!key) return null
  const byVoiceKey = items.find(it => {
    const vk = it.voiceIndexKey
    if (vk == null || String(vk).trim() === '') return false

    // vk是一个带有;或者；的特殊字符串，需要处理 voiceIndexKey 中的分号和顿号，转换为 & 符号，然后分割成数组，再匹配
    const findItem = vk.replace(/\;/g, '&').replace(/\；/g, '&').split('&').map(item => normalizeItemTextForMatch(item));
    return findItem.includes(key)
  })
  if (byVoiceKey) return byVoiceKey
  return (
    items.find(it => normalizeItemTextForMatch(it.text) === key) || null
  )
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function runTerminalUntilClose(shContent) {
  return new Promise(resolve => {
    let remove = window.electronAPI.onTerminalOutput(data => {
      if (data.type === 'close') {
        if (remove) remove()
        resolve(data)
      }
    })
    window.electronAPI.runTerminalCommandStream(shContent)
  })
}

function openMacTerminalPromise(command) {
  return new Promise(resolve => {
    jsBridge.register({
      method: 'openMacTerminal',
      json: { command },
      callback: () => resolve(),
    })
  })
}

async function persistItemAfterVoiceExec(item) {
  const itemRaw = cloneDeep(item)
  delete itemRaw.alwaysHover
  delete itemRaw.executeLoading
  delete itemRaw.alwaysUseNumHover
  if (itemRaw.alwaysUseNum !== undefined) {
    itemRaw.alwaysUseNum = (item.alwaysUseNum || 0) + 1
  }
  await jsBridge.registerSync({
    method: 'proxySql',
    json: {
      methods: 'update',
      data: { id: item.id, item: itemRaw, sql: 'data' },
    },
  })
}

/**
 * 根据 data.json（sql: data）里条目的 text 匹配后执行 sh，行为与脚本页 execute 一致（简化版，无抽屉内终端 UI）
 * @param {string} rawTranscript 识别原文（会自动去掉「打开」前缀再匹配）
 */
export async function runVoiceMatchedShScript(rawTranscript) {
  if (!isInElectron() || !window.electronAPI) {
    return
  }
  const key = normalizeVoiceMatchKey(rawTranscript)
  if (!key) {
    return
  }
  console.log('[voice] 匹配关键字（去「打开」、去标点）:', key)

  const items = await fetchShDataList()
  const item = findItemByVoiceText(items, key)
  // console.log('item', item)
  if (!item) {
    console.log('[voice] 未匹配到脚本, 关键词:', key)
    // ElMessage.warning(`未找到名称为「${key}」的脚本`)
    return {
      status: 'fail',
      key: key,
      message: `未找到名称为「${key}」的脚本`,
    }
  }

  const shContent = item.sh || ''
  const shMode = item.shMode || 1
  const shModeList = item.shModeList || []
  const ti = String(item.terminalInteractive || '2')

  if (shMode === 1 && !shContent) {
    ElMessage.error('该条目没有可执行的 sh 脚本')
    return
  }
  if (shMode === 2 && !shModeList.length) {
    ElMessage.error('该条目没有可执行的 sh 脚本')
    return
  }

  try {
    if (ti === '3') {
      if (shMode === 1) {
        await openMacTerminalPromise(shContent)
      } else {
        for (let i = 0; i < shModeList.length; i++) {
          await openMacTerminalPromise(shModeList[i].sh)
          await sleep(1500)
        }
      }
      ElMessage.success(`已执行：${item.text}`)
    } else {
      if (shMode === 1) {
        await runTerminalUntilClose(shContent)
      } else {
        for (let i = 0; i < shModeList.length; i++) {
          await runTerminalUntilClose(shModeList[i].sh)
          await sleep(1500)
        }
      }
      ElMessage.success(
        ti === '1' ? `已启动脚本（需终端交互）：${item.text}` : `已执行：${item.text}`
      )
    }

    await persistItemAfterVoiceExec(item)
  } catch (e) {
    console.error('[voice] 执行脚本失败', e)
    ElMessage.error('执行脚本失败')
  }
}
