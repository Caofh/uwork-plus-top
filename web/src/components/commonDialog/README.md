# CommonDialog 通用弹窗组件

一个基于 Element Plus 的通用弹窗组件，支持插槽和多种配置选项，方便复用。

## 特性

- ✅ 支持 v-model 双向绑定
- ✅ 完整的插槽支持（默认内容、头部、底部）
- ✅ 丰富的配置选项
- ✅ TypeScript 支持
- ✅ 响应式设计
- ✅ 事件回调支持
- ✅ 暴露方法供父组件调用

## 基本用法

```vue
<template>
  <div>
    <el-button @click="showDialog = true">打开弹窗</el-button>

    <CommonDialog v-model="showDialog" title="基础弹窗">
      <p>这是弹窗内容</p>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </template>
    </CommonDialog>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import CommonDialog from '@/components/CommonDialog.vue'

  const showDialog = ref(false)

  const handleConfirm = () => {
    console.log('确认操作')
    showDialog.value = false
  }
</script>
```

## Props 配置

| 参数               | 类型             | 默认值 | 说明                       |
| ------------------ | ---------------- | ------ | -------------------------- |
| modelValue         | boolean          | false  | 弹窗显示状态               |
| title              | string           | ''     | 弹窗标题                   |
| width              | string \| number | '50%'  | 弹窗宽度                   |
| fullscreen         | boolean          | false  | 是否全屏显示               |
| top                | string           | '15vh' | 弹窗距离顶部的距离         |
| modal              | boolean          | true   | 是否显示遮罩层             |
| appendToBody       | boolean          | false  | 是否插入到 body 元素       |
| lockScroll         | boolean          | true   | 是否锁定页面滚动           |
| closeOnClickModal  | boolean          | true   | 是否可以通过点击遮罩层关闭 |
| closeOnPressEscape | boolean          | true   | 是否可以通过按下 ESC 关闭  |
| showClose          | boolean          | true   | 是否显示关闭按钮           |
| destroyOnClose     | boolean          | false  | 关闭时是否销毁弹窗内容     |
| center             | boolean          | false  | 是否居中显示               |
| draggable          | boolean          | false  | 是否可拖拽                 |
| customClass        | string           | ''     | 自定义类名                 |
| beforeClose        | function         | -      | 关闭前的回调函数           |

## 插槽

### 默认插槽

弹窗的主要内容区域。

```vue
<CommonDialog v-model="showDialog">
  <p>这是主要内容</p>
</CommonDialog>
```

### header 插槽

自定义头部内容，支持作用域插槽。

```vue
<CommonDialog v-model="showDialog">
  <template #header="{ close, titleId, titleClass }">
    <div class="custom-header">
      <h3>自定义标题</h3>
      <el-button @click="close">关闭</el-button>
    </div>
  </template>
  
  <p>弹窗内容</p>
</CommonDialog>
```

### footer 插槽

自定义底部内容。

```vue
<CommonDialog v-model="showDialog">
  <p>弹窗内容</p>
  
  <template #footer>
    <div class="dialog-footer">
      <el-button @click="showDialog = false">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </div>
  </template>
</CommonDialog>
```

## 事件

| 事件名            | 说明                   | 回调参数         |
| ----------------- | ---------------------- | ---------------- |
| update:modelValue | 弹窗显示状态改变时触发 | (value: boolean) |
| open              | 弹窗打开时触发         | -                |
| opened            | 弹窗打开动画结束时触发 | -                |
| close             | 弹窗关闭时触发         | -                |
| closed            | 弹窗关闭动画结束时触发 | -                |

## 方法

通过 ref 可以调用以下方法：

| 方法名 | 说明     | 参数 |
| ------ | -------- | ---- |
| open   | 打开弹窗 | -    |
| close  | 关闭弹窗 | -    |

```vue
<template>
  <div>
    <el-button @click="dialogRef.open()">打开弹窗</el-button>
    <el-button @click="dialogRef.close()">关闭弹窗</el-button>

    <CommonDialog ref="dialogRef" title="弹窗">
      <p>内容</p>
    </CommonDialog>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import CommonDialog from '@/components/CommonDialog.vue'

  const dialogRef = ref()
</script>
```

## 高级用法

### 表单弹窗

```vue
<template>
  <CommonDialog
    v-model="showFormDialog"
    title="用户信息"
    width="600px"
    :before-close="handleBeforeClose"
  >
    <el-form :model="formData" :rules="rules" ref="formRef">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showFormDialog = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </template>
  </CommonDialog>
</template>
```

### 全屏弹窗

```vue
<template>
  <CommonDialog
    v-model="showFullscreenDialog"
    title="全屏内容"
    :fullscreen="true"
    :close-on-click-modal="false"
  >
    <div class="fullscreen-content">
      <!-- 大量内容 -->
    </div>
  </CommonDialog>
</template>
```

### 自定义样式

```vue
<template>
  <CommonDialog
    v-model="showDialog"
    title="自定义样式"
    custom-class="my-dialog"
  >
    <p>内容</p>
  </CommonDialog>
</template>

<style>
  .my-dialog {
    .el-dialog {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
  }
</style>
```

## 注意事项

1. 组件基于 Element Plus 的 `el-dialog`，确保项目中已安装 Element Plus
2. 使用 `v-model` 进行双向绑定控制弹窗显示状态
3. 可以通过插槽灵活定制弹窗内容
4. 支持响应式设计，在移动端会自动调整样式
5. 可以通过 `beforeClose` 属性添加关闭前的确认逻辑
