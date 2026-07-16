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
            {{ store.generatedResult.entityName }} · {{ store.generatedFiles.length }} 文件
          </span>
          <span v-if="store.generatedResult.matchedComponents?.length" class="tab-info-item tab-info-item--comp">
            {{ store.generatedResult.matchedComponents.length }} 组件匹配
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
          :files="store.generatedFiles"
          :active-index="store.activeFileIndex"
          @update:active-file-index="store.activeFileIndex = $event"
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
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--cf-bg);
}

.workspace-left {
  width: 420px;
  flex-shrink: 0;
  border-right: 1px solid var(--cf-border);
  background: var(--cf-surface);
  min-height: 0;
}

.workspace-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}

.workspace-tabs {
  display: flex;
  align-items: center;
  background: var(--cf-surface);
  border-bottom: 1px solid var(--cf-border);
  padding: 0 12px;
  flex-shrink: 0;
  gap: 2px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 18px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--cf-text-3);
  border-bottom: 2px solid transparent;
  transition: all 0.18s;
  font-family: inherit;
}

.tab-btn:hover { color: var(--cf-text-2); }

.tab-btn.active {
  color: var(--cf-brand-strong);
  border-bottom-color: var(--cf-brand);
}

.tab-info {
  margin-left: auto;
  font-size: 12px;
  display: flex;
  gap: 8px;
}

.tab-info-item {
  color: var(--cf-text-3);
  background: var(--cf-surface-3);
  padding: 5px 12px;
  border-radius: var(--cf-r-pill);
  font-weight: 500;
}

.tab-info-item--comp {
  background: var(--cf-brand-soft);
  color: var(--cf-brand-strong);
}

.workspace-tab-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
</style>
