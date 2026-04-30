<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAgendaStore } from '../../stores/agenda'
import AppNav from '../../components/layout/AppNav.vue'
import BigButton from '../../components/shared/BigButton.vue'

const agenda = useAgendaStore()
const especialidadActual = ref('')

const pacientes = computed(() => {
  return agenda.listaEspera[especialidadActual.value] || []
})

onMounted(() => {
  agenda.cargarEspecialidades()
  agenda.suscribirListaEspera()
  if (agenda.especialidades.length > 0) {
    especialidadActual.value = agenda.especialidades[0].id
  }
})

const notificar = async (paciente: any) => {
  // En la vida real, actualizar firebase y quizás llamar API de SMS
  // Aquí removemos o marcamos
  await agenda.removerDeListaEspera(especialidadActual.value, paciente.id)
  alert(`Se ha enviado una notificación a ${paciente.nombre}`)
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
        <h1>Lista de Espera</h1>
        <p class="subtitle">Gestión de cupos liberados</p>
      </div>

      <div class="filter-section">
        <select v-model="especialidadActual" class="esp-select">
          <option v-for="esp in agenda.especialidades" :key="esp.id" :value="esp.id">
            {{ esp.nombre }}
          </option>
        </select>
      </div>

      <div class="table-container">
        <div class="table-desktop-header">
          <div>Posición</div><div>Paciente</div><div>Ingreso</div><div>Acción</div>
        </div>

        <div class="table-body">
          <p v-if="pacientes.length === 0" class="empty-msg">Sin pacientes en espera para esta especialidad</p>
          <div v-for="(p, index) in pacientes" :key="p.rut" class="espera-row">
            <div class="cell-pos">#{{ index + 1 }}</div>
            <div class="cell-paciente">
              <div class="nombre">{{ p.nombre }}</div>
              <div class="rut">{{ p.rut }}</div>
            </div>
            <div class="cell-time">{{ new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</div>
            <div class="cell-actions">
              <BigButton 
                :label="p.notificado ? 'Notificado ✓' : 'Notificar'" 
                :variant="p.notificado ? 'success' : 'primary'"
                size="md"
                :disabled="p.notificado"
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
.esp-select {
  padding: 12px 16px;
  font-size: 1.125rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  min-width: 300px;
}

.table-container {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.table-desktop-header {
  display: grid;
  grid-template-columns: 80px 1fr 120px 160px;
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
  grid-template-columns: 80px 1fr 120px 160px;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  gap: 1rem;
}

.cell-pos { font-size: 1.5rem; font-weight: bold; color: var(--color-border); }
.cell-paciente .nombre { font-weight: 500; }
.cell-paciente .rut { font-size: var(--text-caption); color: var(--color-text-secondary); }
.cell-time { color: var(--color-text-secondary); }

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
