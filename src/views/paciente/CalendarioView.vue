<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAgendaStore } from '../../stores/agenda'
import AppHeader from '../../components/layout/AppHeader.vue'
import CalendarGrid from '../../components/paciente/CalendarGrid.vue'

const router = useRouter()
const route = useRoute()
const agenda = useAgendaStore()

const especialidadId = route.params.especialidad as string
const especialidad = computed(() => agenda.especialidades.find(e => e.id === especialidadId))

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth() + 1)

onMounted(() => {
  agenda.cargarFechasDisponibles(especialidadId)
})

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const selectDate = (dateStr: string) => {
  router.push(`/paciente/horarios/${especialidadId}/${dateStr}`)
}

const monthName = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value - 1)
  return d.toLocaleString('es-CL', { month: 'long', year: 'numeric' })
})
</script>

<template>
  <div class="page-layout">
    <AppHeader :pasoActual="2" />
    
    <main class="content-container">
      <div class="header-actions">
        <button class="back-btn" @click="router.back()">← Volver</button>
      </div>

      <h2 class="guia-text">Seleccione una fecha</h2>
      <p v-if="especialidad" class="sub-guia">Para {{ especialidad.nombre }}</p>

      <div class="calendar-container">
        <div class="month-controls">
          <button @click="prevMonth" class="ctrl-btn">&lt;</button>
          <span class="month-name">{{ monthName }}</span>
          <button @click="nextMonth" class="ctrl-btn">&gt;</button>
        </div>

        <CalendarGrid 
          :year="currentYear" 
          :month="currentMonth"
          :diasDisponibles="agenda.fechasDisponibles"
          @select="selectDate"
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
  padding: 1rem 1.5rem 2rem;
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

.calendar-container {
  background: var(--color-surface);
  padding: 1.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  max-width: 480px;
  margin: 0 auto;
}

.month-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.month-name {
  font-weight: bold;
  font-size: 1.25rem;
  text-transform: capitalize;
}

.ctrl-btn {
  background: var(--color-bg);
  border: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  font-size: 1.25rem;
  cursor: pointer;
}
</style>
