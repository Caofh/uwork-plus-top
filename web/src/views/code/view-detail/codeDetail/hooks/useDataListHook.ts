import { ref } from 'vue'
import { appApi } from '../service/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import { jsBridge } from '@/utils/electron'

interface addAppFormType {
  id?: string
  article_name: string
  code_type: string
  article_content: string
  article_editorDescription: string
  editorLanguage: string
  sort: number
  create_time: number
  update_time: number
}

const sqlFile = `dataSql/dataSnippet.json`

export const useDataListHook = () => {
  const isDataEdit = ref(false)

  // 应用列表相关-start
  const dataListAll = ref([]) // 全部应用列表
  const dataList = ref([]) // 当前分组应用列表
  const currentCodeItem = ref(null)
  const dataListLoading = ref(false)

  const getDataListAll = async () => {
    const res = await jsBridge.registerSync({
      method: 'proxySql',
      json: {
        methods: 'readAll',
        data: { sql: sqlFile },
      },
    })

    ;(dataListAll as any).value = res
  }
  const getDataList = async ({ appType = null, isFirst = true }) => {
    if (!appType) {
      return
    }

    try {
      dataListLoading.value = true
      const res: any = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'readAll',
          data: { sql: sqlFile },
        },
      })
      const dataResult = res.filter((item: any) => item.code_type === appType)

      dataList.value = dataResult

      if (isFirst) {
        currentCodeItem.value = dataList.value.find((item, index) => index === 0)
      }
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
    article_name: '',
    code_type: '',
    article_content: '',
    article_editorDescription: '',
    editorLanguage: '',
    sort: 1,
    create_time: new Date().getTime(),
    update_time: new Date().getTime(),
  })
  const addApp = () => {
    isDataEdit.value = false
    addAppVisible.value = true
  }
  const addAppConfirm = async currentClickTypeGroup => {
    if (!addAppForm.value.article_name.trim()) {
      ElMessage.error('请输入代码名称')
      return
    }
    // if (!addAppForm.value.app_address.trim()) {
    //   ElMessage.error('请输入应用地址')
    //   return
    // }
    // if (!addAppForm.value.app_introduce.trim()) {
    //   ElMessage.error('请输入应用介绍')
    //   return
    // }
    // if (!addAppForm.value.app_icon.trim()) {
    //   ElMessage.error("请输入应用图标");
    //   return;
    // }
    // await appApi.addApp(addAppForm.value)
    const json = {
      id: uuidv4(),
      article_name: addAppForm.value.article_name,
      article_content: '',
      article_editorDescription: '',
      code_type: currentClickTypeGroup.id,
      editorLanguage: 'javascript',
      sort: 1,
      create_time: new Date().getTime(),
      update_time: new Date().getTime(),
    }

    jsBridge.register({
      method: 'proxySql',
      json: {
        methods: 'create',
        data: { item: json, sql: sqlFile },
      },
    })
    ElMessage.success('添加代码成功')
    addAppVisible.value = false

    let isFirst = false
    if (dataList.value.length === 0) {
      isFirst = true
    }
    await getDataList({ appType: addAppForm.value.code_type, isFirst })
    resetAddAppForm()
  }
  const resetAddAppForm = () => {
    addAppForm.value = {
      id: undefined,
      article_name: '',
      code_type: '',
      article_content: '',
      article_editorDescription: '',
      editorLanguage: '',
      sort: 1,
      create_time: new Date().getTime(),
      update_time: new Date().getTime(),
    }
  }
  // 添加应用弹窗相关-end

  // 编辑应用弹窗相关-start
  const editApp = () => {
    isDataEdit.value = true
    addAppVisible.value = true
  }
  const editAppConfirm = async (isSearch = false) => {
    // await appApi.editApp(addAppForm.value)
    const json = dataList.value.find((item: any) => item.id === addAppForm.value.id)
    delete json.visibleTooltip
    console.log('json')
    console.log(json)

    await jsBridge.registerSync({
      method: 'proxySql',
      json: {
        methods: 'update',
        data: {
          id: json.id,
          item: {
            ...json,
            article_name: addAppForm.value.article_name,
          },
          sql: sqlFile,
        },
      },
    })
    ElMessage.success('编辑应用成功')
    addAppVisible.value = false

    // 搜索状态做特殊处理
    if (isSearch) {
      for (let i = 0; i < dataList.value.length; i++) {
        if (String(dataList.value[i].id) === String(addAppForm.value.id)) {
          dataList.value[i] = addAppForm.value
        }
      }
    } else {
      await getDataList({ appType: addAppForm.value.code_type, isFirst: false })
    }
    resetAddAppForm()
  }
  // 编辑应用弹窗相关-end

  // 删除应用弹窗相关-start
  const deleteApp = async (
    isSearch = false,
    item: any,
    needTip = true,
    callback = (currentCodeItem: any) => {}
  ) => {
    if (needTip) {
      await ElMessageBox.confirm('确定删除代码吗？', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      })
    }

    // await appApi.removeApp({
    //   app_id: addAppForm.value.app_id,
    // })
    // console.log('addAppForm')
    // console.log(addAppForm)

    await jsBridge.registerSync({
      method: 'proxySql',
      json: {
        methods: 'remove',
        data: { id: item.id, sql: sqlFile },
      },
    })
    ElMessage.success('删除应用成功')
    addAppVisible.value = false

    // 搜索状态做特殊处理
    // if (isSearch) {
    //   dataList.value = dataList.value.filter(item => {
    //     return String(item.id) !== String(addAppForm.value.id)
    //   })
    // } else {

    let isFirst = true
    if (item.id === currentCodeItem.value.id) {
      isFirst = true
    } else {
      isFirst = false
    }
    await getDataList({ appType: item.code_type, isFirst })

    callback && callback(currentCodeItem.value)
    // }
    // 重置添加应用表单
    // resetAddAppForm()
  }
  // 删除应用弹窗相关-end

  return {
    isDataEdit,
    dataListAll,
    getDataListAll,
    currentCodeItem,
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
