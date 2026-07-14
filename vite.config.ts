import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { swaggerProxyPlugin } from './vite-plugins/swaggerProxy'

export default defineConfig({
  plugins: [vue(), swaggerProxyPlugin()],
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js',
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
  },
  server: {
    port: 3000,
    open: true,
    host: true
  }
})
