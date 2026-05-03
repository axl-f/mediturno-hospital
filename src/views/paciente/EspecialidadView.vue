<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAgendaStore } from '../../stores/agenda'
import AppHeader from '../../components/layout/AppHeader.vue'
import EspecialidadCard from '../../components/paciente/EspecialidadCard.vue'

const router = useRouter()
const agenda = useAgendaStore()

onMounted(() => {
  agenda.cargarEspecialidades()
})

const goCalendario = (id: string) => {
  router.push(`/paciente/calendario/${id}`)
}
</script>

<template>
  <div class="page-layout">
    <AppHeader :pasoActual="1" />
    
    <main class="content-container">
      <div class="header-actions">
        <button class="back-btn" @click="router.push('/paciente')">← Volver</button>
      </div>

      <h2 class="guia-text">¿Qué tipo de atención necesita?</h2>

      <div class="especialidades-grid">
        <EspecialidadCard
          v-for="esp in agenda.especialidades"
          :key="esp.id"
          :id="esp.id"
          :nombre="esp.nombre"
          :icono="esp.icono"
          @select="goCalendario"
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
  margin-bottom: 2rem;
  text-align: center;
}

.especialidades-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

@media (min-width: 768px) {
  .especialidades-grid {
    gap: 1.5rem;
  }
}
</style>
