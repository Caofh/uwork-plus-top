<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :style="{ width: `${width}px`, height: `${height}px` }"
    viewBox="0 0 24 24"
  >
    <path
      :fill="color"
      d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
    />
  </svg>
</template>

<script setup lang="ts">
  defineProps({
    width: { type: Number, default: 20 },
    height: { type: Number, default: 20 },
    color: { type: String, default: '#fff' },
  })
</script>
