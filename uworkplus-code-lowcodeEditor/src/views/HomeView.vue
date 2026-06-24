<template>
  <div class="px-4 py-6 sm:px-0">
    <div class="border-4 border-dashed border-gray-200 rounded-lg p-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Vue3 + Tailwind CSS
        </h1>
        <p class="text-lg text-gray-600 mb-8">
          这是一个使用 Vue 3、TypeScript 和 Tailwind CSS 构建的现代化应用
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Vue 3</h3>
            <p class="text-gray-600">使用最新的 Vue 3 Composition API</p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">TypeScript</h3>
            <p class="text-gray-600">完整的类型安全和智能提示</p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Tailwind CSS</h3>
            <p class="text-gray-600">实用优先的 CSS 框架</p>
          </div>
        </div>
        
        <div class="mt-12">
          <button class="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
            开始使用
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

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
