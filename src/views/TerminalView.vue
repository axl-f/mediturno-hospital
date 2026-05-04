<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { onMounted } from 'vue'

const router = useRouter()
const auth = useAuthStore()

onMounted(() => {
  if (auth.usuario) {
    if (auth.usuario.rol === 'paciente') router.push('/paciente')
    else if (auth.usuario.rol === 'admin') router.push('/admin')
    else if (auth.usuario.rol === 'medico') router.push('/medico')
  }
})
</script>

<template>
  <div class="terminal-layout">
    <!-- Fondo decorativo -->
    <div class="bg-pattern"></div>

    <main class="terminal-card">
      <!-- Encabezado institucional -->
      <header class="terminal-header">
        <div class="logo-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 8v8M8 12h8"></path>
          </svg>
        </div>
        <div class="header-text">
          <h1 class="hospital-name">MediTurno</h1>
          <p class="hospital-sub">Sistema de Autoatención Médica</p>
        </div>
      </header>

      <div class="divider"></div>

      <!-- Mensaje de bienvenida -->
      <div class="welcome-block">
        <h2 class="welcome-title">Bienvenido/a</h2>
        <p class="welcome-desc">
          Seleccione una opción para continuar
        </p>
      </div>

      <!-- Botones principales -->
      <div class="action-grid">
        <button class="action-card primary" @click="router.push('/login')">
          <div class="action-icon">📋</div>
          <div class="action-text">
            <span class="action-title">Agendar o Ver mi Hora</span>
            <span class="action-sub">Ingrese su RUT para continuar</span>
          </div>
          <div class="action-arrow">→</div>
        </button>
      </div>

      <!-- Acceso discreto para personal -->
      <div class="staff-access">
        <button class="staff-btn" @click="router.push('/acceso-personal')">
          Acceso Personal del Hospital
        </button>
      </div>
    </main>

    <!-- Pie institucional -->
    <footer class="terminal-footer">
      <p>🔒 Sus datos están protegidos &nbsp;|&nbsp; Para asistencia, diríjase a la ventanilla de recepción</p>
    </footer>
  </div>
</template>

<style scoped>
.terminal-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f3460 0%, #1a5f9e 50%, #16213e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 2rem 1rem;
}

.bg-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05) 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 40%);
  pointer-events: none;
}

.terminal-card {
  background: white;
  border-radius: 24px;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.35);
  position: relative;
  z-index: 1;
}

/* Header */
.terminal-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.logo-circle {
  width: 64px;
  height: 64px;
  min-width: 64px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-circle svg {
  width: 32px;
  height: 32px;
}

.hospital-name {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-primary);
  margin: 0;
  line-height: 1;
}

.hospital-sub {
  margin: 6px 0 0 0;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.divider {
  height: 1px;
  background: var(--color-border);
  margin-bottom: 2rem;
}

/* Bienvenida */
.welcome-block {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-title {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.welcome-desc {
  color: var(--color-text-secondary);
  font-size: 1.125rem;
  margin: 0;
}

/* Botones de acción */
.action-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s, box-shadow 0.2s;
  width: 100%;
}

.action-card:active {
  transform: scale(0.98);
}

.action-card.primary {
  background: linear-gradient(135deg, var(--color-primary), #1a7bc4);
  color: white;
  box-shadow: 0 8px 24px rgba(26, 95, 158, 0.4);
}

.action-card.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(26, 95, 158, 0.5);
}

.action-icon {
  font-size: 2.25rem;
  min-width: 48px;
  text-align: center;
}

.action-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
}

.action-sub {
  font-size: 0.9rem;
  opacity: 0.85;
}

.action-arrow {
  font-size: 1.5rem;
  opacity: 0.7;
}

/* Acceso Personal */
.staff-access {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.staff-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  padding: 8px 16px;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}

.staff-btn:hover {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

/* Footer */
.terminal-footer {
  margin-top: 2rem;
  text-align: center;
  color: rgba(255,255,255,0.55);
  font-size: 0.875rem;
  position: relative;
  z-index: 1;
}

/* Responsive */
@media (max-width: 600px) {
  .terminal-card {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }
  .hospital-name { font-size: 1.6rem; }
  .welcome-title { font-size: 1.6rem; }
  .action-card { padding: 1.25rem; }
}
</style>
