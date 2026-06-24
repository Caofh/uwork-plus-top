import { useCommonStore } from '@/store/common'
import { compareVersions } from '@/utils/version'

/**
 * 版本控制指令
 * 根据版本要求控制元素的显示和隐藏
 * 
 * 使用方式：
 * v-version="'1.5.7'" - 当前版本大于等于1.5.7时显示
 * v-version:min="'1.5.7'" - 当前版本大于等于1.5.7时显示
 * v-version:max="'2.0.0'" - 当前版本小于等于2.0.0时显示
 * v-version:range="['1.5.7', '2.0.0']" - 当前版本在1.5.7到2.0.0之间时显示
 * v-version:exact="'1.5.7'" - 当前版本等于1.5.7时显示
 */
export const versionDirective = {
  mounted(el, binding) {
    checkVersion(el, binding)
  },
  updated(el, binding) {
    checkVersion(el, binding)
  }
}

function checkVersion(el, binding) {
  const commonStore = useCommonStore()
  const currentVersion = commonStore.currentVersion
  
  if (!currentVersion) {
    // 如果当前版本不可用，默认隐藏元素
    el.style.display = 'none'
    return
  }

  const { arg, value } = binding
  let shouldShow = false

  switch (arg) {
    case 'min':
      // 最小版本要求：当前版本 >= 指定版本
      shouldShow = compareVersions(currentVersion, value) >= 0
      break
      
    case 'max':
      // 最大版本要求：当前版本 <= 指定版本
      shouldShow = compareVersions(currentVersion, value) <= 0
      break
      
    case 'range':
      // 版本范围：当前版本在指定范围内
      if (Array.isArray(value) && value.length === 2) {
        const [minVersion, maxVersion] = value
        shouldShow = compareVersions(currentVersion, minVersion) >= 0 && 
                    compareVersions(currentVersion, maxVersion) <= 0
      }
      break
      
    case 'exact':
      // 精确版本：当前版本 = 指定版本
      shouldShow = compareVersions(currentVersion, value) === 0
      break
      
    default:
      // 默认行为：当前版本 >= 指定版本
      shouldShow = compareVersions(currentVersion, value) >= 0
      break
  }

  // 控制元素显示/隐藏
  el.style.display = shouldShow ? '' : 'none'
  
  // 添加版本相关的类名，方便CSS样式控制
  if (shouldShow) {
    el.classList.add('version-visible')
    el.classList.remove('version-hidden')
  } else {
    el.classList.add('version-hidden')
    el.classList.remove('version-visible')
  }
}
