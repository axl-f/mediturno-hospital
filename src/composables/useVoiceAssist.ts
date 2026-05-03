import { ref } from 'vue'

export function useVoiceAssist() {
  const asistenteActivo = ref(false)

  const toggleAsistente = () => {
    asistenteActivo.value = !asistenteActivo.value
    if (asistenteActivo.value) {
      hablar('Asistencia por voz activada. Use el teclado numérico para ingresar su RUT.')
    } else {
      hablar('Asistencia por voz desactivada.')
    }
  }

  const hablar = (texto: string) => {
    if (!asistenteActivo.value) return
    window.speechSynthesis.cancel() // Detener cualquier habla anterior
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'es-CL'
    // Configuraciones amigables para baja alfabetización:
    utterance.rate = 0.9 // Un poco más lento para mejor comprensión
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }

  // Permite forzar el habla independiente del estado del asistente si es una advertencia crítica, pero por lo general respeta el estado.
  const hablarForzado = (texto: string) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'es-CL'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  return {
    asistenteActivo,
    toggleAsistente,
    hablar,
    hablarForzado
  }
}
