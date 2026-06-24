<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="w-[100vw] pt-[32px]">
    <!-- <header class="max-w-[1500px] mx-auto h-[64px] pt-[20px]">
      <nav class="flex space-x-8">
        <RouterLink
          to="/"
          class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          active-class="text-primary-600 bg-primary-50"
        >
          Home
        </RouterLink>
        <RouterLink
          to="/about"
          class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          active-class="text-primary-600 bg-primary-50"
        >
          About
        </RouterLink>
        <RouterLink
          to="/example"
          class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          active-class="text-primary-600 bg-primary-50"
        >
          Example
        </RouterLink>
        <RouterLink
          to="/editor"
          class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          active-class="text-primary-600 bg-primary-50"
        >
          Editor
        </RouterLink>
      </nav>
    </header> -->

    <main class="max-w-[1500px] mx-auto h-[calc(100vh-64px)]">
      <RouterView />
    </main>
  </div>
</template>

<style scoped></style>
