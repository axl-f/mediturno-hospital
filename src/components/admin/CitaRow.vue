<script setup lang="ts">
import StatusBadge from '../shared/StatusBadge.vue'

defineProps<{
  cita: any
  esHoy?: boolean
}>()

const emit = defineEmits<{
  (e: 'accion', tipo: 'asistio' | 'no_asistio', citaId: string): void
}>()
</script>

<template>
  <div class="cita-row">
    <div class="cell-time">{{ cita.hora }}</div>
    <div class="cell-paciente">
      <div class="nombre">{{ cita.pacienteNombre }}</div>
      <div class="rut">{{ cita.pacienteRut }}</div>
    </div>
    <div class="cell-esp">{{ cita.especialidad }}</div>
    <div class="cell-status"><StatusBadge :estado="cita.estado" /></div>
    
    <div class="cell-actions" v-if="esHoy && cita.estado === 'confirmada'">
      <button class="btn-icon text-success" title="Asistió" @click="emit('accion', 'asistio', cita.id)">✓</button>
      <button class="btn-icon text-danger" title="No asistió" @click="emit('accion', 'no_asistio', cita.id)">✗</button>
    </div>
    <div class="cell-actions" v-else></div>
  </div>
</template>

<style scoped>
.cita-row {
  display: grid;
  grid-template-columns: 80px 1fr 1fr 120px 100px;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  gap: 1rem;
}
.cita-row:hover { background: var(--color-bg); }

.cell-time { font-weight: bold; color: var(--color-primary); }
.cell-paciente .nombre { font-weight: 500; }
.cell-paciente .rut { font-size: var(--text-caption); color: var(--color-text-secondary); }
.cell-esp { text-transform: capitalize; }
.cell-actions { display: flex; gap: 8px; justify-content: flex-end; }

.btn-icon {
  width: 36px; height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid currentColor;
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-weight: bold;
}
.btn-icon:hover { background: var(--color-border); }
.text-success { color: var(--color-success); }
.text-danger { color: var(--color-danger); }

@media (max-width: 767px) {
  .cita-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    background: white;
    margin-bottom: 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow);
  }
  .cell-actions { width: 100%; justify-content: space-between; border-top: 1px solid var(--color-border); padding-top: 8px; }
}
</style>
