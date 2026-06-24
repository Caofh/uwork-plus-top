import { ref } from 'vue'
import { appApi } from '../service/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cloneDeep } from 'lodash'
import { getStorage } from '@/utils/storage'

export const useTypeListHook = () => {
  // 是否是编辑状态
  const isEdit = ref(false)

  const officialGroup = {
    id: 9999,
    type_name: '官方推荐',
    isOfficial: true,
  }

  // 分组列表相关-start
  const typeListAll = ref([]) // 全部分组列表(克隆)
  const typeList = ref([])
  const setTypeList = (payload: any[]) => {
    typeList.value = payload
  }
  const getDataTypeList = async () => {
    try {
      const res = await appApi.getAppTypeList()

      const result = [...res.data]

      // 如果用户不是管理员，则组合官方推荐
      const userInfo: any = getStorage('userInfo')
      if (userInfo.role !== '1') {
        result.unshift(officialGroup)
      }

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
    await appApi.addAppType({
      type_name: addGroupInput.value,
    })
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
    await appApi.editAppTypeList({
      id: currentEditGroup.value.id,
      type_name: addGroupInput.value,
    })
    ElMessage.success('编辑分组成功')
    await getDataTypeList()
    addGroupVisible.value = false
    addGroupInput.value = ''
  }
  async function deleteGroup(item) {
    await ElMessageBox.confirm('确定删除该分组吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await appApi.removeAppTypeList({
      id: item.id,
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
