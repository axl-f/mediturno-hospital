<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAgendaStore } from '../../stores/agenda'
import { useRecordatorios } from '../../composables/useRecordatorios'
import { useWhatsApp } from '../../composables/useWhatsApp'
import AppHeader from '../../components/layout/AppHeader.vue'
import BigButton from '../../components/shared/BigButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const agenda = useAgendaStore()
const { programarRecordatorios } = useRecordatorios()
const { abrirRecordatorioCita } = useWhatsApp()

const especialidadId = route.query.especialidad as string
const fecha = route.query.fecha as string
const hora = route.query.hora as string

const especialidad = computed(() => agenda.especialidades.find(e => e.id === especialidadId))

const fechaFormateada = computed(() => {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

const confirmado = ref(false)
const numAtencion = ref('')

onMounted(() => {
  if (especialidad.value && !confirmado.value) {
    const texto = `Su cita es el ${fechaFormateada.value} a las ${hora} horas en ${especialidad.value.nombre}. Confirme para continuar.`
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'es-CL'
    window.speechSynthesis.speak(utterance)
  }
})

const confirmar = async () => {
  if (!auth.usuario || !auth.usuario.rut) return

  const citaData = {
    pacienteRut: auth.usuario.rut,
    pacienteNombre: auth.usuario.nombre,
    especialidad: especialidadId,
    fecha,
    hora
  }

  const citaId = await agenda.crearCita(citaData)
  if (citaId) {
    programarRecordatorios({ id: citaId, ...citaData })
    numAtencion.value = citaId.slice(-6).toUpperCase()
    confirmado.value = true
  }
}

const enviarRecordatorioWA = () => {
  abrirRecordatorioCita({
    especialidad: especialidad.value?.nombre || especialidadId,
    fecha,
    hora,
    pacienteNombre: auth.usuario?.nombre || 'Paciente',
  })
}
</script>

<template>
  <div class="page-layout">
    <AppHeader :pasoActual="confirmado ? 5 : 4" />
    
    <main class="content-container">
      <template v-if="!confirmado">
        <h2 class="guia-text">Revise y confirme</h2>

        <div class="resumen-card">
          <div class="resumen-header">
            <span class="emoji">{{ especialidad?.icono }}</span>
            <span class="especialidad">{{ especialidad?.nombre }}</span>
          </div>
          <div class="resumen-body">
            <p class="fecha capitalize">{{ fechaFormateada }}</p>
            <p class="hora">{{ hora }} hrs</p>
            <p class="hospital">Hospital Público — MediTurno</p>
          </div>
        </div>

        <div class="actions">
          <BigButton 
            label="Confirmar cita" 
            variant="success" 
            size="lg" 
            @click="confirmar"
            :loading="agenda.cargando"
          />
          <BigButton 
            label="Cambiar" 
            variant="secondary" 
            size="md" 
            @click="router.back()"
          />
        </div>
      </template>

      <template v-else>
        <div class="exito-container">
          <div class="check-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 class="guia-text text-success">¡Cita confirmada!</h2>
          <p class="numero-atencion">Nº Atención: <strong>{{ numAtencion }}</strong></p>
          <p class="mensaje">Guarde su cita como recordatorio en WhatsApp o vuelva al inicio.</p>

          <button class="wa-btn" @click="enviarRecordatorioWA">
            <svg class="wa-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.525 5.845L.057 23.535a.5.5 0 0 0 .609.609l5.702-1.463A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.805 9.805 0 0 1-5.001-1.368l-.36-.213-3.733.957.983-3.617-.235-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
            Guardar recordatorio en WhatsApp
          </button>

          <BigButton
            label="Volver al inicio"
            variant="primary"
            size="lg"
            @click="router.push('/paciente')"
            class="mt-4"
          />
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.page-layout {
  min-height: 100vh;
  background: var(--color-bg);
}

.content-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.guia-text {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
}
.text-success { color: var(--color-success); }

.resumen-card {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.resumen-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1.5rem;
}
.emoji { font-size: 3rem; }
.especialidad { font-size: 1.25rem; font-weight: bold; }

.resumen-body .fecha {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}
.resumen-body .hora {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 12px;
}
.resumen-body .hospital {
  font-size: var(--text-label);
  color: var(--color-text-secondary);
}
.capitalize { text-transform: capitalize; }

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exito-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 0;
}

.check-circle {
  width: 80px; height: 80px;
  background: var(--color-success);
  color: white;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 1.5rem;
  animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.check-circle svg { width: 40px; height: 40px; }

@keyframes scaleIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.numero-atencion {
  font-size: 1.25rem;
  background: var(--color-success-light);
  color: var(--color-success);
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
}
.mensaje {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}
.mt-4 { margin-top: 1rem; }

/* Boton WhatsApp */
.wa-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  background: #25D366;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  max-width: 360px;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(37, 211, 102, 0.35);
}
.wa-btn:hover {
  background: #1ebe5d;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 211, 102, 0.45);
}
.wa-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}
</style>
