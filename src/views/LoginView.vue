<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNetwork } from '@vueuse/core'
import AsistenteButton from '../components/shared/AsistenteButton.vue'
import { useVoiceAssist } from '../composables/useVoiceAssist'

const { isOnline } = useNetwork()
const router = useRouter()
const auth = useAuthStore()

const rutInput = ref('')
const errorMsg = ref('')

const { asistenteActivo, toggleAsistente, hablar, hablarForzado } = useVoiceAssist()

const rutDisplay = computed(() => {
  if (!rutInput.value) return 'Ej: 12.345.678-9'
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
    hablar('Verificando RUT')
    submitPaciente()
  } else {
    if (rutInput.value.length < 9) {
      rutInput.value += key
      hablar(key)
    }
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

const submitPaciente = async () => {
  if (rutInput.value.length < 7) {
    errorMsg.value = 'RUT inválido. Ingrese al menos 7 dígitos.'
    hablarForzado('El RUT ingresado no es válido')
    shakeCard()
    return
  }
  const res = await auth.loginConRut(rutInput.value)
  if (res.ok) {
    router.push('/paciente')
  } else {
    errorMsg.value = 'RUT no encontrado. Consulte en la ventanilla de recepción.'
    hablarForzado('RUT no encontrado. Por favor consulte en ventanilla.')
    shakeCard()
  }
}
</script>

<template>
  <div class="login-layout">
    <div v-if="!isOnline" class="offline-banner">
      ⚠️ Sin conexión a Internet. Intente en un momento.
    </div>

    <button class="back-btn" @click="router.push('/')">← Volver al inicio</button>

    <div class="login-card" ref="loginCard">
      <div class="header-section">
        <div class="logo-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 8v8M8 12h8"></path>
          </svg>
        </div>
        <div>
          <h1 class="title">Identificación del Paciente</h1>
          <p class="subtitle">Ingrese su RUT para acceder al sistema</p>
        </div>
      </div>

      <div class="divider"></div>

      <AsistenteButton :activo="asistenteActivo" @toggle="toggleAsistente" />

      <div class="separator"><span>Ingrese su RUT con el teclado</span></div>

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

      <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>
      <p class="help-text">¿No recuerda su RUT? Solicítelo en la ventanilla de recepción.</p>
    </div>
  </div>
</template>

<style scoped>
.login-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f3460 0%, #1a5f9e 50%, #16213e 100%);
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
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 99px;
  cursor: pointer;
  font-size: 0.9rem;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
  z-index: 10;
}
.back-btn:hover { background: rgba(255,255,255,0.25); }

.offline-banner {
  position: fixed;
  top: 0; left: 0; right: 0;
  background: var(--color-warning);
  color: white;
  text-align: center;
  padding: 12px;
  font-weight: bold;
  z-index: 1000;
}

.login-card {
  background: white;
  width: 100%;
  max-width: 440px;
  padding: 2.5rem 2rem;
  border-radius: 24px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.35);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-10px); }
  40%, 80% { transform: translateX(10px); }
}
.shake { animation: shake 0.4s ease; }

.header-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-circle {
  width: 56px;
  height: 56px;
  min-width: 56px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.logo-circle svg { width: 28px; height: 28px; }

.title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: var(--color-primary);
  margin: 0 0 4px 0;
  line-height: 1.2;
}
.subtitle { margin: 0; color: var(--color-text-secondary); font-size: 0.9rem; }

.divider { height: 1px; background: var(--color-border); }

.separator {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
.separator::before, .separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.rut-display {
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 16px;
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  letter-spacing: 4px;
  color: var(--color-primary);
  min-height: 68px;
  transition: border-color 0.2s;
}
.rut-display.error { border-color: var(--color-danger); color: var(--color-danger); }

.numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.numpad.disabled { opacity: 0.5; pointer-events: none; }

.num-btn {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1.75rem;
  font-weight: bold;
  padding: 16px;
  cursor: pointer;
  min-height: 64px;
  transition: all 0.15s;
  color: var(--color-text);
}
.num-btn:active { background: var(--color-primary-light); transform: scale(0.95); }

.action-btn { color: var(--color-danger); font-size: 1.5rem; }

.enter-btn {
  background: var(--color-success);
  color: white;
  border-color: var(--color-success);
  font-size: 2rem;
}
.enter-btn:active { background: #246e3e; }

.error-text {
  background: var(--color-danger-light);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  padding: 12px;
  text-align: center;
  color: var(--color-danger);
  font-weight: 500;
  margin: 0;
}

.help-text {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin: 0;
}
</style>
