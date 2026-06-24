import CodeDirListService from '@/utils/sqlOperate'

export const HOME_TASK_SQL_FILE = 'dataSql/homeTaskList.json'

export type TaskStatus = 'pending' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface HomeTask {
  id: number
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  /** 截止时间，格式 YYYY-MM-DD HH:mm:ss，选填 */
  dueTime?: string
  createTime: string
}

const taskSql = new CodeDirListService(HOME_TASK_SQL_FILE)

/** 首页任务列表 - 增删改查（基于 electron proxySql / curd） */
export const taskApi = {
  getTaskList: (): Promise<HomeTask[]> => taskSql.readAll() as Promise<HomeTask[]>,

  getTaskById: (id: number | string): Promise<HomeTask | null> =>
    taskSql.readById(id) as Promise<HomeTask | null>,

  addTask: (item: Omit<HomeTask, 'id'>): Promise<HomeTask> =>
    taskSql.create(item) as Promise<HomeTask>,

  updateTask: (id: number | string, item: Partial<HomeTask>): Promise<HomeTask> =>
    taskSql.update(id, item) as Promise<HomeTask>,

  removeTask: (id: number | string): Promise<boolean> => taskSql.remove(id),
}
