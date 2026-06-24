import { ref, onMounted, onUnmounted } from 'vue'
import { loadMicroApp, initGlobalState } from 'qiankun'
import { jsBridge } from '@/utils/electron'
import { resolveRemoteOrLocal } from '@/config/remote'

const getMicroAppEntry = () => {
  const timestamp = new Date().getTime()
  return `${resolveRemoteOrLocal('/uworkplusMarkdown/')}?timestamp=${timestamp}`
}

export const useMiniApp = (onMessage: (data: any) => void) => {
  let microApp = ref(null)
  const miniAction = initGlobalState()

  // 启动微应用
  function startMicroApp({ id = '#react-app-container', props = {} }) {
    microApp.value && microApp.value.unmount()

    // 动态获取入口路径
    const entry = getMicroAppEntry()
    console.log('【当前环境】:', import.meta.env.MODE, '微应用入口:', entry)

    microApp.value = loadMicroApp({
      name: 'react-app', // 必须与微应用注册名字相同
      entry: entry, // 入口路径，开发时为微应用所启本地服务，上线时为微应用线上路径
      container: id, // 微应用挂载的节点
      activeRule: () => {
        return true
      },
      props: {
        // msg: "我是来自主应用的值-react", // 主应用向微应用传递参数
        msg: props, // 主应用向微应用传递参数
        // 传递回调函数给子应用
        onMessage: data => {
          // 处理子应用发送的消息
          onMessage && onMessage(data)
        },
      },
    })
  }

  onUnmounted(() => {
    microApp.value && microApp.value.unmount()
  })

  const isLoadMicroApp = () => {
    return microApp.value ? true : false
  }

  return {
    microApp,
    miniAction,
    startMicroApp,
    isLoadMicroApp,
  }
}

// 获取document数据 hook
export const useDocumentDataApi = () => {
  let documentData = ref<any>({})
  let documentDataCurrent = ref<any>({})
  let currentId = ref<number | null>(null)

  const setDocumentData = (data: any) => {
    ;(documentData as any).value = data
  }
  const setCurrentId = (id: number) => {
    currentId.value = id
  }
  const setDocumentDataCurrent = (data: any) => {
    documentDataCurrent.value = data
  }

  const getDocumentData = async () => {
    const resData = await jsBridge.registerSync({
      method: 'proxySql',
      json: {
        methods: 'readAll',
        data: { sql: 'dataSql/document.json' },
      },
    })
    return resData
  }
  const initDoctData = async () => {
    console.log('initDoctData 方法执行')

    const resData = await getDocumentData()
    documentData.value = resData
    // 取第1个数据作为初始选中数据
    documentDataCurrent.value = resData?.[0]
    currentId.value = resData?.[0]?.id
  }

  const refreshDoctData = async () => {
    console.log('refreshDoctData 方法执行')

    const resData = await getDocumentData()
    documentData.value = resData
    // 当前的数据处理
    documentDataCurrent.value = documentData.value.find((item: any) => item.id === currentId.value)
  }

  // 设置当前选中数据 by id
  const setDocumentDataCurrentById = (id: number) => {
    const selectedData = documentData.value.find((item: any) => item.id === id)
    documentDataCurrent.value = selectedData
    currentId.value = id
  }

  return {
    documentData,
    documentDataCurrent,
    setDocumentDataCurrent,
    currentId,
    setCurrentId,
    setDocumentData,
    initDoctData,
    refreshDoctData,
    setDocumentDataCurrentById,
  }
}
