<template>
  <div class="about">
    <div class="about-text">about {{ test }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
const test = ref(1)

// 挂载时的操作
onMounted(() => {
  console.log(userStore.userName)
  // console.log('组件已挂载');
})

// 卸载时的操作
onUnmounted(() => {
  // console.log('组件已卸载');
})
</script>

<style lang="scss" scoped>
.about {
  .about-text {
    color: rgb(27, 214, 99);
  }
}
</style>
