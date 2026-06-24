<template>
  <div class="custom-scrollbar-container" ref="containerRef">
    <div class="custom-scrollbar-content" ref="contentRef">
      <slot></slot>
    </div>
    <div class="custom-scrollbar-track" ref="trackRef" @mousedown="handleTrackClick">
      <div
        class="custom-scrollbar-thumb"
        ref="thumbRef"
        :style="thumbStyle"
        @mousedown.stop="handleThumbMouseDown"
      ></div>
    </div>
  </div>
</template>

<script setup>
   import { ref, onMounted, onUnmounted, computed, nextTick, watch, watchEffect } from 'vue'

  const props = defineProps({
    // 滚动条宽度
    width: {
      type: Number,
      default: 8,
    },
    // 滚动条颜色
    color: {
      type: String,
      default: 'rgba(255, 255, 255, 0.5)',
    },
    // 滚动条轨道颜色
    trackColor: {
      type: String,
      default: '#000000',
    },
    // 悬停时颜色
    hoverColor: {
      type: String,
      default: 'rgba(255, 255, 255, 0.7)',
    },
    // 强制显示滚动条
    forceShow: {
      type: Boolean,
      default: false,
    },
  })

  const containerRef = ref(null)
  const contentRef = ref(null)
  const trackRef = ref(null)
  const thumbRef = ref(null)

   const scrollTop = ref(0)
   const isDragging = ref(false)
   const dragStartY = ref(0)
   const dragStartScrollTop = ref(0)
   const isMounted = ref(false)
   const contentHeight = ref(0)
   const containerHeight = ref(0)

  // 重新计算内容尺寸
  const recalculateDimensions = () => {
    if (!contentRef.value || !containerRef.value) return
    
    const newContentHeight = contentRef.value.scrollHeight
    const newContainerHeight = containerRef.value.offsetHeight
    
    // console.log('Recalculating dimensions:', {
    //   oldContentHeight: contentHeight.value,
    //   newContentHeight,
    //   oldContainerHeight: containerHeight.value,
    //   newContainerHeight
    // })
    
    contentHeight.value = newContentHeight
    containerHeight.value = newContainerHeight
    
    // 重新初始化滚动位置
    scrollTop.value = contentRef.value.scrollTop
  }

  // 计算滚动条滑块的位置和高度
  const thumbStyle = computed(() => {
    // 确保组件已挂载且所有ref都已准备好
    if (!isMounted.value || !contentRef.value || !trackRef.value || !containerRef.value) {
      // console.log('ThumbStyle: Not ready yet', {
      //   isMounted: isMounted.value,
      //   content: !!contentRef.value,
      //   track: !!trackRef.value,
      //   container: !!containerRef.value,
      // })
      return {}
    }

    const currentContentHeight = contentRef.value.scrollHeight
    const currentContainerHeight = containerRef.value.offsetHeight
    const trackHeight = trackRef.value.offsetHeight

    // 如果尺寸发生变化，重新计算
    if (currentContentHeight !== contentHeight.value || currentContainerHeight !== containerHeight.value) {
      recalculateDimensions()
    }

    // console.log('ThumbStyle calculation:', {
    //   contentHeight: contentHeight.value,
    //   containerHeight: containerHeight.value,
    //   trackHeight,
    //   scrollTop: scrollTop.value,
    //   forceShow: props.forceShow,
    // })

    if (contentHeight.value <= containerHeight.value && !props.forceShow) {
      return { display: 'none' }
    }

    // 如果强制显示，使用最小高度
    const thumbHeight =
      props.forceShow && contentHeight.value <= containerHeight.value
        ? 20
        : Math.max(20, (containerHeight.value / contentHeight.value) * trackHeight)

    const maxScrollTop = Math.max(0, contentHeight.value - containerHeight.value)
    const availableTrackHeight = trackHeight - thumbHeight
    const thumbTop =
      maxScrollTop > 0 && availableTrackHeight > 0
        ? (scrollTop.value / maxScrollTop) * availableTrackHeight
        : 0

    const style = {
      height: `${thumbHeight}px`,
      top: `${thumbTop}px`,
      backgroundColor: isDragging.value ? props.hoverColor : props.color,
      width: `${props.width}px`,
    }

    // console.log('ThumbStyle result:', style)
    return style
  })

  // 更新滚动位置
  const updateScrollTop = newScrollTop => {
    if (!contentRef.value || !containerRef.value) return

    const maxScrollTop = contentRef.value.scrollHeight - containerRef.value.offsetHeight
    scrollTop.value = Math.max(0, Math.min(newScrollTop, maxScrollTop))
    contentRef.value.scrollTop = scrollTop.value
  }

  // 处理内容滚动 - 使用requestAnimationFrame优化
  let scrollAnimationId = null
  const handleContentScroll = () => {
    if (!contentRef.value) return

    if (scrollAnimationId) {
      cancelAnimationFrame(scrollAnimationId)
    }

    scrollAnimationId = requestAnimationFrame(() => {
      scrollTop.value = contentRef.value.scrollTop
      scrollAnimationId = null
    })
  }

  // 处理轨道点击
  const handleTrackClick = e => {
    if (!trackRef.value || !contentRef.value || !containerRef.value) return

    const rect = trackRef.value.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const trackHeight = trackRef.value.offsetHeight
    const contentHeight = contentRef.value.scrollHeight
    const containerHeight = containerRef.value.offsetHeight
    const maxScrollTop = contentHeight - containerHeight

    // 计算滑块高度
    const thumbHeight = Math.max(20, (containerHeight / contentHeight) * trackHeight)
    const availableTrackHeight = trackHeight - thumbHeight

    // 计算点击位置相对于可用轨道高度的比例
    const scrollRatio = availableTrackHeight > 0 ? clickY / availableTrackHeight : 0
    const newScrollTop = Math.min(scrollRatio * maxScrollTop, maxScrollTop)

    updateScrollTop(newScrollTop)
  }

  // 处理滑块拖拽开始
  const handleThumbMouseDown = e => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.value = true

    const thumbRect = thumbRef.value.getBoundingClientRect()
    const trackRect = trackRef.value.getBoundingClientRect()

    // 记录鼠标在滑块内的相对位置
    dragStartY.value = e.clientY - thumbRect.top
    dragStartScrollTop.value = scrollTop.value

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 处理鼠标移动
  const handleMouseMove = e => {
    if (!isDragging.value || !trackRef.value || !contentRef.value || !containerRef.value) return

    const trackRect = trackRef.value.getBoundingClientRect()
    const contentHeight = contentRef.value.scrollHeight
    const containerHeight = containerRef.value.offsetHeight
    const trackHeight = trackRef.value.offsetHeight
    const maxScrollTop = contentHeight - containerHeight

    // 计算鼠标在轨道中的位置
    const mouseY = e.clientY - trackRect.top
    const thumbHeight = Math.max(20, (containerHeight / contentHeight) * trackHeight)

    // 计算滑块应该移动到的位置（考虑滑块高度）
    const availableTrackHeight = trackHeight - thumbHeight
    const thumbTop = Math.max(0, Math.min(mouseY - dragStartY.value, availableTrackHeight))

    // 根据滑块位置计算滚动位置
    const scrollRatio = availableTrackHeight > 0 ? thumbTop / availableTrackHeight : 0
    const newScrollTop = scrollRatio * maxScrollTop

    updateScrollTop(newScrollTop)
  }

  // 处理鼠标释放
  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // 处理悬停效果
  const handleThumbMouseEnter = () => {
    if (!isDragging.value && thumbRef.value) {
      thumbRef.value.style.backgroundColor = props.hoverColor
    }
  }

  const handleThumbMouseLeave = () => {
    if (!isDragging.value && thumbRef.value) {
      thumbRef.value.style.backgroundColor = props.color
    }
  }

  // 监听内容变化
  let resizeObserver = null
  let mutationObserver = null
  
  watchEffect(() => {
    if (isMounted.value && contentRef.value) {
      // 使用 ResizeObserver 监听尺寸变化
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      
      resizeObserver = new ResizeObserver(() => {
        console.log('Content size changed, recalculating...')
        recalculateDimensions()
      })
      
      resizeObserver.observe(contentRef.value)
      
      // 使用 MutationObserver 监听内容变化
      if (mutationObserver) {
        mutationObserver.disconnect()
      }
      
      mutationObserver = new MutationObserver(() => {
        console.log('Content structure changed, recalculating...')
        recalculateDimensions()
      })
      
      mutationObserver.observe(contentRef.value, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      })
      
      // 清理函数
      return () => {
        if (resizeObserver) {
          resizeObserver.disconnect()
        }
        if (mutationObserver) {
          mutationObserver.disconnect()
        }
      }
    }
  })

  onMounted(() => {
    nextTick(() => {
      // console.log('Component mounted, setting up...')

      if (contentRef.value) {
        contentRef.value.addEventListener('scroll', handleContentScroll, { passive: true })
        // 初始化滚动位置
        scrollTop.value = contentRef.value.scrollTop
        // console.log('Content ref ready, scrollTop:', scrollTop.value)
      }

      if (thumbRef.value) {
        thumbRef.value.addEventListener('mouseenter', handleThumbMouseEnter)
        thumbRef.value.addEventListener('mouseleave', handleThumbMouseLeave)
        // console.log('Thumb ref ready')
      }

      // 标记组件已挂载
      isMounted.value = true
      // console.log('All refs ready, isMounted set to true')
      
      // 初始化尺寸
      recalculateDimensions()
    })
  })

  onUnmounted(() => {
    if (contentRef.value) {
      contentRef.value.removeEventListener('scroll', handleContentScroll)
    }

    if (thumbRef.value) {
      thumbRef.value.removeEventListener('mouseenter', handleThumbMouseEnter)
      thumbRef.value.removeEventListener('mouseleave', handleThumbMouseLeave)
    }

    if (scrollAnimationId) {
      cancelAnimationFrame(scrollAnimationId)
    }

    // 清理观察器
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
    if (mutationObserver) {
      mutationObserver.disconnect()
    }

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  })
</script>

<style scoped>
  .custom-scrollbar-container {
    position: relative;
    height: 100%;
    overflow: hidden;
  }

  .custom-scrollbar-content {
    width: calc(100% - 8px);
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 0;
    margin-right: 0;
    /* 隐藏原生滚动条 */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .custom-scrollbar-content::-webkit-scrollbar {
    display: none;
  }

  .custom-scrollbar-track {
    position: absolute;
    right: 0;
    top: 0;
    width: 8px;
    height: 100%;
    background: v-bind(trackColor);
    /* border-radius: 4px; */
    cursor: pointer;
    transition: background-color 0.2s ease;
    border-left: 0.5px solid #cccccc;
  }

  .custom-scrollbar-track:hover {
    background: v-bind(trackColor);
  }

  .custom-scrollbar-thumb {
    position: absolute;
    left: 0;
    width: 8px;
    background: v-bind(color);
    /* border-radius: 4px; */
    cursor: auto;
    /* transition: all 0.2s ease; */
    min-height: 20px;
  }

  .custom-scrollbar-thumb:hover {
    background: v-bind(hoverColor);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  }

  .custom-scrollbar-thumb:active {
    /* cursor: grabbing; */
    cursor: auto;
    background: v-bind(hoverColor);
  }
</style>
