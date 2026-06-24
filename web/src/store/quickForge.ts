import { defineStore } from 'pinia'

export type QuickForgeInitStepKey =
  | 'pullQuickForgeRepo'
  | 'restartQuickForgeAfterPull'
  | 'ensureQuickForgeRepo'
  | 'restartQuickForgeAfterClone'
  | 'initQuickForgeInBackground'

export type QuickForgeInitStepStatus = 'pending' | 'running' | 'success' | 'skipped' | 'failed'

export interface QuickForgeInitStep {
  key: QuickForgeInitStepKey
  label: string
  status: QuickForgeInitStepStatus
  detail: string
}

const STEP_LABELS: Record<QuickForgeInitStepKey, string> = {
  pullQuickForgeRepo: '拉取 QuickForge 最新代码',
  restartQuickForgeAfterPull: '重启 QuickForge 服务（更新后）',
  ensureQuickForgeRepo: '克隆 QuickForge 仓库',
  restartQuickForgeAfterClone: '重启 QuickForge 服务（克隆后）',
  initQuickForgeInBackground: '模块初始化',
}

const STEP_ORDER: QuickForgeInitStepKey[] = [
  'pullQuickForgeRepo',
  'restartQuickForgeAfterPull',
  'ensureQuickForgeRepo',
  'restartQuickForgeAfterClone',
  'initQuickForgeInBackground',
]

function createDefaultSteps(): QuickForgeInitStep[] {
  return STEP_ORDER.map(key => ({
    key,
    label: STEP_LABELS[key],
    status: 'pending',
    detail: '等待中',
  }))
}

export const useQuickForgeStore = defineStore('quickForge', {
  state: () => ({
    initSteps: createDefaultSteps() as QuickForgeInitStep[],
    currentStepKey: null as QuickForgeInitStepKey | null,
  }),

  getters: {
    /** 后台初始化是否已全部完成 */
    initQuickForgeInBackground(state): boolean {
      const step = state.initSteps.find(item => item.key === 'initQuickForgeInBackground')
      return step?.status === 'success'
    },

    /** 仅展示实际执行过的步骤（不含 pending / skipped / 总完成标记） */
    displayedInitSteps(state): QuickForgeInitStep[] {
      return state.initSteps.filter(
        step =>
          step.key !== 'initQuickForgeInBackground' &&
          (step.status === 'running' || step.status === 'success' || step.status === 'failed'),
      )
    },

    currentStepDetail(state): string {
      if (!state.currentStepKey) {
        return ''
      }
      const step = state.initSteps.find(item => item.key === state.currentStepKey)
      if (!step || step.status !== 'running') {
        return ''
      }
      return `${step.label}：${step.detail}`
    },
  },

  actions: {
    resetInitSteps() {
      this.initSteps = createDefaultSteps()
      this.currentStepKey = null
    },

    beginStep(key: QuickForgeInitStepKey, detail = '进行中...') {
      this.currentStepKey = key
      this.updateStep(key, { status: 'running', detail })
    },

    finishStep(key: QuickForgeInitStepKey, detail: string) {
      this.updateStep(key, { status: 'success', detail })
      if (this.currentStepKey === key) {
        this.currentStepKey = null
      }
    },

    skipStep(key: QuickForgeInitStepKey, detail: string) {
      this.updateStep(key, { status: 'skipped', detail })
      if (this.currentStepKey === key) {
        this.currentStepKey = null
      }
    },

    failStep(key: QuickForgeInitStepKey, detail: string) {
      this.updateStep(key, { status: 'failed', detail })
      if (this.currentStepKey === key) {
        this.currentStepKey = null
      }
    },

    updateStep(
      key: QuickForgeInitStepKey,
      patch: Partial<Pick<QuickForgeInitStep, 'status' | 'detail'>>,
    ) {
      const index = this.initSteps.findIndex(item => item.key === key)
      if (index === -1) {
        return
      }
      const next = [...this.initSteps]
      next[index] = { ...next[index], ...patch }
      this.initSteps = next
    },
  },
})
