import { defineStore } from 'pinia'

export const useCommonStore = defineStore('common', {
  state: () => ({
    showDock: true,
    token: '',
    showLoginVisible: false,
    currentVersion: '',
    userInfo: null,
    /** 首页任务列表标红（逾期）条数，用于 Dock 首页角标 */
    homeTaskOverdueCount: 0,
  }),

  getters: {
    getShowDock: state => state.showDock,
  },

  actions: {
    updateShowDock(payload: boolean) {
      this.showDock = payload
    },
    updateToken(payload: string) {
      this.token = payload
    },
    updateUserInfo(payload: any) {
      this.userInfo = payload
    },
    updateShowLoginVisible(payload: boolean) {
      this.showLoginVisible = payload
    },
    updateCurrentVersion(payload: string) {
      this.currentVersion = payload
    },
    updateHomeTaskOverdueCount(payload: number) {
      this.homeTaskOverdueCount = Math.max(0, payload)
    },
  },
})
