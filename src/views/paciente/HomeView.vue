<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'
import AppHeader from '../../components/layout/AppHeader.vue'
import BigButton from '../../components/shared/BigButton.vue'

const auth = useAuthStore()
const router = useRouter()

// Lógica simulada para cita próxima
const citaProxima = null // Acá se podría conectar a un store real

const goEspecialidad = () => {
  router.push('/paciente/especialidad')
}
</script>

<template>
  <div class="page-layout">
    <AppHeader />
    
    <main class="content-container">
      <h1 class="greeting">Hola, {{ auth.usuario?.nombre }}</h1>

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
