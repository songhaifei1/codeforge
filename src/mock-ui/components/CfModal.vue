<template>
  <Teleport to="body">
    <div v-if="modelValue" class="cf-modal-mask" @click.self="handleClose">
      <div class="cf-modal" :style="{ width: width }">
        <div class="cf-modal__header">
          <span class="cf-modal__title">{{ title }}</span>
          <button class="cf-modal__close" @click="handleClose">&times;</button>
        </div>
        <div class="cf-modal__body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="cf-modal__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title?: string
  width?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.cf-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.cf-modal {
  background: #fff;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}
.cf-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}
.cf-modal__title { font-size: 16px; font-weight: 600; color: #333; }
.cf-modal__close {
  background: none; border: none; font-size: 20px; cursor: pointer;
  color: #999; line-height: 1; padding: 0;
}
.cf-modal__close:hover { color: #333; }
.cf-modal__body { padding: 24px; overflow-y: auto; flex: 1; }
.cf-modal__footer {
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
