<script setup>
  import { h, nextTick, onMounted, onUnmounted, ref, computed, markRaw, provide, watch } from 'vue'
  import { useRouter, RouterView, RouterLink } from 'vue-router'
  import { jsBridge, checkUpdate, isInElectron, openExternal } from '@/utils/electron'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Close } from '@element-plus/icons-vue'
  import Layout from './components/layouts/Layout.vue'
  import FlickeringGrid from './components/FlickeringGrid.vue'
  import Dock from './components/Dock.vue'
  import { tabBar } from './app'
  import { cloneDeep } from 'lodash'
  import { urlToJson } from '@/utils/urlQuery'
  import { getCookie, setCookie } from '@/utils/cookie'
  import { afterVersion } from '@/utils/version'
  import { runVoiceMatchedShScript } from '@/utils/voiceShExecute'
  import {
    mergeFloat32Chunks,
    downsampleTo16k,
    floatTo16BitPCM,
    uint8ArrayToBase64,
  } from '@/utils/voiceAudio'

  // 更新管理器
  import UpdateManagerDialog from '@/components/updateManagerDialog/UpdateManagerDialog.vue'
  import commonDialog from '@/components/commonDialog'

  // page
  import AiWebUI from './views/aiWebUi/index.vue'
  import Home from './views/home/index.vue'
  import Application from './views/application/index.vue'
  import Sh from './views/sh/index.vue'
  import Tools from './views/tools/index.vue'
  import About from './views/about/index.vue'
  import Document from './views/document/index.vue'
  import UserCenter from './views/userCenter/index.vue'

  import { useCommonStore } from './store/common'
  const commonStore = useCommonStore()

  import { taskApi } from '@/views/home/service/taskApi'
  import { countOverdueTasks } from '@/views/home/utils/taskOverdue'
  import { proxyService, startExpressApp } from '@/views/switchProxy/proxyService'
  import { hostsService, applyHostsProfiles, isHostsWriteReady } from '@/views/switchHosts/hostsService'

  import { useLoginHooks } from '@/hooks/loginHooks'
  const { showLoginVisible, token, showLogin } = useLoginHooks()

  import eventBus from '@/utils/eventBus'
  import {
    writeClipboardViaBridge,
    CLIPBOARD_WRITE_EVENT,
    CLIPBOARD_MESSAGE_TYPE,
  } from '@/utils/clipboardBridge'
  import { getStorage } from '@/utils/storage'
  import {
    resolveRemoteOrLocal,
    apiBaseCommon,
    defaultUserAvatarUrl,
    wechatProductId,
  } from '@/config/remote'

  const { paramJson } = urlToJson()
  const hasToPageParam = Boolean(String(paramJson.toPage || '').trim())

  // 获取是否显示 dock（独立窗口 toPage 模式下隐藏）
  const showDock = computed(() => commonStore.showDock && !hasToPageParam)

  /** Dock 打赏按钮点击，由父级处理（如打开打赏弹窗/链接） */
  const showTipDialog = ref(false)
  const showTipDialogSub = ref(false)
  const showVoiceDialog = ref(false)
  const voiceWakeupTime = ref('')
  const voiceListening = ref(false)
  const voiceTranscript = ref('')
  const voiceFallbackPhase = ref('')
  const voiceErrorHint = ref('')
  const qrcodeCover = ref(false)
  let loopSub = null
  let removeVoiceWakeupListener = null
  let speechRecognition = null
  /** @type {MediaStream | null} */
  let voiceMediaStream = null
  /** @type {AudioContext | null} */
  let voiceAudioContext = null
  /** @type {ScriptProcessorNode | null} */
  let voiceScriptProcessor = null
  /** @type {MediaStreamAudioSourceNode | null} */
  let voiceAudioSourceNode = null

  function releaseVoiceMicStream() {
    if (voiceMediaStream) {
      voiceMediaStream.getTracks().forEach(t => t.stop())
      voiceMediaStream = null
    }
  }

  function stopSpeechRecognitionOnly() {
    try {
      if (speechRecognition) {
        speechRecognition.onresult = null
        speechRecognition.onerror = null
        speechRecognition.onend = null
        speechRecognition.onstart = null
        speechRecognition.abort?.()
        speechRecognition.stop?.()
      }
    } catch (error) {
      console.warn('[voice] 停止 Web Speech 失败:', error)
    }
    speechRecognition = null
  }

  function stopVoicePcmRecorder() {
    try {
      voiceScriptProcessor?.disconnect()
      voiceAudioSourceNode?.disconnect()
    } catch (error) {
      console.warn('[voice] 停止 PCM 录音失败:', error)
    }
    voiceScriptProcessor = null
    voiceAudioSourceNode = null
    if (voiceAudioContext) {
      voiceAudioContext.close()
      voiceAudioContext = null
    }
  }

  function stopVoiceRecognition() {
    stopSpeechRecognitionOnly()
    stopVoicePcmRecorder()
    voiceListening.value = false
    voiceFallbackPhase.value = ''
    releaseVoiceMicStream()
  }

  async function startFallbackTencentFromStream(stream) {
    voiceFallbackPhase.value = 'recording'
    // voiceErrorHint.value =
    //   'Web Speech 无法连接云端（多为网络原因）。已切换为腾讯云 ASR，本次会先录音约 3 秒后自动转写。'
    // voiceErrorHint.value =
    //   '3 秒后执行语音唤起操作'
    // ElMessage.warning(voiceErrorHint.value)

    voiceListening.value = true
    const chunks = []
    voiceAudioContext = new (window.AudioContext || window.webkitAudioContext)()
    voiceAudioSourceNode = voiceAudioContext.createMediaStreamSource(stream)
    voiceScriptProcessor = voiceAudioContext.createScriptProcessor(4096, 1, 1)
    voiceScriptProcessor.onaudioprocess = e => {
      chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)))
    }
    voiceAudioSourceNode.connect(voiceScriptProcessor)
    voiceScriptProcessor.connect(voiceAudioContext.destination)

    const inputSampleRate = voiceAudioContext?.sampleRate || 48000
    await new Promise(r => setTimeout(r, 3000))
    stopVoicePcmRecorder()
    voiceListening.value = false

    const merged = mergeFloat32Chunks(chunks)
    if (!merged.length) {
      voiceFallbackPhase.value = ''
      ElMessage.error('未采集到有效音频')
      return
    }

    const pcm16kFloat = downsampleTo16k(merged, inputSampleRate)
    const pcmBytes = floatTo16BitPCM(pcm16kFloat)
    const bufferBase64 = uint8ArrayToBase64(pcmBytes)

    voiceFallbackPhase.value = 'transcribing'
    if (!window.electronAPI?.transcribeAudio) {
      voiceFallbackPhase.value = ''
      ElMessage.error('未暴露 transcribeAudio，无法转写')
      return
    }

    const res = await window.electronAPI.transcribeAudio({
      bufferBase64,
      voiceFormat: 'pcm',
      sampleRate: 16000,
    })
    voiceFallbackPhase.value = ''
    if (res?.ok && res.text != null) {
      voiceTranscript.value = res.text
      console.log('[voice] 腾讯云转写结果:', res.text)
      if (res.text) {
        const result = await runVoiceMatchedShScript(res.text)
        console.log('result', result)
        if (result?.status === 'fail') {
          voiceErrorHint.value = result.message
          ElMessage.error(voiceErrorHint.value)
        } else {
          showVoiceDialog.value = false
        }
      }
    } else {
      console.warn('[voice] 腾讯云转写失败:', res?.error)
      voiceErrorHint.value = res?.error || '转写失败'
      ElMessage.error(voiceErrorHint.value)
    }
  }

  async function startVoiceRecognition() {
    voiceErrorHint.value = ''
    voiceFallbackPhase.value = ''
    stopSpeechRecognitionOnly()
    stopVoicePcmRecorder()

    try {
      releaseVoiceMicStream()
      voiceMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      console.warn('[voice] 麦克风不可用:', error)
      voiceErrorHint.value =
        '无法访问麦克风，请在「系统设置 → 隐私与安全性 → 麦克风」中允许 UworkPlus。'
      ElMessage.error(voiceErrorHint.value)
      return
    }

    const stream = voiceMediaStream
    await startFallbackTencentFromStream(stream)

    // const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    // if (!SpeechRecognition) {
    //   console.warn('[voice] 无 Web Speech，直接使用录音转写')
    //   await startFallbackTencentFromStream(stream)
    //   return
    // }

    // speechRecognition = new SpeechRecognition()
    // speechRecognition.lang = 'zh-CN'
    // speechRecognition.continuous = false
    // speechRecognition.interimResults = false
    // speechRecognition.maxAlternatives = 1

    // speechRecognition.onstart = () => {
    //   voiceListening.value = true
    //   console.log('[voice] Web Speech 开始收音...')
    // }

    // speechRecognition.onresult = async event => {
    //   const transcript = event?.results?.[0]?.[0]?.transcript || ''
    //   voiceTranscript.value = transcript
    //   console.log('[voice] Web Speech 识别结果:', transcript)
    //   if (transcript) {
    //     await runVoiceMatchedShScript(transcript)
    //   }
    // }

    // speechRecognition.onerror = async event => {
    //   const code = event?.error || ''
    //   console.warn('[voice] Web Speech 失败:', code, event)
    //   voiceListening.value = false
    //   if (code === 'network' || code === 'service-not-allowed') {
    //     stopSpeechRecognitionOnly()
    //     await startFallbackTencentFromStream(stream)
    //     return
    //   }
    //   if (code === 'not-allowed') {
    //     voiceErrorHint.value = '麦克风或语音识别权限被拒绝。'
    //     ElMessage.error(voiceErrorHint.value)
    //   } else {
    //     voiceErrorHint.value = `语音识别错误: ${code}`
    //     ElMessage.error(voiceErrorHint.value)
    //   }
    // }

    // speechRecognition.onend = () => {
    //   if (!voiceFallbackPhase.value) {
    //     voiceListening.value = false
    //     console.log('[voice] Web Speech 收音结束')
    //   }
    // }

    // try {
    //   speechRecognition.start()
    // } catch (error) {
    //   console.warn('[voice] Web Speech 启动异常，改用录音转写:', error)
    //   stopSpeechRecognitionOnly()
    //   await startFallbackTencentFromStream(stream)
    // }
  }
  function onDockTip() {
    showTipDialog.value = true
    getZzQrcode()

    // 15s后弹出感谢打赏弹窗
    loopSub = setTimeout(() => {
      showTipDialogSub.value = true
    }, 15000)
  }

  /** 赞助弹窗关闭时重置感谢弹层状态 */
  function onTipDialogClose() {
    clearTimeout(loopSub)
    showTipDialogSub.value = false
    // qrcodeCover.value = false
    // zzQrcode.value = ''
  }

  const zzQrcode = ref('')
  function getZzQrcode() {
    // 如果二维码已存在，则不重新生成
    if (zzQrcode.value) return

    const token = getCookie('UworkPlus_token')
    const id = wechatProductId
    if (!id) {
      return
    }
    const form = `uworkPlus`
    const userToken = token ? decodeURIComponent(token) : ''
    const page = decodeURIComponent(`pages/cashier/cashier`)
    // 传入小程序scene的参数
    const urlToken = `id=${id}&token=${userToken}&form=${form}&page=${page}`

    const paraJson = {
      appType: 4,
      env_version: 'release',
      token: urlToken,
      paraType: 'long',
      page: 'pages/relay/relay',
    }

    // 动态生成小程序码地址
    const zzQrcodeUrl = `${apiBaseCommon}/tpCli/weixinLogin/getWeixinCodeCommon?${new URLSearchParams(paraJson).toString()}`

    const imgLoader = new Image()
    imgLoader.onload = () => {
      qrcodeCover.value = true
      zzQrcode.value = zzQrcodeUrl
      console.log('二维码加载完成', zzQrcode.value)
    }
    imgLoader.src = zzQrcodeUrl
  }

  const router = useRouter()

  const carousel = ref(null)
  const carouselActiveIndex = ref('/home')

  // 更新弹窗状态
  const showUpdateDialog = ref(false)
  const updateDetail = ref({})

  const origin = ref(paramJson.origin)

  /**
   * iconClass地址： https://primevue.org/icons/
   */
  const routerAllow = computed(() => [
    {
      iconClass: 'pi pi-home',
      label: '首页',
      path: '/home',
      component: markRaw(Home),
      badge: commonStore.homeTaskOverdueCount,
    },
    {
      iconClass: 'pi pi-android',
      label: 'AI会话',
      path: '/aiWebUI',
      component: markRaw(AiWebUI),
      customClick: true,
      onClick: () => {
        if (afterVersion('1.8.0')) {
          setCarousel('/aiWebUI')
        } else {
          ElMessageBox.alert(
            '该版本不支持该功能，请点击右上角「🔄」按钮升级客户端到 1.8.0',
            '提示',
            { confirmButtonText: '知道了' },
          )
        }
      },
    },
    {
      iconClass: 'pi pi-code',
      label: 'sh脚本',
      path: '/sh',
      component: markRaw(Sh),
    },
    {
      iconClass: 'pi pi-microsoft',
      label: '应用网站',
      customClick: token.value ? false : true,
      path: '/application',
      component: markRaw(Application),
      onClick: () => {
        if (token.value) {
          setCarousel('/application')
        } else {
          setTimeout(() => {
            eventBus.off('login:success')
            eventBus.on('login:success', () => {
              setTimeout(() => {
                setCarouselAuto('/application')
              })
            })
            showLogin(true)
          }, 200)
        }
      },
    },
    {
      iconClass: 'pi pi-file-edit',
      label: '文档 / 笔记',
      path: '/document',
      component: markRaw(Document),
      customClick: token.value ? false : true,
      onClick: () => {
        if (token.value) {
          setCarousel('/document')
        } else {
          setTimeout(() => {
            eventBus.off('login:success')
            eventBus.on('login:success', () => {
              setTimeout(() => {
                setCarouselAuto('/document')
              })
            })
            showLogin(true)
          }, 200)
        }
      },
    },
    {
      iconClass: 'pi pi-wrench',
      label: '工具',
      path: '/tools',
      component: markRaw(Tools),
    },
    // {
    //   iconClass: "pi pi-info",
    //   label: "关于",
    //   path: "/about",
    //   component: markRaw(About),
    // },
    {
      iconClass: 'pi pi-user',
      iconClassByImage: token.value && defaultUserAvatarUrl ? defaultUserAvatarUrl : '',
      label: '个人中心',
      customClick: token.value ? false : true,
      path: '/userCenter',
      component: markRaw(UserCenter),
      onClick: () => {
        if (token.value) {
          setCarousel('/userCenter')
        } else {
          setTimeout(() => {
            eventBus.off('login:success')
            eventBus.on('login:success', () => {
              setTimeout(() => {
                setCarouselAuto('/userCenter')
              })
            })
            showLogin(true)
          }, 200)
        }
      },
    },
  ])
  const items = computed(() => {
    return tabBar(routerAllow.value, setCarousel)
  })

  async function refreshHomeTaskOverdueCount() {
    if (!isInElectron()) {
      commonStore.updateHomeTaskOverdueCount(0)
      return
    }
    try {
      const list = await taskApi.getTaskList()
      commonStore.updateHomeTaskOverdueCount(countOverdueTasks(Array.isArray(list) ? list : []))
    } catch (e) {
      console.error('[task] 刷新首页逾期角标失败:', e)
    }
  }

  // 窗口标题
  const windowTitle = computed(() => {
    return routerAllow.value.find(item => item.path === carouselActiveIndex.value)?.label
  })

  /* 父组件注册 */
  // 注册provide，用于深层子组件调用，所有逻辑统一收到当前父组件执行（单项数据流，子组件只做展示）
  const baiduHotData = ref([])
  const parentProvidePool = {
    baiduHotData, // 百度热搜数据
    loadingSpiderData, // 加载爬虫数据
    refreshSpiderData, // 刷新爬虫数据
    setCarouselAuto, // 自动切换到指定模块
  }
  provide('parentProvide', parentProvidePool)

  function setCarousel(path) {
    console.log('path', path)

    carousel.value.setActiveItem(path)
    setTimeout(() => {
      carouselActiveIndex.value = path
    }, 200)
  }

  function setCarouselAuto(path) {
    items.value.forEach((item, index) => {
      if (item.path === path) {
        document.querySelectorAll('.dock-item')[index].click()
      }
    })
  }

  const LOGIN_REQUIRED_PATHS = ['/document', '/application', '/userCenter']

  function resolveToPagePath(toPage) {
    if (!toPage) return null
    const normalized = String(toPage).trim().replace(/^\//, '')
    if (!normalized) return null
    const path = `/${normalized}`
    return routerAllow.value.some(item => item.path === path) ? path : null
  }

  function openModuleWithLogin(path) {
    if (token.value) {
      setCarousel(path)
      return
    }
    setCarousel('/home')
    setTimeout(() => {
      eventBus.off('login:success')
      eventBus.on('login:success', () => {
        setTimeout(() => setCarouselAuto(path), 200)
      })
      showLogin(true)
    }, 200)
  }

  function applyInitialCarousel() {
    const toPagePath = resolveToPagePath(paramJson.toPage)
    if (!toPagePath) {
      setCarousel('/home')
      return
    }
    if (LOGIN_REQUIRED_PATHS.includes(toPagePath)) {
      openModuleWithLogin(toPagePath)
      return
    }
    setCarousel(toPagePath)
  }

  async function refreshSpiderData() {
    await jsBridge.registerSync({
      method: 'refreshSpiderData',
    })
    const lastSpiderData = await jsBridge.registerSync({
      method: 'proxySql',
      json: {
        methods: 'readAll',
        data: { sql: 'dataSpider/record/latest.json' },
      },
    })
    console.log('爬虫数据刷新完成:', lastSpiderData)
    parentProvidePool.baiduHotData.value = lastSpiderData
  }

  async function loadingProxyServer() {
    if (!isInElectron()) {
      return
    }

    try {
      const proxyList = await proxyService.readAll()
      const activeRoutes = (proxyList || []).reduce((routes, item) => {
        if (item?.inUse && Array.isArray(item.proxyData)) {
          return routes.concat(item.proxyData)
        }
        return routes
      }, [])

      await startExpressApp(activeRoutes)
      console.log('接口代理服务已启动，生效路由数:', activeRoutes.length)
    } catch (error) {
      console.error('启动接口代理服务失败:', error)
    }
  }

  async function loadingHostsProfiles() {
    if (!isInElectron()) {
      return
    }

    try {
      const hostsList = await hostsService.readAll()
      const activeCount = (hostsList || []).filter(item => item?.inUse).length
      if (activeCount === 0) {
        return
      }

      if (!(await isHostsWriteReady())) {
        console.log('Hosts 免密写入未安装，跳过启动时自动应用')
        return
      }

      await applyHostsProfiles(hostsList)
      console.log('Hosts 配置已应用，生效配置数:', activeCount)
    } catch (error) {
      console.error('应用 Hosts 配置失败:', error)
    }
  }

  async function loadingSpiderData() {
    return new Promise((resolve, reject) => {
      if (isInElectron()) {
        // 初始化 express node服务（爬虫功能）
        jsBridge.register({
          method: 'startExpressAppSpider',
          callback: async result => {
            const lastSpiderData = await jsBridge.registerSync({
              method: 'proxySql',
              json: {
                methods: 'readAll',
                data: { sql: 'dataSpider/record/latest.json' },
              },
            })
            console.log('爬虫服务启动结果:', lastSpiderData)
            parentProvidePool.baiduHotData.value = lastSpiderData

            resolve(lastSpiderData)
          },
        })
      } else {
        resolve([])
      }
    })
  }
  // 拖拽相关函数
  function handleTabbarMouseDown(event) {
    // 防止在按钮区域拖拽
    // if (event.target.classList.contains("window-control-button")) {
    //   return;
    // }
    // 通知 Electron 主进程开始拖拽窗口
    // if (jsBridge && jsBridge.register) {
    //   jsBridge.register({
    //     method: "windowDragStart",
    //     callback: () => {
    //       console.log("窗口拖拽开始");
    //     },
    //   });
    // }
  }

  // 窗口控制按钮事件处理
  function handleMinimize() {
    console.log('点击窗口最小化按钮')
  }

  // 显示更新弹窗
  async function showUpdate() {
    try {
      console.log('开始检查更新...')
      const updateResult = await checkUpdate()
      console.log('更新检查结果:', updateResult)

      if (updateResult?.hasUpdate) {
        console.log(`发现新版本: ${updateResult.version}`)
        showUpdateDialog.value = true
        updateDetail.value = updateResult
      } else if (updateResult.error) {
        // 这里可以显示错误提示
        ElMessage.error('检查更新失败: ' + updateResult.error)
      } else {
        ElMessage.info('当前已是最新版本')
      }
    } catch (error) {
      ElMessage.error('检查软件更新时出错: ' + error.message)
    }
  }

  // 环境判断函数
  const getLoginUrl = () => {
    const timestamp = new Date().getTime()
    return `${resolveRemoteOrLocal('/uworkplus/iframe')}?origin=iframe&timestamp=${timestamp}`
  }

  // 定时，1天check一次版本
  function checkVersion() {
    // 检查更新
    showUpdate()
    // 定时，1天check一次版本
    setInterval(
      () => {
        showUpdate()
      },
      1000 * 60 * 60 * 24
    )
  }

  watch(
    () => router.currentRoute.value,
    async newValue => {
      // 切换到demo页面，设置为自定义模式
      if (newValue.name?.toLowerCase() === 'demo') {
        origin.value = 'custom'
      }
    },
    { deep: true }
  )

  onMounted(async () => {
    if (origin.value === 'iframe' || origin.value === 'custom') {
      // 作为iframe，不显示轮播，也不添加 postMessage 监听器
      console.log('iframe 模式，不添加 postMessage 监听器')
    } else {
      // 添加监听器
      window.addEventListener('message', handleIframeMessage)
      eventBus.on('setCarouselAuto', setCarouselAuto)
      eventBus.on(CLIPBOARD_WRITE_EVENT, handleClipboardWrite)
      console.log('postMessage / clipboard 监听器已添加')

      // setCookie("UworkPlus_token", ""); // 测试mock数据
      const cookieToken = getCookie('UworkPlus_token')
      commonStore.updateToken(cookieToken)

      // 设置轮播（支持 ?toPage=document 等参数直达模块）
      applyInitialCarousel()

      try {
        // 并行加载数据，提高加载速度
        await Promise.all([
          loadingSpiderData(),
          loadingProxyServer(),
          loadingHostsProfiles(),
          refreshHomeTaskOverdueCount(),
        ])

        // 定时，1天check一次版本
        checkVersion()

        const userInfo = getStorage('userInfo')
        commonStore.updateUserInfo(userInfo)

        if (isInElectron() && window.electronAPI?.onVoiceWakeup) {
          removeVoiceWakeupListener = window.electronAPI.onVoiceWakeup(() => {
            voiceWakeupTime.value = new Date().toLocaleTimeString()
            voiceTranscript.value = ''
            voiceErrorHint.value = ''
            voiceFallbackPhase.value = ''
            showVoiceDialog.value = true
            startVoiceRecognition()
          })
        }
      } catch (error) {
        console.error('加载数据时出错:', error)
      }
    }
  })

  // 组件卸载时清理事件监听器
  onUnmounted(() => {
    // 只在主应用模式下清理监听器
    if (origin.value !== 'iframe') {
      console.log('主应用模式，清理 postMessage 监听器')
      window.removeEventListener('message', handleIframeMessage)
      eventBus.off('setCarouselAuto', setCarouselAuto)
      eventBus.off(CLIPBOARD_WRITE_EVENT, handleClipboardWrite)
    }
    if (typeof removeVoiceWakeupListener === 'function') {
      removeVoiceWakeupListener()
      removeVoiceWakeupListener = null
    }
    stopVoiceRecognition()
  })

  const handleClipboardWrite = async text => {
    try {
      await writeClipboardViaBridge(text)
    } catch (error) {
      console.error('[clipboard] 写入失败:', error)
    }
  }

  const QUICK_FORGE_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1):(5188|5190)$/i
  const OPEN_EXTERNAL_MESSAGE_TYPE = 'uwork-open-external'

  function isQuickForgeMessageOrigin(origin = '') {
    return QUICK_FORGE_ORIGIN_PATTERN.test(origin)
  }

  function handleOpenExternal(url) {
    if (!url) {
      return
    }
    if (isInElectron()) {
      openExternal(url)
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // 处理 iframe / 子页面发送的 postMessage
  const handleIframeMessage = event => {
    const { type, data, text, url } = event.data || {}

    if (type === CLIPBOARD_MESSAGE_TYPE && typeof text === 'string') {
      handleClipboardWrite(text)
      return
    }

    if (type === OPEN_EXTERNAL_MESSAGE_TYPE && typeof url === 'string') {
      if (isQuickForgeMessageOrigin(event.origin)) {
        handleOpenExternal(url)
      }
      return
    }

    console.log('收到 iframe 消息:', { type, data, origin: event.origin })

    switch (type) {
      case 'LOGIN_SUCCESS':
        // 处理登录成功 - 使用多种方法确保弹窗关闭
        showLogin(false)

        // 可以在这里更新用户状态、token等
        if (data.token) {
          commonStore.updateToken(data.token)

          // EventBus 方案：发布登录成功事件；哪里需要，就在哪里监听
          eventBus.emit('login:success', {
            token: data.token,
            timestamp: Date.now(),
            source: 'iframe',
          })

          // ElMessage.success("登录成功！");
        }
        break
      default:
        console.log('收到未知消息类型:', type)
        break
    }
  }
</script>

<template>
  <div>
    <!-- 单独打开 ， 独立页面 -->
    <div v-if="origin === 'iframe' || origin === 'custom'">
      <RouterView />
    </div>
    <div v-else>
      <div class="electron-tabbar c-flex-x-center">
        <h1 class="c-flex-x-center">
          <img class="logo-img" src="./assets/imgs/logo.png" alt="logo" />
          UworkPlus -&nbsp;
          <span class="text-white">{{ windowTitle }}</span>
        </h1>
        <!-- 更新按钮 -->
        <div class="update-controls">
          <button class="update-button" @click="showUpdate" title="检查更新">
            <span>🔄</span>
          </button>
        </div>
        <!-- 窗口控制按钮 -->
        <!-- <div class="window-controls">
        <button
          class="window-control-button minimize-btn"
          @click="handleMinimize"
          title="最小化"
        >
          <span>─</span>
        </button>
      </div> -->
      </div>
      <div class="layout" :class="{ 'layout--no-dock': hasToPageParam }">
        <!-- 背景 -->
        <div class="bg-part">
          <FlickeringGrid
            class="c-flex-x-center relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]"
            :square-size="4"
            :grid-gap="6"
            color="#60A5FA"
            :max-opacity="0.5"
            :flicker-chance="0.1"
            :width="800"
            :height="800"
          />
        </div>
        <!-- <aside class="sidebar">
        <nav>
          <ul>
            <li><RouterLink to="/">首页</RouterLink></li>
            <li><RouterLink to="/sh">sh脚本</RouterLink></li>
            <li><RouterLink to="/about">关于</RouterLink></li>
          </ul>
        </nav>
      </aside> -->
        <main class="content">
          <div class="carousel-block">
            <el-carousel
              ref="carousel"
              direction="vertical"
              style="height: 100%"
              height="auto"
              arrow="never"
              indicator-position="none"
              :loop="false"
              :autoplay="false"
            >
              <el-carousel-item
                class="carousel-item"
                v-for="item in routerAllow"
                :key="item.path"
                :name="item.path"
              >
                <Layout v-if="item.path === carouselActiveIndex">
                  <component :is="item.component">
                    <RouterView />
                  </component>
                </Layout>
              </el-carousel-item>
            </el-carousel>
          </div>

          <!-- <Layout>
          <RouterView />
        </Layout> -->
        </main>

        <!-- 桌面 -->
        <Dock
          v-show="showDock"
          class-name="dock"
          :items="items"
          :active-path="carouselActiveIndex"
          :panel-height="68"
          :base-item-size="50"
          :magnification="70"
          :distance="200"
          :dock-height="256"
          :spring="{ mass: 0.1, stiffness: 150, damping: 12 }"
          @tip="onDockTip"
        />

        <UpdateManagerDialog v-model="showUpdateDialog" :update-detail="updateDetail" />

        <el-dialog
          v-model="showTipDialog"
          title="感谢赞助"
          width="360px"
          align-center
          class="tip-dialog"
          @close="onTipDialogClose"
        >
          <div class="tip-dialog__content">
            <p class="tip-dialog__text">赞助：9.9元</p>
            <div class="tip-dialog__qrcode-container">
              <div class="loading-container c-flex-x-center">
                <el-icon class="tip-dialog__loading-spin"><Loading /></el-icon>
              </div>
              <img v-if="zzQrcode" :src="zzQrcode" alt="赞助二维码" class="tip-dialog__qrcode" />
              <div v-if="qrcodeCover" class="qrcode-cover">
                <img src="./assets/imgs/logo.png" alt="二维码遮罩" class="qrcode-cover-img" />
              </div>
              <div v-if="showTipDialogSub" class="c-flex-x-center sub-container">
                <p class="tip-sub">感谢您的赞助！</p>
                <div class="close-sub-btn c-flex-x-center" @click="showTipDialogSub = false">
                  <el-icon><Close /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </el-dialog>

        <commonDialog
          v-model="showLoginVisible"
          :closeOnClickModal="false"
          title="登录"
          custom-class="login-dialog"
          :beforeClose="
            () => {
              showLogin(false)
            }
          "
        >
          <iframe
            v-if="showLoginVisible"
            class="iframe-login"
            :src="getLoginUrl()"
            frameborder="0"
          ></iframe>
        </commonDialog>

        <el-dialog
          v-model="showVoiceDialog"
          title="语音输入"
          width="420px"
          align-center
          append-to-body
          class="voice-dialog-byVoice"
          @close="stopVoiceRecognition"
        >
          <div class="voice-dialog-content">
            <!-- <p class="voice-dialog-title">语音唤起成功</p> -->
            <p v-if="voiceFallbackPhase === 'recording'" class="voice-dialog-desc">
              正在录音，请对着麦克风说话…
            </p>
            <!-- <p v-else-if="voiceFallbackPhase === 'transcribing'" class="voice-dialog-desc">
              正在转写，请稍候…
            </p>
            <p v-else class="voice-dialog-desc">
              {{
                voiceListening
                  ? '正在尝试 Web Speech 收音，请说话…'
                  : '等待语音输入…'
              }}
            </p> -->
            <p v-if="voiceTranscript" class="voice-dialog-transcript">
              识别文本：{{ voiceTranscript }}
            </p>
            <p v-if="voiceErrorHint" class="voice-dialog-hint text-red">{{ voiceErrorHint }}</p>
            <p v-if="voiceWakeupTime" class="voice-dialog-time">唤起时间：{{ voiceWakeupTime }}</p>
          </div>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  @keyframes tip-dialog-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .electron-tabbar {
    position: relative;
    z-index: 999;
    width: 100vw;
    height: 38px;
    background: rgb(40, 38, 38);
    -webkit-app-region: drag;
    /* 启用拖拽区域 */
    cursor: grab;
    user-select: none;

    /* 添加一些视觉效果 */
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

    /* 添加渐变背景 */
    background: linear-gradient(180deg, rgba(60, 60, 60, 1) 0%, rgba(40, 40, 40, 1) 100%);

    .logo-img {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      margin-right: 8px;
    }

    /* 添加悬停效果 */
    &:hover {
      background: linear-gradient(180deg, rgba(70, 70, 70, 1) 0%, rgba(50, 50, 50, 1) 100%);
    }

    /* 添加激活状态 */
    &:active {
      cursor: grabbing;
      background: linear-gradient(180deg, rgba(80, 80, 80, 1) 0%, rgba(60, 60, 60, 1) 100%);
    }

    .text-white {
      color: var(--el-color-primary);
    }

    /* 更新按钮样式 */
    .update-controls {
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
      display: flex;
      align-items: center;
      -webkit-app-region: no-drag;
      /* 按钮区域不拖拽 */
    }

    /* 窗口控制按钮样式 */
    .window-controls {
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
      display: flex;
      align-items: center;
      -webkit-app-region: no-drag;
      /* 按钮区域不拖拽 */
    }

    .update-button {
      width: 46px;
      height: 32px;
      border: none;
      background: transparent;
      color: #ffffff;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      border-radius: 4px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        // transform: scale(1.05);
      }

      &:active {
        background-color: rgba(255, 255, 255, 0.2);
        // transform: scale(0.95);
      }

      span {
        line-height: 1;
        font-size: 18px;
      }
    }

    .window-control-button {
      width: 46px;
      height: 32px;
      border: none;
      background: transparent;
      color: #ffffff;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      &:active {
        background-color: rgba(255, 255, 255, 0.2);
      }

      span {
        line-height: 1;
      }
    }

    .close-btn {
      &:hover {
        background-color: #e81123 !important;
      }

      &:active {
        background-color: #f1707a !important;
      }
    }
  }

  .layout {
    display: flex;
    height: calc(100vh - 40px);

    .bg-part {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: calc(100vh - 40px);
      pointer-events: none;
    }

    .content {
      // flex: 1;
      min-width: 960px;
      width: calc(100vw - 92px);
      margin-left: 92px;
      background: #000;

      .carousel-block {
        height: 100%;

        :deep(.el-carousel) {
          height: 100%;

          .el-carousel__container {
            height: 100% !important;
          }
        }
      }
    }

    &.layout--no-dock .content {
      width: calc(100vw - 24px);
      margin-left: 24px;
    }

    // 登录弹窗样式
    :deep(.login-dialog) {
      width: 80vw;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      .iframe-login {
        width: 100%;
        height: 80vh;
      }
    }
  }

  :deep(.tip-dialog) {
    .tip-dialog__content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 8px 0;
    }
    .tip-dialog__text {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
    .tip-dialog__qrcode-container {
      position: relative;
      width: 200px;
      height: 200px;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      .loading-container {
        width: 100%;
        height: 100%;
        font-size: 23px;
      }
      .tip-dialog__loading-spin {
        animation: tip-dialog-spin 0.8s linear infinite;
      }
      .tip-dialog__qrcode {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: #f5f5f5;
      }
      .qrcode-cover {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80px;
        height: 80px;
        background: #ffffff;
        border-radius: 50%;
        overflow: hidden;
        .qrcode-cover-img {
          width: 80px;
          height: 80px;
        }
      }
      .sub-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #0000008c;
        .tip-sub {
          font-size: 16px;
          color: #67c23a;
          font-weight: 500;
        }
        .close-sub-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 20px;
          height: 20px;
          background: #ffffff8f;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.2s;
          &:hover {
            background: #ffffff;
          }
        }
      }
    }
  }

  // .sidebar {
  //   width: 120px;
  //   min-width: 120px;
  //   /* background: #f5f5f5; */
  //   padding: 2px 0;
  //   box-shadow: 2px 0 8px #f0f1f2;
  //   display: flex;
  //   flex-direction: column;
  //   align-items: center;
  //   background: #000;
  // }
  // .sidebar nav {
  //   width: 100%;
  // }
  // .sidebar ul {
  //   list-style: none;
  //   padding: 0;
  //   margin: 0;
  //   width: 100%;
  // }
  // .sidebar li {
  //   margin: 12px 0;
  //   width: 100%;
  //   display: flex;
  //   justify-content: center;
  // }
  // .sidebar a {
  //   display: block;
  //   width: 80%;
  //   padding: 12px 18px;
  //   color: #333;
  //   text-decoration: none;
  //   font-weight: 500;
  //   border-radius: 8px;
  //   transition: background 0.2s, color 0.2s;
  //   text-align: center;
  // }
  // .sidebar a:hover {
  //   background: #207399;
  //   color: #ffffff;
  // }
  // .sidebar a.router-link-active {
  //   background: #42b983;
  //   color: #fff;
  // }

  :deep(.dock) {
    background: #000000a1;
  }
</style>
<style lang="scss">
  .voice-dialog-byVoice .el-dialog__body {
    .voice-dialog-content {
      text-align: center;
      .voice-dialog-title {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 600;
      }
      .voice-dialog-desc {
        margin: 0 0 8px;
        color: var(--el-text-color-regular);
      }
      .voice-dialog-time {
        margin: 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
      .voice-dialog-transcript {
        margin: 0 0 8px;
        color: var(--el-color-primary);
      }
      .voice-dialog-hint {
        margin: 0 0 8px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--el-text-color-secondary);
        text-align: conter;

        &.text-red {
          color: var(--el-color-danger);
        }
      }
    }
  }
</style>
