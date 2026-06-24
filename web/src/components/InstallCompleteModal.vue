<template>
  <div class="install-complete-modal">
    <div class="success-icon">
      <i class="el-icon-success"></i>
    </div>

    <h3 class="title">安装完成！</h3>
    <!-- <p class="description">安装结果如下</p>

    <div class="details-card">
      <h4 class="details-title">安装详情：</h4>
      <ul class="details-list">
        <li v-for="(item, index) in installDetails" :key="index">
          <i class="el-icon-check"></i>
          {{ item }}
        </li>
      </ul>
    </div>

    <div class="additional-info" v-if="additionalInfo">
      <p>{{ additionalInfo }}</p>
    </div> -->
  </div>
</template>

<script setup>
  defineProps({
    installDetails: {
      type: Array,
      default: () => ['Node.js 环境配置完成', '依赖包安装成功', '配置文件已更新', '服务启动正常'],
    },
    additionalInfo: {
      type: String,
      default: '',
    },
  })
</script>

<style scoped>
  .install-complete-modal {
    text-align: center;
    padding: 20px;
  }

  .success-icon {
    margin-bottom: 15px;
  }

  .success-icon i {
    font-size: 48px;
    color: #67c23a;
  }

  .title {
    color: #67c23a;
    margin: 0 0 10px 0;
    font-size: 18px;
  }

  .description {
    color: #606266;
    margin: 0 0 15px 0;
  }

  .details-card {
    background: #f5f7fa;
    padding: 15px;
    border-radius: 8px;
    text-align: left;
    margin-bottom: 15px;
  }

  .details-title {
    margin: 0 0 10px 0;
    color: #303133;
    font-size: 14px;
  }

  .details-list {
    margin: 0;
    /* padding-left: 20px; */
    color: #606266;
    list-style: none;
  }

  .details-list li {
    margin-bottom: 5px;
    display: flex;
    align-items: center;
  }

  .details-list li i {
    color: #67c23a;
    margin-right: 8px;
    font-size: 12px;
  }

  .additional-info {
    background: #e1f3d8;
    padding: 10px;
    border-radius: 6px;
    border-left: 4px solid #67c23a;
  }

  .additional-info p {
    margin: 0;
    color: #67c23a;
    font-size: 14px;
  }
</style>
