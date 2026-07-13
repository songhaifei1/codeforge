<template>
  <div class="workspace">
    <!-- Left: Requirement Panel -->
    <div class="workspace-left">
      <RequirementPanel
        :chat-history="store.chatHistory"
        :is-loading="store.isLoading"
        :loading-step="store.loadingStep"
        :examples="store.examples"
        :requirement="store.requirement"
        @generate="handleGenerate"
        @load-example="store.loadExample"
        @update:requirement="store.requirement = $event"
      />
    </div>

    <!-- Right: Code / Preview Panel -->
    <div class="workspace-right">
      <!-- Tab Bar -->
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
            {{ store.generatedResult.entityName }} · {{ store.generatedResult.mockData.length }} 条Mock数据
          </span>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="workspace-tab-content">
        <PreviewPanel
          v-show="store.activeTab === 'preview'"
          :generated-result="store.generatedResult"
        />
        <CodePanel
          v-show="store.activeTab === 'code'"
          :code="store.generatedResult?.sfcCode || ''"
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

function handleGenerate(text: string) {
  store.requirement = text
  store.generate()
}
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
}

.tab-info-item {
  color: #94a3b8;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 50px;
}

.workspace-tab-content {
  flex: 1;
  overflow: hidden;
}
</style>
