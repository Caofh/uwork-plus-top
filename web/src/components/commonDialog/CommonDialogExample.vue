<template>
  <div class="dialog-examples">
    <h2>通用弹窗组件示例</h2>

    <!-- 基础弹窗 -->
    <el-button type="primary" @click="showBasicDialog = true">基础弹窗</el-button>

    <!-- 自定义头部弹窗 -->
    <el-button type="success" @click="showCustomHeaderDialog = true">自定义头部弹窗</el-button>

    <!-- 全屏弹窗 -->
    <el-button type="warning" @click="showFullscreenDialog = true">全屏弹窗</el-button>

    <!-- 表单弹窗 -->
    <el-button type="info" @click="showFormDialog = true">表单弹窗</el-button>

    <!-- 基础弹窗 -->
    <CommonDialog v-model="showBasicDialog" title="基础弹窗" width="500px">
      <p>这是一个基础弹窗示例，使用默认配置。</p>
      <p>你可以在这里放置任何内容。</p>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showBasicDialog = false">取消</el-button>
          <el-button type="primary" @click="handleBasicConfirm">确认</el-button>
        </div>
      </template>
    </CommonDialog>

    <!-- 自定义头部弹窗 -->
    <CommonDialog v-model="showCustomHeaderDialog" width="600px" :show-close="false">
      <template #header="{ close }">
        <div class="custom-header">
          <h3>自定义头部</h3>
          <el-button type="text" @click="close">×</el-button>
        </div>
      </template>

      <div class="custom-content">
        <p>这个弹窗使用了自定义头部。</p>
        <p>你可以完全控制头部的样式和内容。</p>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCustomHeaderDialog = false">关闭</el-button>
        </div>
      </template>
    </CommonDialog>

    <!-- 全屏弹窗 -->
    <CommonDialog
      v-model="showFullscreenDialog"
      title="全屏弹窗"
      :fullscreen="true"
      :close-on-click-modal="false"
    >
      <div class="fullscreen-content">
        <h3>全屏弹窗内容</h3>
        <p>这个弹窗占据了整个屏幕。</p>
        <p>适合显示大量内容或复杂的操作界面。</p>

        <div class="content-area">
          <el-card v-for="i in 5" :key="i" class="content-card">
            <h4>内容卡片 {{ i }}</h4>
            <p>这是第 {{ i }} 个内容卡片，展示了全屏弹窗的布局效果。</p>
          </el-card>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showFullscreenDialog = false">关闭</el-button>
        </div>
      </template>
    </CommonDialog>

    <!-- 表单弹窗 -->
    <CommonDialog
      v-model="showFormDialog"
      title="表单弹窗"
      width="600px"
      :before-close="handleFormBeforeClose"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="formData.age" :min="1" :max="120" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="formData.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="爱好" prop="hobbies">
          <el-checkbox-group v-model="formData.hobbies">
            <el-checkbox label="reading">阅读</el-checkbox>
            <el-checkbox label="music">音乐</el-checkbox>
            <el-checkbox label="sports">运动</el-checkbox>
            <el-checkbox label="travel">旅行</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showFormDialog = false">取消</el-button>
          <el-button type="primary" @click="handleFormSubmit">提交</el-button>
        </div>
      </template>
    </CommonDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { defineAsyncComponent } from 'vue'
  const CommonDialog = defineAsyncComponent(() => import('./CommonDialog.vue'))

  // 弹窗显示状态
  const showBasicDialog = ref(false)
  const showCustomHeaderDialog = ref(false)
  const showFullscreenDialog = ref(false)
  const showFormDialog = ref(false)

  // 表单数据
  const formRef = ref()
  const formData = reactive({
    name: '',
    email: '',
    age: 18,
    gender: 'male',
    hobbies: [],
    remark: '',
  })

  // 表单验证规则
  const formRules = {
    name: [
      { required: true, message: '请输入姓名', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
    ],
    age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
    gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  }

  // 基础弹窗确认
  const handleBasicConfirm = () => {
    ElMessage.success('基础弹窗确认操作')
    showBasicDialog.value = false
  }

  // 表单提交前确认
  const handleFormBeforeClose = (done: () => void) => {
    if (formData.name || formData.email) {
      ElMessageBox.confirm('表单已填写，确定要关闭吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          done()
        })
        .catch(() => {
          // 取消关闭
        })
    } else {
      done()
    }
  }

  // 表单提交
  const handleFormSubmit = async () => {
    try {
      await formRef.value.validate()
      ElMessage.success('表单提交成功！')
      console.log('表单数据:', formData)
      showFormDialog.value = false
    } catch (error) {
      ElMessage.error('请检查表单填写是否正确')
    }
  }
</script>

<style lang="scss" scoped>
  .dialog-examples {
    padding: 20px;

    h2 {
      margin-bottom: 20px;
      color: #333;
    }

    .el-button {
      margin-right: 10px;
      margin-bottom: 10px;
    }
  }

  .custom-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      color: #409eff;
    }
  }

  .custom-content {
    padding: 20px 0;

    p {
      margin: 10px 0;
      line-height: 1.6;
    }
  }

  .fullscreen-content {
    padding: 20px;

    h3 {
      margin-bottom: 20px;
      color: #333;
    }

    .content-area {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;

      .content-card {
        margin-bottom: 0;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  // 响应式设计
  @media (max-width: 768px) {
    .dialog-examples {
      padding: 10px;

      .el-button {
        width: 100%;
        margin-right: 0;
      }
    }

    .fullscreen-content .content-area {
      grid-template-columns: 1fr;
    }
  }
</style>
