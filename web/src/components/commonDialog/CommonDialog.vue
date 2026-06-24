<template>
  <div class="dialog-custom-container">
    <el-dialog
      v-model="visible"
      :title="title"
      :width="width"
      :fullscreen="fullscreen"
      :top="top"
      :modal="modal"
      :append-to-body="appendToBody"
      :lock-scroll="lockScroll"
      :close-on-click-modal="closeOnClickModal"
      :close-on-press-escape="closeOnPressEscape"
      :show-close="showClose"
      :before-close="handleBeforeClose"
      :destroy-on-close="destroyOnClose"
      :center="center"
      :draggable="draggable"
      :class="customClass"
      @open="handleOpen"
      @opened="handleOpened"
      @close="handleClose"
      @closed="handleClosed"
    >
      <!-- 头部插槽 -->
      <template #header="{ close, titleId, titleClass }" v-if="$slots.header">
        <slot name="header" :close="close" :titleId="titleId" :titleClass="titleClass" />
      </template>

      <!-- 默认内容插槽 -->
      <div class="dialog-content">
        <slot />
      </div>

      <!-- 底部插槽 -->
      <template #footer v-if="$slots.footer">
        <slot name="footer" />
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue'

  interface Props {
    modelValue: boolean
    title?: string
    width?: string | number
    fullscreen?: boolean
    top?: string
    modal?: boolean
    appendToBody?: boolean
    lockScroll?: boolean
    closeOnClickModal?: boolean
    closeOnPressEscape?: boolean
    showClose?: boolean
    destroyOnClose?: boolean
    center?: boolean
    draggable?: boolean
    customClass?: string
    beforeClose?: (done: () => void) => void
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'open'): void
    (e: 'opened'): void
    (e: 'close'): void
    (e: 'closed'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    title: '',
    width: '50%',
    fullscreen: false,
    top: '15vh',
    modal: true,
    appendToBody: false,
    lockScroll: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    showClose: true,
    destroyOnClose: false,
    center: false,
    draggable: false,
    customClass: '',
    beforeClose: undefined,
  })

  const emit = defineEmits<Emits>()

  // 弹窗显示状态
  const visible = ref(false)

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    newVal => {
      visible.value = newVal
    }
  )

  // 监听 visible 变化
  watch(visible, newVal => {
    emit('update:modelValue', newVal)
  })

  // 处理关闭前回调
  const handleBeforeClose = (done: () => void) => {
    if (props.beforeClose) {
      props.beforeClose(done)
    } else {
      done()
    }
  }

  // 打开事件
  const handleOpen = () => {
    emit('open')
  }

  // 打开完成事件
  const handleOpened = () => {
    emit('opened')
  }

  // 关闭事件
  const handleClose = () => {
    emit('close')
  }

  // 关闭完成事件
  const handleClosed = () => {
    emit('closed')
  }

  // 暴露方法给父组件
  defineExpose({
    open: () => {
      visible.value = true
    },
    close: () => {
      visible.value = false
    },
  })

  // 导出组件属性类型
  export type DialogProps = typeof props
</script>

<style lang="scss" scoped>
  .dialog-custom-container {
    .dialog-content {
      // 默认样式，可以根据需要自定义
    }

    :deep(.el-dialog) {
      // width: 90% !important;
      // margin: 5vh auto;
      margin: 0;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
    }
  }
</style>
