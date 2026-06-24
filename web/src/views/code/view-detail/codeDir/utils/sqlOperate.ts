import { jsBridge } from '@/utils/electron'

/**
 * codeDirList.json 文件的增删改查操作
 * 基于 electron 的 curd API 实现
 */
export class CodeDirListService {
  private static readonly SQL_FILE = 'dataSql/codeDirList.json'

  /**
   * 创建新的代码目录项
   * @param item 要创建的代码目录项数据
   * @returns Promise<any> 创建成功返回新创建的项目
   */
  static async create(item: any): Promise<any> {
    try {
      const result = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'create',
          data: { 
            item,
            sql: this.SQL_FILE 
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
  static async readAll(): Promise<any[]> {
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
  static async readById(id: number | string): Promise<any> {
    try {
      const result = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'readById',
          data: { 
            id,
            sql: this.SQL_FILE 
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
  static async update(id: number | string, item: any): Promise<any> {
    try {
      const result = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'update',
          data: { 
            id,
            item,
            sql: this.SQL_FILE 
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
  static async remove(id: number | string): Promise<boolean> {
    try {
      const result = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'remove',
          data: { 
            id,
            sql: this.SQL_FILE 
          },
        },
      })
      return Boolean(result)
    } catch (error) {
    }
  }
}

// 导出默认实例，方便直接使用
export default CodeDirListService

/**
 * 使用示例：
 * 
 * // 导入服务
 * import CodeDirListService from './utils/sqlOperate'
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
