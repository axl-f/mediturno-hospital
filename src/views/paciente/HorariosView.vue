<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAgendaStore } from '../../stores/agenda'
import { useAuthStore } from '../../stores/auth'
import AppHeader from '../../components/layout/AppHeader.vue'
import HorarioBloque from '../../components/paciente/HorarioBloque.vue'
import BigButton from '../../components/shared/BigButton.vue'
import LoadingSpinner from '../../components/shared/LoadingSpinner.vue'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const route = useRoute()
const agenda = useAgendaStore()
const auth = useAuthStore()
const toast = useToast()

const especialidadId = route.params.especialidad as string
const fecha = route.params.fecha as string
const especialidad = computed(() => agenda.especialidades.find(e => e.id === especialidadId))

const fechaFormateada = computed(() => {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
})

onMounted(async () => {
  if (agenda.especialidades.length === 0) {
    await agenda.cargarEspecialidades()
  }
  await agenda.cargarDisponibilidad(especialidadId, fecha)
})

const horasDisponibles = computed(() => {
  if (agenda.disponibilidad[especialidadId] && agenda.disponibilidad[especialidadId][fecha]) {
    return agenda.disponibilidad[especialidadId][fecha].sort()
  }
  return []
})

const seleccion = ref<string | null>(null)

const selectHora = (hora: string) => {
  seleccion.value = hora
}

const continuar = () => {
  if (seleccion.value) {
    // Pasar a confirmación (pasamos params por query o store)
    router.push({
      path: '/paciente/confirmar',
      query: { especialidad: especialidadId, fecha, hora: seleccion.value }
    })
  }
}

const anotando = ref(false)
const unirseListaEspera = async () => {
  if (!auth.usuario || !auth.usuario.rut) return
  anotando.value = true
  try {
    await agenda.unirseListaEspera(especialidadId, auth.usuario.rut, auth.usuario.nombre, fecha)
    toast.success('Se ha anotado exitosamente en la lista de espera para esta fecha.')
    setTimeout(() => router.push('/paciente'), 1500)
  } catch(e) {
    toast.error('Hubo un error al anotarse en la lista de espera. Inténtelo de nuevo.')
  } finally {
    anotando.value = false
  }
}
</script>

<template>
  <div class="page-layout">
    <AppHeader :pasoActual="3" />
    
    <main class="content-container">
      <div class="header-actions">
        <button class="back-btn" @click="router.back()">← Volver</button>
      </div>

      <h2 class="guia-text">Seleccione su hora</h2>
      <p class="sub-guia" v-if="especialidad">
        {{ especialidad.nombre }} — <span class="capitalize">{{ fechaFormateada }}</span>
      </p>

      <div v-if="agenda.cargando" class="loading-state">
        <LoadingSpinner color="var(--color-primary)" />
        <p>Cargando disponibilidad...</p>
      </div>

      <div v-else-if="horasDisponibles.length > 0" class="horarios-list">
        <HorarioBloque
          v-for="h in horasDisponibles"
          :key="h"
          :hora="h"
          :disponible="true"
          :seleccionado="seleccion === h"
          @select="selectHora"
        />
      </div>

      <div v-else class="empty-state">
        <p>No hay horarios disponibles para esta fecha o la agenda ya se llenó.</p>
        <p class="waitlist-msg">Si lo desea, puede ingresar a la lista de espera y le notificaremos si se libera un cupo.</p>
        <BigButton label="Unirme a la lista de espera" variant="secondary" @click="unirseListaEspera" :disabled="anotando" />
        <p v-if="anotando" class="loading-msg">Anotando...</p>
      </div>

      <div class="bottom-actions" v-if="horasDisponibles.length > 0">
        <BigButton 
          label="Continuar →" 
          variant="primary" 
          size="lg" 
          :disabled="!seleccion"
          @click="continuar"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.page-layout {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: 100px; /* espacio para bottom actions */
}

.content-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
}

.header-actions {
  margin-bottom: 1.5rem;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-primary);
  cursor: pointer;
  padding: 8px 0;
}

.guia-text {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  text-align: center;
}
.sub-guia {
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}
.capitalize {
  text-transform: capitalize;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}
.empty-state p { font-size: 1.125rem; margin: 0; }
.waitlist-msg { color: var(--color-text-secondary); font-size: 1rem !important; max-width: 400px; }
.loading-msg { margin-top: 1rem; color: var(--color-primary); font-weight: bold; }

.horarios-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bottom-actions {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: white;
  padding: 1rem 1.5rem;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
  display: flex;
  justify-content: center;
  z-index: 10;
}
.bottom-actions > * {
  max-width: 600px;
  width: 100%;
}
</style>
