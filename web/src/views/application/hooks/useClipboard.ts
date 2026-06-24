import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { appApiCommon } from '@/utils/service'
import { ElMessage } from 'element-plus'

interface ClipboardHookOptions {
  domRef?: Ref<any>
  callback?: (data: any) => void
}

// 获取实际的DOM元素（处理Vue ref的情况）
function getActualElement(domRef: Ref<any>) {
  if (domRef && domRef?.value?.$el) {
    return domRef.value.$el
  } else if (domRef && domRef?.value) {
    return domRef.value
  } else if (domRef) {
    return domRef
  }
}

/**
 * 剪贴板hook
 * @param domRef / 需要粘贴的dom元素
 * @param callback // 粘贴回调
 * @returns // 粘贴结果 上传图片函数
 */
export const useClipboardHook = ({ domRef, callback }: ClipboardHookOptions = {}) => {
  const pasteDataReault = ref({})

  async function pasteFunc(e: any) {
    // 获取实际的DOM元素（处理Vue ref的情况）
    let targetElement = getActualElement(domRef)

    // 校验事件目标是否在domRef内时，生效粘贴逻辑，不在不处理
    if (!targetElement?.contains || !targetElement?.contains(e?.target)) return

    if (e.clipboardData || e.originalEvent) {
      const clipboardData = e.clipboardData
      const types = clipboardData.types

      const pasteData = {} as any
      types.forEach((item: string) => {
        if (item === 'Files') {
          pasteData[item] = clipboardData.files
        } else {
          pasteData[item] = clipboardData.getData(item)
        }
      })
      console.log('剪贴板结果：')
      console.log(pasteData)
      if (pasteData.Files && pasteData.Files.length) {
        const res = await uploadImgFunc(pasteData.Files)
        const { data } = res

        // 上传图片成功后，返回图片url
        pasteDataReault.value = {
          ...pasteData,
          ...data,
        }
      } else {
        pasteDataReault.value = pasteData
      }

      callback && callback(pasteDataReault.value)
    }
  }
  async function uploadImgFunc(files: any) {
    const json = {
      filename: files[0],
    }
    try {
      const res = await appApiCommon.uploadImg(json)
      return res
    } catch (error) {
      ElMessage.error('上传图片失败')
      return null
    }
  }

  onMounted(() => {
    document.addEventListener('paste', pasteFunc)
  })

  onUnmounted(() => {
    document.removeEventListener('paste', pasteFunc)
  })

  return {
    pasteDataReault,
    uploadImgFunc,
  }
}
