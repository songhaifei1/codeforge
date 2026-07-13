<template>
  <input
    class="cf-datepicker"
    type="date"
    :value="modelValue"
    :placeholder="placeholder"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
}>(), {
  modelValue: '',
  placeholder: '请选择日期'
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.cf-datepicker {
  padding: 6px 12px;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  color: #333;
}
.cf-datepicker:focus { border-color: #4096ff; }
</style>
