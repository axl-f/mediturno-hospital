<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  id: string
  nombre: string
  icono: string
  disponibles?: number
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const isDisabled = computed(() => props.disponibles === 0)
const statusText = computed(() => {
  if (!props.disponibles || props.disponibles <= 0) return ''
  return `${props.disponibles} ${props.disponibles === 1 ? 'hora disponible' : 'horas disponibles'} hoy`
})
</script>

<template>
  <button 
    class="especialidad-card" 
    :class="{ disabled: isDisabled }"
    :disabled="isDisabled"
    @click="emit('select', id)"
  >
    <div class="emoji-icon">{{ icono }}</div>
    <h3 class="nombre">{{ nombre }}</h3>
    <p v-if="statusText" class="status text-success">{{ statusText }}</p>
  </button>
</template>

<style scoped>
.especialidad-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 120px;
  width: 100%;
}

.especialidad-card:hover:not(:disabled) {
  border-color: var(--color-primary);
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.especialidad-card.disabled {
  background: var(--color-bg);
  opacity: 0.6;
  cursor: not-allowed;
}

.emoji-icon {
  font-size: 2.5rem;
}

.nombre {
  font-size: 1.125rem;
  font-weight: bold;
  color: var(--color-text);
  margin: 0;
  text-align: center;
}

.status {
  font-size: var(--text-caption);
  color: var(--color-text-secondary);
  margin: 0;
}
.text-success {
  color: var(--color-success);
  font-weight: 500;
}
</style>
