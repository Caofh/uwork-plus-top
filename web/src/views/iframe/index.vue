<template>
  <div class="iframe">
    <div v-if="urlToken" class="login-success c-flex-x-center">
      <span class="text-success">登录成功</span>
    </div>
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, ref, reactive } from 'vue'
  import { urlToJson } from '@/utils/urlQuery'
  import { setCookie } from '@/utils/cookie'
  import { appApiCommon } from '@/utils/service'
  import { setStorage } from '@/utils/storage'
  import { remoteUrl } from '@/config/remote'

  const ssoBase = remoteUrl('/sso/login')
  const url = ssoBase
    ? `${ssoBase}?loginMode=2&redirectUrl=${window.location.href}&systemName=UworkPlus&timestamp=${new Date().getTime()}`
    : ''

  const { paramJson } = urlToJson()
  const { token } = paramJson
  const urlToken = ref(token)

  // 挂载时的操作
  onMounted(async () => {
    console.log('iframe 页面已加载')
    console.log('当前 token:', urlToken.value)

    // 处理登录回来的token
    if (urlToken.value) {
      console.log('检测到 token，准备发送消息给主应用')

      const token = decodeURIComponent(urlToken.value)

      // 设置cookie
      var in15Minutes = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30) // 1个月过期
      setCookie('UworkPlus_token', token, {
        expires: in15Minutes, // 过期时间（毫秒）
      })

      const res = await appApiCommon.getUserInfo().then()
      const userInfo = res.data || null
      if (userInfo && userInfo.uid) {
        setStorage('userInfo', userInfo)
      }

      // 发送消息给主应用
      setTimeout(() => {
        const message = {
          type: 'LOGIN_SUCCESS',
          data: {
            token: token,
            userInfo: userInfo,
          },
        }
        window.parent.postMessage(message, '*')
      }, 1200)
    } else {
      window.location.href = url
    }
  })

  // 测试方法
  const sendTestMessage = () => {
    const testMessage = {
      type: 'TEST',
      data: '手动发送的测试消息',
    }
    console.log('手动发送测试消息:', testMessage)
    window.parent.postMessage(testMessage, '*')
  }

  const sendLoginMessage = () => {
    const loginMessage = {
      type: 'LOGIN_SUCCESS',
      data: {
        token: 'test-token-' + Date.now(),
      },
    }
    console.log('手动发送登录消息:', loginMessage)
    window.parent.postMessage(loginMessage, '*')
  }

  // 卸载时的操作
  onUnmounted(() => {})
</script>

<style lang="scss" scoped>
  .iframe {
    width: 100vw;
    height: 100vh;

    .test-controls {
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 1000;
      display: flex;
      gap: 10px;

      .test-btn {
        padding: 8px 16px;
        background: #409eff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
          background: #337ecc;
        }
      }
    }

    iframe {
      width: 100%;
      height: 100%;
    }

    .login-success {
      width: 100%;
      height: 100%;
      .text-success {
        color: var(--el-color-success);
      }
    }
  }
</style>
