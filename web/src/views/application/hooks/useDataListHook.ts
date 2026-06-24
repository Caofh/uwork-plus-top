import { ref } from 'vue'
import { appApi } from '../service/api'
import { ElMessage, ElMessageBox } from 'element-plus'
// import { useCommonStore } from '@/store/common'
import { getStorage } from '@/utils/storage'

interface addAppFormType {
  app_id?: number | null
  app_name: string
  app_type: string
  app_address: string
  app_introduce: string
  app_iconUrl: string
}

export const useDataListHook = () => {
  const isDataEdit = ref(false)

  // 应用列表相关-start
  const dataListAll = ref([]) // 全部应用列表
  const dataList = ref([]) // 当前分组应用列表
  const dataListLoading = ref(false)

  const getDataListAll = async () => {
    const officialJson = {
      app_type: 9999,
      test: 1,
    }
    const resOfficialApi = appApi.getAppList(officialJson)
    const resApi = appApi.getAppList()

    const [resOfficial, res] = await Promise.all([resOfficialApi, resApi])

    // 过滤官方推荐
    const resFilter = res.data.filter(item => item.app_type !== 9999)
    
    // 组合官方推荐 和 非官方的个人数据
    dataListAll.value = [...resOfficial.data, ...resFilter]

    // const commonStore = useCommonStore()
    // // 如果用户是管理员，则不需要组合官方推荐
    const userInfo: any = getStorage('userInfo')
    if (userInfo.role === '1') {
      dataListAll.value = res.data
    } else {
      dataListAll.value = [...resOfficial.data, ...res.data]
    }
  }
  const getDataList = async ({ appType = null, typeList = [] }) => {
    if (!appType) {
      return
    }

    const typeItem = typeList.find(item => item.id === appType)
    const isOfficial = typeItem && typeItem.isOfficial ? typeItem.isOfficial : false

    try {
      dataListLoading.value = true
      const json: any = {
        app_type: appType,
      }
      if (isOfficial) {
        json.test = 1
      }
      const res = await appApi.getAppList(json)
      dataList.value = res.data
    } catch (error) {
      console.error(error)
    } finally {
      dataListLoading.value = false
    }
  }
  // 应用列表相关-end

  // 添加应用弹窗相关-start
  const addAppVisible = ref(false)
  const addAppForm = ref<addAppFormType>({
    app_name: '',
    app_type: '',
    app_address: '',
    app_introduce: '',
    app_iconUrl: '',
  })
  const addApp = () => {
    isDataEdit.value = false
    addAppVisible.value = true
  }
  const addAppConfirm = async () => {
    if (!addAppForm.value.app_name.trim()) {
      ElMessage.error('请输入应用名称')
      return
    }
    if (!addAppForm.value.app_address.trim()) {
      ElMessage.error('请输入应用地址')
      return
    }
    if (!addAppForm.value.app_introduce.trim()) {
      ElMessage.error('请输入应用介绍')
      return
    }
    // if (!addAppForm.value.app_icon.trim()) {
    //   ElMessage.error("请输入应用图标");
    //   return;
    // }
    await appApi.addApp(addAppForm.value)
    ElMessage.success('添加应用成功')
    addAppVisible.value = false
    await getDataList({ appType: addAppForm.value.app_type })
    resetAddAppForm()
  }
  const resetAddAppForm = () => {
    addAppForm.value = {
      app_id: null,
      app_name: '',
      app_type: '',
      app_address: '',
      app_introduce: '',
      app_iconUrl: '',
    }
  }
  // 添加应用弹窗相关-end

  // 编辑应用弹窗相关-start
  const editApp = () => {
    isDataEdit.value = true
    addAppVisible.value = true
  }
  const editAppConfirm = async (isSearch = false) => {
    await appApi.editApp(addAppForm.value)
    ElMessage.success('编辑应用成功')
    addAppVisible.value = false

    // 搜索状态做特殊处理
    if (isSearch) {
      for (let i = 0; i < dataList.value.length; i++) {
        if (String(dataList.value[i].app_id) === String(addAppForm.value.app_id)) {
          dataList.value[i] = addAppForm.value
        }
      }
    } else {
      await getDataList({ appType: addAppForm.value.app_type })
    }
    resetAddAppForm()
  }
  // 编辑应用弹窗相关-end

  // 删除应用弹窗相关-start
  const deleteApp = async (isSearch = false) => {
    await ElMessageBox.confirm('确定删除应用吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await appApi.removeApp({
      app_id: addAppForm.value.app_id,
    })
    ElMessage.success('删除应用成功')
    addAppVisible.value = false

    // 搜索状态做特殊处理
    if (isSearch) {
      dataList.value = dataList.value.filter(item => {
        return String(item.app_id) !== String(addAppForm.value.app_id)
      })
    } else {
      await getDataList({ appType: addAppForm.value.app_type })
    }
    // 重置添加应用表单
    resetAddAppForm()
  }
  // 删除应用弹窗相关-end

  return {
    isDataEdit,
    dataListAll,
    getDataListAll,
    dataList,
    getDataList,
    dataListLoading,
    addAppVisible,
    addAppForm,
    addApp,
    addAppConfirm,
    deleteApp,
    editApp,
    editAppConfirm,
    resetAddAppForm,
  }
}
