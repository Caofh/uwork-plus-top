<template>
  <div class="container-layout">
    <slot></slot>
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, ref, reactive } from 'vue'

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
  .container-layout {
    // width: 100vw;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    // padding: 24px;
    padding: 24px 24px 24px 0;
  }
</style>
