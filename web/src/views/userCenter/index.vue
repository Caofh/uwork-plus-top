<template>
  <div class="user-center">
    <el-button @click="logout">退出登录</el-button>
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, ref, reactive, inject } from 'vue'
  import { ElMessageBox } from 'element-plus'

  import { useLoginHooks } from '@/hooks/loginHooks'
  const { logout: logoutHooks } = useLoginHooks()

  const parentProvide = inject('parentProvide')

  // 退出登录
  const logout = async () => {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    logoutHooks()
    // 回到首页
    parentProvide.setCarouselAuto('/home')
  }

  // 挂载时的操作
  onMounted(() => {
    // console.log('组件已挂载');
  })

  // 卸载时的操作
  onUnmounted(() => {
    // console.log('组件已卸载');
  })
</script>

<style lang="scss" scoped></style>
