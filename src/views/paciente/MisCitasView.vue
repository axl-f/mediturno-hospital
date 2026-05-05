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
import { useWhatsApp } from '../../composables/useWhatsApp'

const router = useRouter()
const agenda = useAgendaStore()
const auth = useAuthStore()
const { abrirRecordatorioCita } = useWhatsApp()

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

const recordatorioWA = (cita: any) => {
  const espNombre = getEspNombre(cita.especialidad)
  abrirRecordatorioCita({
    especialidad: espNombre,
    fecha: cita.fecha,
    hora: cita.hora,
    pacienteNombre: auth.usuario?.nombre || 'Paciente',
  })
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
              class="wa-mini-btn"
              @click="recordatorioWA(cita)"
              title="Enviar recordatorio por WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.525 5.845L.057 23.535a.5.5 0 0 0 .609.609l5.702-1.463A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.805 9.805 0 0 1-5.001-1.368l-.36-.213-3.733.957.983-3.617-.235-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
              </svg>
              Recordatorio WA
            </button>
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

.wa-mini-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #25D366;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}
.wa-mini-btn:hover { background: #1ebe5d; }

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
