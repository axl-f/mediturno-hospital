<script setup lang="ts">
defineProps<{
  hora: string
  disponible: boolean
  seleccionado: boolean
}>()

const emit = defineEmits<{
  (e: 'select', hora: string): void
}>()
</script>

<template>
  <button 
    class="horario-bloque"
    :class="{ 
      disponible: disponible, 
      ocupado: !disponible,
      seleccionado: seleccionado
    }"
    :disabled="!disponible"
    @click="emit('select', hora)"
  >
    <span class="hora">{{ hora }}</span>
    <svg v-if="seleccionado" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </button>
</template>

<style scoped>
.horario-bloque {
  width: 100%;
  height: 64px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.1s;
  position: relative;
}

.horario-bloque.ocupado {
  background: var(--color-bg);
  color: var(--color-text-disabled);
  border-color: var(--color-border);
  cursor: not-allowed;
}

.horario-bloque.disponible {
  background: var(--color-success-light);
  color: var(--color-success);
  border-color: var(--color-success);
}
.horario-bloque.disponible:hover:not(:disabled) {
  transform: translateY(-1px);
}

.horario-bloque.seleccionado {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.check-icon {
  position: absolute;
  right: 16px;
  width: 24px;
  height: 24px;
}
</style>
