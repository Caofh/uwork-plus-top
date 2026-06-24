<template>
  <div class="json-git-diff">
    <div v-if="diffResult.stats.changes > 0" class="diff-summary">
      <span class="diff-summary__icon">↕</span>
      <span class="diff-summary__count">{{ diffResult.stats.changes }}</span>
      <div class="diff-summary__blocks">
        <span
          v-for="(block, index) in changeBlocks"
          :key="index"
          class="diff-summary__block"
          :class="`diff-summary__block--${block}`"
        />
      </div>
    </div>
    <div v-else class="diff-summary diff-summary--same">
      <span>两份 JSON 内容完全一致</span>
    </div>

    <div class="diff-panels">
      <div class="diff-panel">
        <div class="diff-panel__header">{{ leftLabel }}</div>
        <div ref="leftBodyRef" class="diff-panel__body" @scroll="syncScroll('left', $event)">
          <div class="diff-table">
            <template v-for="(row, index) in diffResult.rows" :key="`left-${index}`">
              <div v-if="row.isHunkStart" class="diff-hunk">{{ row.hunkHeader }}</div>
              <div class="diff-row" :class="getRowClass(row.leftType)">
                <span class="diff-gutter">{{ row.leftLineNum ?? '' }}</span>
                <span class="diff-sign">{{ getSign(row.leftType) }}</span>
                <code class="diff-code">{{ row.leftText }}</code>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="diff-panel">
        <div class="diff-panel__header">{{ rightLabel }}</div>
        <div ref="rightBodyRef" class="diff-panel__body" @scroll="syncScroll('right', $event)">
          <div class="diff-table">
            <template v-for="(row, index) in diffResult.rows" :key="`right-${index}`">
              <div v-if="row.isHunkStart" class="diff-hunk">{{ row.hunkHeader }}</div>
              <div class="diff-row" :class="getRowClass(row.rightType)">
                <span class="diff-gutter">{{ row.rightLineNum ?? '' }}</span>
                <span class="diff-sign">{{ getSign(row.rightType) }}</span>
                <code class="diff-code">{{ row.rightText }}</code>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { buildSideBySideDiff, formatJsonText } from './jsonLineDiff'

  const props = defineProps({
    leftJson: {
      type: String,
      default: '',
    },
    rightJson: {
      type: String,
      default: '',
    },
    leftLabel: {
      type: String,
      default: '变更前',
    },
    rightLabel: {
      type: String,
      default: '变更后',
    },
  })

  const leftBodyRef = ref(null)
  const rightBodyRef = ref(null)
  let syncing = false

  const diffResult = computed(() => {
    const leftText = formatJsonText(props.leftJson)
    const rightText = formatJsonText(props.rightJson)
    return buildSideBySideDiff(leftText, rightText)
  })

  const changeBlocks = computed(() => {
    const blocks = []
    diffResult.value.rows.forEach(row => {
      if (row.leftType === 'delete') {
        blocks.push('delete')
      }
      if (row.rightType === 'insert') {
        blocks.push('insert')
      }
    })
    return blocks.slice(0, 24)
  })

  function getSign(type) {
    if (type === 'delete') {
      return '-'
    }
    if (type === 'insert') {
      return '+'
    }
    return ' '
  }

  function getRowClass(type) {
    return {
      'diff-row--delete': type === 'delete',
      'diff-row--insert': type === 'insert',
      'diff-row--empty': type === 'empty',
    }
  }

  function syncScroll(source, event) {
    if (syncing) {
      return
    }
    syncing = true
    const target = source === 'left' ? rightBodyRef.value : leftBodyRef.value
    if (target) {
      target.scrollTop = event.target.scrollTop
      target.scrollLeft = event.target.scrollLeft
    }
    requestAnimationFrame(() => {
      syncing = false
    })
  }

  watch(
    () => [props.leftJson, props.rightJson],
    () => {
      if (leftBodyRef.value) {
        leftBodyRef.value.scrollTop = 0
      }
      if (rightBodyRef.value) {
        rightBodyRef.value.scrollTop = 0
      }
    }
  )
</script>

<style scoped lang="scss">
  .json-git-diff {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    border: 1px solid #2e2e2e;
    border-radius: 8px;
    overflow: hidden;
    background: #121212;
  }

  .diff-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid #2e2e2e;
    background: #1a1a1a;
    font-size: 13px;
    color: #bdbdbd;
    flex-shrink: 0;

    &--same {
      color: #81c784;
    }

    &__icon {
      font-size: 14px;
      line-height: 1;
      color: #90caf9;
    }

    &__count {
      font-weight: 600;
      color: #f0f0f0;
    }

    &__blocks {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-left: 4px;
    }

    &__block {
      width: 8px;
      height: 14px;
      border-radius: 2px;

      &--delete {
        background: rgba(248, 81, 73, 0.55);
      }

      &--insert {
        background: rgba(63, 185, 80, 0.55);
      }
    }
  }

  .diff-panels {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .diff-panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;

    &:first-child {
      border-right: 1px solid #2e2e2e;
    }

    &__header {
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 600;
      color: #f0f0f0;
      background: #1e1e1e;
      border-bottom: 1px solid #2e2e2e;
      flex-shrink: 0;
    }

    &__body {
      flex: 1;
      min-height: 0;
      overflow: auto;
      background: #1a1a1a;
    }
  }

  .diff-table {
    min-width: max-content;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
    line-height: 20px;
  }

  .diff-hunk {
    padding: 4px 12px;
    color: #757575;
    background: #252525;
    border-top: 1px solid #2e2e2e;
    border-bottom: 1px solid #2e2e2e;
    white-space: pre;
  }

  .diff-row {
    display: flex;
    align-items: stretch;
    white-space: pre;
    min-height: 20px;

    &--delete {
      background: rgba(248, 81, 73, 0.12);

      .diff-sign {
        color: #f85149;
      }
    }

    &--insert {
      background: rgba(63, 185, 80, 0.12);

      .diff-sign {
        color: #3fb950;
      }
    }

    &--empty {
      background: rgba(255, 255, 255, 0.02);
    }
  }

  .diff-gutter {
    flex: 0 0 48px;
    padding: 0 8px;
    text-align: right;
    color: #555;
    user-select: none;
    border-right: 1px solid #2e2e2e;
    background: #1e1e1e;
  }

  .diff-sign {
    flex: 0 0 16px;
    text-align: center;
    user-select: none;
    color: #555;
  }

  .diff-code {
    flex: 1;
    padding: 0 12px 0 4px;
    color: #e0e0e0;
    white-space: pre;
  }
</style>
