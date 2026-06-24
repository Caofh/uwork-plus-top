import { jsBridge } from '@/utils/electron'

function encodeUtf8ToBase64(text: string) {
  return btoa(unescape(encodeURIComponent(text)))
}

/**
 * codeDirList.json 文件的增删改查操作
 * 基于 electron 的 curd API 实现
 */
export class CodeDirListService {
  // 数据库文件路径； ex： dataSql/codeDirList.json
  SQL_FILE: string = ''

  constructor(sqlFile?: string) {
    if (sqlFile) {
      this.SQL_FILE = sqlFile
    }
  }

  /**
   * 创建新的代码目录项
   * @param item 要创建的代码目录项数据
   * @returns Promise<any> 创建成功返回新创建的项目
   */
  async create(item: any): Promise<any> {
    if (!this.SQL_FILE) {
      throw new Error('SQL_FILE is not set')
    }
    try {
      const result = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'create',
          data: {
            item,
            sql: this.SQL_FILE,
          },
        },
      })
      return result
    } catch (error) {
      console.error('创建代码目录项失败:', error)
      throw error
    }
  }

  /**
   * 读取所有代码目录项
   * @returns Promise<any[]> 返回所有代码目录项列表
   */
  async readAll(): Promise<any[]> {
    if (!this.SQL_FILE) {
      throw new Error('SQL_FILE is not set')
    }
    try {
      const result = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'readAll',
          data: { sql: this.SQL_FILE },
        },
      })
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('读取代码目录列表失败:', error)
      throw error
    }
  }

  /**
   * 根据 ID 读取单个代码目录项
   * @param id 代码目录项的 ID
   * @returns Promise<any> 返回对应的代码目录项
   */
  async readById(id: number | string): Promise<any> {
    if (!this.SQL_FILE) {
      throw new Error('SQL_FILE is not set')
    }
    try {
      const result = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'readById',
          data: {
            id,
            sql: this.SQL_FILE,
          },
        },
      })
      return result
    } catch (error) {
      console.error('读取代码目录项失败:', error)
      throw error
    }
  }

  /**
   * 更新代码目录项
   * @param id 要更新的代码目录项 ID
   * @param item 更新后的数据
   * @returns Promise<any> 返回更新后的项目
   */
  async update(id: number | string, item: any): Promise<any> {
    if (!this.SQL_FILE) {
      throw new Error('SQL_FILE is not set')
    }
    try {
      const result = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'update',
          data: {
            id,
            item,
            sql: this.SQL_FILE,
          },
        },
      })
      return result
    } catch (error) {
      console.error('更新代码目录项失败:', error)
      throw error
    }
  }

  /**
   * 删除代码目录项
   * @param id 要删除的代码目录项 ID
   * @returns Promise<boolean> 删除成功返回 true
   */
  async remove(id: number | string): Promise<boolean> {
    if (!this.SQL_FILE) {
      throw new Error('SQL_FILE is not set')
    }
    try {
      const result = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'remove',
          data: {
            id,
            sql: this.SQL_FILE,
          },
        },
      })
      return Boolean(result)
    } catch (error) {}
  }

  /**
   * 覆盖写入全部数据
   * @param items 完整数据列表
   */
  async writeAll(items: any[]): Promise<any[]> {
    if (!this.SQL_FILE) {
      throw new Error('SQL_FILE is not set')
    }

    const plainItems = JSON.parse(JSON.stringify(Array.isArray(items) ? items : []))

    try {
      const result = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'writeAll',
          data: {
            items: plainItems,
            sql: this.SQL_FILE,
          },
        },
      })
      if (Array.isArray(result)) {
        return result
      }
    } catch (error) {
      console.warn('[SqlOperate] writeAll proxySql 失败，尝试终端写入:', error)
    }

    await this.writeAllViaTerminal(plainItems)
    return plainItems
  }

  /** 通过终端直接写入 JSON 文件（兼容未重启的旧版 Electron） */
  private async writeAllViaTerminal(items: any[]) {
    const homeResult: any = await jsBridge.registerSync({
      method: 'getHomeProjectPath',
    })
    const projectPath = homeResult?.data
    if (!projectPath) {
      throw new Error('无法获取项目路径')
    }

    const filePath = `${projectPath}/${this.SQL_FILE}`
    const content = JSON.stringify(items, null, 2)
    const base64Content = encodeUtf8ToBase64(content)
    const script =
      'require("fs").writeFileSync(process.argv[1], Buffer.from(process.argv[2], "base64").toString("utf8"))'
    const writeCommand = `node -e ${JSON.stringify(script)} ${JSON.stringify(filePath)} ${JSON.stringify(base64Content)}`
    const result: any = await jsBridge.registerSync({
      method: 'runTerminalCommand',
      json: { command: writeCommand },
    })
    if (result.code !== 0) {
      throw new Error(result.stderr || '写入 JSON 文件失败')
    }
  }
}

// 导出默认实例，方便直接使用
export default CodeDirListService

/**
 * 使用示例：
 *
 * // 导入服务
 * import SqlOperate from './utils/sqlOperate'
 * 
 * // 创建实例
 * const codeDirListService = new SqlOperate('dataSql/codeDirList.json')
 *
 * // 创建新的代码目录项
 * const newItem = await CodeDirListService.create({
 *   name: 'My Project',
 *   path: '/path/to/project',
 *   description: '项目描述'
 * })
 *
 * // 读取所有代码目录项
 * const allItems = await CodeDirListService.readAll()
 *
 * // 根据ID读取单个项目
 * const item = await CodeDirListService.readById(123)
 *
 * // 更新项目
 * const updatedItem = await CodeDirListService.update(123, {
 *   name: 'Updated Project Name',
 *   description: '更新的描述'
 * })
 *
 * // 删除项目
 * const deleted = await CodeDirListService.remove(123)
 */
