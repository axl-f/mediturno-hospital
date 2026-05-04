<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import BigButton from '../components/shared/BigButton.vue'

const router = useRouter()
const auth = useAuthStore()

const rolSeleccionado = ref<'admin' | 'medico'>('medico')
const usuario = ref('')
const contrasena = ref('')
const errorMsg = ref('')

const loginCard = ref<HTMLElement | null>(null)
const shakeCard = () => {
  if (loginCard.value) {
    loginCard.value.classList.remove('shake')
    void loginCard.value.offsetWidth
    loginCard.value.classList.add('shake')
  }
}

const submit = async () => {
  errorMsg.value = ''
  if (!usuario.value || !contrasena.value) {
    errorMsg.value = 'Complete todos los campos.'
    shakeCard()
    return
  }

  let res
  if (rolSeleccionado.value === 'admin') {
    res = await auth.loginAdmin(usuario.value, contrasena.value)
  } else {
    res = await auth.loginMedico(usuario.value, contrasena.value)
  }

  if (res.ok) {
    router.push(`/${rolSeleccionado.value}`)
  } else {
    errorMsg.value = 'Credenciales incorrectas. Verifique sus datos.'
    shakeCard()
  }
}
</script>

<template>
  <div class="acceso-layout">
    <button class="back-btn" @click="router.push('/')">← Volver al inicio</button>

    <div class="acceso-card" ref="loginCard">
      <!-- Header -->
      <div class="card-header">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <div>
          <h1 class="card-title">Acceso Personal</h1>
          <p class="card-sub">Área restringida — Hospital MediTurno</p>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Selector de rol -->
      <div class="role-tabs">
        <button
          class="role-tab"
          :class="{ active: rolSeleccionado === 'medico' }"
          @click="rolSeleccionado = 'medico'; errorMsg = ''"
        >
          <span class="tab-icon">👨‍⚕️</span>
          <span>Médico / Enfermería</span>
        </button>
        <button
          class="role-tab"
          :class="{ active: rolSeleccionado === 'admin' }"
          @click="rolSeleccionado = 'admin'; errorMsg = ''"
        >
          <span class="tab-icon">📊</span>
          <span>Administración</span>
        </button>
      </div>

      <!-- Formulario -->
      <form class="acceso-form" @submit.prevent="submit">
        <div class="form-group">
          <label for="usuario-input">Usuario</label>
          <input
            id="usuario-input"
            v-model="usuario"
            type="text"
            placeholder="Ej: medico1"
            autocomplete="username"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="pass-input">Contraseña</label>
          <input
            id="pass-input"
            v-model="contrasena"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            class="form-input"
          />
        </div>

        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

        <BigButton
          label="Iniciar sesión"
          variant="primary"
          :loading="auth.cargando"
          @click="submit"
        />
      </form>
    </div>
  </div>
</template>

<style scoped>
.acceso-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 2rem 1rem;
}

.back-btn {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.25);
  color: rgba(255,255,255,0.8);
  padding: 8px 16px;
  border-radius: 99px;
  cursor: pointer;
  font-size: 0.9rem;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
  z-index: 10;
}
.back-btn:hover { background: rgba(255,255,255,0.2); }

.acceso-card {
  background: white;
  width: 100%;
  max-width: 440px;
  padding: 2.5rem 2rem;
  border-radius: 24px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-10px); }
  40%, 80% { transform: translateX(10px); }
}
.shake { animation: shake 0.4s ease; }

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  width: 56px;
  height: 56px;
  min-width: 56px;
  background: #1a1a2e;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.logo-icon svg { width: 26px; height: 26px; }

.card-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--color-text);
  margin: 0 0 4px 0;
}
.card-sub { margin: 0; color: var(--color-text-secondary); font-size: 0.875rem; }

.divider { height: 1px; background: var(--color-border); }

/* Role tabs */
.role-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: var(--color-bg);
  padding: 6px;
  border-radius: 12px;
}

.role-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.2s;
  text-align: center;
}
.role-tab.active {
  background: white;
  color: var(--color-text);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.tab-icon { font-size: 1.25rem; }

/* Formulario */
.acceso-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text);
}

.form-input {
  padding: 14px 16px;
  border: 2px solid var(--color-border);
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.2s;
  outline: none;
}
.form-input:focus { border-color: var(--color-primary); }

.error-text {
  background: var(--color-danger-light);
  border: 1px solid var(--color-danger);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--color-danger);
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
}
</style>
