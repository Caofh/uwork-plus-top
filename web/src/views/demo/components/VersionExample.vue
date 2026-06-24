<template>
  <div class="version-example">
    <h2>版本控制指令示例</h2>
    <p>当前版本: {{ currentVersion }}</p>
    
    <!-- 基本用法：当前版本 >= 1.5.7 时显示 -->
    <div v-version="'1.5.7'" class="version-item">
      <h3>基本用法</h3>
      <p>这个元素只在版本 >= 1.5.7 时显示</p>
    </div>
    
    <!-- 最小版本要求 -->
    <div v-version:min="'1.5.8'" class="version-item">
      <h3>最小版本要求</h3>
      <p>这个元素只在版本 >= 1.5.8 时显示</p>
    </div>
    
    <!-- 最大版本要求 -->
    <div v-version:max="'2.0.0'" class="version-item">
      <h3>最大版本要求</h3>
      <p>这个元素只在版本 <= 2.0.0 时显示</p>
    </div>
    
    <!-- 版本范围 -->
    <div v-version:range="['1.5.0', '2.0.0']" class="version-item">
      <h3>版本范围</h3>
      <p>这个元素只在版本 1.5.0 到 2.0.0 之间时显示</p>
    </div>
    
    <!-- 精确版本 -->
    <div v-version:exact="'1.5.7'" class="version-item">
      <h3>精确版本</h3>
      <p>这个元素只在版本 = 1.5.7 时显示</p>
    </div>
    
    <!-- 简化用法 -->
    <div v-v-version="'1.5.6'" class="version-item">
      <h3>简化用法</h3>
      <p>这个元素只在版本 >= 1.5.6 时显示（简化指令）</p>
    </div>
    
    <!-- 版本过低提示 -->
    <div v-version:min="'2.0.0'" class="version-item error">
      <h3>版本过低提示</h3>
      <p>您的版本过低，请升级到 2.0.0 或更高版本</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCommonStore } from '@/store/common'

const commonStore = useCommonStore()
const currentVersion = computed(() => commonStore.currentVersion)
</script>

<style scoped>
.version-example {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.version-item {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.version-item.error {
  background-color: #ffe6e6;
  border-color: #ff9999;
}

.version-item h3 {
  margin-top: 0;
  color: #333;
}

.version-item p {
  margin-bottom: 0;
  color: #666;
}

/* 版本控制相关的样式类 */
.version-visible {
  opacity: 1;
  transition: opacity 0.3s ease;
}

.version-hidden {
  opacity: 0;
  transition: opacity 0.3s ease;
}
</style>
