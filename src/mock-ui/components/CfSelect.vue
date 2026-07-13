<template>
  <select
    class="cf-select"
    :value="modelValue"
    :disabled="disabled"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option value="" disabled>{{ placeholder }}</option>
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
interface Option {
  label: string
  value: string
}

withDefaults(defineProps<{
  modelValue?: string
  options?: Option[]
  placeholder?: string
  disabled?: boolean
}>(), {
  modelValue: '',
  options: () => [],
  placeholder: '请选择',
  disabled: false
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.cf-select {
  padding: 6px 12px;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  background: #fff;
  color: #333;
  font-family: inherit;
  min-width: 120px;
}
.cf-select:focus { border-color: #4096ff; }
.cf-select:disabled { background: #f5f5f5; cursor: not-allowed; }
</style>
