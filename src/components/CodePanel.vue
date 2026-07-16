<template>
  <div class="code-panel">
    <div class="panel-header">
      <div class="tabs">
        <button
          v-for="(file, index) in files"
          :key="file.filename"
          :class="['tab', { active: activeIndex === index }]"
          @click="$emit('update:activeFileIndex', index)"
        >
          <span class="tab-icon">{{ file.filename.includes('api') ? '🔌' : '📄' }}</span>
          <span class="tab-name">{{ file.filename }}</span>
          <span class="tab-lang" v-if="file.language === 'vue'">.vue</span>
          <span class="tab-lang" v-else>.ts</span>
        </button>
      </div>
      <div class="panel-actions">
        <span class="file-count">{{ files.length }} 个文件</span>
        <button
          type="button"
          class="btn-copy"
          :class="{ copied: copiedTarget === 'current' }"
          :disabled="!currentFile"
          :title="currentFile ? `复制 ${currentFile.filename}` : ''"
          @click.stop="handleCopyCurrent('current')"
        >
          {{ copiedTarget === 'current' ? '✅ 已复制' : '📋 复制当前文件' }}
        </button>
        <button
          type="button"
          class="btn-copy btn-copy--secondary"
          :class="{ copied: copiedTarget === 'all' }"
          :disabled="files.length === 0"
          title="复制全部文件（含文件名分隔）"
          @click.stop="handleCopyAll"
        >
          {{ copiedTarget === 'all' ? '✅ 已复制' : '📦 复制全部' }}
        </button>
        <button
          type="button"
          class="btn-copy btn-copy--secondary"
          :disabled="!currentFile"
          title="下载当前文件到本地"
          @click.stop="handleDownloadCurrent"
        >
          ⬇️ 下载
        </button>
      </div>
    </div>
    <Transition name="copy-tip-fade">
      <div v-if="copyTip" class="copy-tip" :class="copyTipType">{{ copyTip }}</div>
    </Transition>
    <div class="code-content" v-if="currentFile">
      <div class="code-file-bar">
        <span class="code-file-name">{{ currentFile.filename }}</span>
        <button
          type="button"
          class="btn-copy-inline"
          :class="{ copied: copiedTarget === 'inline' }"
          @click.stop="handleCopyCurrent('inline')"
        >
          {{ copiedTarget === 'inline' ? '✅ 已复制' : '📋 复制' }}
        </button>
      </div>
      <pre ref="codeBlockRef" class="code-block"><code>{{ currentFile.code }}</code></pre>
    </div>
    <div class="usage-tips" v-if="files.length > 0">
      <h4>📖 使用说明</h4>
      <ol>
        <li>将 <code>index.vue</code> 和 <code>Form.vue</code> 复制到 <code>src/views/对应的模块/</code> 目录</li>
        <li>将 <code>api/index.ts</code> 复制到 <code>src/views/对应的模块/api/</code> 目录</li>
        <li>在路由文件 <code>src/router/routes/</code> 中添加页面路由配置</li>
        <li>启动项目：<code>npm run dev</code></li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GeneratedFile } from '../types'

const props = defineProps<{
  files: GeneratedFile[]
  activeIndex: number
}>()

defineEmits<{
  'update:activeFileIndex': [index: number]
}>()

const codeBlockRef = ref<HTMLElement>()
const copiedTarget = ref<'current' | 'all' | 'inline' | null>(null)
const copyTip = ref('')
const copyTipType = ref<'success' | 'error' | 'warning'>('success')
let copiedTimer: ReturnType<typeof setTimeout> | null = null
let tipTimer: ReturnType<typeof setTimeout> | null = null

const currentFile = computed(() => {
  return props.files[props.activeIndex] || null
})

function showTip(text: string, type: 'success' | 'error' | 'warning' = 'success') {
  copyTip.value = text
  copyTipType.value = type
  if (tipTimer) clearTimeout(tipTimer)
  tipTimer = setTimeout(() => { copyTip.value = '' }, 4000)
}

function showCopied(target: 'current' | 'all' | 'inline', filename?: string) {
  copiedTarget.value = target
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => { copiedTarget.value = null }, 2000)
  showTip(filename ? `✅ 已复制 ${filename}，可直接 Ctrl+V 粘贴` : '✅ 已复制到剪贴板')
}

function selectCodeBlock(): boolean {
  const codeEl = codeBlockRef.value?.querySelector('code')
  if (!codeEl) return false
  const selection = window.getSelection()
  if (!selection) return false
  const range = document.createRange()
  range.selectNodeContents(codeEl)
  selection.removeAllRanges()
  selection.addRange(range)
  return true
}

/** 同步复制，必须在 click 事件内立即执行 */
function copyTextSync(text: string): boolean {
  if (selectCodeBlock()) {
    try {
      if (document.execCommand('copy')) return true
    } catch {
      // fall through
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(textarea)
  return ok
}

function copyToClipboard(text: string, target: 'current' | 'all' | 'inline', filename?: string) {
  if (!text) {
    showTip('⚠️ 没有可复制的内容', 'warning')
    return
  }

  if (copyTextSync(text)) {
    showCopied(target, filename)
    return
  }

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showCopied(target, filename))
      .catch(() => {
        selectCodeBlock()
        showTip('❌ 自动复制失败，代码已选中，请按 Ctrl+C', 'error')
      })
    return
  }

  selectCodeBlock()
  showTip('❌ 自动复制失败，代码已选中，请按 Ctrl+C', 'error')
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.replace(/\//g, '_')
  link.click()
  URL.revokeObjectURL(url)
}

function handleCopyCurrent(target: 'current' | 'inline') {
  if (!currentFile.value) return
  copyToClipboard(currentFile.value.code, target, currentFile.value.filename)
}

function handleCopyAll() {
  if (props.files.length === 0) return
  const text = props.files
    .map(file => `// ===== ${file.filename} =====\n${file.code}`)
    .join('\n\n')
  copyToClipboard(text, 'all', `${props.files.length} 个文件`)
}

function handleDownloadCurrent() {
  if (!currentFile.value) return
  downloadText(currentFile.value.filename, currentFile.value.code)
  showTip(`✅ 已下载 ${currentFile.value.filename}`, 'success')
}
</script>

<style scoped>
.code-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e2e;
  color: #cdd6f4;
}

.panel-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border-bottom: 1px solid #313244;
  background: #181825;
  min-height: 42px;
}

.copy-tip {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 1px solid #313244;
  flex-shrink: 0;
}
.copy-tip-fade-enter-active,
.copy-tip-fade-leave-active {
  transition: opacity 0.2s ease;
}
.copy-tip-fade-enter-from,
.copy-tip-fade-leave-to {
  opacity: 0;
}
.copy-tip.success {
  background: rgba(166, 227, 161, 0.15);
  color: #a6e3a1;
}
.copy-tip.error {
  background: rgba(243, 139, 168, 0.15);
  color: #f38ba8;
}
.copy-tip.warning {
  background: rgba(249, 226, 175, 0.15);
  color: #f9e2af;
}

.tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
}

.tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: #6c7086;
  cursor: pointer;
  font-size: 13px;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all 0.15s;
}
.tab:hover {
  color: #bac2de;
  background: rgba(205, 214, 244, 0.05);
}
.tab.active {
  color: #89b4fa;
  border-bottom-color: #89b4fa;
  background: rgba(137, 180, 250, 0.08);
}

.tab-icon { font-size: 12px; }
.tab-name { font-size: 13px; }
.tab-lang {
  font-size: 11px;
  color: #585b70;
  margin-left: 2px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
  padding: 4px 0;
}

.file-count {
  font-size: 11px;
  color: #6c7086;
}

.btn-copy {
  padding: 4px 12px;
  border: 1px solid #45475a;
  border-radius: 4px;
  background: transparent;
  color: #a6adc8;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
}
.btn-copy:hover {
  border-color: #89b4fa;
  color: #89b4fa;
}
.btn-copy.copied {
  border-color: #a6e3a1;
  color: #a6e3a1;
}
.btn-copy:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.btn-copy--secondary {
  border-color: #585b70;
}

.code-content {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.code-file-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #181825;
  border-bottom: 1px solid #313244;
  position: sticky;
  top: 0;
  z-index: 1;
}

.code-file-name {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  color: #89b4fa;
}

.btn-copy-inline {
  padding: 2px 10px;
  border: 1px solid #45475a;
  border-radius: 4px;
  background: transparent;
  color: #a6adc8;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.15s;
}
.btn-copy-inline:hover {
  border-color: #89b4fa;
  color: #89b4fa;
}
.btn-copy-inline.copied {
  border-color: #a6e3a1;
  color: #a6e3a1;
}

.code-block {
  margin: 0;
  flex: 1;
  padding: 16px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #cdd6f4;
  white-space: pre;
  tab-size: 2;
}

.usage-tips {
  border-top: 1px solid #313244;
  padding: 12px 16px;
  background: #181825;
  font-size: 12px;
  color: #a6adc8;
  flex-shrink: 0;
}
.usage-tips h4 {
  margin: 0 0 6px;
  font-size: 12px;
  color: #f5c2e7;
}
.usage-tips ol {
  margin: 0;
  padding-left: 18px;
  line-height: 1.8;
}
.usage-tips code {
  background: #313244;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 11px;
  color: #f9e2af;
}
</style>
