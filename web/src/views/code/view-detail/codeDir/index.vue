<template>
  <div class="code-dir">
    <CodeDir />
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, onUnmounted } from 'vue'
  import CodeDir from './CodeDir.vue'

  // 挂载时的操作
  onMounted(() => {
    // console.log('组件已挂载');
  })

  // 卸载时的操作
  onUnmounted(() => {
    // console.log('组件已卸载');
  })
</script>

<style lang="scss" scoped>
  .code-dir {
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
</style>
