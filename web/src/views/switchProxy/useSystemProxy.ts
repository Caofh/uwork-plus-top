import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { SYSTEM_PROXY_PORT, SYSTEM_PROXY_CHANGED_EVENT } from './constants'
import {
  disableSystemProxy,
  enableSystemProxy,
  getSystemProxyStatus,
  installMitmCa,
  revealMitmCa,
  proxyService,
  updateSystemProxyRoutes,
} from './proxyService'

/** 全局系统代理开关切换中，供页面级 v-loading 使用 */
export const systemProxyToggleLoading = ref(false)

export function collectActiveProxyRoutes(list: Array<{ inUse?: boolean; proxyData?: unknown[] }> = []) {
  return list.reduce<unknown[]>((routes, item) => {
    if (item?.inUse && Array.isArray(item.proxyData)) {
      return routes.concat(item.proxyData)
    }
    return routes
  }, [])
}

export function useSystemProxy() {
  const enabled = ref(false)
  const running = ref(false)
  const service = ref('')
  const caTrusted = ref(false)
  const caInKeychain = ref(false)
  const mockRuleCount = ref(0)
  const loading = ref(false)
  const routes = ref<unknown[]>([])

  async function loadRoutes() {
    const list = await proxyService.readAll()
    routes.value = collectActiveProxyRoutes(list)
    return routes.value
  }

  async function refreshStatus() {
    try {
      const status = await getSystemProxyStatus()
      enabled.value = Boolean(status.enabled)
      running.value = Boolean(status.running)
      service.value = status.service || ''
      caTrusted.value = Boolean(status.caTrusted)
      caInKeychain.value = Boolean(status.caInKeychain)
      mockRuleCount.value = Number(status.mockRuleCount) || 0
    } catch (error) {
      console.warn('[systemProxy] getSystemProxyStatus failed:', error)
    }
  }

  async function syncRoutes(nextRoutes?: unknown[]) {
    if (!enabled.value) {
      return
    }
    const payload = nextRoutes ?? routes.value
    try {
      const result = await updateSystemProxyRoutes(payload)
      if (result?.code !== 0) {
        throw new Error(result?.message || '更新系统代理规则失败')
      }
      await refreshStatus()
    } catch (error) {
      ElMessage.error((error as Error)?.message || '更新系统代理规则失败')
    }
  }

  async function toggle(nextValue: boolean) {
    if (systemProxyToggleLoading.value || loading.value || nextValue === enabled.value) {
      return
    }

    systemProxyToggleLoading.value = true
    try {
      await loadRoutes()
      if (nextValue) {
        const result = await enableSystemProxy(routes.value)
        if (result?.code !== 0) {
          throw new Error(result?.message || '开启系统代理失败')
        }
        if (!result.data?.caTrusted) {
          ElMessage.warning('HTTPS 拦截需信任根证书，请点击「安装证书」')
        } else {
          ElMessage.success(`全局系统代理已开启，端口 ${SYSTEM_PROXY_PORT}`)
        }
      } else {
        const result = await disableSystemProxy()
        if (result?.code !== 0) {
          throw new Error(result?.message || '关闭系统代理失败')
        }
        window.dispatchEvent(
          new CustomEvent(SYSTEM_PROXY_CHANGED_EVENT, { detail: { enabled: false } }),
        )
        ElMessage.success('全局系统代理已关闭，所有 Mock 已关闭')
      }
      await refreshStatus()
    } catch (error) {
      ElMessage.error((error as Error)?.message || '系统代理操作失败')
      await refreshStatus()
    } finally {
      systemProxyToggleLoading.value = false
    }
  }

  async function installCertificate() {
    loading.value = true
    try {
      const result = await installMitmCa()
      if (result?.code !== 0) {
        throw new Error(result?.message || '安装证书失败')
      }
      await refreshStatus()
      if (caTrusted.value) {
        ElMessage.success('根证书已安装并信任，请重启浏览器或 Apifox 后生效')
      } else {
        ElMessage.warning('请在钥匙串访问中手动信任 NodeMITMProxyCA，并重启浏览器或 Apifox')
      }
    } catch (error) {
      ElMessage.error((error as Error)?.message || '安装证书失败')
    } finally {
      loading.value = false
    }
  }

  async function revealCertificate() {
    loading.value = true
    try {
      const result = await revealMitmCa()
      if (result?.code !== 0) {
        throw new Error(result?.message || '打开证书失败')
      }
    } catch (error) {
      ElMessage.error((error as Error)?.message || '打开证书失败')
    } finally {
      loading.value = false
    }
  }

  async function init() {
    await Promise.all([loadRoutes(), refreshStatus()])
  }

  return {
    enabled,
    running,
    service,
    caTrusted,
    caInKeychain,
    mockRuleCount,
    loading,
    routes,
    loadRoutes,
    refreshStatus,
    syncRoutes,
    toggle,
    installCertificate,
    revealCertificate,
    init,
  }
}
