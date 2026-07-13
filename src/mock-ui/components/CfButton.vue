<template>
  <button
    class="cf-btn"
    :class="[`cf-btn--${type}`, { 'cf-btn--disabled': disabled }]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'primary' | 'default' | 'danger' | 'success'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}>(), {
  type: 'default',
  size: 'medium',
  disabled: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

function handleClick(e: MouseEvent) {
  if (props.disabled) return
  emit('click', e)
}
</script>

<style scoped>
.cf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 16px;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-family: inherit;
}
.cf-btn:hover { opacity: 0.85; }
.cf-btn--primary { background: #4096ff; border-color: #4096ff; color: #fff; }
.cf-btn--danger { background: #ff4d4f; border-color: #ff4d4f; color: #fff; }
.cf-btn--success { background: #52c41a; border-color: #52c41a; color: #fff; }
.cf-btn--default { background: #fff; border-color: #d9d9d9; color: #333; }
.cf-btn--default:hover { color: #4096ff; border-color: #4096ff; }
.cf-btn--disabled { opacity: 0.5; cursor: not-allowed; }
.cf-btn--disabled:hover { opacity: 0.5; }
</style>
