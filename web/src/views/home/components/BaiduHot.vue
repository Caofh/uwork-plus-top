<template>
  <div class="baidu-hot-container">
    <div class="header">
      <h3 class="title c-flex-x-start" :class="getTitleNameClass(type)">
        <BaiduIcon v-if="type === 1" :color="'#ff4d4f'" class="title-icon" />
        <WeiboIcon v-if="type === 2" :color="'#ff7a45'" class="title-icon" />

        <span>{{ title }}</span>
      </h3>
      <div class="refresh-btn" @click="refreshData" :class="{ loading: isLoading }">
        <el-icon v-if="!isLoading"><Refresh /></el-icon>
        <el-icon v-else class="is-loading"><Loading /></el-icon>
      </div>
    </div>
    <div class="list-container">
      <el-skeleton animated class="skeleton-ani c-flex-y-center" v-if="isLoading" :rows="5" />
      <div v-else class="list-container-content">
        <div class="news-list" v-if="hotNewsList.length">
          <div
            v-for="(item, index) in hotNewsList"
            :key="index"
            class="news-item"
            @click="openNews(item)"
          >
            <!-- 排名数字 -->
            <div class="rank-number" :class="getRankClass(index + 1)">
              {{ index + 1 }}
            </div>

            <!-- 新闻标题 -->
            <div class="news-title" :class="getTitleClass(index + 1)">
              {{ item.title }}
            </div>

            <!-- 状态标签 -->
            <div class="status-tag" v-if="item.tag">
              <span class="tag" :class="getTagClass(item.tag)">
                {{ item.hotStatus }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <!-- 空状态 -->
          <el-icon size="48" color="#999"><Document /></el-icon>
          <p>暂无热点新闻</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { onMounted, ref, reactive, inject, computed, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Refresh, Loading, Document } from '@element-plus/icons-vue'
  import { openExternal } from '@/utils/electron'
  import { number } from 'echarts'

  // icon
  import BaiduIcon from './svg/Baidu-icon.vue'
  import WeiboIcon from './svg/weibo-icon.vue'

  // 响应式数据
  const isLoading = ref(true)
  const hotNewsList = ref([])

  // 模拟数据（实际应该从API获取）
  const mockData = [
    { title: '朱雀玄武敕令自曝被送精神病院', tag: '热' },
    { title: '跳水冠军谈全红婵发胖原因', tag: '热' },
    { title: '这种东西别囤在家里了', tag: '' },
    { title: '山西人爱午睡究竟是为啥', tag: '热' },
    { title: '医学生飞机上救人 被质疑有无资质', tag: '新' },
    { title: '释永信携34人潜逃被拦截?警方回应', tag: '热' },
    { title: '王琳给儿子打电话情绪失控倪萍哭了', tag: '' },
    { title: '印度1岁男童咬死眼镜蛇奇迹生还', tag: '热' },
    { title: '山西载12人中巴车因强降雨失联', tag: '' },
  ]

  /* 子组件调用 */
  // 所有逻辑集中在最顶层处理 接受父组件的provide方法
  const parentProvide = inject('parentProvide')
  // const baiduHotData = computed(() => parentProvide.baiduHotData.value);
  // console.log("baiduHotData");
  // console.log(baiduHotData.value);

  // 声明你想接收的 props
  const props = defineProps({
    title: {
      type: String,
      default: '百度热点',
    },
    // 1: 百度热点 2: 微博热搜
    type: {
      type: Number,
      default: 1,
    },
  })

  watch(
    () => parentProvide,
    async (newValue, oldValue) => {
      // console.log('baiduHotData')
      // console.log(hotNewsList.value)
      // isLoading.value = true;

      const type = props.type
      const resultData = getHotData(newValue, type)

      // 获取 百度新闻 or 微博 热点数据
      hotNewsList.value = resultData || []
      setTimeout(() => {
        isLoading.value = false
      }, 1000)
    },
    { immediate: true, deep: true }
  )

  function getHotData(data, type) {
    if (type === 1) {
      return data.baiduHotData.value.hotNews
    } else if (type === 2) {
      return data.baiduHotData.value.weiboHot
    }
  }

  // 获取排名样式类
  const getRankClass = rank => {
    if (rank <= 3) {
      return props.type === 1 ? `baidu-rank-top-${rank}` : `weibo-rank-top-${rank}`
    }
    return 'rank-normal'
  }

  // 获取标题样式类
  const getTitleClass = rank => {
    if (rank <= 3) {
      return props.type === 1 ? `baidu-title-top-${rank}` : `weibo-title-top-${rank}`
    }
    return 'title-normal'
  }
  const getTitleNameClass = type => {
    return props.type === 1 ? `baidu-title-name` : `weibo-title-name`
  }

  // 获取标签样式类
  const getTagClass = tag => {
    switch (tag) {
      case '热':
        return 'tag-hot'
      case '新':
        return 'tag-new'
      default:
        return ''
    }
  }

  // 刷新数据
  const refreshData = async () => {
    isLoading.value = true
    await parentProvide.refreshSpiderData()
    setTimeout(() => {
      isLoading.value = false
    }, 1000)
  }

  // 打开新闻
  const openNews = item => {
    if (item.src) {
      // 打开外部链接
      openExternal(item.src)
    } else if (item.link) {
      // 打开外部链接
      openExternal(item.link)
    } else {
      // 否则显示提示
      ElMessage.info(`点击了: ${item.title}`)
    }
  }

  // 组件挂载时初始化
  onMounted(() => {
    // initData();
  })
</script>

<style lang="scss" scoped>
  .baidu-hot-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 18px;
    // border: 1px solid rgba(255, 255, 255, 0.08);
    // border-radius: 16px;
    background: #1a1a1a;
    box-shadow: 0 18px 44px -34px rgba(0, 0, 0, 0.85);

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      .title {
        margin: 0;
        color: #e0e0e0;
        font-size: 17px;
        font-weight: 600;

        .title-icon {
          margin-right: 8px;
        }

        &.baidu-title-name {
          color: #ff7a7a;
        }

        &.weibo-title-name {
          color: #ff9c66;
        }
      }

      .refresh-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.05);
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;

        &:hover,
        &.loading {
          border-color: rgba(66, 185, 131, 0.36);
          background: rgba(66, 185, 131, 0.12);
          color: #7ee2ad;
        }

        .is-loading {
          animation: spin 1s linear infinite;
        }
      }
    }

    .list-container {
      height: calc(100% - 55px);

      .skeleton-ani {
        height: 100%;
        align-items: flex-start;
      }

      .list-container-content {
        height: 100%;

        .news-list {
          height: 100%;
          overflow-y: auto;

          .news-item {
            display: flex;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            cursor: pointer;
            transition: transform 0.2s ease, background 0.2s ease;

            &:hover {
              transform: translateX(4px);
            }

            &:last-child {
              border-bottom: none;
            }

            .rank-number {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
              margin-right: 12px;
              border-radius: 50%;
              flex-shrink: 0;
              font-size: 14px;
              font-weight: 600;

              &.baidu-rank-top-1,
              &.baidu-rank-top-2,
              &.baidu-rank-top-3 {
                background: rgba(255, 122, 122, 0.9);
                color: #fff;
              }

              &.weibo-rank-top-1,
              &.weibo-rank-top-2,
              &.weibo-rank-top-3 {
                background: rgba(255, 156, 102, 0.9);
                color: #fff;
              }

              &.rank-normal {
                background: rgba(255, 255, 255, 0.08);
                color: #d8d8d8;
              }
            }

            .news-title {
              flex: 1;
              overflow: hidden;
              color: #e0e0e0;
              font-size: 14px;
              line-height: 1.5;
              text-overflow: ellipsis;
              white-space: nowrap;

              &.baidu-title-top-1,
              &.baidu-title-top-2,
              &.baidu-title-top-3 {
                color: #ff7a7a;
                font-weight: 600;
              }

              &.weibo-title-top-1,
              &.weibo-title-top-2,
              &.weibo-title-top-3 {
                color: #ff9c66;
                font-weight: 600;
              }
            }

            .status-tag {
              flex-shrink: 0;
              margin-left: 8px;

              .tag {
                padding: 2px 8px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 500;

                &.tag-hot {
                  border: 1px solid rgba(255, 122, 69, 0.28);
                  background: rgba(255, 122, 69, 0.12);
                  color: #ff9c66;
                }

                &.tag-new {
                  border: 1px solid rgba(255, 77, 79, 0.28);
                  background: rgba(255, 77, 79, 0.12);
                  color: #ff7a7a;
                }
              }
            }
          }
        }

        .empty-state {
          height: 100%;
        }
      }
    }

    .empty-state {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #9a9a9a;

      p {
        margin-top: 12px;
        font-size: 14px;
      }
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .baidu-hot-container {
      padding: 16px;

      .header .title {
        font-size: 16px;
      }

      .news-list .news-item {
        padding: 10px 0;

        .rank-number {
          width: 20px;
          height: 20px;
          margin-right: 8px;
          font-size: 12px;
        }

        .news-title {
          font-size: 13px;
        }
      }
    }
  }
</style>
