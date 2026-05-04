<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const logout = () => {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <nav class="app-nav">
    <div class="nav-brand">
      <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v8M8 12h8"></path>
      </svg>
      <span class="logo-text">MediTurno</span>
    </div>

    <div class="nav-links">
      <slot></slot>
      <!-- Boton logout solo visible en movil -->
      <button class="nav-logout-mobile" @click="logout" title="Cerrar sesión">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Salir</span>
      </button>
    </div>

    <div class="nav-footer">
      <div class="user-info">
        <span class="user-name">{{ auth.usuario?.nombre }}</span>
        <span class="user-role">{{ auth.usuario?.rol }}</span>
      </div>
      <button class="logout-btn" @click="logout">Cerrar sesión</button>
    </div>
  </nav>
</template>

<style scoped>
.app-nav {
  width: 220px;
  background: white;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
}

.nav-brand {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-primary);
  border-bottom: 1px solid var(--color-border);
}

.logo-icon { width: 24px; height: 24px; }
.logo-text { font-family: var(--font-display); font-size: 1.25rem; }

.nav-links {
  flex: 1;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:deep(.nav-link) {
  display: flex;
  align-items: center;
  padding: 12px 1.5rem;
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

:deep(.nav-link:hover) {
  background: var(--color-bg);
}

:deep(.nav-link.router-link-active) {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-right: 3px solid var(--color-primary);
}

.nav-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.user-info {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.user-name { font-weight: 500; }
.user-role { font-size: var(--text-caption); color: var(--color-text-secondary); text-transform: capitalize; }

.logout-btn {
  width: 100%;
  padding: 8px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  cursor: pointer;
  font-weight: 500;
}
.logout-btn:hover {
  background: var(--color-danger-light);
}

/* Boton logout mobile: oculto en desktop */
.nav-logout-mobile {
  display: none;
}

@media (max-width: 767px) {
  .app-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    width: 100%;
    height: auto;
    flex-direction: row;
    border-right: none;
    border-top: 1px solid var(--color-border);
    z-index: 100;
    background: white;
  }
  .nav-brand, .nav-footer { display: none; }
  .nav-links {
    flex-direction: row;
    justify-content: space-around;
    padding: 0;
    width: 100%;
  }
  :deep(.nav-link) {
    flex-direction: column;
    padding: 8px 4px;
    font-size: 0.75rem;
    gap: 4px;
    text-align: center;
    border-right: none !important;
  }
  :deep(.nav-link.router-link-active) {
    border-top: 3px solid var(--color-primary);
    background: transparent;
    color: var(--color-primary);
  }
  /* Mostrar logout en movil igual que los nav-link */
  .nav-logout-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 4px;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-danger);
    background: none;
    border: none;
    cursor: pointer;
    min-width: 56px;
  }
}
</style>
