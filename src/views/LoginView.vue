<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNetwork } from '@vueuse/core'
import AsistenteButton from '../components/shared/AsistenteButton.vue'
import BigButton from '../components/shared/BigButton.vue'
import { useVoiceAssist } from '../composables/useVoiceAssist'

const { isOnline } = useNetwork()

const router = useRouter()
const auth = useAuthStore()

const rolSeleccionado = ref<'paciente' | 'admin' | 'medico'>('paciente')
const rutInput = ref('')
const adminUser = ref('')
const adminPass = ref('')
const errorMsg = ref('')

const { asistenteActivo, toggleAsistente, hablar, hablarForzado } = useVoiceAssist()

const rutDisplay = computed(() => {
  if (!rutInput.value) return 'Ej: 12345678-9'
  // Formateo simple para display
  let rut = rutInput.value.replace(/[^0-9kK]/g, '')
  if (rut.length > 1) {
    const dv = rut.slice(-1)
    const body = rut.slice(0, -1)
    return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
  }
  return rut
})

const handleTeclado = (key: string) => {
  errorMsg.value = ''
  if (key === 'del') {
    rutInput.value = rutInput.value.slice(0, -1)
    hablar('Borrar')
  } else if (key === 'enter') {
    hablar('Iniciando sesión')
    submitPaciente()
  } else {
    if (rutInput.value.length < 9) {
      rutInput.value += key
      hablar(key)
    }
  }
}

const submitPaciente = async () => {
  if (rutInput.value.length < 7) {
    errorMsg.value = 'RUT inválido'
    hablarForzado('El RUT ingresado no es válido')
    shakeCard()
    return
  }
  const res = await auth.loginConRut(rutInput.value)
  if (res.ok) {
    router.push('/paciente')
  } else {
    errorMsg.value = 'RUT no encontrado. Consulte en la ventanilla.'
    hablarForzado('RUT no encontrado. Por favor consulte en ventanilla.')
    shakeCard()
  }
}

const submitStaff = async () => {
  let res
  if (rolSeleccionado.value === 'admin') {
    res = await auth.loginAdmin(adminUser.value, adminPass.value)
  } else {
    res = await auth.loginMedico(adminUser.value, adminPass.value)
  }
  
  if (res.ok) {
    router.push(`/${rolSeleccionado.value}`)
  } else {
    errorMsg.value = 'Credenciales incorrectas'
    shakeCard()
  }
}

const loginCard = ref<HTMLElement | null>(null)
const shakeCard = () => {
  if (loginCard.value) {
    loginCard.value.classList.remove('shake')
    void loginCard.value.offsetWidth
    loginCard.value.classList.add('shake')
  }
}
</script>

<template>
  <div class="login-layout">
    <div v-if="!isOnline" class="offline-banner">
      Sin conexión. Intente en un momento.
    </div>

    <div class="login-card" ref="loginCard">
      <div class="header-section">
        <div class="logo-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 8v8M8 12h8"></path>
          </svg>
        </div>
        <h1 class="title">MediTurno</h1>
        <p class="subtitle">Agendamiento de horas médicas</p>
      </div>

      <div class="role-selector">
        <button 
          :class="['role-btn', { active: rolSeleccionado === 'paciente' }]"
          @click="rolSeleccionado = 'paciente'; errorMsg = ''"
        >🏥 Paciente</button>
        <button 
          :class="['role-btn', { active: rolSeleccionado === 'admin' }]"
          @click="rolSeleccionado = 'admin'; errorMsg = ''"
        >📋 Admin</button>
        <button 
          :class="['role-btn', { active: rolSeleccionado === 'medico' }]"
          @click="rolSeleccionado = 'medico'; errorMsg = ''"
        >👨‍⚕️ Médico</button>
      </div>

      <div v-if="rolSeleccionado === 'paciente'" class="paciente-section">
        <h2 class="section-title">Ingrese su RUT</h2>
        
        <div class="input-methods">
          <AsistenteButton :activo="asistenteActivo" @toggle="toggleAsistente" />
          
          <div class="separator"><span>o use el teclado directamente</span></div>
          
          <div class="rut-display" :class="{ error: errorMsg }">{{ rutDisplay }}</div>
          
          <div class="numpad" :class="{ disabled: auth.cargando }">
            <button v-for="n in 9" :key="n" class="num-btn" @click="handleTeclado(n.toString())">{{ n }}</button>
            <button class="num-btn action-btn" @click="handleTeclado('del')">⌫</button>
            <button class="num-btn" @click="handleTeclado('0')">0</button>
            <button 
              class="num-btn enter-btn" 
              :style="{ visibility: rutInput.length >= 7 ? 'visible' : 'hidden' }"
              @click="handleTeclado('enter')"
            >✓</button>
          </div>
        </div>
        
        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>
        <p class="help-text">¿No recuerda su RUT? Solicítelo en ventanilla.</p>
      </div>

      <div v-else class="staff-section">
        <div class="form-group">
          <label>Usuario</label>
          <input type="text" v-model="adminUser" class="form-input" />
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" v-model="adminPass" class="form-input" />
        </div>
        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>
        <BigButton label="Ingresar" @click="submitStaff" :loading="auth.cargando" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-layout {
  min-height: 100vh;
  background-color: var(--color-bg);
  background-image: radial-gradient(var(--color-border) 2px, transparent 2px);
  background-size: 32px 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.offline-banner {
  position: absolute;
  top: 0; left: 0; right: 0;
  background: var(--color-warning);
  color: white;
  text-align: center;
  padding: 12px;
  font-weight: bold;
  z-index: 1000;
}

.login-card {
  background: var(--color-surface);
  width: 100%;
  max-width: 420px;
  padding: 2rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (max-width: 480px) {
  .login-card {
    min-height: 100dvh;
    border-radius: 0;
    justify-content: center;
    padding: 1.5rem;
  }
}

.header-section {
  text-align: center;
}

.logo-circle {
  width: 64px; height: 64px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px;
}
.logo-circle svg { width: 36px; height: 36px; }

.title {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1rem;
}

.role-selector {
  display: flex;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  padding: 4px;
  gap: 4px;
}

.role-btn {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 4px;
  font-size: var(--text-label);
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.2s;
  min-height: 56px;
}

.role-btn.active {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow);
}

.paciente-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.section-title {
  font-size: 1.125rem;
  font-weight: bold;
}

.input-methods {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.separator {
  width: 100%;
  text-align: center;
  border-bottom: 1px solid var(--color-border);
  line-height: 0.1em;
  margin: 10px 0;
}
.separator span {
  background: var(--color-surface);
  padding: 0 10px;
  color: var(--color-text-secondary);
  font-size: var(--text-caption);
}

.rut-display {
  width: 100%;
  height: 56px;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: 2px;
}
.rut-display.error {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
  max-width: 260px;
}
.numpad.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.num-btn {
  height: 64px;
  border: none;
  background: var(--color-bg);
  font-size: 1.5rem;
  font-weight: bold;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.1s;
}
@media (max-width: 480px) {
  .num-btn { height: 56px; }
}

.num-btn:active {
  background: var(--color-border);
}

.action-btn {
  color: var(--color-danger);
}

.enter-btn {
  background: var(--color-success);
  color: white;
}
.enter-btn:active { background: #236b3d; }

.help-text {
  font-size: var(--text-caption);
  color: var(--color-text-secondary);
  text-align: center;
  margin-top: 8px;
}

.error-text {
  color: var(--color-danger);
  font-weight: bold;
  text-align: center;
}

.staff-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: var(--text-label);
  font-weight: 500;
}

.form-input {
  height: 56px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0 1rem;
  font-size: var(--text-body);
}

.shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
