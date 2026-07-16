<template>
  <div class="app">
    <TopNav />
    <Workspace />
  </div>
</template>

<script setup lang="ts">
import TopNav from './components/TopNav.vue'
import Workspace from './components/Workspace.vue'
</script>

<style>
:root {
  /* ===== 品牌色 ===== */
  --cf-brand: #6366f1;
  --cf-brand-strong: #4f46e5;
  --cf-brand-soft: #eef2ff;
  --cf-brand-tint: #f5f3ff;
  --cf-accent: #0ea5e9;

  /* ===== 中性色（冷灰） ===== */
  --cf-bg: #f6f7fb;
  --cf-surface: #ffffff;
  --cf-surface-2: #f8fafc;
  --cf-surface-3: #f1f5f9;

  --cf-border: #e8ebf2;
  --cf-border-strong: #d8dde8;

  --cf-text: #1e293b;
  --cf-text-2: #475569;
  --cf-text-3: #94a3b8;
  --cf-text-4: #cbd5e1;

  /* ===== 圆角 ===== */
  --cf-r-sm: 8px;
  --cf-r-md: 12px;
  --cf-r-lg: 16px;
  --cf-r-xl: 20px;
  --cf-r-pill: 999px;

  /* ===== 阴影 ===== */
  --cf-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06);
  --cf-shadow-md: 0 4px 16px rgba(15, 23, 42, 0.08);
  --cf-shadow-lg: 0 12px 32px rgba(15, 23, 42, 0.12);

  /* ===== 字体 ===== */
  --cf-font: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --cf-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--cf-font);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--cf-text);
  background: var(--cf-bg);
}

.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
