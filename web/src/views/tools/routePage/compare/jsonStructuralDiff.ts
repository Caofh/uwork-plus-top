export type JsonDiffType = 'added' | 'deleted' | 'modified'

export interface JsonDiffItem {
  path: string
  type: JsonDiffType
  oldValue: unknown
  newValue: unknown
}

export interface JsonDiffStats {
  same: number
  modified: number
  added: number
  deleted: number
}

export interface JsonDiffResult {
  stats: JsonDiffStats
  differences: JsonDiffItem[]
}

export function calculateJsonDiff(obj1: unknown, obj2: unknown): JsonDiffResult {
  const stats: JsonDiffStats = { same: 0, modified: 0, added: 0, deleted: 0 }
  const differences: JsonDiffItem[] = []

  const traverse = (oldObj: unknown, newObj: unknown, path = '') => {
    if (oldObj === null || oldObj === undefined) {
      if (newObj !== null && newObj !== undefined) {
        stats.added++
        differences.push({ path, type: 'added', oldValue: null, newValue: newObj })
      }
      return
    }

    if (newObj === null || newObj === undefined) {
      stats.deleted++
      differences.push({ path, type: 'deleted', oldValue: oldObj, newValue: null })
      return
    }

    if (typeof oldObj !== typeof newObj) {
      stats.modified++
      differences.push({ path, type: 'modified', oldValue: oldObj, newValue: newObj })
      return
    }

    if (typeof oldObj !== 'object' || Array.isArray(oldObj) !== Array.isArray(newObj)) {
      if (JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
        stats.modified++
        differences.push({ path, type: 'modified', oldValue: oldObj, newValue: newObj })
      } else {
        stats.same++
      }
      return
    }

    if (Array.isArray(oldObj)) {
      const oldArr = oldObj as unknown[]
      const newArr = newObj as unknown[]
      const maxLength = Math.max(oldArr.length, newArr.length)
      for (let i = 0; i < maxLength; i++) {
        const itemPath = path ? `${path}[${i}]` : `[${i}]`
        if (i >= oldArr.length) {
          stats.added++
          differences.push({ path: itemPath, type: 'added', oldValue: null, newValue: newArr[i] })
        } else if (i >= newArr.length) {
          stats.deleted++
          differences.push({ path: itemPath, type: 'deleted', oldValue: oldArr[i], newValue: null })
        } else {
          traverse(oldArr[i], newArr[i], itemPath)
        }
      }
      return
    }

    const oldRecord = oldObj as Record<string, unknown>
    const newRecord = newObj as Record<string, unknown>
    const allKeys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)])

    for (const key of Array.from(allKeys)) {
      const itemPath = path ? `${path}.${key}` : key

      if (!(key in oldRecord)) {
        stats.added++
        differences.push({ path: itemPath, type: 'added', oldValue: null, newValue: newRecord[key] })
      } else if (!(key in newRecord)) {
        stats.deleted++
        differences.push({ path: itemPath, type: 'deleted', oldValue: oldRecord[key], newValue: null })
      } else {
        traverse(oldRecord[key], newRecord[key], itemPath)
      }
    }
  }

  traverse(obj1, obj2)

  return { stats, differences }
}

function isNestedStructure(value: unknown): boolean {
  return value !== null && typeof value === 'object'
}

/** 仅比较对象属性结构，不比较属性值；数组只比较重叠项内属性，不比较 length */
export function calculateJsonStructureDiff(obj1: unknown, obj2: unknown): JsonDiffResult {
  const stats: JsonDiffStats = { same: 0, modified: 0, added: 0, deleted: 0 }
  const differences: JsonDiffItem[] = []

  const traverse = (oldObj: unknown, newObj: unknown, path = '') => {
    const oldNested = isNestedStructure(oldObj)
    const newNested = isNestedStructure(newObj)

    if (!oldNested && !newNested) {
      stats.same++
      return
    }

    if (oldNested !== newNested) {
      stats.modified++
      differences.push({ path, type: 'modified', oldValue: null, newValue: null })
      return
    }

    if (Array.isArray(oldObj)) {
      const oldArr = oldObj as unknown[]
      const newArr = newObj as unknown[]
      const compareLength = Math.min(oldArr.length, newArr.length)

      for (let i = 0; i < compareLength; i++) {
        const itemPath = path ? `${path}[${i}]` : `[${i}]`
        traverse(oldArr[i], newArr[i], itemPath)
      }
      return
    }

    const oldRecord = oldObj as Record<string, unknown>
    const newRecord = newObj as Record<string, unknown>
    const allKeys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)])

    for (const key of Array.from(allKeys)) {
      const itemPath = path ? `${path}.${key}` : key

      if (!(key in oldRecord)) {
        stats.added++
        differences.push({ path: itemPath, type: 'added', oldValue: null, newValue: null })
      } else if (!(key in newRecord)) {
        stats.deleted++
        differences.push({ path: itemPath, type: 'deleted', oldValue: null, newValue: null })
      } else {
        traverse(oldRecord[key], newRecord[key], itemPath)
      }
    }
  }

  traverse(obj1, obj2)

  return { stats, differences }
}

export function buildJsonDiffAssessment(leftJson: string, mockJson: string) {
  const leftText = String(leftJson || '').trim()
  const mockText = String(mockJson || '').trim()
  if (!leftText || !mockText) {
    return null
  }

  try {
    const left = JSON.parse(leftText)
    const mock = JSON.parse(mockText)
    const { stats } = calculateJsonStructureDiff(left, mock)
    const total = stats.same + stats.modified + stats.added + stats.deleted
    const matchRate = total > 0 ? Math.round((stats.same / total) * 100) : 100
    const isIdentical = stats.modified === 0 && stats.added === 0 && stats.deleted === 0

    return {
      stats,
      matchRate,
      isIdentical,
      diffCount: stats.modified + stats.added + stats.deleted,
    }
  } catch {
    return {
      invalid: true as const,
    }
  }
}
