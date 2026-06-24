import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import config from './src/config/index.js'

// https://vite.dev/config/
export default defineConfig({
  base: '/uworkplus/',
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'webview',
        },
      },
    }),
    vueDevTools(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        // manualChunks: {},
      },
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  define: {
    'process.env': {},
    // 从配置文件获取配置
    __APP_CONFIG__: JSON.stringify(config),
    __API_CONFIG__: JSON.stringify(config.api),
    __ENV_INFO__: JSON.stringify({
      env: config.env || 'development',
      isDev: config.debug,
      isStaging: config.env === 'staging',
      isProd: config.env === 'production',
    }),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      process: 'process/browser',
    },
  },
  server: {
    proxy: {
      // 本地 markdown 微应用（5176）代理到主应用同域，避免 qiankun 开发态脚本 404
      '/uworkplusMarkdown': {
        target: 'http://127.0.0.1:5176',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
