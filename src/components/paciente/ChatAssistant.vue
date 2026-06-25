<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useChatAssistant } from '../../composables/useChatAssistant'

const chat = useChatAssistant()
const chatBody = ref<HTMLElement | null>(null)
const inputTexto = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

// Auto-scroll suave al nuevo mensaje
watch(() => chat.mensajes.value.length, async () => {
  await nextTick()
  if (chatBody.value) {
    chatBody.value.scrollTo({
      top: chatBody.value.scrollHeight,
      behavior: 'smooth'
    })
  }
})

// Formatear timestamp de mensaje
function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

// Último mensaje del asistente (para mostrar opciones solo del último)
const ultimoIndiceAsistente = computed(() => {
  for (let i = chat.mensajes.value.length - 1; i >= 0; i--) {
    if (chat.mensajes.value[i].tipo === 'asistente') return i
  }
  return -1
})

function enviarTexto() {
  const texto = inputTexto.value.trim()
  if (!texto) return
  chat.procesarRespuesta(texto)
  inputTexto.value = ''
  nextTick(() => inputRef.value?.focus())
}

function seleccionarOpcion(valor: string) {
  const ultimoMsg = chat.mensajes.value[chat.mensajes.value.length - 1]
  if (ultimoMsg) ultimoMsg.opciones = undefined
  chat.procesarRespuesta(valor)
}

// Delay stagger para animación de opciones
function opcionDelay(index: number): string {
  return `${0.1 + index * 0.07}s`
}

defineExpose({ iniciar: chat.iniciar })
</script>

<template>
  <!-- ═══ Botón principal para abrir ═══ -->
  <button v-if="!chat.abierto.value" class="chat-fab" @click="chat.iniciar()">
    <div class="fab-pulse"></div>
    <div class="fab-inner">
      <svg class="fab-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
        <circle cx="8" cy="10" r="1.2" fill="#0F3460"/>
        <circle cx="12" cy="10" r="1.2" fill="#0F3460"/>
        <circle cx="16" cy="10" r="1.2" fill="#0F3460"/>
      </svg>
    </div>
    <div class="fab-text">
      <span class="fab-title">Asistente Virtual</span>
      <span class="fab-sub">Agende su hora por voz o texto</span>
    </div>
    <div class="fab-arrow">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 4l6 6-6 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
  </button>

  <!-- ═══ Panel de chat ═══ -->
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="chat.abierto.value" class="chat-overlay" @click.self="chat.cerrar()">
        <div class="chat-panel">

          <!-- ── Header ──────────────────────── -->
          <div class="chat-header">
            <div class="header-left">
              <div class="avatar-ring">
                <div class="avatar">
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="4" width="20" height="24" rx="3" fill="white" fill-opacity="0.9"/>
                    <path d="M16 8v3M13 14h6M13 17h4" stroke="#0F3460" stroke-width="1.5" stroke-linecap="round"/>
                    <rect x="11" y="8" width="10" height="2" rx="1" fill="#1A5F9E" fill-opacity="0.3"/>
                  </svg>
                </div>
                <span class="status-dot" :class="{ listening: chat.escuchando.value }"></span>
              </div>
              <div class="header-text">
                <h3>Asistente MediTurno</h3>
                <span class="status-label">
                  <template v-if="chat.escuchando.value">
                    <span class="status-mic-wave"></span> Escuchando...
                  </template>
                  <template v-else-if="chat.paso.value === 'buscando'">
                    Buscando cupo...
                  </template>
                  <template v-else>
                    En línea
                  </template>
                </span>
              </div>
            </div>
            <button class="header-close" @click="chat.cerrar()" aria-label="Cerrar asistente">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>

          <!-- ── Chat body ───────────────────── -->
          <div class="chat-body" ref="chatBody">
            <!-- Mensaje de bienvenida visual -->
            <div class="welcome-badge">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v6m0 2v.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/></svg>
              <span>Puede escribir o usar el micrófono para hablar</span>
            </div>

            <TransitionGroup name="msg" tag="div" class="messages-container">
              <div
                v-for="(msg, i) in chat.mensajes.value"
                :key="msg.timestamp + '-' + i"
                class="msg-group"
                :class="msg.tipo"
              >
                <!-- Avatar del asistente -->
                <div v-if="msg.tipo === 'asistente'" class="msg-avatar-col">
                  <div class="msg-avatar">
                    <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="3" fill="#0F3460"/><path d="M12 6v3M9 12h6M9 15h4" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>
                  </div>
                </div>

                <div class="msg-content" :class="msg.tipo">
                  <!-- Burbuja -->
                  <div class="msg-bubble" :class="msg.tipo">
                    <p>{{ msg.texto }}</p>
                  </div>
                  <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>

                  <!-- Opciones (solo en último mensaje del asistente) -->
                  <div
                    v-if="msg.opciones && msg.opciones.length > 0 && i === ultimoIndiceAsistente"
                    class="msg-opciones"
                  >
                    <button
                      v-for="(op, oi) in msg.opciones"
                      :key="op.valor"
                      class="opcion-btn"
                      :style="{ animationDelay: opcionDelay(oi) }"
                      @click="seleccionarOpcion(op.valor)"
                    >
                      <span class="opcion-text">{{ op.label }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </TransitionGroup>

            <!-- Typing indicator -->
            <Transition name="typing">
              <div v-if="chat.paso.value === 'buscando'" class="msg-group asistente">
                <div class="msg-avatar-col">
                  <div class="msg-avatar">
                    <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="3" fill="#0F3460"/><path d="M12 6v3M9 12h6M9 15h4" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>
                  </div>
                </div>
                <div class="msg-content asistente">
                  <div class="msg-bubble asistente typing-bubble">
                    <div class="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- ── Footer / Input ──────────────── -->
          <div class="chat-footer" :class="{ disabled: chat.paso.value === 'completado' }">
            <button
              v-if="chat.soportaReconocimiento.value"
              class="mic-btn"
              :class="{ active: chat.escuchando.value }"
              @click="chat.activarMicrofono()"
              :disabled="chat.escuchando.value || chat.paso.value === 'completado'"
              aria-label="Activar micrófono"
            >
              <svg v-if="!chat.escuchando.value" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="7" y="2" width="6" height="10" rx="3" fill="currentColor"/>
                <path d="M5 9a5 5 0 0010 0M10 16v2M8 18h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <div v-else class="mic-waves">
                <span></span><span></span><span></span>
              </div>
            </button>

            <div class="input-container">
              <input
                ref="inputRef"
                v-model="inputTexto"
                type="text"
                placeholder="Escriba su respuesta..."
                @keyup.enter="enviarTexto"
                :disabled="chat.paso.value === 'completado'"
                autocomplete="off"
              />
            </div>

            <button
              class="send-btn"
              @click="enviarTexto"
              :disabled="!inputTexto.trim() || chat.paso.value === 'completado'"
              :class="{ ready: inputTexto.trim().length > 0 }"
              aria-label="Enviar mensaje"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10l14-7-4 7 4 7L3 10z" fill="currentColor"/>
              </svg>
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ═════════════════════════════════════════════════════════════════════
   BOTÓN FAB — Punto de entrada del asistente
   ═════════════════════════════════════════════════════════════════════ */
.chat-fab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1.1rem 1.35rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #0a2647 0%, #144272 50%, #205295 100%);
  color: white;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s cubic-bezier(.4,0,.2,1);
  box-shadow: 0 4px 20px rgba(10,38,71,0.3), 0 1px 3px rgba(0,0,0,0.1);
}
.chat-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(10,38,71,0.4), 0 2px 8px rgba(0,0,0,0.15);
}
.chat-fab:active { transform: scale(0.98) translateY(0); }

.fab-pulse {
  position: absolute;
  top: 50%; left: 50%;
  width: 200%; height: 200%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  animation: fabPulse 3s ease-in-out infinite;
  pointer-events: none;
}
@keyframes fabPulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.8); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

.fab-inner {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.fab-svg { width: 26px; height: 26px; }

.fab-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.fab-title { font-size: 1.05rem; font-weight: 700; letter-spacing: -0.01em; }
.fab-sub { font-size: 0.78rem; opacity: 0.7; font-weight: 400; }

.fab-arrow { opacity: 0.5; transition: transform 0.2s; flex-shrink: 0; }
.chat-fab:hover .fab-arrow { transform: translateX(3px); opacity: 0.8; }

/* ═════════════════════════════════════════════════════════════════════
   OVERLAY + PANEL
   ═════════════════════════════════════════════════════════════════════ */
.chat-overlay {
  position: fixed; inset: 0;
  background: rgba(10,20,40,0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* Transiciones del overlay */
.overlay-enter-active { transition: opacity 0.25s ease-out; }
.overlay-enter-active .chat-panel { transition: transform 0.35s cubic-bezier(.16,1,.3,1), opacity 0.25s ease-out; }
.overlay-leave-active { transition: opacity 0.2s ease-in; }
.overlay-leave-active .chat-panel { transition: transform 0.2s ease-in, opacity 0.15s ease-in; }
.overlay-enter-from { opacity: 0; }
.overlay-enter-from .chat-panel { transform: translateY(60px) scale(0.95); opacity: 0; }
.overlay-leave-to { opacity: 0; }
.overlay-leave-to .chat-panel { transform: translateY(40px) scale(0.97); opacity: 0; }

.chat-panel {
  width: 100%; max-width: 420px;
  height: 82vh; max-height: 680px;
  background: #ffffff;
  border-radius: 20px;
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05);
}

/* ═════════════════════════════════════════════════════════════════════
   HEADER
   ═════════════════════════════════════════════════════════════════════ */
.chat-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, #0a2647, #144272);
  color: white;
  flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 0.7rem; }

.avatar-ring {
  position: relative; width: 40px; height: 40px; flex-shrink: 0;
}
.avatar {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.avatar svg { width: 28px; height: 28px; }

.status-dot {
  position: absolute; bottom: -1px; right: -1px;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid #0a2647;
  transition: background 0.3s;
}
.status-dot.listening { background: #f59e0b; animation: statusPulse 1.2s infinite; }
@keyframes statusPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); }
  50% { box-shadow: 0 0 0 4px rgba(245,158,11,0); }
}

.header-text h3 { margin: 0; font-size: 0.95rem; font-weight: 700; letter-spacing: -0.01em; }
.status-label { font-size: 0.72rem; opacity: 0.75; display: flex; align-items: center; gap: 4px; }

.status-mic-wave {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  animation: statusPulse 1.2s infinite;
}

.header-close {
  background: rgba(255,255,255,0.1);
  border: none; color: white;
  width: 34px; height: 34px;
  border-radius: 10px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.header-close:hover { background: rgba(255,255,255,0.2); }

/* ═════════════════════════════════════════════════════════════════════
   CHAT BODY
   ═════════════════════════════════════════════════════════════════════ */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.85rem;
  background: linear-gradient(180deg, #f5f7fb 0%, #eef1f7 100%);
  scroll-behavior: smooth;
}
.chat-body::-webkit-scrollbar { width: 4px; }
.chat-body::-webkit-scrollbar-track { background: transparent; }
.chat-body::-webkit-scrollbar-thumb { background: #c5cdd8; border-radius: 4px; }

.welcome-badge {
  display: flex; align-items: center; gap: 6px;
  justify-content: center;
  padding: 6px 14px;
  margin: 0 auto 1rem;
  background: rgba(15,52,96,0.06);
  border-radius: 20px;
  font-size: 0.72rem;
  color: #6b7a90;
  animation: fadeIn 0.5s ease-out 0.3s both;
}
.welcome-badge svg { flex-shrink: 0; color: #6b7a90; }

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

/* ── Transiciones de mensajes ──────────────────────── */
.msg-enter-active {
  transition: transform 0.35s cubic-bezier(.16,1,.3,1), opacity 0.25s ease-out;
}
.msg-leave-active { transition: opacity 0.15s; }
.msg-enter-from { opacity: 0; transform: translateY(16px) scale(0.96); }
.msg-leave-to { opacity: 0; }

/* ── Grupo de mensaje ─────────────────────────────── */
.msg-group {
  display: flex;
  gap: 8px;
  max-width: 85%;
}
.msg-group.asistente { align-self: flex-start; }
.msg-group.usuario { align-self: flex-end; flex-direction: row-reverse; }

.msg-avatar-col { flex-shrink: 0; padding-top: 2px; }
.msg-avatar {
  width: 30px; height: 30px;
  border-radius: 10px;
  background: #e8eef6;
  display: flex; align-items: center; justify-content: center;
}
.msg-avatar svg { width: 18px; height: 18px; }

.msg-content { display: flex; flex-direction: column; min-width: 0; }

/* ── Burbuja ──────────────────────────────────────── */
.msg-bubble {
  padding: 0.65rem 0.9rem;
  border-radius: 14px;
  line-height: 1.5;
  font-size: 0.9rem;
  word-wrap: break-word;
  position: relative;
}
.msg-bubble p { margin: 0; }

.msg-bubble.asistente {
  background: white;
  color: #1a2332;
  border-top-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03);
}
.msg-bubble.usuario {
  background: linear-gradient(135deg, #0F3460, #1a5590);
  color: white;
  border-top-right-radius: 4px;
  box-shadow: 0 2px 8px rgba(15,52,96,0.2);
}

.msg-time {
  font-size: 0.65rem;
  color: #9ca3af;
  margin-top: 3px;
  padding: 0 4px;
}
.msg-group.usuario .msg-time { text-align: right; }

/* ── Opciones ─────────────────────────────────────── */
.msg-opciones {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding-left: 2px;
}

.opcion-btn {
  padding: 0.5rem 0.85rem;
  border: 1.5px solid #c5d0e0;
  border-radius: 12px;
  background: white;
  color: #0F3460;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(.4,0,.2,1);
  animation: optionIn 0.3s cubic-bezier(.16,1,.3,1) both;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  white-space: nowrap;
}
.opcion-btn:hover {
  background: #0F3460;
  color: white;
  border-color: #0F3460;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15,52,96,0.25);
}
.opcion-btn:active { transform: scale(0.96); }

@keyframes optionIn {
  from { opacity: 0; transform: translateY(8px) scale(0.92); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Typing indicator ─────────────────────────────── */
.typing-enter-active { transition: all 0.3s cubic-bezier(.16,1,.3,1); }
.typing-leave-active { transition: all 0.15s ease-in; }
.typing-enter-from { opacity: 0; transform: translateY(10px); }
.typing-leave-to { opacity: 0; transform: translateY(-5px); }

.typing-bubble { padding: 0.7rem 1rem; }
.typing-dots {
  display: flex; gap: 5px;
  align-items: center;
  height: 18px;
}
.typing-dots span {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #94a3b8;
  animation: typingBounce 1.4s infinite ease-in-out;
  will-change: transform;
}
.typing-dots span:nth-child(2) { animation-delay: 0.16s; }
.typing-dots span:nth-child(3) { animation-delay: 0.32s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* ═════════════════════════════════════════════════════════════════════
   FOOTER
   ═════════════════════════════════════════════════════════════════════ */
.chat-footer {
  display: flex; align-items: center; gap: 8px;
  padding: 0.65rem 0.85rem;
  border-top: 1px solid #edf0f5;
  background: white;
  flex-shrink: 0;
  transition: opacity 0.3s;
}
.chat-footer.disabled { opacity: 0.5; pointer-events: none; }

.mic-btn {
  width: 40px; height: 40px;
  border: 1.5px solid #d1d9e6;
  border-radius: 12px;
  background: white;
  color: #0F3460;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.mic-btn:hover { background: #f0f4fb; border-color: #0F3460; }
.mic-btn.active {
  background: #fee2e2; border-color: #ef4444; color: #ef4444;
}
.mic-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.mic-waves {
  display: flex; gap: 3px; align-items: center;
}
.mic-waves span {
  width: 3px;
  border-radius: 2px;
  background: #ef4444;
  animation: micWave 0.8s ease-in-out infinite;
}
.mic-waves span:nth-child(1) { height: 10px; animation-delay: 0s; }
.mic-waves span:nth-child(2) { height: 16px; animation-delay: 0.15s; }
.mic-waves span:nth-child(3) { height: 10px; animation-delay: 0.3s; }
@keyframes micWave {
  0%, 100% { transform: scaleY(0.6); }
  50% { transform: scaleY(1.2); }
}

.input-container { flex: 1; }
.input-container input {
  width: 100%;
  padding: 0.6rem 0.9rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.88rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  background: #f8fafc;
  color: #1a2332;
}
.input-container input::placeholder { color: #94a3b8; }
.input-container input:focus {
  border-color: #0F3460;
  box-shadow: 0 0 0 3px rgba(15,52,96,0.08);
  background: white;
}
.input-container input:disabled { background: #f1f5f9; opacity: 0.5; }

.send-btn {
  width: 40px; height: 40px;
  border: none;
  border-radius: 12px;
  background: #d1d9e6;
  color: white;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s cubic-bezier(.4,0,.2,1);
  flex-shrink: 0;
}
.send-btn.ready {
  background: linear-gradient(135deg, #0F3460, #1a5590);
  box-shadow: 0 2px 8px rgba(15,52,96,0.3);
}
.send-btn.ready:hover { transform: scale(1.06); box-shadow: 0 4px 14px rgba(15,52,96,0.35); }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* ═════════════════════════════════════════════════════════════════════
   UTILIDADES
   ═════════════════════════════════════════════════════════════════════ */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ═════════════════════════════════════════════════════════════════════
   RESPONSIVE
   ═════════════════════════════════════════════════════════════════════ */
@media (max-width: 600px) {
  .chat-panel {
    max-width: 100%;
    height: 100vh; max-height: 100vh;
    border-radius: 0;
  }
  .chat-overlay { padding: 0; align-items: stretch; }
  .fab-sub { display: none; }
}
</style>
