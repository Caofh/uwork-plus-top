import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 根据 mode 加载对应的环境变量
  const env = loadEnv(mode, process.cwd(), '')
  console.log('环境变量:', env)
  
  // 根据不同的 mode 进行不同的配置
  const isDev = mode === 'development'
  const isProd = mode === 'production'
  console.log('  环境判断:', { isDev, isProd })
  
  return {
    base: env.VITE_PUBLIC_PATH,
    plugins: [
      vue(),
      // 只在开发环境启用 devtools
      ...(isDev ? [vueDevTools()] : []),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        process: "process/browser",
      },
    },
    // 根据 mode 进行不同的构建配置
    build: {
      // 开发环境构建时启用 sourcemap
      sourcemap: !isProd,
      // 生产环境构建时进行代码压缩
      minify: isProd ? 'esbuild' : false,
      // 根据环境设置不同的输出目录
      outDir: isProd ? 'dist' : 'dist',
    },
    // 开发服务器配置
    server: isDev ? {
      port: 3000,
      open: true,
      // 开发环境可以启用热更新
      hmr: true,
    } : undefined,
  }
})
