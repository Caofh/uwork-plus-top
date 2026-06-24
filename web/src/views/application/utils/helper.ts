// 工具函数

/**
 * 获取网站favicon
 * @param url 网站地址
 * @returns favicon地址
 */
export function getFavicon(url: string): string {
  if (!url) return ''

  try {
    const urlObj = new URL(url)
    return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
  } catch (error) {
    console.error('Invalid URL:', url)
    return ''
  }
}

/**
 * 按app_type字段聚合数组数据
 * @param data 原始数组数据
 * @returns 聚合后的对象，key为app_type，value为对应的数组
 */
export function groupByAppType<T extends { app_type: string | number }>(
  data: T[]
): Record<string | number, T[]> {
  if (!Array.isArray(data)) {
    console.warn('groupByAppType: 输入数据不是数组')
    return {}
  }

  return data.reduce(
    (acc, item) => {
      const appType = item.app_type
      if (appType !== undefined && appType !== null) {
        if (!acc[appType]) {
          acc[appType] = []
        }
        acc[appType].push(item)
      }
      return acc
    },
    {} as Record<string | number, T[]>
  )
}

/**
 * 按app_type字段聚合数组数据，并返回分组统计信息
 * @param data 原始数组数据
 * @returns 包含分组数据和统计信息的对象
 */
export function groupByAppTypeWithStats<T extends { app_type: string | number }>(data: T[]) {
  if (!Array.isArray(data)) {
    console.warn('groupByAppTypeWithStats: 输入数据不是数组')
    return { groups: {}, stats: {}, total: 0 }
  }

  const groups = groupByAppType(data)
  const stats: Record<string | number, number> = {}
  let total = 0

  Object.keys(groups).forEach(key => {
    const count = groups[key].length
    stats[key] = count
    total += count
  })

  return {
    groups,
    stats,
    total,
    groupCount: Object.keys(groups).length,
  }
}

/**
 * 搜索数据
 * @param keyword 搜索关键词
 * @param data 数据数组
 * @param fields 搜索字段，默认为 ['app_name', 'app_introduce']
 * @returns 搜索结果数组
 */
export function serachData<T extends Record<string, any>>(
  keyword: string,
  data: T[],
  fields: string[] = ['app_name', 'app_introduce']
): T[] {
  if (!keyword || !Array.isArray(data) || data.length === 0) {
    return []
  }

  const lowerKeyword = keyword.toLowerCase()

  return data.filter(item => {
    return fields.some(field => {
      const value = item[field]
      if (value && typeof value === 'string') {
        return value.toLowerCase().includes(lowerKeyword)
      }
      return false
    })
  })
}

/**
 * 按app_type分组并支持搜索
 * @param keyword 搜索关键词
 * @param data 数据数组
 * @param fields 搜索字段
 * @returns 分组后的搜索结果
 */
export function searchAndGroupByType<T extends { app_type: string | number }>(
  keyword: string,
  data: T[],
  fields: string[] = ['app_name', 'app_introduce']
) {
  // 先搜索
  const searchResults = serachData(keyword, data, fields)

  // 再按类型分组
  const groupedResults = groupByAppTypeWithStats(searchResults)

  return {
    ...groupedResults,
    keyword,
    originalData: data,
    searchResults,
  }
}

/**
 * 根据groups对象获取对应的数据类型信息
 * @param groups 按app_type分组的对象 { [app_type]: T[] }
 * @param dataTypeList 数据类型列表数组
 * @returns 在dataTypeList中存在的分组信息数组
 */
export function getDataTypeByGroups<
  T extends { app_type: string | number },
  U extends { id: string | number },
>(groups: Record<string | number, T[]>, dataTypeList: U[]): U[] {
  if (!groups || !Array.isArray(dataTypeList) || dataTypeList.length === 0) {
    return []
  }

  // 获取groups对象中所有的app_type键
  const groupKeys = Object.keys(groups)

  // 过滤出在dataTypeList中存在的分组
  return dataTypeList.filter(dataType => {
    // 检查dataType.id是否在groups的键中存在
    return groupKeys.some(key => {
      // 转换为字符串进行比较，确保类型匹配
      return String(dataType.id) === String(key)
    })
  })
}

/**
 * 根据groups对象获取对应的数据类型信息，并包含分组统计
 * @param groups 按app_type分组的对象 { [app_type]: T[] }
 * @param dataTypeList 数据类型列表数组
 * @returns 包含分组信息和统计的对象
 */
export function getDataTypeByGroupsWithStats<
  T extends { app_type: string | number },
  U extends { id: string | number },
>(groups: Record<string | number, T[]>, dataTypeList: U[]) {
  const matchedDataTypes = getDataTypeByGroups(groups, dataTypeList)

  // 为每个匹配的数据类型添加对应的应用数量
  const dataTypesWithCount = matchedDataTypes.map(dataType => {
    const appTypeKey = String(dataType.id)
    const appCount = groups[appTypeKey]?.length || 0

    return {
      ...dataType,
      appCount,
      apps: groups[appTypeKey] || [],
    }
  })

  return {
    dataTypes: dataTypesWithCount,
    totalGroups: matchedDataTypes.length,
    totalApps: Object.values(groups).reduce((sum, apps) => sum + apps.length, 0),
  }
}
