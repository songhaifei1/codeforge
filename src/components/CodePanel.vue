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
        <button class="btn-copy" @click="copyCode" :class="{ copied: copied }">
          {{ copied ? '✅ 已复制' : '📋 复制代码' }}
        </button>
      </div>
    </div>
    <div class="code-content" v-if="currentFile">
      <pre class="code-block"><code>{{ currentFile.code }}</code></pre>
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

const emit = defineEmits<{
  'update:activeFileIndex': [index: number]
}>()

const copied = ref(false)

const currentFile = computed(() => {
  return props.files[props.activeIndex] || null
})

function copyCode() {
  if (!currentFile.value) return
  navigator.clipboard.writeText(currentFile.value.code).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
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
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid #313244;
  background: #181825;
  min-height: 42px;
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
  gap: 10px;
  flex-shrink: 0;
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

.code-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.code-block {
  margin: 0;
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
