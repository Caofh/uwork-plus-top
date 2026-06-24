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
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m-1 14H9V8h2zm4 0h-2V8h2z"
    />
    <path
      :fill="color"
      d="M7 10h2v4H7zm8 0h2v4h-2z"
      opacity="0.85"
    />
  </svg>
</template>

<script setup lang="ts">
  defineProps({
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
  export default {
    name: 'ProxyIcon',
  }
</script>
