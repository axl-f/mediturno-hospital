<script setup lang="ts">


const props = defineProps<{
  activo: boolean
  label?: string
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>

<template>
  <div class="voice-assist-container">
    <button 
      class="assist-btn" 
      :class="{ active: activo }"
      @click="emit('toggle')"
      type="button"
      :aria-pressed="activo"
      aria-label="Activar asistencia por voz"
    >
      <svg v-if="!activo" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      </svg>
    </button>
    <span class="assist-label">{{ activo ? 'Asistencia Activada' : 'Activar Asistencia por Voz' }}</span>
  </div>
</template>

<style scoped>
.voice-assist-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 1rem 0;
}

.assist-label {
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 1.125rem;
}

.assist-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.assist-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
}

.assist-btn:active {
  transform: scale(0.95);
}

.assist-btn.active {
  background: var(--color-success);
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(45, 138, 78, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(45, 138, 78, 0); }
  100% { box-shadow: 0 0 0 0 rgba(45, 138, 78, 0); }
}
</style>
