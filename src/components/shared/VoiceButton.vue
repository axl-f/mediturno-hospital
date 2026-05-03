<script setup lang="ts">
import { useVoiceInput } from '../../composables/useVoiceInput'
import { watch } from 'vue'

const props = defineProps<{
  label?: string
}>()

const emit = defineEmits<{
  (e: 'result', digits: string): void
}>()

const { isSupported, isListening, startListening, stopListening, transcript, digitsOnly } = useVoiceInput()

const toggleListening = () => {
  if (!isSupported.value) return
  
  if (isListening.value) {
    stopListening()
  } else {
    if (transcript.value === '') {
      const utterance = new SpeechSynthesisUtterance("Diga su RUT número a número")
      utterance.lang = 'es-CL'
      window.speechSynthesis.speak(utterance)
    }
    startListening()
  }
}

watch(isListening, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    if (digitsOnly.value) {
      emit('result', digitsOnly.value)
    }
  }
})
</script>

<template>
  <div v-if="isSupported" class="voice-container">
    <button 
      class="voice-btn" 
      :class="{ listening: isListening }"
      @click="toggleListening"
      type="button"
      aria-label="Presionar para dictar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="22"></line>
      </svg>
      <div v-if="isListening" class="wave-ring"></div>
    </button>
    <span v-if="label" class="label">{{ label }}</span>
    <span v-if="isListening" class="transcript-preview">{{ transcript || 'Escuchando...' }}</span>
  </div>
</template>

<style scoped>
.voice-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.voice-btn {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.voice-btn:hover {
  transform: scale(1.05);
}

.wave-ring {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border-radius: 50%;
  border: 2px solid var(--color-primary);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}

.label {
  font-size: var(--text-label);
  color: var(--color-text-secondary);
}

.transcript-preview {
  font-size: var(--text-caption);
  color: var(--color-text-secondary);
  font-style: italic;
  min-height: 18px;
}
</style>
