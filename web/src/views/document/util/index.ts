/**
 * 增强版 findGroupById - 支持多种查找方式和结果
 */
class GroupFinder<T extends { children?: T[]; [key: string]: any }> {
  private data: T[]
  private idField: string

  constructor(data: T[], idField: string = 'id') {
    this.data = data
    this.idField = idField
  }

  /**
   * 通过子项 id 查找父级组
   */
  findParentById(targetId: string | number): T | null {
    const result = this.findGroupById(targetId)
    return result?.parent || null
  }

  /**
   * 通过子项 id 查找完整的组信息
   */
  findGroupById(
    targetId: string | number
  ): { parent: T | null; child: T | null; path: T[] } | null {
    return this._findRecursive(this.data, targetId)
  }

  /**
   * 通过子项 id 查找所有父级路径
   */
  findAllParents(targetId: string | number): T[] {
    const result = this.findGroupById(targetId)
    return result ? result.path.slice(0, -1) : []
  }

  /**
   * 通过子项 id 查找兄弟项
   */
  findSiblings(targetId: string | number): T[] {
    const result = this.findGroupById(targetId)
    if (!result?.parent) return []

    return result.parent.children?.filter(item => item[this.idField] !== targetId) || []
  }

  /**
   * 通过子项 id 查找根级组
   */
  findRootGroup(targetId: string | number): T | null {
    const result = this.findGroupById(targetId)
    return result?.path[0] || null
  }

  /**
   * 检查是否为叶子节点
   */
  isLeafNode(targetId: string | number): boolean {
    const result = this.findGroupById(targetId)
    if (!result?.child) return false

    return !result.child.children || result.child.children.length === 0
  }

  /**
   * 获取节点的深度层级
   */
  getNodeDepth(targetId: string | number): number {
    const result = this.findGroupById(targetId)
    return result ? result.path.length : -1
  }

  private _findRecursive(
    items: T[],
    targetId: string | number,
    parent: T | null = null,
    path: T[] = []
  ): { parent: T | null; child: T | null; path: T[] } | null {
    for (const item of items) {
      // 检查当前项是否是目标
      if (item[this.idField] === targetId) {
        return { parent, child: item, path: [...path, item] }
      }

      // 如果有子项，递归查找
      if (item.children && item.children.length > 0) {
        const result = this._findRecursive(item.children, targetId, item, [...path, item])

        if (result) {
          return result
        }
      }
    }

    return null
  }
}

export { GroupFinder }
