<template>
  <div class="cf-form-item">
    <label v-if="label" class="cf-form-item__label" :style="{ width: labelWidth }">
      {{ label }}
    </label>
    <div class="cf-form-item__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  labelWidth?: string
}>(), {
  label: '',
  labelWidth: '100px'
})
</script>

<style scoped>
.cf-form-item {
  display: flex;
  align-items: flex-start;
}
.cf-form-item__label {
  text-align: right;
  padding-right: 12px;
  line-height: 32px;
  font-size: 14px;
  color: #333;
  flex-shrink: 0;
}
.cf-form-item__content {
  flex: 1;
  display: flex;
  align-items: center;
}
</style>
