<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :style="{ width: `${width}px`, height: `${height}px` }"
    viewBox="0 0 24 24"
  >
    <path
      :fill="color"
      d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"
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
