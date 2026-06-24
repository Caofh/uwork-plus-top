import { getVersion } from '@/utils/electron'
import { useCommonStore } from '@/store/common'

/**
 * 比较两个版本号的大小
 * @param version1 第一个版本号，如 "1.5.7"
 * @param version2 第二个版本号，如 "1.5.8"
 * @returns 比较结果：
 *   - 如果 version1 > version2，返回 1
 *   - 如果 version1 < version2，返回 -1
 *   - 如果 version1 === version2，返回 0
 */
function compareVersions(version1: string, version2: string): number {
  if (!version1 || !version2) {
    return -1
  }
  // 将版本号按点分割成数字数组
  const v1Parts = version1.split('.').map(Number)
  const v2Parts = version2.split('.').map(Number)

  // 确保两个版本号有相同的长度，不足的用0补齐
  const maxLength = Math.max(v1Parts.length, v2Parts.length)

  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0

    if (v1Part > v2Part) {
      return 1
    } else if (v1Part < v2Part) {
      return -1
    }
  }

  return 0
}

// 判断当前版本是否大于等于传入的版本
function afterVersion(version: string) {
  const commonStore = useCommonStore()
  const currentVersion = commonStore.currentVersion
  const result = compareVersions(currentVersion, version)
  return result >= 0
}

export { afterVersion, compareVersions }
