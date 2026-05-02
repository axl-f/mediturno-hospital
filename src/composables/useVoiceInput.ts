import { ref, computed } from 'vue'

export function useVoiceInput() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const isSupported = computed(() => !!SpeechRecognition)

  const isListening = ref(false)
  const transcript = ref('')
  const parseSpanishNumbers = (text: string) => {
    const numMap: Record<string, number | string> = {
      'cero': 0, 'un': 1, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
      'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10, 'once': 11, 'doce': 12,
      'trece': 13, 'catorce': 14, 'quince': 15, 'dieciseis': 16, 'diecisiete': 17,
      'dieciocho': 18, 'diecinueve': 19, 'veinte': 20, 'veintiun': 21, 'veintiuno': 21,
      'veintidos': 22, 'veintitres': 23, 'veinticuatro': 24, 'veinticinco': 25,
      'veintiseis': 26, 'veintisiete': 27, 'veintiocho': 28, 'veintinueve': 29,
      'treinta': 30, 'cuarenta': 40, 'cincuenta': 50, 'sesenta': 60, 'setenta': 70,
      'ochenta': 80, 'noventa': 90, 'cien': 100, 'ciento': 100, 'doscientos': 200,
      'trescientos': 300, 'cuatrocientos': 400, 'quinientos': 500, 'seiscientos': 600,
      'setecientos': 700, 'ochocientos': 800, 'novecientos': 900, 'mil': 1000, 'k': 'k'
    }

    const words = text.toLowerCase().replace(/,/g, ' ').split(/\s+/)
    let result = ""
    let currentGroup = 0
    let lastVal = Infinity

    for (let w of words) {
      if (w === 'y') continue
      
      if (/^\d+$/.test(w)) {
        if (currentGroup > 0) { result += currentGroup.toString(); currentGroup = 0 }
        result += w
        lastVal = Infinity
        continue
      }
      
      if (w === 'k') {
        if (currentGroup > 0) { result += currentGroup.toString(); currentGroup = 0 }
        result += 'k'
        lastVal = Infinity
        continue
      }

      let val = numMap[w]
      if (val !== undefined) {
        if (val === 1000) {
          currentGroup = currentGroup === 0 ? 1000 : currentGroup * 1000
          lastVal = 1000
        } else {
          if (typeof val === 'number') {
            if (val >= lastVal) {
              result += currentGroup.toString()
              currentGroup = val
            } else {
              currentGroup += val
            }
            lastVal = val
          }
        }
      } else {
        if (currentGroup > 0) { result += currentGroup.toString(); currentGroup = 0 }
        lastVal = Infinity
      }
    }

    if (currentGroup > 0) { result += currentGroup.toString() }
    return result
  }

  const digitsOnly = computed(() => {
    const parsed = parseSpanishNumbers(transcript.value)
    return parsed.replace(/[^0-9kK]/g, '')
  })
  const error = ref<string | null>(null)

  let recognition: any = null
  let userHolding = false

  if (isSupported.value) {
    recognition = new SpeechRecognition()
    recognition.lang = 'es-CL'
    recognition.interimResults = true
    recognition.continuous = true // Keep listening while holding

    recognition.onresult = (event: any) => {
      let currentTranscript = ''
      for (let i = 0; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript + ' '
      }
      transcript.value = currentTranscript.trim()
    }

    recognition.onerror = (event: any) => {
      error.value = event.error === 'no-speech' ? 'No se detectó voz' : `Error: ${event.error}`
      if (!userHolding) stopListening()
    }

    recognition.onend = () => {
      if (userHolding && isListening.value) {
        try { recognition.start() } catch (e) {}
      } else {
        isListening.value = false
      }
    }
  }

  const startListening = () => {
    if (!isSupported.value) return
    userHolding = true
    error.value = null
    transcript.value = ''
    try {
      recognition.start()
      isListening.value = true
    } catch (e) {
      console.warn("Ya está escuchando")
    }
  }

  const stopListening = () => {
    userHolding = false
    if (isListening.value) {
      recognition.stop()
      isListening.value = false
    }
  }

  return {
    isSupported,
    isListening,
    transcript,
    digitsOnly,
    error,
    startListening,
    stopListening
  }
}
