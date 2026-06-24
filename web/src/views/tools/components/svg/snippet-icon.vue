<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :style="{
      width: `${width}px`,
      height: `${height}px`,
    }"
    viewBox="0 0 24 24"
  >
    <path
      :fill="color"
      d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20zm10.5-4.5v-5h1.375l1.625 1.625V15.5zM13 17h6v-5.5L16.5 9H13z"
    ></path>
  </svg>
</template>

<script setup lang="ts">
  const props = defineProps({
    width: {
      type: Number,
      default: 20,
    },
    height: {
      type: Number,
      default: 20,
    },
    color: {
      type: String,
      default: '#fff',
    },
  })
</script>

<script lang="ts">
  // 为了兼容性添加默认导出
  export default {
    name: 'SnippetIcon',
  }
</script>
