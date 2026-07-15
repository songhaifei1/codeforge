import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// ant-design-vue v4 使用 CSS-in-JS，组件样式在运行时自动注入
// 只需加载基础 reset 样式
import 'ant-design-vue/dist/reset.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
