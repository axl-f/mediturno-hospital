<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAgendaStore } from '../../stores/agenda'
import AppNav from '../../components/layout/AppNav.vue'
import BigButton from '../../components/shared/BigButton.vue'

const router = useRouter()
const agenda = useAgendaStore()

onMounted(() => {
  agenda.cargarEspecialidades()
  agenda.suscribirListaEspera()
  agenda.suscribirCitasDelDia('2026-05-05') // O la fecha actual
})

// Alertas computadas
const alertas = computed(() => {
  const result: any[] = []
  let idCounter = 1

  agenda.especialidades.forEach(esp => {
    const citasEsp = agenda.citasDelDia.filter(c => c.especialidad === esp.id)
    const canceladas = citasEsp.filter(c => c.estado === 'cancelada').length
    const noAsistio = citasEsp.filter(c => c.estado === 'no_asistio').length
    const lista = agenda.listaEspera[esp.id] || []
    
    // Alerta de cancelaciones
    if (canceladas > 0) {
      const porcentaje = Math.round((canceladas / citasEsp.length) * 100)
      if (porcentaje >= 20 || canceladas >= 2) {
        result.push({
          id: idCounter++,
          tipo: 'cancelacion',
          especialidad: esp.nombre,
          especialidadId: esp.id,
          mensaje: `Se detectó un ${porcentaje}% (${canceladas}) de citas canceladas para el día de hoy en ${esp.nombre}.`,
          accion: lista.length > 0 ? 'Ver lista de espera' : '',
          ruta: ''
        })
      }
    }

    // Alerta de inasistencia
    if (noAsistio > 0) {
      result.push({
        id: idCounter++,
        tipo: 'inasistencia',
        especialidad: esp.nombre,
        especialidadId: esp.id,
        mensaje: `Hay ${noAsistio} paciente(s) que no asistió(eron) a su hora de ${esp.nombre}.`,
        accion: '',
        ruta: ''
      })
    }

    // Alerta de lista de espera alta
    if (lista.length > 3) {
      result.push({
        id: idCounter++,
        tipo: 'espera',
        especialidad: esp.nombre,
        especialidadId: esp.id,
        mensaje: `La lista de espera para ${esp.nombre} tiene ${lista.length} pacientes. Considere abrir más cupos.`,
        accion: 'Ver lista de espera',
        ruta: '/admin/espera'
      })
    }
  })

  return result
})

const irALista = (_ruta: string) => {
  if (_ruta) router.push(_ruta)
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
      <div class="content-header">
        <h1>Alertas del Sistema</h1>
        <p class="subtitle">Anomalías y notificaciones automáticas</p>
      </div>

      <div class="alertas-list">
        <p v-if="alertas.length === 0" class="empty-msg">No hay alertas activas.</p>
        
        <div v-for="alerta in alertas" :key="alerta.id" class="alerta-card" :class="alerta.tipo">
          <div class="alerta-icon">
            <template v-if="alerta.tipo === 'cancelacion'">⚠️</template>
            <template v-else-if="alerta.tipo === 'inasistencia'">❌</template>
            <template v-else>⏳</template>
          </div>
          <div class="alerta-info">
            <h3>Alerta en {{ alerta.especialidad }}</h3>
            <p>{{ alerta.mensaje }}</p>
          </div>
          <div class="alerta-actions" v-if="alerta.accion">
            <BigButton 
              :label="alerta.accion" 
              variant="secondary" 
              @click="irALista(alerta.ruta)"
            />
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

.alertas-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alerta-card {
  background: var(--color-warning-light);
  border-left: 4px solid var(--color-warning);
  border-radius: var(--radius-sm);
  padding: 1.5rem;
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

@media (max-width: 767px) {
  .alerta-card {
    flex-direction: column;
    gap: 1rem;
  }
}

.alerta-icon {
  font-size: 2rem;
}

.alerta-info {
  flex: 1;
}

.alerta-info h3 {
  margin: 0 0 8px 0;
  color: #a65800;
}

.alerta-info p {
  margin: 0 0 4px 0;
}

.espera-info {
  font-size: var(--text-label);
  color: var(--color-text-secondary);
}

.alerta-actions {
  min-width: 200px;
}

.empty-msg {
  color: var(--color-text-secondary);
}
</style>
