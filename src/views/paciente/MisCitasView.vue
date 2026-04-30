<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAgendaStore } from '../../stores/agenda'
import { useAuthStore } from '../../stores/auth'
import AppHeader from '../../components/layout/AppHeader.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import BigButton from '../../components/shared/BigButton.vue'
import { get, ref as dbRef } from 'firebase/database'
import { db } from '../../firebase'

const router = useRouter()
const agenda = useAgendaStore()
const auth = useAuthStore()

const citas = ref<any[]>([])
const cargando = ref(true)

onMounted(async () => {
  if (!auth.usuario?.rut) return
  try {
    const snap = await get(dbRef(db, 'citas'))
    if (snap.exists()) {
      const data = snap.val()
      citas.value = Object.keys(data)
        .map(k => data[k])
        .filter(c => c.pacienteRut === auth.usuario?.rut)
        .sort((a, b) => new Date(`${a.fecha}T${a.hora}`).getTime() - new Date(`${b.fecha}T${b.hora}`).getTime())
    }
  } finally {
    cargando.value = false
  }
})

const getEspNombre = (id: string) => {
  const esp = agenda.especialidades.find(e => e.id === id)
  return esp ? esp.nombre : id
}

const formatDate = (fecha: string) => {
  const [y, m, d] = fecha.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
}

const showModal = ref(false)
const citaACancelar = ref<any>(null)

const iniciarCancelacion = (cita: any) => {
  citaACancelar.value = cita
  showModal.value = true
}

const confirmarCancelacion = async () => {
  if (citaACancelar.value) {
    await agenda.cancelarCita(citaACancelar.value.id, citaACancelar.value)
    citaACancelar.value.estado = 'cancelada'
    showModal.value = false
  }
}
</script>

<template>
  <div class="page-layout">
    <AppHeader />
    
    <main class="content-container">
      <div class="header-actions">
        <button class="back-btn" @click="router.push('/paciente')">← Volver</button>
      </div>

      <h2 class="guia-text">Mis citas agendadas</h2>

      <div v-if="cargando" class="loading-state">Cargando...</div>

      <div v-else-if="citas.length === 0" class="empty-state">
        <div class="empty-icon">📅</div>
        <p>No tiene citas agendadas.</p>
        <BigButton 
          label="Agendar ahora" 
          variant="primary" 
          @click="router.push('/paciente/especialidad')"
          class="mt-4"
        />
      </div>

      <div v-else class="citas-list">
        <div v-for="cita in citas" :key="cita.id" class="cita-card">
          <div class="cita-info">
            <h3 class="especialidad">{{ getEspNombre(cita.especialidad) }}</h3>
            <p class="fecha capitalize">{{ formatDate(cita.fecha) }}</p>
            <p class="hora">{{ cita.hora }} hrs</p>
          </div>
          
          <div class="cita-status">
            <StatusBadge :estado="cita.estado" />
            <button 
              v-if="cita.estado === 'confirmada' || cita.estado === 'pendiente'"
              class="cancel-btn"
              @click="iniciarCancelacion(cita)"
            >Cancelar</button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de confirmación custom -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <h3>¿Seguro que desea cancelar?</h3>
        <p>Esta acción no se puede deshacer.</p>
        <div class="modal-actions">
          <BigButton label="Sí, cancelar cita" variant="danger" @click="confirmarCancelacion" />
          <BigButton label="No, mantener" variant="secondary" @click="showModal = false" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-layout {
  min-height: 100vh;
  background: var(--color-bg);
}

.content-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem 1.5rem 2rem;
}

.header-actions { margin-bottom: 1.5rem; }
.back-btn { background: none; border: none; font-size: 1.125rem; font-weight: 500; color: var(--color-primary); cursor: pointer; padding: 8px 0; }
.guia-text { font-size: 1.5rem; margin-bottom: 2rem; }

.citas-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cita-card {
  background: white;
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.cita-info .especialidad { font-size: 1.25rem; margin-bottom: 4px; }
.cita-info .fecha { color: var(--color-text-secondary); margin-bottom: 4px; }
.cita-info .hora { font-size: 1.5rem; font-weight: bold; color: var(--color-primary); }
.capitalize { text-transform: capitalize; }

.cita-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.cancel-btn {
  background: none; border: none;
  color: var(--color-danger);
  font-weight: 500; cursor: pointer;
  text-decoration: underline;
}

.empty-state, .loading-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--color-text-secondary);
}
.empty-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
.mt-4 { margin-top: 1.5rem; }

.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
}
.modal-card {
  background: white; border-radius: var(--radius); padding: 2rem;
  width: 100%; max-width: 400px; text-align: center;
}
.modal-card h3 { margin-bottom: 8px; }
.modal-card p { color: var(--color-text-secondary); margin-bottom: 1.5rem; }
.modal-actions { display: flex; flex-direction: column; gap: 8px; }
</style>
