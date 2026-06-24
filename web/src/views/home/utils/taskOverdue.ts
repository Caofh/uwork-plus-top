import type { HomeTask } from '../service/taskApi'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const parseTaskDueTime = (dueTime?: string) => {
  if (!dueTime) return null
  const t = new Date(dueTime.replace(/-/g, '/')).getTime()
  return Number.isNaN(t) ? null : t
}

/** 未完成且截止时间 ≤ 当前时间 - 1 天（与列表标红一致） */
export const isTaskOverdue = (task: HomeTask) => {
  if (task.status === 'done' || !task.dueTime) return false
  const t = parseTaskDueTime(task.dueTime)
  return t != null && t - ONE_DAY_MS <= Date.now()
}

export const countOverdueTasks = (list: HomeTask[]) =>
  list.filter(t => isTaskOverdue(t)).length
