<template>
  <div class="tools-container">
    <div class="tools-container-nav">
      <el-menu
        :key="menuRenderKey"
        mode="horizontal"
        :default-active="defaultActive"
        class="tools-top-menu"
        @open="handleOpen"
        @close="handleClose"
        @select="handleMenuSelect"
      >
        <RecursiveMenuItem
          v-for="item in visibleMenuData"
          :key="item.index"
          :item="item"
          :default-active="defaultActive"
        />
      </el-menu>
    </div>
    <div class="tools-container-content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted, markRaw, provide } from 'vue'
  import RecursiveMenuItem from './components/RecursiveMenuItem.vue'
  import { type MenuItem } from './mock/menuData'
  import { useRouter, useRoute } from 'vue-router'
  import { useLoginHooks } from '@/hooks/loginHooks'
  import { afterVersion } from '@/utils/version'
  import eventBus from '@/utils/eventBus'
  import { ElMessage } from 'element-plus'

  import JsonIcon from './components/svg/json-icon.vue'
  import SnippetIcon from './components/svg/snippet-icon.vue'
  import WebIcon from './components/svg/web-icon.vue'
  import CodeIcon from './components/svg/code-icon.vue'
  import ScaffoldIcon from './components/svg/scaffold-icon.vue'
  import ProxyIcon from './components/svg/proxy-icon.vue'
  import HostsIcon from './components/svg/hosts-icon.vue'
  import ApiDebugIcon from './components/svg/api-debug-icon.vue'

  const router = useRouter()
  const route = useRoute()
  const { token, showLogin } = useLoginHooks()

  const isCollapse = ref(false)
  const defaultActive = ref('1')
  const menuRenderKey = ref(0)

  const parentProvidePool = {
    provideIsCollapse: isCollapse,
  }
  provide('parentProvide', parentProvidePool)

  const menuData = ref<MenuItem[]>([
    {
      index: '1',
      title: '接口代理',
      customIcon: markRaw(ProxyIcon),
      path: 'switchProxy',
      children: [],
    },
    {
      index: '2',
      title: 'Hosts 管理',
      customIcon: markRaw(HostsIcon),
      path: 'switchHosts',
      minVersion: '1.10.0',
      children: [],
    },
    {
      index: '8',
      title: '接口调试',
      customIcon: markRaw(ApiDebugIcon),
      path: 'apiDebug',
      minVersion: '1.11.0',
      children: [],
    },
    {
      index: '3',
      title: '代码沉淀',
      customIcon: markRaw(CodeIcon),
      path: 'code',
      requireLogin: true,
      minVersion: '1.5.8',
      children: [],
    },
    {
      index: '4',
      title: '脚手架',
      customIcon: markRaw(ScaffoldIcon),
      path: 'scaffold',
      children: [],
    },
    {
      index: '5',
      title: 'JSON转换器',
      customIcon: markRaw(JsonIcon),
      icon: 'Watermelon',
      path: 'jsonView',
      children: [],
    },
    {
      index: '6',
      title: 'JSON比对',
      customIcon: markRaw(SnippetIcon),
      icon: 'Pear',
      path: 'responseCompare',
      children: [],
    },
    {
      index: '7',
      title: 'Webview',
      customIcon: markRaw(WebIcon),
      icon: 'Monitor',
      path: 'webview',
      children: [],
    },
  ])

  const visibleMenuData = computed(() =>
    menuData.value.filter(item => !item.minVersion || afterVersion(item.minVersion)),
  )

  const handleOpen = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
  }

  const handleClose = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
  }

  const restoreActiveMenu = () => {
    syncActiveFromRoute()
    menuRenderKey.value += 1
  }

  const pushToolRoute = (path: string, replace = false) => {
    const location = {
      path,
      query: { ...route.query },
    }
    if (replace) {
      router.replace(location)
    } else {
      router.push(location)
    }
  }

  const navigateToTool = (item: MenuItem) => {
    defaultActive.value = String(item.index)
    if (item.path) {
      pushToolRoute(`/tools/${item.path}`)
    }
  }

  const handleMenuSelect = (index: string) => {
    const item = visibleMenuData.value.find(menuItem => menuItem.index === index)
    if (!item) {
      return
    }

    if (item.requireLogin && !token.value) {
      restoreActiveMenu()
      setTimeout(() => {
        eventBus.off('login:success')
        eventBus.on('login:success', () => {
          setTimeout(() => {
            navigateToTool(item)
          }, 200)
        })
        showLogin(true)
      }, 200)
      return
    }

    navigateToTool(item)
  }

  const syncActiveFromRoute = () => {
    const current = visibleMenuData.value.find(item => route.path.includes(item.path || ''))
    if (current) {
      defaultActive.value = current.index
      return true
    }
    if (route.path.includes('/tools/apiDebug') && !afterVersion('1.11.0')) {
      pushToolRoute('/tools/switchProxy', true)
      return true
    }
    return false
  }

  onMounted(() => {
    if (!syncActiveFromRoute()) {
      pushToolRoute('/tools/switchProxy')
    }
  })
</script>

<style lang="scss" scoped>
  .tools-container {
    --tools-nav-offset: 52px;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;

    .tools-container-nav {
      flex-shrink: 0;
      width: 100%;
      margin-bottom: 20px;

      .tools-top-menu {
        border-bottom: none;
        background: transparent;
        height: auto;

        :deep(.el-menu-item),
        :deep(.el-menu-item.is-active) {
          --el-menu-hover-bg-color: transparent;
          --el-menu-bg-color: transparent;
        }

        :deep(.el-menu-item) {
          height: 32px;
          line-height: 32px;
          padding: 0 12px;
          font-size: 13px;
          border-bottom: none;
          background: transparent;

          &:hover,
          &:focus {
            background: transparent !important;
          }
        }

        :deep(.el-menu-item.is-active) {
          background: transparent !important;
          border-bottom: none !important;

          &:hover,
          &:focus {
            background: transparent !important;
          }
        }

        :deep(.el-menu-item .el-icon) {
          margin-right: 4px;
        }
      }
    }

    .tools-container-content {
      flex: 1;
      min-height: 0;
      min-width: 0;
      overflow-y: auto;
    }
  }
</style>
