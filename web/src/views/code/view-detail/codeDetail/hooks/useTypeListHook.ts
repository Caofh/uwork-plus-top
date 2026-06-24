import { ref } from 'vue'
import { appApi } from '../service/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cloneDeep } from 'lodash'
import { jsBridge } from '@/utils/electron'
import { v4 as uuidv4 } from 'uuid'

const sqlFile = 'dataSql/dataSnippetType.json'

export const useTypeListHook = () => {
  // 是否是编辑状态
  const isEdit = ref(false)

  // 分组列表相关-start
  const typeListAll = ref([])
  const typeList = ref([])
  const setTypeList = (payload: any[]) => {
    typeList.value = payload
  }
  const getDataTypeList = async () => {
    try {
      // const res = await appApi.getAppTypeList()
      const result: any = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'readAll',
          data: { sql: sqlFile },
        },
      })

      typeList.value = result
      typeListAll.value = cloneDeep(result)
    } catch (error) {
      console.error(error)
    }
  }
  // 分组列表相关-end

  // 添加分组弹窗相关-start
  const addGroupVisible = ref(false)
  const addGroupInput = ref<string>('')
  async function addGroup() {
    isEdit.value = false
    addGroupVisible.value = true
  }
  async function addGroupConfirm() {
    if (!addGroupInput.value.trim()) {
      ElMessage.error('请输入分组名称')
      return
    }

    const json = {
      id: uuidv4(),
      type_name: addGroupInput.value,
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
    // await appApi.addAppType({
    //   type_name: addGroupInput.value,
    // })

    ElMessage.success('添加分组成功')
    await getDataTypeList()
    addGroupVisible.value = false
    addGroupInput.value = ''
  }
  // 添加分组弹窗相关-end

  // 编辑分组弹窗相关-start
  const currentEditGroup = ref(null)
  async function editGroup(item) {
    isEdit.value = true
    addGroupVisible.value = true
    currentEditGroup.value = item
    addGroupInput.value = item.type_name
  }
  async function editGroupConfirm() {
    const json = typeList.value.find((item: any) => item.id === currentEditGroup.value.id)
    jsBridge.register({
      method: 'proxySql',
      json: {
        methods: 'update',
        data: {
          id: json.id,
          item: {
            ...json,
            type_name: addGroupInput.value,
          },
          sql: sqlFile,
        },
      },
    })
    // await appApi.editAppTypeList({
    //   id: currentEditGroup.value.id,
    //   type_name: addGroupInput.value,
    // })
    ElMessage.success('编辑分组成功')
    await getDataTypeList()
    addGroupVisible.value = false
    addGroupInput.value = ''
  }
  async function deleteGroup(item) {
    await ElMessageBox.confirm('确定删除该分组吗？删除分组后，分组下的所有代码数据也会被删除。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    // await appApi.removeAppTypeList({
    //   id: item.id,
    // })
    await jsBridge.registerSync({
      method: 'proxySql',
      json: {
        methods: 'remove',
        data: { id: item.id, sql: sqlFile },
      },
    })
    ElMessage.success('删除分组成功')
    await getDataTypeList()
  }
  // 编辑分组弹窗相关-end

  return {
    isEdit,
    typeListAll,
    typeList,
    setTypeList,
    getDataTypeList,
    addGroupVisible,
    addGroupInput,
    addGroup,
    addGroupConfirm,
    currentEditGroup,
    editGroup,
    editGroupConfirm,
    deleteGroup,
  }
}
