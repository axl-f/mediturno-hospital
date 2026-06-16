<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useAgendaStore } from '../../stores/agenda'
import { useRouter } from 'vue-router'
import AppHeader from '../../components/layout/AppHeader.vue'
import BigButton from '../../components/shared/BigButton.vue'
import ChatAssistant from '../../components/paciente/ChatAssistant.vue'
import OfertaModal from '../../components/paciente/OfertaModal.vue'

const auth = useAuthStore()
const agenda = useAgendaStore()
const router = useRouter()

let expirationTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  agenda.cargarEspecialidades()
  agenda.suscribirListaEspera()
  // Suscribir a ofertas de reasignación para este paciente
  if (auth.usuario?.rut) {
    agenda.suscribirOfertas(auth.usuario.rut)
  }
  // Verificar expiraciones cada 30 segundos
  expirationTimer = setInterval(() => {
    agenda.verificarExpiraciones()
  }, 30000)
})

onUnmounted(() => {
  if (expirationTimer) clearInterval(expirationTimer)
})

// ── Oferta de reasignación activa ──────────────────────────────────────
const ofertaPendiente = computed(() => {
  const ahora = Date.now()
  return agenda.ofertasActivas.find(o =>
    o.estado === 'pendiente' && o.expiraEn > ahora
  ) || null
})

const handleAceptarOferta = async (ofertaId: string) => {
  await agenda.aceptarOferta(ofertaId)
}

const handleRechazarOferta = async (ofertaId: string) => {
  await agenda.rechazarOferta(ofertaId)
}

// ── Notificaciones de lista de espera (legacy, mantenidas) ────────────
const notificaciones = computed(() => {
  if (!auth.usuario?.rut) return []
  const result: any[] = []
  for (const espId in agenda.listaEspera) {
    const queue = agenda.listaEspera[espId]
    for (const p of queue) {
      if (p.rut === auth.usuario.rut && p.notificado) {
        const esp = agenda.especialidades.find(e => e.id === espId)
        result.push({
          especialidadId: espId,
          especialidadNombre: esp ? esp.nombre : espId,
          fechaEsperada: p.fechaEsperada || ''
        })
      }
    }
  }
  return result
})

const agendarDesdeNotificacion = (notif: any) => {
  if (notif.fechaEsperada) {
    router.push(`/paciente/horarios/${notif.especialidadId}/${notif.fechaEsperada}`)
  } else {
    router.push('/paciente/especialidad')
  }
}
</script>

<template>
  <div class="page-layout">
    <AppHeader />

    <main class="content-container">
      <h1 class="greeting">Hola, {{ auth.usuario?.nombre }}</h1>

      <!-- Modal de oferta de reasignación (máxima prioridad) -->
      <OfertaModal
        v-if="ofertaPendiente"
        :oferta="ofertaPendiente"
        @aceptar="handleAceptarOferta"
        @rechazar="handleRechazarOferta"
      />

      <!-- Notificaciones legacy de lista de espera -->
      <div v-if="notificaciones.length > 0" class="notificaciones-container">
        <div
          v-for="(notif, i) in notificaciones"
          :key="i"
          class="notificacion-card"
          @click="agendarDesdeNotificacion(notif)"
        >
          <div class="notif-icon">🔔</div>
          <div class="notif-content">
            <h3>¡Cupo liberado para usted!</h3>
            <p>Se ha liberado un cupo en <strong>{{ notif.especialidadNombre }}</strong> para la fecha <strong>{{ notif.fechaEsperada || 'solicitada' }}</strong>. Presione aquí para agendar su hora.</p>
          </div>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="action-area">
        <!-- Asistente Virtual (reemplaza "Pedir hora automáticamente") -->
        <ChatAssistant />

        <div class="divider-row"><span>o elija usted mismo</span></div>

        <BigButton
          label="Escoger hora manualmente"
          variant="secondary"
          size="md"
          icon="📅"
          @click="router.push('/paciente/especialidad')"
        />

        <BigButton
          label="Mis citas"
          variant="ghost"
          size="md"
          @click="router.push('/paciente/mis-citas')"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.page-layout {
  min-height: 100vh;
  background: var(--color-bg);
}

.content-container {
  max-width: 560px;
  margin: 0 auto;
  padding: 2rem 1.5rem 6rem;
}

.greeting {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 2rem;
  text-align: center;
}

/* Notificaciones */
.notificaciones-container {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notificacion-card {
  background: var(--color-success-light);
  border: 2px solid var(--color-success);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}
.notificacion-card:hover { transform: translateY(-2px); }
.notif-icon { font-size: 1.75rem; }
.notif-content h3 { color: var(--color-success); margin: 0 0 4px 0; font-size: 1.1rem; }
.notif-content p { margin: 0; font-size: 0.95rem; line-height: 1.4; }

/* Área de acciones */
.action-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.divider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
.divider-row::before, .divider-row::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
</style>
