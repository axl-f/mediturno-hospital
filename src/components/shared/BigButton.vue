<script setup lang="ts">
defineProps<{
  label?: string
  variant?: 'primary' | 'success' | 'danger' | 'ghost' | 'secondary'
  size?: 'md' | 'lg'
  icon?: string
  disabled?: boolean
  loading?: boolean
}>()
</script>

<template>
  <button
    :class="[
      'big-btn',
      `variant-${variant || 'primary'}`,
      `size-${size || 'md'}`,
      { loading: loading }
    ]"
    :disabled="disabled || loading"
    :aria-disabled="disabled || loading"
  >
    <span v-if="loading" class="spinner"></span>
    <template v-else>
      <span v-if="icon" class="icon">{{ icon }}</span>
      <span v-if="label">{{ label }}</span>
      <slot></slot>
    </template>
  </button>
</template>

<style scoped>
.big-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
  width: 100%;
}

.size-md {
  min-height: 56px;
  font-size: var(--text-action);
  padding: 0 1rem;
}

.size-lg {
  min-height: 72px;
  font-size: 1.25rem;
  padding: 0 1.5rem;
}

.variant-primary {
  background: var(--color-primary);
  color: #fff;
}
.variant-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.variant-success {
  background: var(--color-success);
  color: #fff;
}
.variant-success:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.variant-danger {
  background: var(--color-danger);
  color: #fff;
}
.variant-danger:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.variant-secondary {
  background: var(--color-border);
  color: var(--color-text);
}

.variant-ghost {
  background: transparent;
  color: var(--color-primary);
}
.variant-ghost:hover:not(:disabled) {
  background: var(--color-primary-light);
}

.big-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.icon {
  font-size: 1.2em;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
