<template>
  <div class="requirement-panel">
    <!-- Header -->
    <div class="rp-header">
      <div class="rp-logo">
        <span class="rp-logo-icon">⚡</span>
        <div>
          <div class="rp-logo-name">码搭 CodeForge</div>
          <div class="rp-logo-desc">AI 前端页面智能搭建助手</div>
        </div>
      </div>
    </div>

    <!-- Input Mode Tabs -->
    <div class="rp-mode-tabs">
      <button
        class="mode-tab"
        :class="{ active: inputMode === 'requirement' }"
        @click="$emit('update:inputMode', 'requirement')"
      >
        💬 需求描述
      </button>
      <button
        class="mode-tab"
        :class="{ active: inputMode === 'api' }"
        @click="$emit('update:inputMode', 'api')"
      >
        📡 接口文档
      </button>
    </div>

    <!-- Chat Area -->
    <div class="rp-chat" ref="chatContainer">
      <div v-if="chatHistory.length === 0" class="rp-welcome">
        <div class="welcome-icon">🚀</div>
        <h3>欢迎使用码搭</h3>
        <p v-if="inputMode === 'requirement'">描述你想要的页面，AI 自动生成 Vue3 代码</p>
        <p v-else>粘贴 Swagger JSON、Knife4j 文档或自定义 JSON，自动生成页面代码</p>

        <div v-if="inputMode === 'requirement'" class="welcome-examples">
          <div class="examples-title">💡 试试这些示例：</div>
          <div
            v-for="(ex, i) in examples"
            :key="i"
            class="example-item"
            @click="$emit('loadExample', ex)"
          >
            <span class="example-num">{{ i + 1 }}</span>
            <span class="example-text">{{ ex }}</span>
          </div>
        </div>

        <div v-else class="welcome-examples">
          <div class="examples-title">💡 试试这些方式：</div>
          <div class="example-item" @click="$emit('loadApiExample')">
            <span class="example-num">🔗</span>
            <span class="example-text">粘贴 Knife4j 链接（自动拉取 Swagger）</span>
          </div>
          <div class="example-item" @click="$emit('loadApiMarkdownExample')">
            <span class="example-num">📋</span>
            <span class="example-text">粘贴复制的接口文档内容（Markdown）</span>
          </div>
        </div>
      </div>

      <div v-for="(msg, i) in chatHistory" :key="i" class="rp-msg" :class="`rp-msg--${msg.role}`">
        <div class="msg-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
        <div class="msg-body">
          <div class="msg-role">{{ msg.role === 'user' ? '我' : '码搭 AI' }}</div>
          <div class="msg-content" v-html="formatContent(msg.content)"></div>
        </div>
      </div>

      <div v-if="isLoading" class="rp-msg rp-msg--assistant">
        <div class="msg-avatar">🤖</div>
        <div class="msg-body">
          <div class="msg-role">码搭 AI</div>
          <div class="msg-loading">
            <div class="loading-dots">
              <span></span><span></span><span></span>
            </div>
            <span class="loading-text">{{ loadingStep }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modification hints -->
    <div v-if="hasResult && inputMode === 'requirement'" class="rp-modify-hints">
      <div class="hints-title">✏️ 继续修改页面：</div>
      <div class="hints-list">
        <button
          v-for="(hint, i) in modificationHints"
          :key="i"
          class="hint-chip"
          :disabled="isLoading"
          @click="$emit('loadModificationHint', hint)"
        >
          {{ hint }}
        </button>
      </div>
    </div>

    <!-- Input Area -->
    <div class="rp-input-area">
      <textarea
        v-model="inputText"
        class="rp-textarea"
        :class="{ 'rp-textarea--api': inputMode === 'api' }"
        :placeholder="placeholderText"
        :disabled="isLoading"
        @keydown.ctrl.enter="handleSubmit"
        :rows="inputMode === 'api' ? 6 : 3"
      ></textarea>
      <div class="rp-input-actions">
        <span class="rp-hint">Ctrl + Enter 快速{{ hasResult && inputMode === 'requirement' ? '发送' : '生成' }}</span>
        <button
          class="rp-generate-btn"
          :disabled="!inputText.trim() || isLoading"
          @click="handleSubmit"
        >
          {{ submitButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { ChatMessage, InputMode } from '../types'

const props = defineProps<{
  chatHistory: ChatMessage[]
  isLoading: boolean
  loadingStep: string
  examples: string[]
  modificationHints: string[]
  requirement: string
  inputMode: InputMode
  hasResult: boolean
}>()

const emit = defineEmits<{
  submit: [text: string]
  loadExample: [text: string]
  loadApiExample: []
  loadApiMarkdownExample: []
  loadModificationHint: [text: string]
  'update:requirement': [text: string]
  'update:inputMode': [InputMode]
}>()

const inputText = ref(props.requirement)
const chatContainer = ref<HTMLElement>()

const placeholderText = computed(() => {
  if (props.inputMode === 'api') {
    return '支持粘贴 Knife4j 链接，例如：\nhttp://192.168.0.102:30303/doc.html#/分组/标签/getDetail_48\n\n码搭会自动拉取 Swagger 定义并生成页面（需 npm run dev 启动）'
  }
  if (props.hasResult) {
    return '继续描述修改，例如：\n给表格增加操作列，包含编辑和删除按钮'
  }
  return '描述你想要的页面，例如：\n创建一个设备管理列表页，展示设备编号、名称、类型、状态，支持按名称筛选，支持新增和编辑'
})

const submitButtonText = computed(() => {
  if (props.isLoading) return '处理中...'
  if (props.hasResult && props.inputMode === 'requirement') return '✏️ 发送修改'
  if (props.inputMode === 'api') return '📡 解析生成'
  return '⚡ 生成页面'
})

watch(() => props.requirement, (val) => {
  inputText.value = val
})

watch(inputText, (val) => {
  emit('update:requirement', val)
})

watch(() => props.chatHistory.length, scrollToBottom)
watch(() => props.isLoading, scrollToBottom)

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

function handleSubmit() {
  if (!inputText.value.trim() || props.isLoading) return
  emit('submit', inputText.value)
  if (props.hasResult && props.inputMode === 'requirement') {
    inputText.value = ''
    emit('update:requirement', '')
  }
}

function formatContent(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.requirement-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.rp-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.rp-logo { display: flex; align-items: center; gap: 12px; }
.rp-logo-icon {
  font-size: 28px;
  width: 44px; height: 44px;
  background: linear-gradient(135deg, #6366F1, #0EA5E9);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.rp-logo-name { font-size: 18px; font-weight: 700; color: #1e293b; }
.rp-logo-desc { font-size: 12px; color: #94a3b8; }

.rp-mode-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.mode-tab {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.mode-tab:hover { border-color: #c7d2fe; color: #4338ca; }
.mode-tab.active {
  background: #eef2ff;
  border-color: #6366f1;
  color: #4338ca;
}

.rp-chat {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.rp-welcome {
  text-align: center;
  padding: 20px 0;
}
.welcome-icon { font-size: 56px; margin-bottom: 12px; }
.rp-welcome h3 { font-size: 20px; color: #1e293b; margin-bottom: 6px; }
.rp-welcome p { font-size: 14px; color: #64748b; margin-bottom: 20px; }
.welcome-examples { text-align: left; margin-top: 20px; }
.examples-title { font-size: 13px; color: #64748b; margin-bottom: 10px; }
.example-item {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 12px; margin-bottom: 8px;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 8px; cursor: pointer;
  transition: all 0.2s;
  font-size: 13px; color: #475569; line-height: 1.5;
}
.example-item:hover {
  background: #eef2ff; border-color: #c7d2fe; color: #4338ca;
}
.example-num {
  flex-shrink: 0; width: 20px; height: 20px;
  background: #6366f1; color: white; border-radius: 50%;
  font-size: 11px; display: flex; align-items: center; justify-content: center;
  font-weight: 700;
}

.rp-msg {
  display: flex; gap: 10px; margin-bottom: 16px;
}
.rp-msg--user { flex-direction: row-reverse; }
.msg-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
  background: #f1f5f9;
}
.rp-msg--user .msg-avatar { background: #e0e7ff; }
.msg-body { max-width: 80%; }
.msg-role { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
.rp-msg--user .msg-role { text-align: right; }
.msg-content {
  font-size: 14px; line-height: 1.7; color: #334155;
  background: #f8fafc; padding: 10px 14px; border-radius: 10px;
  border: 1px solid #f1f5f9;
}
.rp-msg--user .msg-content {
  background: #eef2ff; border-color: #e0e7ff; color: #3730a3;
}

.msg-loading {
  display: flex; align-items: center; gap: 10px;
  background: #f8fafc; padding: 10px 14px; border-radius: 10px;
  border: 1px solid #f1f5f9;
}
.loading-dots { display: flex; gap: 4px; }
.loading-dots span {
  width: 8px; height: 8px; border-radius: 50%;
  background: #6366f1;
  animation: bounce 1.4s infinite ease-in-out;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
.loading-text { font-size: 13px; color: #64748b; }

.rp-modify-hints {
  padding: 8px 20px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: #fafbff;
}
.hints-title { font-size: 12px; color: #64748b; margin-bottom: 6px; }
.hints-list { display: flex; flex-wrap: wrap; gap: 6px; }
.hint-chip {
  padding: 4px 10px;
  border: 1px solid #e0e7ff;
  background: #fff;
  border-radius: 50px;
  font-size: 11px;
  color: #4338ca;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.hint-chip:hover:not(:disabled) {
  background: #eef2ff;
  border-color: #6366f1;
}
.hint-chip:disabled { opacity: 0.5; cursor: not-allowed; }

.rp-input-area {
  padding: 12px 20px 16px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.rp-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  font-family: inherit;
  color: #334155;
  transition: border-color 0.2s;
}
.rp-textarea--api {
  font-family: 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px;
}
.rp-textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.rp-textarea::placeholder { color: #cbd5e1; }
.rp-input-actions {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px;
}
.rp-hint { font-size: 12px; color: #94a3b8; }
.rp-generate-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #6366F1, #4F46E5);
  color: white; border: none; border-radius: 8px;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.rp-generate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99,102,241,0.3);
}
.rp-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
