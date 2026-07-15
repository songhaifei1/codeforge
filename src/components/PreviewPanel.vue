<template>
  <div class="preview-panel">
    <div class="preview-toolbar">
      <span class="preview-title">页面预览</span>
      <div class="preview-actions">
        <span v-if="pageTypeName" class="preview-badge">{{ pageTypeName }}</span>
        <span v-if="fileCount" class="preview-badge-files">{{ fileCount }} 文件</span>
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
// ant-design-vue 预览组件
import {
  Table, Button, Select, Input, Tag, DatePicker,
  Card, Descriptions, Divider, Row, Col,
} from 'ant-design-vue'
import type { GeneratedResult } from '../types'

const props = defineProps<{
  generatedResult: GeneratedResult | null
}>()

const previewRoot = ref<HTMLElement>()
let app: ReturnType<typeof createApp> | null = null

const pageTypeName = ref('')
const fileCount = ref(0)

// @vue/compiler-dom 编译模板字符串为渲染函数
function compileTemplate(template: string): (ctx: any, cache: any) => any {
  const { code } = compile(template, { mode: 'function' })
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
  fileCount.value = result.files?.length || 0

  if (!result.previewTemplate || !result.previewSetup) {
    if (previewRoot.value) {
      previewRoot.value.innerHTML = `<div style="padding:20px;color:#666;text-align:center">预览暂不可用</div>`
    }
    return
  }

  try {
    const renderFn = compileTemplate(result.previewTemplate)

    const previewComponent = defineComponent({
      setup: result.previewSetup,
      render() {
        return renderFn(this, [])
      },
    })

    const previewApp = createApp(previewComponent)

    // 注册 ant-design-vue 预览组件（kebab-case + PascalCase）
    const register = (name: string, comp: any) => {
      previewApp.component(name, comp)
      previewApp.component(name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^a/, 'A'), comp)
    }
    register('a-table', Table)
    register('a-button', Button)
    register('a-select', Select)
    register('a-select-option', Select.Option)
    register('a-input', Input)
    register('a-tag', Tag)
    register('a-date-picker', DatePicker)
    register('a-card', Card)
    register('a-descriptions', Descriptions)
    register('a-descriptions-item', Descriptions.Item)
    register('a-divider', Divider)
    register('a-row', Row)
    register('a-col', Col)

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
.preview-badge-files {
  font-size: 12px; padding: 2px 8px; border-radius: 4px;
  background: #f0f5ff; color: #6366f1; font-weight: 600;
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
