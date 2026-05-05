<script setup lang="ts">
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<Toast[]>([])
let nextId = 0

const show = (message: string, type: ToastType = 'info', duration = 4000) => {
  const id = ++nextId
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

const remove = (id: number) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

defineExpose({ show })
</script>

<template>
  <teleport to="body">
    <div class="toast-container">
      <transition-group name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast"
          :class="t.type"
          @click="remove(t.id)"
        >
          <span class="toast-icon">
            {{ t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ' }}
          </span>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close" @click.stop="remove(t.id)">✕</button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 360px;
  width: calc(100vw - 3rem);
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
  border-left: 4px solid transparent;
}

.toast.success {
  background: #f0fdf4;
  color: #166534;
  border-left-color: #22c55e;
}
.toast.error {
  background: #fef2f2;
  color: #991b1b;
  border-left-color: #ef4444;
}
.toast.warning {
  background: #fffbeb;
  color: #92400e;
  border-left-color: #f59e0b;
}
.toast.info {
  background: #eff6ff;
  color: #1e40af;
  border-left-color: #3b82f6;
}

.toast-icon {
  font-size: 1.1rem;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-msg { flex: 1; }

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  opacity: 0.5;
  padding: 0 4px;
  flex-shrink: 0;
  color: inherit;
}
.toast-close:hover { opacity: 1; }

/* Animación */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-leave-active {
  transition: all 0.25s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(60px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(60px);
}
</style>
