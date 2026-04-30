<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'

defineProps<{
  pasoActual?: number
}>()

const auth = useAuthStore()
const router = useRouter()

const logout = () => {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v8M8 12h8"></path>
      </svg>
      <span class="logo-text">MediTurno</span>
    </div>

    <!-- Barra de pasos (solo visible en flujo de agendamiento) -->
    <div v-if="pasoActual" class="header-center step-bar">
      <div class="step-mobile">Paso {{ pasoActual }} de 4</div>
      <div class="step-desktop">
        <template v-for="step in 4" :key="step">
          <div 
            class="step-circle" 
            :class="{ active: pasoActual === step, completed: pasoActual > step }"
          >
            <span v-if="pasoActual > step">✓</span>
            <span v-else>{{ step }}</span>
          </div>
          <div v-if="step < 4" class="step-line" :class="{ completed: pasoActual > step }"></div>
        </template>
      </div>
    </div>

    <div class="header-right">
      <span class="user-name">Hola, {{ auth.usuario?.nombre.split(' ')[0] }}</span>
      <button class="logout-btn" @click="logout" aria-label="Cerrar sesión">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  box-shadow: var(--shadow);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
}

.logo-icon {
  width: 24px;
  height: 24px;
}

.logo-text {
  font-family: var(--font-display);
  font-size: 1.25rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-weight: 500;
  display: none;
}

@media (min-width: 768px) {
  .user-name {
    display: inline;
  }
}

.logout-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logout-btn:hover {
  background: var(--color-bg);
  color: var(--color-danger);
}

/* Steps */
.step-mobile {
  font-size: var(--text-label);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.step-desktop {
  display: none;
  align-items: center;
  gap: 8px;
}

@media (min-width: 768px) {
  .step-mobile { display: none; }
  .step-desktop { display: flex; }
}

.step-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-border);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}
.step-circle.active {
  background: var(--color-primary);
}
.step-circle.completed {
  background: var(--color-success);
}

.step-line {
  width: 32px;
  height: 2px;
  background: var(--color-border);
}
.step-line.completed {
  background: var(--color-success);
}
</style>
