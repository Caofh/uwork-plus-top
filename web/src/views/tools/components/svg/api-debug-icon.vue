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
      d="M4 6h16v2H4zm0 5h10v2H4zm0 5h16v2H4z"
    />
    <path
      :fill="color"
      d="M17 10.5l3 1.5l-3 1.5V10.5z"
      opacity="0.9"
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
    name: 'ApiDebugIcon',
  }
</script>
