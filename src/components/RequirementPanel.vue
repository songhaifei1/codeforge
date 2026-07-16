<template>
  <div class="requirement-panel">
    <!-- Header -->
    <div class="rp-header">
      <span class="rp-title">需求对话</span>
      <span class="rp-live"><span class="rp-live-dot"></span>实时生成</span>
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
        <h3>开始搭建你的页面</h3>
        <p v-if="inputMode === 'requirement'">用自然语言描述需求，AI 自动生成 Vue3 代码</p>
        <p v-else>粘贴 Swagger JSON / Knife4j 文档，自动生成页面与接口代码</p>

        <div v-if="inputMode === 'requirement'" class="welcome-examples">
          <div class="examples-title">✨ 挑一个示例快速体验</div>
          <div class="examples-grid">
            <div
              v-for="(ex, i) in examples"
              :key="i"
              class="example-card"
              @click="$emit('loadExample', ex)"
            >
              <div class="example-card-top">
                <span class="example-tag">{{ categoryOf(ex).label }}</span>
                <span class="example-card-icon">{{ categoryOf(ex).icon }}</span>
              </div>
              <span class="example-card-text">{{ ex }}</span>
            </div>
          </div>
        </div>

        <div v-else class="welcome-examples">
          <div class="examples-title">✨ 选择导入方式</div>
          <div class="examples-grid">
            <div class="example-card" @click="$emit('loadApiExample')">
              <div class="example-card-top">
                <span class="example-tag">Swagger</span>
                <span class="example-card-icon">🔗</span>
              </div>
              <span class="example-card-text">粘贴 Knife4j 链接，自动拉取 Swagger 定义生成页面</span>
            </div>
            <div class="example-card" @click="$emit('loadApiMarkdownExample')">
              <div class="example-card-top">
                <span class="example-tag">Markdown</span>
                <span class="example-card-icon">📋</span>
              </div>
              <span class="example-card-text">直接粘贴复制的接口文档内容，自动解析字段生成页面</span>
            </div>
          </div>
        </div>
      </div>

      <div v-for="(msg, i) in chatHistory" :key="i" class="rp-msg" :class="`rp-msg--${msg.role}`">
        <div class="msg-avatar">{{ msg.role === 'user' ? '👤' : '✨' }}</div>
        <div class="msg-body">
          <div class="msg-role">{{ msg.role === 'user' ? '我' : '码搭 AI' }}</div>
          <div class="msg-content" v-html="formatContent(msg.content)"></div>
        </div>
      </div>

      <div v-if="isLoading" class="rp-msg rp-msg--assistant">
        <div class="msg-avatar">✨</div>
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
      <div class="hints-title">✏️ 继续修改页面</div>
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
      <div class="rp-input-head">
        <span class="rp-input-mode">
          当前模式：<b>{{ inputMode === 'api' ? '接口文档' : '需求描述' }}</b>
        </span>
        <span class="rp-hint">Ctrl + Enter {{ hasResult && inputMode === 'requirement' ? '发送' : '生成' }}</span>
      </div>
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
        <button
          class="rp-generate-btn"
          :disabled="!inputText.trim() || isLoading"
          @click="handleSubmit"
        >
          <span class="rp-generate-icon">⚡</span>
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

function categoryOf(text: string): { label: string; icon: string } {
  if (text.includes('详情')) return { label: '详情页', icon: '📄' }
  if (text.includes('看板') || text.includes('统计')) return { label: '统计看板', icon: '📊' }
  if (text.includes('表单')) return { label: '表单页', icon: '📝' }
  if (text.includes('列表') || text.includes('管理') || text.includes('记录')) return { label: '列表页', icon: '📋' }
  return { label: '页面', icon: '✨' }
}

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
  if (props.hasResult && props.inputMode === 'requirement') return '发送修改'
  if (props.inputMode === 'api') return '解析生成'
  return '生成页面'
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
  background: var(--cf-surface);
}

/* Header */
.rp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--cf-border);
  flex-shrink: 0;
}
.rp-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--cf-text);
  letter-spacing: 0.3px;
}
.rp-live {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
}
.rp-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18);
}

/* Mode tabs */
.rp-mode-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--cf-border);
  flex-shrink: 0;
}
.mode-tab {
  flex: 1;
  padding: 9px 12px;
  border: 1px solid var(--cf-border-strong);
  background: var(--cf-surface);
  border-radius: var(--cf-r-pill);
  font-size: 13px;
  font-weight: 600;
  color: var(--cf-text-3);
  cursor: pointer;
  transition: all 0.18s;
  font-family: inherit;
}
.mode-tab:hover { border-color: var(--cf-brand); color: var(--cf-brand-strong); }
.mode-tab.active {
  background: linear-gradient(135deg, var(--cf-brand), var(--cf-brand-strong));
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.28);
}

/* Chat area */
.rp-chat {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  background: var(--cf-surface-2);
}

.rp-welcome {
  text-align: center;
  padding: 12px 0 4px;
}
.welcome-icon { font-size: 48px; margin-bottom: 10px; }
.rp-welcome h3 { font-size: 18px; color: var(--cf-text); margin-bottom: 6px; font-weight: 700; }
.rp-welcome p { font-size: 13.5px; color: var(--cf-text-3); margin-bottom: 18px; }

.welcome-examples { text-align: left; margin-top: 16px; }
.examples-title { font-size: 12.5px; font-weight: 600; color: var(--cf-text-2); margin-bottom: 12px; }

.examples-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.example-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 13px;
  background: var(--cf-surface);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-r-md);
  cursor: pointer;
  transition: all 0.18s ease;
}
.example-card:hover {
  border-color: var(--cf-brand);
  background: var(--cf-brand-tint);
  box-shadow: var(--cf-shadow-md);
  transform: translateY(-2px);
}
.example-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.example-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--cf-brand-strong);
  background: var(--cf-brand-soft);
  padding: 2px 9px;
  border-radius: var(--cf-r-pill);
}
.example-card-icon { font-size: 15px; }
.example-card-text {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--cf-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Messages */
.rp-msg {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}
.rp-msg--user { flex-direction: row-reverse; }
.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  background: var(--cf-surface-3);
}
.rp-msg--assistant .msg-avatar {
  background: linear-gradient(135deg, var(--cf-brand), var(--cf-accent));
  color: #fff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}
.msg-body { max-width: 82%; }
.msg-role { font-size: 11.5px; color: var(--cf-text-3); margin-bottom: 5px; font-weight: 600; }
.rp-msg--user .msg-role { text-align: right; }
.msg-content {
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--cf-text-2);
  background: var(--cf-surface);
  padding: 11px 14px;
  border-radius: var(--cf-r-md);
  border: 1px solid var(--cf-border);
  box-shadow: var(--cf-shadow-sm);
  word-break: break-word;
}
.rp-msg--user .msg-content {
  background: var(--cf-brand-soft);
  color: var(--cf-brand-strong);
  border-color: transparent;
}

.msg-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--cf-surface);
  padding: 12px 14px;
  border-radius: var(--cf-r-md);
  border: 1px solid var(--cf-border);
  box-shadow: var(--cf-shadow-sm);
}
.loading-dots { display: flex; gap: 4px; }
.loading-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--cf-brand);
  animation: bounce 1.4s infinite ease-in-out;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
.loading-text { font-size: 13px; color: var(--cf-text-2); }

/* Modify hints */
.rp-modify-hints {
  padding: 12px 18px;
  border-top: 1px solid var(--cf-border);
  flex-shrink: 0;
  background: var(--cf-brand-tint);
}
.hints-title { font-size: 12.5px; font-weight: 600; color: var(--cf-text-2); margin-bottom: 10px; }
.hints-list { display: flex; flex-wrap: wrap; gap: 8px; }
.hint-chip {
  padding: 6px 12px;
  border: 1px solid var(--cf-border-strong);
  background: var(--cf-surface);
  border-radius: var(--cf-r-pill);
  font-size: 12px;
  color: var(--cf-text-2);
  cursor: pointer;
  transition: all 0.18s ease;
  font-family: inherit;
}
.hint-chip:hover:not(:disabled) {
  border-color: var(--cf-brand);
  color: var(--cf-brand-strong);
  background: var(--cf-brand-soft);
}
.hint-chip:disabled { opacity: 0.5; cursor: not-allowed; }

/* Input area */
.rp-input-area {
  padding: 14px 18px 16px;
  border-top: 1px solid var(--cf-border);
  flex-shrink: 0;
  background: var(--cf-surface);
}
.rp-input-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.rp-input-mode { font-size: 12px; color: var(--cf-text-3); }
.rp-input-mode b { color: var(--cf-brand-strong); font-weight: 600; }
.rp-hint { font-size: 11.5px; color: var(--cf-text-4); }
.rp-textarea {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--cf-border-strong);
  border-radius: var(--cf-r-md);
  font-size: 13.5px;
  line-height: 1.6;
  resize: none;
  outline: none;
  font-family: inherit;
  color: var(--cf-text);
  background: var(--cf-surface);
  transition: border-color 0.18s, box-shadow 0.18s;
}
.rp-textarea--api {
  font-family: var(--cf-mono);
  font-size: 12px;
}
.rp-textarea:focus {
  border-color: var(--cf-brand);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.rp-textarea::placeholder { color: var(--cf-text-4); }
.rp-input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
.rp-generate-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 22px;
  background: linear-gradient(135deg, var(--cf-brand), var(--cf-brand-strong));
  color: #fff;
  border: none;
  border-radius: var(--cf-r-pill);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.28);
}
.rp-generate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.4);
}
.rp-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.rp-generate-icon { font-size: 14px; }
</style>
