<template>
  <div class="code-panel">
    <div class="code-toolbar">
      <div class="code-toolbar-left">
        <span class="code-title">生成的代码</span>
        <div v-if="hasApiCode" class="code-subtabs">
          <button
            class="code-subtab"
            :class="{ active: codeTab === 'page' }"
            @click="$emit('update:codeTab', 'page')"
          >
            页面代码
          </button>
          <button
            class="code-subtab"
            :class="{ active: codeTab === 'api' }"
            @click="$emit('update:codeTab', 'api')"
          >
            API 代码
          </button>
        </div>
      </div>
      <div class="code-actions">
        <span v-if="lineCount" class="code-info">{{ lineCount }} 行</span>
        <button class="code-copy" @click="copyCode">
          {{ copied ? '✓ 已复制' : '📋 复制' }}
        </button>
      </div>
    </div>
    <div class="code-content">
      <div v-if="!activeCode" class="code-empty">
        <div class="empty-icon">📝</div>
        <p>生成的 Vue3 代码将在这里展示</p>
      </div>
      <pre v-else class="code-block"><code v-html="highlightedCode"></code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import typescript from 'highlight.js/lib/languages/typescript'

hljs.registerLanguage('xml', xml)
hljs.registerLanguage('typescript', typescript)

const props = defineProps<{
  pageCode: string
  apiCode: string
  codeTab: 'page' | 'api'
}>()

defineEmits<{
  'update:codeTab': ['page' | 'api']
}>()

const copied = ref(false)

const hasApiCode = computed(() => !!props.apiCode)

const activeCode = computed(() => {
  if (props.codeTab === 'api' && props.apiCode) return props.apiCode
  return props.pageCode
})

const highlightedCode = computed(() => {
  if (!activeCode.value) return ''
  try {
    const lang = props.codeTab === 'api' ? 'typescript' : 'xml'
    const result = hljs.highlight(activeCode.value, { language: lang })
    return result.value
  } catch {
    return activeCode.value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }
})

const lineCount = computed(() => {
  if (!activeCode.value) return 0
  return activeCode.value.split('\n').length
})

async function copyCode() {
  try {
    await navigator.clipboard.writeText(activeCode.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = activeCode.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
.code-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
}
.code-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
  flex-shrink: 0;
}
.code-toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.code-title { font-size: 14px; font-weight: 600; color: #cccccc; }
.code-subtabs { display: flex; gap: 4px; }
.code-subtab {
  padding: 4px 10px;
  border: 1px solid #3e3e42;
  background: #2d2d30;
  color: #858585;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  font-family: inherit;
}
.code-subtab:hover { color: #ccc; }
.code-subtab.active {
  background: #37373d;
  color: #fff;
  border-color: #6366f1;
}
.code-actions { display: flex; align-items: center; gap: 10px; }
.code-info { font-size: 12px; color: #858585; }
.code-copy {
  border: 1px solid #3e3e42; background: #2d2d30; color: #cccccc;
  border-radius: 4px; cursor: pointer; padding: 4px 10px; font-size: 12px;
  transition: all 0.2s;
}
.code-copy:hover { background: #3e3e42; color: #fff; }
.code-content { flex: 1; overflow: auto; }
.code-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; color: #666; gap: 12px;
}
.code-block {
  margin: 0; padding: 16px;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 13px; line-height: 1.6;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-word;
}
.code-block :deep(.hljs-tag) { color: #569cd6; }
.code-block :deep(.hljs-name) { color: #4ec9b0; }
.code-block :deep(.hljs-attr) { color: #9cdcfe; }
.code-block :deep(.hljs-string) { color: #ce9178; }
.code-block :deep(.hljs-keyword) { color: #c586c0; }
.code-block :deep(.hljs-comment) { color: #6a9955; }
.code-block :deep(.hljs-title) { color: #dcdcaa; }
.code-block :deep(.hljs-built_in) { color: #4ec9b0; }
.code-block :deep(.hljs-number) { color: #b5cea8; }
</style>
