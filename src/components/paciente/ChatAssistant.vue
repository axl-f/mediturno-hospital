<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useChatAssistant } from '../../composables/useChatAssistant'

const chat = useChatAssistant()
const chatBody = ref<HTMLElement | null>(null)
const inputTexto = ref('')

// Auto-scroll al nuevo mensaje
watch(() => chat.mensajes.value.length, async () => {
  await nextTick()
  if (chatBody.value) {
    chatBody.value.scrollTop = chatBody.value.scrollHeight
  }
})

function enviarTexto() {
  if (!inputTexto.value.trim()) return
  chat.procesarRespuesta(inputTexto.value.trim())
  inputTexto.value = ''
}

function seleccionarOpcion(valor: string) {
  // Remover opciones del último mensaje para evitar doble click
  const ultimoMsg = chat.mensajes.value[chat.mensajes.value.length - 1]
  if (ultimoMsg) ultimoMsg.opciones = undefined
  chat.procesarRespuesta(valor)
}

defineExpose({ iniciar: chat.iniciar })
</script>

<template>
  <!-- Botón flotante para abrir -->
  <button v-if="!chat.abierto.value" class="chat-fab" @click="chat.iniciar()">
    <span class="fab-icon">💬</span>
    <span class="fab-label">Asistente Virtual</span>
  </button>

  <!-- Panel de chat -->
  <Teleport to="body">
    <div v-if="chat.abierto.value" class="chat-overlay" @click.self="chat.cerrar()">
      <div class="chat-panel">
        <!-- Header -->
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">🏥</div>
            <div>
              <h3>Asistente MediTurno</h3>
              <span class="chat-status" :class="{ listening: chat.escuchando.value }">
                {{ chat.escuchando.value ? '🎤 Escuchando...' : '🟢 En línea' }}
              </span>
            </div>
          </div>
          <button class="chat-close" @click="chat.cerrar()">✕</button>
        </div>

        <!-- Body -->
        <div class="chat-body" ref="chatBody">
          <div
            v-for="(msg, i) in chat.mensajes.value"
            :key="i"
            class="msg-row"
            :class="msg.tipo"
          >
            <div class="msg-bubble" :class="msg.tipo">
              <p>{{ msg.texto }}</p>
            </div>
            <!-- Botones de opciones -->
            <div v-if="msg.opciones && msg.opciones.length > 0" class="msg-opciones">
              <button
                v-for="op in msg.opciones"
                :key="op.valor"
                class="opcion-btn"
                @click="seleccionarOpcion(op.valor)"
              >
                {{ op.label }}
              </button>
            </div>
          </div>

          <!-- Indicador de "buscando" -->
          <div v-if="chat.paso.value === 'buscando'" class="msg-row asistente">
            <div class="msg-bubble asistente">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer / Input -->
        <div class="chat-footer">
          <button
            v-if="chat.soportaReconocimiento.value"
            class="mic-btn"
            :class="{ active: chat.escuchando.value }"
            @click="chat.activarMicrofono()"
            :disabled="chat.escuchando.value || chat.paso.value === 'completado'"
          >
            🎤
          </button>
          <div class="chat-input-wrap">
            <input
              v-model="inputTexto"
              type="text"
              placeholder="Escriba su respuesta..."
              @keyup.enter="enviarTexto"
              :disabled="chat.paso.value === 'completado'"
            />
          </div>
          <button
            class="send-btn"
            @click="enviarTexto"
            :disabled="!inputTexto.trim() || chat.paso.value === 'completado'"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Botón flotante ────────────────────────────────────────────── */
.chat-fab {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1.25rem 1.5rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #0F3460, #1A5F9E);
  color: white;
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 6px 24px rgba(15, 52, 96, 0.35);
}
.chat-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 32px rgba(15, 52, 96, 0.45);
}
.chat-fab:active { transform: scale(0.98); }
.fab-icon { font-size: 2rem; }
.fab-label { font-size: 1.15rem; font-weight: 700; }

/* ── Overlay ───────────────────────────────────────────────────── */
.chat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* ── Panel principal ───────────────────────────────────────────── */
.chat-panel {
  width: 100%;
  max-width: 440px;
  height: 85vh;
  max-height: 680px;
  background: white;
  border-radius: 20px 20px 16px 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* ── Header ────────────────────────────────────────────────────── */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #0F3460, #1A5F9E);
  color: white;
}
.chat-header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.chat-avatar {
  width: 42px;
  height: 42px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}
.chat-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}
.chat-status {
  font-size: 0.75rem;
  opacity: 0.85;
}
.chat-status.listening {
  color: #fbbf24;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 0.4; }
}
.chat-close {
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.chat-close:hover { background: rgba(255,255,255,0.3); }

/* ── Body / mensajes ───────────────────────────────────────────── */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #f0f4f8;
}

.msg-row {
  display: flex;
  flex-direction: column;
  max-width: 88%;
}
.msg-row.asistente { align-self: flex-start; }
.msg-row.usuario { align-self: flex-end; }

.msg-bubble {
  padding: 0.75rem 1rem;
  border-radius: 16px;
  line-height: 1.45;
  font-size: 0.95rem;
  word-wrap: break-word;
}
.msg-bubble p { margin: 0; }
.msg-bubble.asistente {
  background: white;
  color: #1a1d23;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.msg-bubble.usuario {
  background: #0F3460;
  color: white;
  border-bottom-right-radius: 4px;
}

/* ── Opciones / botones ────────────────────────────────────────── */
.msg-opciones {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.opcion-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #0F3460;
  border-radius: 20px;
  background: white;
  color: #0F3460;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.opcion-btn:hover {
  background: #0F3460;
  color: white;
  transform: translateY(-1px);
}

/* ── Typing indicator ──────────────────────────────────────────── */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}
.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0F3460;
  animation: bounce 1.4s infinite ease-in-out;
}
.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ── Footer ────────────────────────────────────────────────────── */
.chat-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.75rem 1rem;
  border-top: 1px solid #e5e7eb;
  background: white;
}
.mic-btn {
  width: 42px;
  height: 42px;
  border: 2px solid #0F3460;
  border-radius: 50%;
  background: white;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.mic-btn:hover { background: #E8F0FE; }
.mic-btn.active {
  background: #EF4444;
  border-color: #EF4444;
  animation: pulse 1s infinite;
}
.mic-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.chat-input-wrap {
  flex: 1;
}
.chat-input-wrap input {
  width: 100%;
  padding: 0.65rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}
.chat-input-wrap input:focus {
  border-color: #0F3460;
}
.chat-input-wrap input:disabled {
  background: #f9fafb;
  opacity: 0.6;
}

.send-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: #0F3460;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.send-btn:hover { background: #1A5F9E; transform: scale(1.05); }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .chat-panel {
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  .chat-overlay {
    padding: 0;
    align-items: stretch;
  }
}
</style>
