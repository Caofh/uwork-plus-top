import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const userName = computed(() => user.value?.name || '未登录')

  // 动作
  const setUser = (userData: User) => {
    user.value = userData
  }

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  const clearUser = () => {
    user.value = null
  }

  return {
    // 状态
    user,
    token,
    // 计算属性
    isLoggedIn,
    userName,
    // 动作
    setUser,
    setToken,
    logout,
    clearUser,
  }
})
