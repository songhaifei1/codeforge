<template>
  <input
    class="cf-input"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}>(), {
  modelValue: '',
  placeholder: '请输入',
  disabled: false
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.cf-input {
  padding: 6px 12px;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  color: #333;
}
.cf-input:focus { border-color: #4096ff; box-shadow: 0 0 0 2px rgba(64,150,255,0.1); }
.cf-input:disabled { background: #f5f5f5; cursor: not-allowed; }
.cf-input::placeholder { color: #bfbfbf; }
</style>
