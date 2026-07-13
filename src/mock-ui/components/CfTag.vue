<template>
  <span class="cf-tag" :class="`cf-tag--${type}`">
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'success' | 'warning' | 'danger' | 'info' | 'primary'
}>(), {
  type: 'info'
})
</script>

<style scoped>
.cf-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 20px;
  border-radius: 4px;
  border: 1px solid;
  white-space: nowrap;
}
.cf-tag--success { background: #f6ffed; border-color: #b7eb8f; color: #52c41a; }
.cf-tag--warning { background: #fffbe6; border-color: #ffe58f; color: #faad14; }
.cf-tag--danger { background: #fff2f0; border-color: #ffccc7; color: #ff4d4f; }
.cf-tag--info { background: #f5f5f5; border-color: #d9d9d9; color: #666; }
.cf-tag--primary { background: #e6f4ff; border-color: #91caff; color: #4096ff; }
</style>
