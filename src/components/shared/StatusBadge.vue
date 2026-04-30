<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  estado: 'confirmada' | 'pendiente' | 'cancelada' | 'asistio' | 'no_asistio' | 'espera'
}>()

const styleMap: Record<string, { bg: string, text: string, label: string }> = {
  confirmada: { bg: 'var(--color-success-light)', text: 'var(--color-success)', label: 'Confirmada' },
  pendiente: { bg: 'var(--color-warning-light)', text: 'var(--color-warning)', label: 'Pendiente' },
  cancelada: { bg: 'var(--color-danger-light)', text: 'var(--color-danger)', label: 'Cancelada' },
  asistio: { bg: '#e8eeff', text: '#2d4db5', label: 'Asistió' },
  no_asistio: { bg: '#f5e8e8', text: '#7a1515', label: 'No Asistió' },
  espera: { bg: 'var(--color-primary-light)', text: 'var(--color-primary)', label: 'En Espera' }
}

const currentStyle = computed(() => styleMap[props.estado] || styleMap['pendiente'])
</script>

<template>
  <span 
    class="status-badge" 
    :style="{ backgroundColor: currentStyle.bg, color: currentStyle.text }"
  >
    {{ currentStyle.label }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: var(--text-caption);
  font-weight: 500;
  text-transform: capitalize;
}
</style>
