<template>
  <div class="example-view">
    <h1>Vue3 + Vite + TypeScript 示例页面</h1>

    <div class="sections">
      <!-- Element Plus 组件示例 -->
      <section class="section">
        <h2>Element Plus 组件示例</h2>
        <div class="element-demo">
          <el-card class="box-card">
            <template #header>
              <div class="card-header">
                <span>Element Plus 卡片</span>
              </div>
            </template>
            <el-button type="primary" @click="showMessage">显示消息</el-button>
            <el-button type="success" @click="showNotification">显示通知</el-button>
            <el-button type="warning" @click="showDialog">显示对话框</el-button>
          </el-card>
          
          <el-form :model="form" label-width="120px" style="margin-top: 20px;">
            <el-form-item label="用户名">
              <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="form.password" type="password" placeholder="请输入密码"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitForm">提交</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </section>

      <!-- Pinia Store 示例 -->
      <section class="section">
        <h2>Pinia Store 示例</h2>
        <div class="user-info">
          <p>登录状态: {{ isLoggedIn ? '已登录' : '未登录' }}</p>
          <p>用户名: {{ userName }}</p>
          <p>计数器: {{ count }}</p>
          <el-button type="primary" @click="increment">增加计数</el-button>
          <el-button type="danger" @click="decrement">减少计数</el-button>
        </div>
      </section>

      <!-- API 调用示例 -->
      <section class="section">
        <h2>API 调用示例</h2>
        <div class="api-demo">
          <button @click="fetchData" :disabled="loading">
            {{ loading ? '加载中...' : '获取数据' }}
          </button>
          <div v-if="error" class="error">错误: {{ error }}</div>
          <div v-if="data" class="success">数据: {{ JSON.stringify(data) }}</div>
        </div>
      </section>

      <!-- 路由导航示例 -->
      <section class="section">
        <h2>路由导航示例</h2>
        <nav class="nav-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/about" class="nav-link">关于</router-link>
        </nav>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import { useCounterStore } from '@/stores/counter'
import { useUserStore } from '@/stores/user'
import { useApi } from '@/composables/useApi'

// 使用 Pinia stores
const counterStore = useCounterStore()
const userStore = useUserStore()

// 计算属性
const count = computed(() => counterStore.count)
const isLoggedIn = computed(() => userStore.isLoggedIn)
const userName = computed(() => userStore.userName)

// 使用 API composable
const { data, loading, error, execute } = useApi()

// 表单数据
const form = reactive({
  username: '',
  password: ''
})

// Element Plus 方法
const showMessage = () => {
  ElMessage.success('这是一个成功消息!')
}

const showNotification = () => {
  ElNotification({
    title: '通知标题',
    message: '这是一个通知消息',
    type: 'info'
  })
}

const showDialog = () => {
  ElMessageBox.confirm('这是一个确认对话框', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('已确认')
  }).catch(() => {
    ElMessage.info('已取消')
  })
}

const submitForm = () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写完整信息')
    return
  }
  ElMessage.success('表单提交成功!')
}

const resetForm = () => {
  form.username = ''
  form.password = ''
  ElMessage.info('表单已重置')
}

// 模拟 API 调用
const fetchData = () => {
  execute(async () => {
    // 模拟异步请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { message: 'Hello from API!', timestamp: new Date().toISOString() }
  })
}

// Store 方法
const increment = () => counterStore.increment()
const decrement = () => counterStore.decrement()
</script>

<style scoped>
.example-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.section h2 {
  margin-top: 0;
  color: #333;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-info button {
  padding: 0.5rem 1rem;
  margin-right: 0.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.user-info button:hover {
  background: #0056b3;
}

.api-demo button {
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.api-demo button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.error {
  color: #dc3545;
  margin-top: 1rem;
}

.success {
  color: #28a745;
  margin-top: 1rem;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.nav-link:hover {
  background: #545b62;
}

.nav-link.router-link-active {
  background: #007bff;
}
</style>
