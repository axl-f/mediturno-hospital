<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAgendaStore } from '../../stores/agenda'
import { useAuthStore } from '../../stores/auth'
import AppNav from '../../components/layout/AppNav.vue'
import BigButton from '../../components/shared/BigButton.vue'

const agenda = useAgendaStore()
const auth = useAuthStore()

const especialidadActual = computed(() => auth.usuario?.especialidad || '')

const pacientes = computed(() => {
  return agenda.listaEspera[especialidadActual.value] || []
})

onMounted(() => {
  agenda.suscribirListaEspera()
})

const notificar = async (paciente: any) => {
  if (!paciente.id) return
  await agenda.notificarPaciente(especialidadActual.value, paciente.id)
  alert(`Se ha enviado una notificación a ${paciente.nombre} para la fecha ${paciente.fechaEsperada || 'solicitada'}`)
}
</script>

<template>
  <div class="admin-layout">
    <AppNav>
      <router-link to="/medico" class="nav-link">📅 Agenda</router-link>
      <router-link to="/medico/espera" class="nav-link">⏳ Lista de Espera</router-link>
      <router-link to="/medico/configuracion" class="nav-link">⚙️ Disponibilidad</router-link>
    </AppNav>
    
    <main class="admin-content">
      <div class="content-header">
        <h1>Lista de Espera</h1>
        <p class="subtitle">Gestión de cupos liberados</p>
      </div>

      <div class="filter-section">
        <h3 class="esp-title">Especialidad: <span class="capitalize">{{ especialidadActual.replace('_', ' ') }}</span></h3>
      </div>

      <div class="table-container">
        <div class="table-desktop-header">
          <div>Posición</div><div>Paciente</div><div>Fecha Solicitada</div><div>Acción</div>
        </div>

        <div class="table-body">
          <p v-if="pacientes.length === 0" class="empty-msg">Sin pacientes en espera para esta especialidad</p>
          <div v-for="(p, index) in pacientes" :key="p.rut" class="espera-row">
            <div class="cell-pos">#{{ index + 1 }}</div>
            <div class="cell-paciente">
              <div class="nombre">{{ p.nombre }}</div>
              <div class="rut">{{ p.rut }}</div>
            </div>
            <div class="cell-time">{{ p.fechaEsperada || 'Cualquiera' }}</div>
            <div class="cell-actions">
              <span v-if="p.notificado" class="badge-notificado">Notificado ✓</span>
              <BigButton 
                v-else
                label="Notificar" 
                variant="primary"
                size="md"
                @click="notificar(p)"
              />
            </div>
          </div>
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

.content-header { margin-bottom: 2rem; }
.content-header h1 { font-family: var(--font-display); color: var(--color-primary); margin: 0; }
.subtitle { color: var(--color-text-secondary); font-size: 1.125rem; }

.filter-section {
  margin-bottom: 1.5rem;
}

.esp-title { font-size: 1.25rem; margin: 0; color: var(--color-text-secondary); }
.capitalize { text-transform: capitalize; color: var(--color-primary); }

.table-container {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.table-desktop-header {
  display: grid;
  grid-template-columns: 80px 1fr 150px 160px;
  padding: 1rem;
  background: var(--color-bg);
  font-weight: bold;
  font-size: var(--text-label);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  gap: 1rem;
}

.espera-row {
  display: grid;
  grid-template-columns: 80px 1fr 150px 160px;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  gap: 1rem;
}

.cell-pos { font-size: 1.5rem; font-weight: bold; color: var(--color-border); }
.cell-paciente .nombre { font-weight: 500; }
.cell-paciente .rut { font-size: var(--text-caption); color: var(--color-text-secondary); }
.cell-time { color: var(--color-text-secondary); font-weight: bold; }

.badge-notificado { background: var(--color-success); color: white; padding: 6px 12px; border-radius: 99px; font-weight: bold; font-size: 0.875rem; display: inline-block; }

@media (max-width: 767px) {
  .table-desktop-header { display: none; }
  .espera-row {
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
  .cell-actions { width: 100%; margin-top: 8px; }
  .table-container { background: transparent; box-shadow: none; }
}

.empty-msg {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}
</style>
