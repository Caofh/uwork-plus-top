import { reactive, ref } from 'vue'

export const useContextMenu = () => {
  // 显示右键菜单
  const contextMenuVisible = ref(false)
  const contextMenuPosition = reactive({ x: 0, y: 0 })
  const currentContextItem = ref(null)
  const showContextMenu = (event, item) => {
    event.preventDefault()
    currentContextItem.value = item
    contextMenuPosition.x = event.clientX - 92 + 10
    contextMenuPosition.y = event.clientY - 15
    contextMenuVisible.value = true

    // 点击其他地方隐藏菜单
    setTimeout(() => {
      document.addEventListener('click', hideContextMenu, { once: true })
    }, 0)
  }

  // 隐藏右键菜单
  const hideContextMenu = () => {
    contextMenuVisible.value = false
    currentContextItem.value = null
  }

  return {
    contextMenuVisible,
    contextMenuPosition,
    currentContextItem,
    showContextMenu,
    hideContextMenu,
  }
}
