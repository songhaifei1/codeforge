<template>
  <div class="preview-panel">
    <!-- 浏览器风格外框 -->
    <div class="preview-browser">
      <div class="browser-bar">
        <div class="browser-dots">
          <span></span><span></span><span></span>
        </div>
        <div class="browser-url">
          <span class="browser-lock">🔒</span>
          <span class="browser-url-text">{{ urlText }}</span>
        </div>
        <button class="browser-refresh" @click="renderPreview" title="刷新预览">↻</button>
      </div>
      <div class="preview-toolbar">
        <span class="preview-title">页面预览</span>
        <div class="preview-actions">
          <span v-if="pageTypeName" class="preview-badge">{{ pageTypeName }}</span>
          <span v-if="fileCount" class="preview-badge-files">{{ fileCount }} 文件</span>
        </div>
      </div>
    </div>

    <div class="preview-content">
      <div v-if="!generatedResult" class="preview-empty">
        <div class="empty-icon">🎨</div>
        <p>输入需求后，生成的页面将在这里实时预览</p>
      </div>
      <div v-else class="preview-stage">
        <div ref="previewRoot" class="preview-render-area"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed, createApp, defineComponent } from 'vue'
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

const urlText = computed(() => {
  const name = props.generatedResult?.entityName
  return name ? `codeforge.app/p/${name}` : 'codeforge.app'
})

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
  background: var(--cf-surface-2);
}

/* 浏览器外框 */
.preview-browser {
  flex-shrink: 0;
  background: var(--cf-surface);
  border-bottom: 1px solid var(--cf-border);
  box-shadow: var(--cf-shadow-sm);
}
.browser-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
}
.browser-dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.browser-dots span {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.browser-dots span:nth-child(1) { background: #ff5f57; }
.browser-dots span:nth-child(2) { background: #febc2e; }
.browser-dots span:nth-child(3) { background: #28c840; }
.browser-url {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--cf-surface-2);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-r-pill);
  padding: 6px 14px;
  font-size: 12.5px;
  color: var(--cf-text-3);
  font-family: var(--cf-mono);
  overflow: hidden;
}
.browser-lock { font-size: 11px; flex-shrink: 0; }
.browser-url-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.browser-refresh {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border: 1px solid var(--cf-border);
  background: var(--cf-surface);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--cf-text-3);
  transition: all 0.18s;
}
.browser-refresh:hover {
  color: var(--cf-brand);
  border-color: var(--cf-brand);
}
.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-top: 1px solid var(--cf-border);
}
.preview-title { font-size: 13.5px; font-weight: 700; color: var(--cf-text); }
.preview-actions { display: flex; align-items: center; gap: 8px; }
.preview-badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: var(--cf-r-pill);
  background: #e6f4ff;
  color: #4096ff;
  font-weight: 600;
}
.preview-badge-files {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: var(--cf-r-pill);
  background: var(--cf-brand-soft);
  color: var(--cf-brand-strong);
  font-weight: 600;
}

/* 画布区 */
.preview-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
  background-color: var(--cf-surface-2);
  background-image: radial-gradient(circle at 1px 1px, var(--cf-border) 1px, transparent 0);
  background-size: 22px 22px;
}
.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--cf-text-3);
  gap: 12px;
}
.empty-icon { font-size: 48px; opacity: 0.55; }
.preview-stage {
  min-height: 100%;
  display: flex;
}
.preview-render-area {
  flex: 1;
  background: var(--cf-surface);
  border-radius: var(--cf-r-lg);
  box-shadow: var(--cf-shadow-lg);
  border: 1px solid var(--cf-border);
  overflow: hidden;
  min-height: 420px;
}
</style>
