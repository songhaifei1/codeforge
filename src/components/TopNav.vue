<template>
  <header class="topnav">
    <!-- 品牌区 -->
    <div class="tn-brand">
      <div class="tn-logo">码</div>
      <div class="tn-wordmark">
        <span class="tn-name">码搭</span>
        <span class="tn-sub">CodeForge</span>
      </div>
      <span class="tn-ai-pill">AI</span>
    </div>

    <!-- 中部工作区标识 -->
    <div class="tn-context">
      <span class="tn-crumb">工作台</span>
      <span class="tn-divider">/</span>
      <span class="tn-crumb tn-crumb--muted">前端页面智能搭建</span>
    </div>

    <!-- 右侧操作区 -->
    <div class="tn-actions">
      <button class="tn-model" type="button">
        <span class="tn-model-dot"></span>
        CodeForge 3.5
        <span class="tn-caret">▾</span>
      </button>
      <button class="tn-btn tn-btn--ghost" type="button" @click="store.reset()">
        <span class="tn-btn-icon">✦</span> 新建对话
      </button>
      <div class="tn-avatar" title="用户">U</div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspace'

const store = useWorkspaceStore()
</script>

<style scoped>
.topnav {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  background: var(--cf-surface);
  border-bottom: 1px solid var(--cf-border);
  box-shadow: var(--cf-shadow-sm);
  z-index: 20;
}

/* 品牌 */
.tn-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tn-logo {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--cf-brand), var(--cf-accent));
  color: #fff;
  font-size: 17px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
  letter-spacing: -1px;
}
.tn-wordmark {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.tn-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--cf-text);
  letter-spacing: 0.5px;
}
.tn-sub {
  font-size: 13px;
  font-weight: 600;
  color: var(--cf-text-3);
  letter-spacing: 0.3px;
}
.tn-ai-pill {
  font-size: 10px;
  font-weight: 700;
  color: var(--cf-brand-strong);
  background: var(--cf-brand-soft);
  padding: 2px 7px;
  border-radius: var(--cf-r-pill);
  letter-spacing: 0.5px;
}

/* 中部上下文 */
.tn-context {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  padding-left: 16px;
  border-left: 1px solid var(--cf-border);
  height: 24px;
}
.tn-crumb {
  font-size: 13px;
  color: var(--cf-text-2);
  font-weight: 500;
}
.tn-crumb--muted {
  color: var(--cf-text-3);
  font-weight: 400;
}
.tn-divider {
  color: var(--cf-text-4);
  font-size: 12px;
}

/* 右侧操作 */
.tn-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}
.tn-model {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--cf-border-strong);
  background: var(--cf-surface);
  border-radius: var(--cf-r-pill);
  font-size: 13px;
  font-weight: 600;
  color: var(--cf-text-2);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s ease;
}
.tn-model:hover {
  border-color: var(--cf-brand);
  color: var(--cf-brand-strong);
  background: var(--cf-brand-tint);
}
.tn-model-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--cf-brand), var(--cf-accent));
}
.tn-caret {
  font-size: 10px;
  color: var(--cf-text-3);
}

.tn-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: var(--cf-r-pill);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.18s ease;
}
.tn-btn--ghost {
  border: 1px solid var(--cf-border-strong);
  background: var(--cf-surface);
  color: var(--cf-text-2);
}
.tn-btn--ghost:hover {
  border-color: var(--cf-brand);
  color: var(--cf-brand-strong);
  background: var(--cf-brand-tint);
}
.tn-btn-icon {
  font-size: 13px;
}

.tn-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  border: 1px solid var(--cf-border);
  color: var(--cf-text-2);
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
}
.tn-avatar:hover {
  border-color: var(--cf-brand);
  color: var(--cf-brand-strong);
}
</style>
