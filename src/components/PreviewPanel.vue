<template>
  <div class="preview-panel">
    <div class="preview-toolbar">
      <span class="preview-title">页面预览</span>
      <div class="preview-actions">
        <span v-if="pageTypeName" class="preview-badge">{{ pageTypeName }}</span>
        <button class="preview-refresh" @click="renderPreview" title="刷新预览">↻</button>
      </div>
    </div>
    <div class="preview-content">
      <div v-if="!generatedResult" class="preview-empty">
        <div class="empty-icon">🎨</div>
        <p>输入需求后，生成的页面将在这里实时预览</p>
      </div>
      <div v-else ref="previewRoot" class="preview-render-area"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, createApp, defineComponent } from 'vue'
import * as VueRuntime from 'vue'
import { compile } from '@vue/compiler-dom'
import { allComponents } from '../mock-ui'
import type { GeneratedResult } from '../types'

const props = defineProps<{
  generatedResult: GeneratedResult | null
}>()

const previewRoot = ref<HTMLElement>()
let app: ReturnType<typeof createApp> | null = null

const pageTypeName = ref('')

// 使用 @vue/compiler-dom 编译模板字符串为渲染函数
function compileTemplate(template: string): (ctx: any, cache: any) => any {
  const { code } = compile(template, { mode: 'function' })
  // mode:'function' 生成的代码引用 Vue 变量获取运行时辅助函数
  const fn = new Function('Vue', code)
  return fn(VueRuntime)
}

function renderPreview() {
  if (app) {
    app.unmount()
    app = null
  }
  if (!props.generatedResult || !previewRoot.value) return

  const result = props.generatedResult
  const typeMap: Record<string, string> = {
    list: '列表页', form: '表单页', detail: '详情页', dashboard: '统计看板',
  }
  pageTypeName.value = typeMap[result.pageType] || ''

  try {
    // 编译模板为渲染函数
    const renderFn = compileTemplate(result.previewTemplate)

    // 创建预览组件
    const previewComponent = defineComponent({
      setup: result.previewSetup,
      render() {
        return renderFn(this, [])
      }
    })

    // 创建独立 Vue 应用实例用于预览
    const previewApp = createApp(previewComponent)

    // 注册所有企业组件库组件
    for (const [name, component] of Object.entries(allComponents)) {
      const kebab = name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)
      previewApp.component(kebab, component as any)
      previewApp.component(name, component as any)
    }

    app = previewApp
    app.mount(previewRoot.value)
  } catch (err) {
    console.error('Preview render error:', err)
    if (previewRoot.value) {
      previewRoot.value.innerHTML = `<div style="padding:20px;color:#ff4d4f;">预览渲染出错：${(err as Error).message}</div>`
    }
  }
}

watch(() => props.generatedResult, () => {
  nextTick(renderPreview)
}, { deep: true })

onMounted(() => {
  nextTick(renderPreview)
})

onUnmounted(() => {
  if (app) {
    app.unmount()
    app = null
  }
})
</script>

<style scoped>
.preview-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f2f5;
}
.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.preview-title { font-size: 14px; font-weight: 600; color: #333; }
.preview-actions { display: flex; align-items: center; gap: 8px; }
.preview-badge {
  font-size: 12px; padding: 2px 8px; border-radius: 4px;
  background: #e6f4ff; color: #4096ff; font-weight: 600;
}
.preview-refresh {
  border: 1px solid #d9d9d9; background: #fff; border-radius: 4px;
  cursor: pointer; padding: 2px 8px; font-size: 14px; color: #666;
}
.preview-refresh:hover { color: #4096ff; border-color: #4096ff; }
.preview-content { flex: 1; overflow: auto; }
.preview-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; color: #999; gap: 12px;
}
.empty-icon { font-size: 48px; opacity: 0.5; }
.preview-render-area { min-height: 100%; }
</style>
