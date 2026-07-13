<template>
  <div class="cf-card">
    <div v-if="title" class="cf-card__header">
      <span class="cf-card__title">{{ title }}</span>
      <div class="cf-card__extra">
        <slot name="extra" />
      </div>
    </div>
    <div class="cf-card__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<style scoped>
.cf-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}
.cf-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}
.cf-card__title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.cf-card__body {
  padding: 24px;
}
</style>
