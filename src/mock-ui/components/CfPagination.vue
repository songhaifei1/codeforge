<template>
  <div class="cf-pagination">
    <button
      class="cf-pagination__btn"
      :disabled="current <= 1"
      @click="goTo(current - 1)"
    >&lt;</button>
    <button
      v-for="p in pageList"
      :key="p"
      class="cf-pagination__btn"
      :class="{ active: p === current }"
      @click="goTo(p)"
    >{{ p }}</button>
    <button
      class="cf-pagination__btn"
      :disabled="current >= totalPages"
      @click="goTo(current + 1)"
    >&gt;</button>
    <span class="cf-pagination__total">共 {{ total }} 条</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  total: number
  current?: number
  pageSize?: number
}>(), {
  current: 1,
  pageSize: 10
})

const emit = defineEmits<{
  'update:current': [value: number]
  'change': [value: number]
}>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize) || 1)

const pageList = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, props.current - 2)
  const end = Math.min(totalPages.value, start + 4)
  for (let i = Math.max(1, end - 4); i <= end; i++) {
    pages.push(i)
  }
  return pages
})

function goTo(page: number) {
  if (page < 1 || page > totalPages.value || page === props.current) return
  emit('update:current', page)
  emit('change', page)
}
</script>

<style scoped>
.cf-pagination {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  justify-content: flex-end;
}
.cf-pagination__btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
}
.cf-pagination__btn:hover:not(:disabled) { border-color: #4096ff; color: #4096ff; }
.cf-pagination__btn.active { background: #4096ff; border-color: #4096ff; color: #fff; }
.cf-pagination__btn:disabled { cursor: not-allowed; opacity: 0.5; }
.cf-pagination__total { font-size: 13px; color: #666; margin-left: 8px; }
</style>
