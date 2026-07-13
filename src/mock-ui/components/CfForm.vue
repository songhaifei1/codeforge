<template>
  <div class="cf-form">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  model?: Record<string, any>
}>()
</script>

<style scoped>
.cf-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
