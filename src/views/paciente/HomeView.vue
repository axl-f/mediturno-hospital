<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useAgendaStore } from '../../stores/agenda'
import { useRouter } from 'vue-router'
import AppHeader from '../../components/layout/AppHeader.vue'
import BigButton from '../../components/shared/BigButton.vue'

const auth = useAuthStore()
const agenda = useAgendaStore()
const router = useRouter()

onMounted(() => {
  agenda.suscribirListaEspera()
})

const notificaciones = computed(() => {
  if (!auth.usuario?.rut) return []
  const result: any[] = []
  for (const espId in agenda.listaEspera) {
    const queue = agenda.listaEspera[espId]
    for (const p of queue) {
      if (p.rut === auth.usuario.rut && p.notificado) {
        // Encontrar el nombre de la especialidad
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

// Lógica simulada para cita próxima
const citaProxima = null // Acá se podría conectar a un store real

const goEspecialidad = () => {
  router.push('/paciente/especialidad')
}

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

      <div v-if="notificaciones.length > 0" class="notificaciones-container">
        <div v-for="(notif, i) in notificaciones" :key="i" class="notificacion-card" @click="agendarDesdeNotificacion(notif)">
          <div class="notif-icon">🔔</div>
          <div class="notif-content">
            <h3>¡Buenas noticias! Cupo liberado</h3>
            <p>Se ha liberado un cupo en <strong>{{ notif.especialidadNombre }}</strong> para la fecha <strong>{{ notif.fechaEsperada || 'solicitada' }}</strong>. Haga clic aquí para agendar su hora.</p>
          </div>
        </div>
      </div>

      <div v-if="citaProxima" class="cita-destacada">
        <!-- Renderizar cita próxima si la hay -->
      </div>

      <div class="action-area">
        <BigButton 
          label="Agendar nueva hora" 
          variant="success" 
          size="lg" 
          icon="📅"
          @click="goEspecialidad" 
          class="main-btn"
        />
        
        <BigButton 
          label="Mis citas" 
          variant="secondary" 
          size="md" 
          @click="router.push('/paciente/mis-citas')" 
          class="secondary-btn"
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
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.greeting {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 2rem;
  text-align: center;
}

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
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  cursor: pointer;
  box-shadow: var(--shadow);
  transition: transform 0.2s, box-shadow 0.2s;
}

.notificacion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.notif-icon {
  font-size: 2rem;
}

.notif-content h3 {
  color: var(--color-success);
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.notif-content p {
  margin: 0;
  color: var(--color-text);
  line-height: 1.4;
}

.action-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

.main-btn {
  height: 72px;
}

.secondary-btn {
  height: 56px;
}
</style>
