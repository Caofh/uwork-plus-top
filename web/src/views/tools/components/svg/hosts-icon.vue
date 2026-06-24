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
      d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m0 2v12h16V6zm2 2h8v2H6zm0 4h12v2H6zm0 4h10v2H6z"
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
    name: 'HostsIcon',
  }
</script>
