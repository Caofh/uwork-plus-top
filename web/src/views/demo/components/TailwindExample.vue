<template>
  <div class="tailwind-example">
    <!-- 基础样式示例 -->
    <div
      class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg mb-6"
      style="
        background-color: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
      "
    >
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Tailwind CSS 基础样式</h2>

      <!-- 颜色系统 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-primary text-primary-foreground p-4 rounded-md text-center">主色调</div>
        <div class="bg-secondary text-secondary-foreground p-4 rounded-md text-center">次要色</div>
        <div class="bg-accent text-accent-foreground p-4 rounded-md text-center">强调色</div>
        <div class="bg-destructive text-destructive-foreground p-4 rounded-md text-center">
          危险色
        </div>
      </div>

      <!-- 间距和布局 -->
      <div class="space-y-4">
        <div class="flex items-center space-x-4">
          <div class="w-16 h-16 bg-blue-500 rounded-lg"></div>
          <div class="w-16 h-16 bg-green-500 rounded-lg"></div>
          <div class="w-16 h-16 bg-yellow-500 rounded-lg"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">响应式网格</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">
              这个卡片在小屏幕上会占满宽度，在大屏幕上会显示为3列布局。
            </p>
          </div>
          <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">自适应布局</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">
              使用 Tailwind 的响应式前缀可以轻松创建自适应布局。
            </p>
          </div>
          <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">组件化设计</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">
              每个组件都可以独立使用，便于维护和复用。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 动画示例 -->
    <div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">动画效果</h2>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="animate-fade-in bg-blue-500 p-6 rounded-lg text-white text-center">
          淡入动画
        </div>
        <div class="animate-slide-up bg-green-500 p-6 rounded-lg text-white text-center">
          滑入动画
        </div>
        <div class="animate-scale-in bg-purple-500 p-6 rounded-lg text-white text-center">
          缩放动画
        </div>
        <div class="animate-bounce-in bg-orange-500 p-6 rounded-lg text-white text-center">
          弹跳动画
        </div>
      </div>
    </div>

    <!-- 交互状态示例 -->
    <div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">交互状态</h2>

      <div class="space-y-4">
        <button
          class="bg-el-primary hover:bg-el-primary-light-3 active:bg-el-primary-dark-2 text-white px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          悬停和点击效果
        </button>

        <div class="flex space-x-4">
          <div class="group cursor-pointer">
            <div
              class="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors duration-200"
            >
              <h4
                class="font-medium text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300"
              >
                组悬停效果
              </h4>
              <p class="text-gray-600 dark:text-gray-400 text-sm">鼠标悬停时整个组都会改变样式</p>
            </div>
          </div>

          <div class="group cursor-pointer">
            <div
              class="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg group-hover:bg-green-100 dark:group-hover:bg-green-900 transition-colors duration-200"
            >
              <h4
                class="font-medium text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-300"
              >
                另一个组
              </h4>
              <p class="text-gray-600 dark:text-gray-400 text-sm">每个组都有独立的悬停状态</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 表单样式示例 -->
    <div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">表单样式</h2>

      <form class="space-y-4 max-w-md">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            用户名
          </label>
          <input
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-el-primary focus:border-el-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="请输入用户名"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            邮箱
          </label>
          <input
            type="email"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-el-primary focus:border-el-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="请输入邮箱"
          />
        </div>

        <button
          type="submit"
          class="w-full bg-el-primary hover:bg-el-primary-light-3 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          提交
        </button>
      </form>
    </div>

    <!-- 卡片组件示例 -->
    <div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">卡片组件</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          class="bg-card text-card-foreground rounded-lg border border-border shadow-sm overflow-hidden"
        >
          <div class="h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-2">渐变背景卡片</h3>
            <p class="text-muted-foreground text-sm mb-4">
              这是一个使用 Tailwind 渐变类的卡片示例，展示了如何创建美观的背景效果。
            </p>
            <button
              class="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              了解更多
            </button>
          </div>
        </div>

        <div
          class="bg-card text-card-foreground rounded-lg border border-border shadow-sm overflow-hidden"
        >
          <div class="h-48 bg-gradient-to-br from-green-400 to-blue-500"></div>
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-2">响应式设计</h3>
            <p class="text-muted-foreground text-sm mb-4">
              这个卡片会根据屏幕大小自动调整布局，确保在所有设备上都有良好的显示效果。
            </p>
            <button
              class="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              查看详情
            </button>
          </div>
        </div>

        <div
          class="bg-card text-card-foreground rounded-lg border border-border shadow-sm overflow-hidden"
        >
          <div class="h-48 bg-gradient-to-br from-orange-400 to-red-500"></div>
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-2">主题支持</h3>
            <p class="text-muted-foreground text-sm mb-4">
              支持明暗主题切换，使用 CSS 变量确保颜色的一致性和可维护性。
            </p>
            <button
              class="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              开始使用
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  // 组件逻辑
  const title = ref('Tailwind CSS 示例')
</script>

<style scoped>
  /* 可以在这里添加组件特定的样式 */
  .tailwind-example {
    max-width: 80rem; /* 相当于 max-w-7xl */
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
</style>
