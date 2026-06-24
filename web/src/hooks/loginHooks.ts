import { computed } from 'vue'
import { useCommonStore } from '@/store/common'
import { removeCookie } from '@/utils/cookie'

export const useLoginHooks = () => {
  const commonStore = useCommonStore()
  const token = computed(() => commonStore.token)
  const showLoginVisible = computed(() => commonStore.showLoginVisible)

  const showLogin = (payload: boolean = true) => {
    commonStore.updateShowLoginVisible(payload)
  }

  const isLogin = computed(() => {
    return token.value !== ''
  })

  const logout = () => {
    removeCookie('UworkPlus_token')
    commonStore.updateToken('')
    commonStore.updateShowLoginVisible(false)
  }

  return {
    token,
    showLoginVisible,
    showLogin,
    isLogin,
    logout,
  }
}
