/** 文档链接，可通过 Vite 环境变量覆盖（见 web/.env.example） */
export const docUrls = {
  softwareOfficial: import.meta.env.VITE_DOC_SOFTWARE_OFFICIAL ?? '',
  intro: import.meta.env.VITE_DOC_INTRO ?? '',
  voiceWakeup: import.meta.env.VITE_DOC_VOICE_WAKEUP ?? '',
  switchProxyGuide: import.meta.env.VITE_DOC_SWITCH_PROXY ?? '',
  proxyCertHelp: import.meta.env.VITE_DOC_PROXY_CERT ?? '',
  codeSnippet: import.meta.env.VITE_DOC_CODE_SNIPPET ?? '',
} as const
