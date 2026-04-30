<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAgendaStore } from '../../stores/agenda'
import { useAuthStore } from '../../stores/auth'
import { update, ref as dbRef } from 'firebase/database'
import { db } from '../../firebase'
import AppNav from '../../components/layout/AppNav.vue'
import BigButton from '../../components/shared/BigButton.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'

const agenda = useAgendaStore()
const auth = useAuthStore()
const fechaHoy = '2026-05-05'

onMounted(() => {
  agenda.suscribirCitasDelDia(fechaHoy)
})

const citasMedico = computed(() => {
  return agenda.citasDelDia.filter(c => c.especialidad === auth.usuario?.especialidad)
})

const registradas = computed(() => citasMedico.value.filter(c => c.estado === 'asistio' || c.estado === 'no_asistio').length)
const total = computed(() => citasMedico.value.length)

const marcarAsistencia = async (citaId: string, asistio: boolean) => {
  const estado = asistio ? 'asistio' : 'no_asistio'
  await update(dbRef(db, `citas/${citaId}`), { estado })
}
</script>

<template>
  <div class="medico-layout">
    <AppNav>
      <router-link to="/medico" class="nav-link">📅 Agenda de Hoy</router-link>
      <router-link to="/medico/checklist" class="nav-link">✅ Checklist</router-link>
      <router-link to="/medico/configuracion" class="nav-link">⚙️ Disponibilidad</router-link>
    </AppNav>
    
    <main class="medico-content">
      <div class="content-header">
        <h1>Control de Asistencia</h1>
        <p class="subtitle">Progreso: {{ registradas }} de {{ total }} citas registradas</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: total ? (registradas/total)*100 + '%' : '0%' }"></div>
        </div>
      </div>

      <div class="checklist-container">
        <p v-if="citasMedico.length === 0" class="empty-msg">No hay citas para registrar hoy.</p>
        
        <div v-for="cita in citasMedico" :key="cita.id" class="check-item" :class="{ completado: cita.estado === 'asistio' || cita.estado === 'no_asistio' }">
          <div class="item-info">
            <span class="hora">{{ cita.hora }}</span>
            <div class="paciente">
              <strong>{{ cita.pacienteNombre }}</strong>
              <span>{{ cita.pacienteRut }}</span>
            </div>
          </div>
          
          <div class="item-actions">
            <template v-if="cita.estado === 'confirmada' || cita.estado === 'pendiente'">
              <span class="pregunta">¿Asistió?</span>
              <div class="action-buttons">
                <BigButton label="Sí" variant="success" size="md" @click="marcarAsistencia(cita.id, true)" />
                <BigButton label="No" variant="danger" size="md" @click="marcarAsistencia(cita.id, false)" />
              </div>
            </template>
            <template v-else>
              <StatusBadge :estado="cita.estado" />
              <button class="deshacer-btn" @click="update(dbRef(db, `citas/${cita.id}`), { estado: 'confirmada' })">Deshacer</button>
            </template>
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

.content-header { margin-bottom: 2rem; }
.content-header h1 { font-family: var(--font-display); color: var(--color-primary); margin: 0 0 8px 0; }
.subtitle { color: var(--color-text-secondary); margin: 0 0 12px 0; font-weight: 500; }

.progress-bar {
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--color-success);
  transition: width 0.3s ease;
}

.checklist-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.check-item {
  background: white;
  border-radius: var(--radius-sm);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.2s;
}
.check-item.completado {
  background: var(--color-bg);
  opacity: 0.8;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.hora {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-primary);
}
.paciente {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.paciente strong { font-size: 1.125rem; }
.paciente span { color: var(--color-text-secondary); font-size: var(--text-caption); }

.item-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pregunta { font-weight: 500; }
.action-buttons { display: flex; gap: 8px; width: 160px; }

.deshacer-btn {
  background: none; border: none;
  color: var(--color-text-secondary);
  text-decoration: underline;
  cursor: pointer;
}

@media (max-width: 767px) {
  .check-item { flex-direction: column; align-items: flex-start; }
  .item-actions { width: 100%; justify-content: space-between; border-top: 1px solid var(--color-border); padding-top: 1rem; }
  .action-buttons { width: auto; flex: 1; margin-left: 1rem; }
}

.empty-msg { text-align: center; color: var(--color-text-secondary); padding: 2rem; }
</style>
