<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAgendaStore } from '../../stores/agenda'
import { update, ref as dbRef } from 'firebase/database'
import { db } from '../../firebase'
import AppNav from '../../components/layout/AppNav.vue'
import MetricCard from '../../components/admin/MetricCard.vue'
import CitaRow from '../../components/admin/CitaRow.vue'

const agenda = useAgendaStore()

// ── Navegación de fecha ────────────────────────────────────────────────────
const toLocalIso = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const fechaSeleccionada = ref(toLocalIso(new Date()))

const esPasado = computed(() => fechaSeleccionada.value < toLocalIso(new Date()))
const esHoy    = computed(() => fechaSeleccionada.value === toLocalIso(new Date()))

const cambiarDia = (delta: number) => {
  const [y, m, d] = fechaSeleccionada.value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + delta)
  fechaSeleccionada.value = toLocalIso(date)
}

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Re-suscribir citas al cambiar fecha + cargar datos de soporte
watch(fechaSeleccionada, (nueva) => {
  agenda.suscribirCitasDelDia(nueva)
}, { immediate: true })

agenda.cargarEspecialidades()
agenda.suscribirListaEspera()

// ── Filtros ────────────────────────────────────────────────────────────────
const filtroEstado = ref('Todos')

const citasFiltradas = computed(() => {
  const base = filtroEstado.value === 'Todos'
    ? agenda.citasDelDia
    : agenda.citasDelDia.filter(c => c.estado === filtroEstado.value.toLowerCase())
  return [...base].sort((a, b) => a.hora.localeCompare(b.hora))
})

// ── Métricas ───────────────────────────────────────────────────────────────
const total        = computed(() => agenda.citasDelDia.length)
const confirmadas  = computed(() => agenda.citasDelDia.filter(c => c.estado === 'confirmada' || c.estado === 'asistio').length)
const canceladas   = computed(() => agenda.citasDelDia.filter(c => c.estado === 'cancelada' || c.estado === 'no_asistio').length)
const enEspera     = computed(() => Object.values(agenda.listaEspera).reduce((acc, curr) => acc + curr.length, 0))
const cancelacionPct = computed(() => total.value ? Math.round((canceladas.value / total.value) * 100) : 0)
const hayAlerta    = computed(() => cancelacionPct.value >= 20)

const manejarAccion = async (tipo: 'asistio' | 'no_asistio' | 'confirmar', citaId: string) => {
  const nuevoEstado = tipo === 'confirmar' ? 'confirmada' : tipo
  await update(dbRef(db, `citas/${citaId}`), { estado: nuevoEstado })
}
</script>

<template>
  <div class="admin-layout">
    <AppNav>
      <router-link to="/admin" class="nav-link">📅 Agenda</router-link>
      <router-link to="/admin/alertas" class="nav-link">⚠️ Alertas</router-link>
      <router-link to="/admin/usuarios" class="nav-link">👥 Gestión Usuarios</router-link>
    </AppNav>

    <main class="admin-content">

      <!-- Encabezado + Navegador de fecha -->
      <div class="content-header">
        <div class="header-top">
          <h1>Agenda General</h1>
          <div class="metrics-mini" v-if="total > 0">
            <span class="mini-val">{{ confirmadas }}/{{ total }}</span>
            <span class="mini-lbl">confirmadas</span>
          </div>
        </div>

        <div class="date-nav">
          <button class="nav-arrow" @click="cambiarDia(-1)" title="Día anterior">‹</button>

          <div class="date-center">
            <div class="date-badge" :class="{ hoy: esHoy, pasado: esPasado }">
              {{ esHoy ? 'Hoy' : esPasado ? 'Historial' : 'Próximo' }}
            </div>
            <span class="fecha-texto capitalize">{{ formatDate(fechaSeleccionada) }}</span>
            <input
              type="date"
              class="date-input"
              v-model="fechaSeleccionada"
              title="Seleccionar fecha"
            />
          </div>

          <button class="nav-arrow" @click="cambiarDia(1)" title="Día siguiente">›</button>
        </div>
      </div>

      <!-- Métricas del día -->
      <div class="metrics-grid">
        <MetricCard title="Total Citas"  :value="total" />
        <MetricCard title="Confirmadas"  :value="confirmadas" />
        <MetricCard title="Canceladas / No Asistió" :value="canceladas" :trend="`${cancelacionPct}%`" :trendUp="false" />
        <MetricCard title="Lista de Espera" :value="enEspera" />
      </div>

      <!-- Banner de alerta -->
      <div v-if="hayAlerta" class="alert-banner">
        ⚠️ Alerta: {{ cancelacionPct }}% de cancelaciones detectado. Revise la lista de espera.
      </div>

      <!-- Tabla de citas -->
      <div class="table-container">
        <div class="table-header-actions">
          <div class="tabs">
            <button
              v-for="t in ['Todos', 'Confirmada', 'Pendiente', 'Cancelada']"
              :key="t"
              :class="['tab-btn', { active: filtroEstado === t }]"
              @click="filtroEstado = t"
            >{{ t }}</button>
          </div>
        </div>

        <div class="table-desktop-header">
          <div>Hora</div><div>Paciente</div><div>Especialidad</div><div>Estado</div><div>Acción</div>
        </div>

        <div class="table-body">
          <p v-if="citasFiltradas.length === 0" class="empty-msg">
            {{ esPasado ? 'No se registraron citas para esta fecha.' : 'No hay citas agendadas aún.' }}
          </p>
          <CitaRow
            v-for="cita in citasFiltradas"
            :key="cita.id"
            :cita="cita"
            :esHoy="!esPasado"
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

/* Header */
.content-header { margin-bottom: 2rem; }

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.content-header h1 {
  font-family: var(--font-display);
  color: var(--color-primary);
  margin: 0;
  font-size: 2rem;
}

.metrics-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  border-radius: var(--radius-sm);
  padding: 10px 18px;
  box-shadow: var(--shadow);
}
.mini-val { font-size: 1.6rem; font-weight: bold; color: var(--color-primary); line-height: 1; }
.mini-lbl { font-size: 0.75rem; color: var(--color-text-secondary); }

/* Navegador de fecha */
.date-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: var(--radius);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
}

.nav-arrow {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  color: var(--color-primary);
}
.nav-arrow:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.date-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.date-badge {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: bold;
  background: var(--color-primary-light);
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.date-badge.hoy   { background: var(--color-success-light); color: var(--color-success); }
.date-badge.pasado { background: var(--color-bg); color: var(--color-text-secondary); }

.fecha-texto {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-text);
  text-align: center;
}
.capitalize { text-transform: capitalize; }

.date-input {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  background: var(--color-bg);
}

/* Métricas */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 1024px) {
  .metrics-grid { grid-template-columns: repeat(4, 1fr); }
}

/* Alerta */
.alert-banner {
  background: var(--color-warning-light);
  color: #a65800;
  padding: 1rem;
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--color-warning);
  font-weight: bold;
  margin-bottom: 2rem;
}

/* Tabla */
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
  white-space: nowrap;
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

.empty-msg {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 1.05rem;
}

/* Responsive */
@media (max-width: 767px) {
  .admin-content { padding: 1rem 1rem 5rem; }
  .header-top { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .date-nav { gap: 0.5rem; padding: 0.75rem 1rem; }
  .nav-arrow { width: 36px; height: 36px; }
  .fecha-texto { font-size: 1rem; }
  .table-desktop-header { display: none; }
  .table-container { background: transparent; box-shadow: none; }
}
</style>
