<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAgendaStore } from '../../stores/agenda'
import { useAuthStore } from '../../stores/auth'
import AppNav from '../../components/layout/AppNav.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { update, ref as dbRef } from 'firebase/database'
import { db } from '../../firebase'

const agenda = useAgendaStore()
const auth = useAuthStore()

const fechaHoy = '2026-05-05'

onMounted(() => {
  agenda.suscribirCitasDelDia(fechaHoy)
})

const citasMedico = computed(() => {
  return agenda.citasDelDia.filter(c => c.especialidad === auth.usuario?.especialidad)
})

const total = computed(() => citasMedico.value.length)
const confirmadas = computed(() => citasMedico.value.filter(c => c.estado === 'confirmada' || c.estado === 'asistio').length)

const formatDate = () => {
  const [y, m, d] = fechaHoy.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const manejarAccion = async (tipo: 'asistio'|'no_asistio'|'confirmar', citaId: string) => {
  const nuevoEstado = tipo === 'confirmar' ? 'confirmada' : tipo
  await update(dbRef(db, `citas/${citaId}`), { estado: nuevoEstado })
}
</script>

<template>
  <div class="medico-layout">
    <AppNav>
      <router-link to="/medico" class="nav-link">📅 Agenda de Hoy</router-link>
      <router-link to="/medico/espera" class="nav-link">⏳ Lista de Espera</router-link>
      <router-link to="/medico/checklist" class="nav-link">✅ Checklist</router-link>
      <router-link to="/medico/configuracion" class="nav-link">⚙️ Disponibilidad</router-link>
    </AppNav>
    
    <main class="medico-content">
      <div class="header-section">
        <h1>{{ auth.usuario?.nombre }}</h1>
        <p class="especialidad">{{ auth.usuario?.especialidad?.replace('_', ' ') }}</p>
        
        <div class="date-header">
          <span class="fecha capitalize">{{ formatDate() }}</span>
          <span class="counter">{{ confirmadas }} de {{ total }} citas confirmadas</span>
        </div>
      </div>

      <div class="agenda-list">
        <p v-if="citasMedico.length === 0" class="empty-msg">No hay citas agendadas para hoy.</p>
        
        <div v-for="cita in citasMedico" :key="cita.id" class="agenda-bloque">
          <div class="bloque-hora">{{ cita.hora }}</div>
          <div class="bloque-detalle">
            <h3 class="paciente-nombre">{{ cita.pacienteNombre }}</h3>
            <p class="paciente-rut">{{ cita.pacienteRut }}</p>
            <div class="status-row">
              <StatusBadge :estado="cita.estado" />
              <div class="cell-actions" v-if="cita.estado === 'pendiente'">
                <button class="btn-text text-primary" @click="manejarAccion('confirmar', cita.id)">Confirmar</button>
              </div>
              <div class="cell-actions" v-else-if="cita.estado === 'confirmada'">
                <button class="btn-icon text-success" title="Asistió" @click="manejarAccion('asistio', cita.id)">✓</button>
                <button class="btn-icon text-danger" title="No asistió" @click="manejarAccion('no_asistio', cita.id)">✗</button>
              </div>
            </div>
          </div>
        </div>
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

.header-section {
  margin-bottom: 2rem;
}
.header-section h1 {
  font-family: var(--font-display);
  color: var(--color-primary);
  margin: 0 0 4px 0;
}
.especialidad {
  color: var(--color-text-secondary);
  text-transform: capitalize;
  font-size: 1.125rem;
  margin: 0 0 1.5rem 0;
}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
}
.fecha { font-size: 1.25rem; font-weight: bold; }
.capitalize { text-transform: capitalize; }
.counter { color: var(--color-text-secondary); font-weight: 500; }

.agenda-list {
  display: flex;
  flex-direction: column;
  gap: 1px; /* Para bordes compartidos si usamos un contenedor, o gap para tarjetas */
  background: var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.agenda-bloque {
  display: flex;
  background: white;
}

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
}

.bloque-detalle {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.paciente-nombre { margin: 0; font-size: 1.25rem; }
.paciente-rut { margin: 0 0 8px 0; color: var(--color-text-secondary); }

@media (max-width: 767px) {
  .date-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .bloque-hora { width: 80px; font-size: 1.25rem; padding: 1rem; }
}

.empty-msg {
  background: white;
  padding: 3rem;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 1.125rem;
}

.status-row { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: 8px; }
.cell-actions { display: flex; gap: 8px; }
.btn-icon {
  width: 36px; height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid currentColor;
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-weight: bold;
}
.btn-icon:hover { background: var(--color-bg); }
.text-success { color: var(--color-success); }
.text-danger { color: var(--color-danger); }
.text-primary { color: var(--color-primary); }

.btn-text {
  background: transparent;
  border: 1px solid currentColor;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: bold;
}
.btn-text:hover { background: var(--color-primary-light); }
</style>
