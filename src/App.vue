<template>
  <div class="app">
    <Workspace />
  </div>
</template>

<script setup lang="ts">
import Workspace from './components/Workspace.vue'
</script>

<style>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #334155;
  background: #f8fafc;
}
</style>
