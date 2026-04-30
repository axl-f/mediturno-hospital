<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAgendaStore } from '../../stores/agenda'
import { update, ref as dbRef } from 'firebase/database'
import { db } from '../../firebase'
import AppNav from '../../components/layout/AppNav.vue'
import MetricCard from '../../components/admin/MetricCard.vue'
import CitaRow from '../../components/admin/CitaRow.vue'

const agenda = useAgendaStore()

// Simulamos la fecha de "hoy" (según el set de datos del prototipo: 2026-05-05)
const fechaHoy = '2026-05-05'

const filtroEstado = ref('Todos')

onMounted(() => {
  agenda.suscribirCitasDelDia(fechaHoy)
  agenda.cargarEspecialidades()
  agenda.suscribirListaEspera()
})

const citasFiltradas = computed(() => {
  if (filtroEstado.value === 'Todos') return agenda.citasDelDia
  return agenda.citasDelDia.filter(c => c.estado === filtroEstado.value.toLowerCase())
})

// Métricas
const total = computed(() => agenda.citasDelDia.length)
const confirmadas = computed(() => agenda.citasDelDia.filter(c => c.estado === 'confirmada').length)
const canceladas = computed(() => agenda.citasDelDia.filter(c => c.estado === 'cancelada').length)
const enEspera = computed(() => {
  return Object.values(agenda.listaEspera).reduce((acc, curr) => acc + curr.length, 0)
})
const cancelacionPorcentaje = computed(() => total.value ? Math.round((canceladas.value / total.value) * 100) : 0)

const hayAlerta = computed(() => cancelacionPorcentaje.value > 30)

const manejarAccion = async (tipo: 'asistio'|'no_asistio', citaId: string) => {
  await update(dbRef(db, `citas/${citaId}`), { estado: tipo })
}
</script>

<template>
  <div class="admin-layout">
    <AppNav>
      <router-link to="/admin" class="nav-link">📅 Agenda</router-link>
      <router-link to="/admin/espera" class="nav-link">⏳ Lista de Espera</router-link>
      <router-link to="/admin/alertas" class="nav-link">⚠️ Alertas</router-link>
      <router-link to="/admin/usuarios" class="nav-link">👥 Gestión Usuarios</router-link>
    </AppNav>
    
    <main class="admin-content">
      <div class="content-header">
        <h1>Agenda del Día</h1>
        <p class="subtitle">{{ fechaHoy }}</p>
      </div>

      <div class="metrics-grid">
        <MetricCard title="Total Citas" :value="total" />
        <MetricCard title="Confirmadas" :value="confirmadas" />
        <MetricCard title="Canceladas" :value="canceladas" :trend="`${cancelacionPorcentaje}%`" :trendUp="false" />
        <MetricCard title="En Espera" :value="enEspera" />
      </div>

      <div v-if="hayAlerta" class="alert-banner">
        ⚠️ Alerta: {{ cancelacionPorcentaje }}% de cancelaciones detectado. Revise la lista de espera.
      </div>

      <div class="table-container">
        <div class="table-header-actions">
          <div class="tabs">
            <button 
              v-for="t in ['Todos', 'Confirmada', 'Pendiente', 'Cancelada']" :key="t"
              :class="['tab-btn', { active: filtroEstado === t }]"
              @click="filtroEstado = t"
            >{{ t }}</button>
          </div>
        </div>

        <div class="table-desktop-header">
          <div>Hora</div><div>Paciente</div><div>Especialidad</div><div>Estado</div><div>Acción</div>
        </div>

        <div class="table-body">
          <p v-if="citasFiltradas.length === 0" class="empty-msg">No hay citas para mostrar</p>
          <CitaRow 
            v-for="cita in citasFiltradas" 
            :key="cita.id" 
            :cita="cita" 
            :esHoy="true"
            @accion="manejarAccion" 
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.admin-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.content-header {
  margin-bottom: 2rem;
}
.content-header h1 { font-family: var(--font-display); color: var(--color-primary); margin: 0; }
.subtitle { color: var(--color-text-secondary); font-size: 1.125rem; }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 1024px) {
  .metrics-grid { grid-template-columns: repeat(4, 1fr); }
}

.alert-banner {
  background: var(--color-warning-light);
  color: #a65800;
  padding: 1rem;
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--color-warning);
  font-weight: bold;
  margin-bottom: 2rem;
}

.table-container {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.table-header-actions {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: var(--color-bg);
  border-radius: 99px;
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text-secondary);
}
.tab-btn.active {
  background: var(--color-primary);
  color: white;
}

.table-desktop-header {
  display: grid;
  grid-template-columns: 80px 1fr 1fr 120px 100px;
  padding: 1rem;
  background: var(--color-bg);
  font-weight: bold;
  font-size: var(--text-label);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  gap: 1rem;
}

@media (max-width: 767px) {
  .table-desktop-header { display: none; }
  .table-container { background: transparent; box-shadow: none; }
}

.empty-msg {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}
</style>
