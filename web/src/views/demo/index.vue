<template>
  <div class="demo">
    <TailwindExample />
    <ConfigExample />
    <AxiosExample />
    <VersionExample />
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, ref, reactive } from 'vue'

  import ConfigExample from './components/config-example.vue'
  import AxiosExample from './components/axios-example.vue'
  import TailwindExample from './components/TailwindExample.vue'
  import VersionExample from './components/VersionExample.vue'

  // 挂载时的操作
  onMounted(() => {
    // console.log('组件已挂载');
  })

  // 卸载时的操作
  onUnmounted(() => {
    // console.log('组件已卸载');
  })
</script>

<style lang="scss" scoped></style>
