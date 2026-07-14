<template>
  <div class="workspace">
    <div class="workspace-left">
      <RequirementPanel
        :chat-history="store.chatHistory"
        :is-loading="store.isLoading"
        :loading-step="store.loadingStep"
        :examples="store.examples"
        :modification-hints="store.modificationHints"
        :requirement="store.requirement"
        :input-mode="store.inputMode"
        :has-result="store.hasResult"
        @submit="store.submitInput"
        @load-example="store.loadExample"
        @load-api-example="store.loadApiExample"
        @load-api-markdown-example="store.loadApiMarkdownExample"
        @load-modification-hint="store.loadModificationHint"
        @update:requirement="store.requirement = $event"
        @update:input-mode="store.inputMode = $event"
      />
    </div>

    <div class="workspace-right">
      <div class="workspace-tabs">
        <button
          class="tab-btn"
          :class="{ active: store.activeTab === 'preview' }"
          @click="store.activeTab = 'preview'"
        >
          🎨 页面预览
        </button>
        <button
          class="tab-btn"
          :class="{ active: store.activeTab === 'code' }"
          @click="store.activeTab = 'code'"
        >
          📝 源代码
        </button>
        <div class="tab-info" v-if="store.generatedResult">
          <span class="tab-info-item">
            {{ store.generatedResult.entityName }} · {{ store.generatedResult.mockData.length }} 条Mock
          </span>
          <span v-if="store.generatedResult.matchedComponents?.length" class="tab-info-item tab-info-item--comp">
            {{ store.generatedResult.matchedComponents.length }} 个组件
          </span>
        </div>
      </div>

      <div class="workspace-tab-content">
        <PreviewPanel
          v-show="store.activeTab === 'preview'"
          :generated-result="store.generatedResult"
        />
        <CodePanel
          v-show="store.activeTab === 'code'"
          :page-code="store.generatedResult?.sfcCode || ''"
          :api-code="store.generatedResult?.apiCode || ''"
          :code-tab="store.codeTab"
          @update:code-tab="store.codeTab = $event"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspace'
import RequirementPanel from './RequirementPanel.vue'
import CodePanel from './CodePanel.vue'
import PreviewPanel from './PreviewPanel.vue'

const store = useWorkspaceStore()
</script>

<style scoped>
.workspace {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.workspace-left {
  width: 420px;
  flex-shrink: 0;
  border-right: 1px solid #e2e8f0;
}

.workspace-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.workspace-tabs {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 16px;
  flex-shrink: 0;
  gap: 4px;
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  font-family: inherit;
}

.tab-btn:hover { color: #334155; }

.tab-btn.active {
  color: #6366f1;
  border-bottom-color: #6366f1;
}

.tab-info {
  margin-left: auto;
  font-size: 12px;
  display: flex;
  gap: 8px;
}

.tab-info-item {
  color: #94a3b8;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 50px;
}

.tab-info-item--comp {
  background: #eef2ff;
  color: #6366f1;
}

.workspace-tab-content {
  flex: 1;
  overflow: hidden;
}
</style>
