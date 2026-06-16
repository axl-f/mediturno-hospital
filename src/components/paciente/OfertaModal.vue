<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { OfertaReasignacion } from '../../stores/agenda'

const props = defineProps<{
  oferta: OfertaReasignacion
}>()

const emit = defineEmits<{
  aceptar: [ofertaId: string]
  rechazar: [ofertaId: string]
}>()

const ahora = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    ahora.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const tiempoRestante = computed(() => {
  const diff = props.oferta.expiraEn - ahora.value
  if (diff <= 0) return '0:00'
  const minutos = Math.floor(diff / 60000)
  const segundos = Math.floor((diff % 60000) / 1000)
  return `${minutos}:${segundos.toString().padStart(2, '0')}`
})

const porcentajeRestante = computed(() => {
  const total = props.oferta.expiraEn - props.oferta.creadaEn
  const restante = props.oferta.expiraEn - ahora.value
  return Math.max(0, Math.min(100, (restante / total) * 100))
})

const expirado = computed(() => ahora.value >= props.oferta.expiraEn)

const formatFecha = (iso: string) => {
  const [y, m, d] = iso.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
}
</script>

<template>
  <div class="oferta-overlay">
    <div class="oferta-card" :class="{ expirado }">
      <!-- Timer visual -->
      <div class="timer-bar">
        <div class="timer-fill" :style="{ width: porcentajeRestante + '%' }"></div>
      </div>

      <div class="oferta-content">
        <!-- Ícono -->
        <div class="oferta-icon">
          <span v-if="!expirado">🔔</span>
          <span v-else>⏰</span>
        </div>

        <!-- Título -->
        <h2 v-if="!expirado">¡Se liberó un cupo para usted!</h2>
        <h2 v-else>La oferta ha expirado</h2>

        <!-- Detalles -->
        <div v-if="!expirado" class="oferta-detalles">
          <div class="detalle-row">
            <span class="detalle-label">Especialidad</span>
            <span class="detalle-val">{{ oferta.especialidad }}</span>
          </div>
          <div class="detalle-row">
            <span class="detalle-label">Fecha</span>
            <span class="detalle-val capitalize">{{ formatFecha(oferta.fecha) }}</span>
          </div>
          <div class="detalle-row">
            <span class="detalle-label">Hora</span>
            <span class="detalle-val">{{ oferta.hora }}</span>
          </div>
        </div>

        <!-- Countdown -->
        <div v-if="!expirado" class="countdown">
          <span class="countdown-icon">⏱️</span>
          <span class="countdown-text">Tiempo para responder: <strong>{{ tiempoRestante }}</strong></span>
        </div>

        <!-- Acciones -->
        <div v-if="!expirado" class="oferta-actions">
          <button class="oferta-btn aceptar" @click="emit('aceptar', oferta.id)">
            ✅ Sí, quiero esta hora
          </button>
          <button class="oferta-btn rechazar" @click="emit('rechazar', oferta.id)">
            No, mantener mi posición
          </button>
        </div>

        <div v-else class="oferta-actions">
          <p class="expirado-msg">El cupo fue ofrecido al siguiente paciente en la lista de espera.</p>
          <button class="oferta-btn rechazar" @click="emit('rechazar', oferta.id)">
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.oferta-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.oferta-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.3);
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.oferta-card.expirado { opacity: 0.85; }

@keyframes popIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Timer bar */
.timer-bar {
  height: 6px;
  background: #e5e7eb;
  width: 100%;
}
.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #16A34A, #22c55e);
  transition: width 1s linear;
  border-radius: 0 3px 3px 0;
}

.oferta-content {
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.oferta-icon {
  font-size: 3rem;
  animation: ring 0.8s ease-in-out;
}
@keyframes ring {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(15deg); }
  40% { transform: rotate(-15deg); }
  60% { transform: rotate(10deg); }
  80% { transform: rotate(-5deg); }
}

.oferta-content h2 {
  font-family: var(--font-display, 'Inter', sans-serif);
  color: #0F3460;
  margin: 0;
  font-size: 1.3rem;
}

.oferta-detalles {
  background: #f0f4f8;
  border-radius: 12px;
  padding: 1rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detalle-row {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
}
.detalle-label { color: #6b7280; }
.detalle-val { font-weight: 700; color: #1a1d23; }
.capitalize { text-transform: capitalize; }

.countdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.5rem 1rem;
  background: #FEF3C7;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #92400E;
}
.countdown-icon { font-size: 1.2rem; }

.oferta-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  margin-top: 0.5rem;
}

.oferta-btn {
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  width: 100%;
}
.oferta-btn:active { transform: scale(0.97); }

.oferta-btn.aceptar {
  background: linear-gradient(135deg, #16A34A, #22c55e);
  color: white;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.35);
}
.oferta-btn.aceptar:hover {
  box-shadow: 0 6px 24px rgba(22, 163, 74, 0.5);
  transform: translateY(-1px);
}

.oferta-btn.rechazar {
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}
.oferta-btn.rechazar:hover {
  border-color: #9ca3af;
  background: #f9fafb;
}

.expirado-msg {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}
</style>
