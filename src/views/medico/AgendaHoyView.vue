<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAgendaStore } from '../../stores/agenda'
import { useAuthStore } from '../../stores/auth'
import AppNav from '../../components/layout/AppNav.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { update, ref as dbRef } from 'firebase/database'
import { db } from '../../firebase'

const agenda = useAgendaStore()
const auth = useAuthStore()

// Fecha seleccionada — arranca en hoy (en formato YYYY-MM-DD local)
const toLocalIso = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const fechaSeleccionada = ref(toLocalIso(new Date()))

// Suscribirse cada vez que cambie la fecha
watch(fechaSeleccionada, (nueva) => {
  agenda.suscribirCitasDelDia(nueva)
}, { immediate: true })

// Helper: navegar días
const cambiarDia = (delta: number) => {
  const [y, m, d] = fechaSeleccionada.value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + delta)
  fechaSeleccionada.value = toLocalIso(date)
}

// Filtrar por especialidad del médico
const citasMedico = computed(() =>
  agenda.citasDelDia.filter(c => c.especialidad === auth.usuario?.especialidad)
    .sort((a, b) => a.hora.localeCompare(b.hora))
)

const total = computed(() => citasMedico.value.length)
const confirmadas = computed(() => citasMedico.value.filter(c => c.estado === 'confirmada' || c.estado === 'asistio').length)

const esPasado = computed(() => fechaSeleccionada.value < toLocalIso(new Date()))
const esHoy = computed(() => fechaSeleccionada.value === toLocalIso(new Date()))

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const manejarAccion = async (tipo: 'asistio' | 'no_asistio' | 'confirmar', citaId: string) => {
  const nuevoEstado = tipo === 'confirmar' ? 'confirmada' : tipo
  await update(dbRef(db, `citas/${citaId}`), { estado: nuevoEstado })
}
</script>

<template>
  <div class="medico-layout">
    <AppNav>
      <router-link to="/medico" class="nav-link">📅 Agenda</router-link>
      <router-link to="/medico/espera" class="nav-link">⏳ Lista de Espera</router-link>
      <router-link to="/medico/configuracion" class="nav-link">⚙️ Disponibilidad</router-link>
    </AppNav>

    <main class="medico-content">
      <!-- Header médico -->
      <div class="header-section">
        <div class="header-top">
          <div>
            <h1>{{ auth.usuario?.nombre }}</h1>
            <p class="especialidad">{{ auth.usuario?.especialidad?.replace(/_/g, ' ') }}</p>
          </div>
          <div class="stats-mini" v-if="total > 0">
            <span class="stat-val">{{ confirmadas }}/{{ total }}</span>
            <span class="stat-lbl">confirmadas</span>
          </div>
        </div>

        <!-- Navegador de fecha -->
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

      <!-- Lista de citas -->
      <div class="agenda-list" v-if="citasMedico.length > 0">
        <div v-for="cita in citasMedico" :key="cita.id" class="agenda-bloque" :class="cita.estado">
          <div class="bloque-hora">{{ cita.hora }}</div>
          <div class="bloque-detalle">
            <h3 class="paciente-nombre">{{ cita.pacienteNombre }}</h3>
            <p class="paciente-rut">RUT: {{ cita.pacienteRut }}</p>
            <div class="status-row">
              <StatusBadge :estado="cita.estado" />
              <div class="cell-actions" v-if="cita.estado === 'pendiente' && !esPasado">
                <button class="btn-text text-primary" @click="manejarAccion('confirmar', cita.id)">Confirmar</button>
              </div>
              <div class="cell-actions" v-else-if="cita.estado === 'confirmada'">
                <button class="btn-text text-success" @click="manejarAccion('asistio', cita.id)">✓ Asistió</button>
                <button class="btn-text text-danger" @click="manejarAccion('no_asistio', cita.id)">✗ No Asistió</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <p class="empty-title">Sin citas para este día</p>
        <p class="empty-sub">{{ esPasado ? 'No se registraron citas para esta fecha.' : 'No hay citas agendadas aún.' }}</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.medico-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.medico-content {
  flex: 1;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

/* Header */
.header-section { margin-bottom: 2rem; }

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.header-top h1 {
  font-family: var(--font-display);
  color: var(--color-primary);
  margin: 0 0 4px 0;
  font-size: 2rem;
}

.especialidad {
  color: var(--color-text-secondary);
  text-transform: capitalize;
  font-size: 1.125rem;
  margin: 0;
}

.stats-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  border-radius: var(--radius-sm);
  padding: 12px 20px;
  box-shadow: var(--shadow);
}
.stat-val { font-size: 1.75rem; font-weight: bold; color: var(--color-primary); line-height: 1; }
.stat-lbl { font-size: 0.75rem; color: var(--color-text-secondary); }

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
.date-badge.hoy { background: var(--color-success-light); color: var(--color-success); }
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

/* Agenda */
.agenda-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.agenda-bloque {
  display: flex;
  background: white;
  transition: background 0.2s;
}
.agenda-bloque.asistio { background: var(--color-success-light); }
.agenda-bloque.no_asistio { background: var(--color-danger-light); }

.bloque-hora {
  width: 100px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-primary);
  border-right: 2px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
}

.bloque-detalle {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.paciente-nombre { margin: 0; font-size: 1.25rem; }
.paciente-rut { margin: 0 0 8px 0; color: var(--color-text-secondary); font-size: 0.9rem; }

.status-row { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.cell-actions { display: flex; gap: 8px; }

.btn-icon {
  width: 36px; height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid currentColor;
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
}
.btn-icon:hover { background: var(--color-bg); }
.text-success { color: var(--color-success); }
.text-danger { color: var(--color-danger); }
.text-primary { color: var(--color-primary); }

.btn-text {
  background: transparent;
  border: 1px solid currentColor;
  padding: 4px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: bold;
}
.btn-text:hover { background: var(--color-primary-light); }

/* Estado vacío */
.empty-state {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 4rem 2rem;
  text-align: center;
}
.empty-icon { font-size: 3rem; margin-bottom: 1rem; }
.empty-title { font-size: 1.25rem; font-weight: bold; color: var(--color-text); margin: 0 0 8px 0; }
.empty-sub { color: var(--color-text-secondary); margin: 0; }

/* Responsive */
@media (max-width: 767px) {
  .header-top { flex-direction: column; gap: 1rem; }
  .stats-mini { flex-direction: row; gap: 8px; align-items: baseline; }
  .date-nav { gap: 0.5rem; padding: 1rem; }
  .nav-arrow { width: 36px; height: 36px; }
  .fecha-texto { font-size: 1rem; }
  .bloque-hora { width: 72px; font-size: 1.1rem; padding: 1rem; }
  .medico-content { padding: 1rem 1rem 5rem; }
}
</style>
