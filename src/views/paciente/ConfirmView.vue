<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAgendaStore } from '../../stores/agenda'
import { useRecordatorios } from '../../composables/useRecordatorios'
import AppHeader from '../../components/layout/AppHeader.vue'
import BigButton from '../../components/shared/BigButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const agenda = useAgendaStore()
const { programarRecordatorios } = useRecordatorios()

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
          <p class="mensaje">Recibirá un recordatorio antes de su cita.</p>

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
  margin-bottom: 2rem;
}
.mt-4 { margin-top: 2rem; }
</style>
