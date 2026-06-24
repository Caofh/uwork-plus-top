export type DiffRowType = 'equal' | 'delete' | 'insert' | 'empty'

export interface SideBySideRow {
  leftLineNum: number | null
  rightLineNum: number | null
  leftText: string
  rightText: string
  leftType: DiffRowType
  rightType: DiffRowType
  isHunkStart?: boolean
  hunkHeader?: string
}

export interface DiffStats {
  additions: number
  deletions: number
  changes: number
}

type DiffOp =
  | { type: 'equal'; oldLine: string; newLine: string }
  | { type: 'delete'; oldLine: string }
  | { type: 'insert'; newLine: string }

export function formatJsonText(raw: string): string {
  const text = String(raw ?? '').trim()
  if (!text) {
    return ''
  }
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return String(raw ?? '')
  }
}

function buildLcsOps(oldLines: string[], newLines: string[]): DiffOp[] {
  const n = oldLines.length
  const m = newLines.length
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const ops: DiffOp[] = []
  let i = n
  let j = m

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.unshift({ type: 'equal', oldLine: oldLines[i - 1], newLine: newLines[j - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'insert', newLine: newLines[j - 1] })
      j--
    } else {
      ops.unshift({ type: 'delete', oldLine: oldLines[i - 1] })
      i--
    }
  }

  return ops
}

function toSideBySideRows(ops: DiffOp[]): SideBySideRow[] {
  const rows: SideBySideRow[] = []
  let leftNum = 0
  let rightNum = 0

  for (let index = 0; index < ops.length; index++) {
    const op = ops[index]

    if (op.type === 'equal') {
      leftNum++
      rightNum++
      rows.push({
        leftLineNum: leftNum,
        rightLineNum: rightNum,
        leftText: op.oldLine,
        rightText: op.newLine,
        leftType: 'equal',
        rightType: 'equal',
      })
      continue
    }

    if (op.type === 'delete') {
      const next = ops[index + 1]
      if (next?.type === 'insert') {
        leftNum++
        rightNum++
        rows.push({
          leftLineNum: leftNum,
          rightLineNum: rightNum,
          leftText: op.oldLine,
          rightText: next.newLine,
          leftType: 'delete',
          rightType: 'insert',
        })
        index++
      } else {
        leftNum++
        rows.push({
          leftLineNum: leftNum,
          rightLineNum: null,
          leftText: op.oldLine,
          rightText: '',
          leftType: 'delete',
          rightType: 'empty',
        })
      }
      continue
    }

    rightNum++
    rows.push({
      leftLineNum: null,
      rightLineNum: rightNum,
      leftText: '',
      rightText: op.newLine,
      leftType: 'empty',
      rightType: 'insert',
    })
  }

  return rows
}

function attachHunkHeaders(rows: SideBySideRow[]): SideBySideRow[] {
  let oldStart = 0
  let newStart = 0
  let oldCount = 0
  let newCount = 0
  let inHunk = false

  const flushHunk = (row: SideBySideRow) => {
    if (!inHunk) {
      return
    }
    row.isHunkStart = true
    row.hunkHeader = `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`
    inHunk = false
    oldCount = 0
    newCount = 0
  }

  return rows.map((row, index) => {
    const changed = row.leftType !== 'equal' || row.rightType !== 'equal'
    const nextRow = rows[index + 1]
    const nextChanged = nextRow ? nextRow.leftType !== 'equal' || nextRow.rightType !== 'equal' : false

    if (changed && !inHunk) {
      oldStart = row.leftLineNum ?? Math.max(1, (row.rightLineNum ?? 1) - 1)
      newStart = row.rightLineNum ?? Math.max(1, (row.leftLineNum ?? 1) - 1)
      inHunk = true
    }

    if (inHunk) {
      if (row.leftLineNum !== null) {
        oldCount++
      }
      if (row.rightLineNum !== null) {
        newCount++
      }
    }

    const result = { ...row }
    if (inHunk && changed && !nextChanged) {
      flushHunk(result)
    }
    return result
  })
}

export function buildSideBySideDiff(
  oldText: string,
  newText: string
): { rows: SideBySideRow[]; stats: DiffStats } {
  const oldLines = oldText.length ? oldText.split('\n') : ['']
  const newLines = newText.length ? newText.split('\n') : ['']
  const ops = buildLcsOps(oldLines, newLines)
  const rows = attachHunkHeaders(toSideBySideRows(ops))

  let additions = 0
  let deletions = 0

  rows.forEach(row => {
    if (row.leftType === 'delete') {
      deletions++
    }
    if (row.rightType === 'insert') {
      additions++
    }
  })

  return {
    rows,
    stats: {
      additions,
      deletions,
      changes: additions + deletions,
    },
  }
}
