import { ref, computed } from 'vue'
import { useAgendaStore } from '../stores/agenda'
import { useAuthStore } from '../stores/auth'
import { get, ref as dbRef } from 'firebase/database'
import { db } from '../firebase'
import { useRouter } from 'vue-router'

export interface ChatMensaje {
  tipo: 'asistente' | 'usuario'
  texto: string
  opciones?: { label: string; valor: string; icono?: string }[]
  timestamp: number
}

type PasoChat =
  | 'inicio'
  | 'especialidad'
  | 'buscando'
  | 'confirmar'
  | 'sinCupos'
  | 'completado'
  | 'enEspera'
  | 'misCitas'
  | 'cancelar'

export function useChatAssistant() {
  const agenda = useAgendaStore()
  const auth = useAuthStore()
  const router = useRouter()

  const mensajes = ref<ChatMensaje[]>([])
  const paso = ref<PasoChat>('inicio')
  const abierto = ref(false)
  const escuchando = ref(false)
  let recognitionInstance: any = null
  const especialidadElegida = ref<any>(null)
  const resultadoCita = ref<{ fecha: string; hora: string; especialidad: string } | null>(null)

  // ── Voz ──────────────────────────────────────────────────────────────
  const soportaVoz = computed(() => 'speechSynthesis' in window)
  const soportaReconocimiento = computed(() => 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  function hablar(texto: string) {
    if (!soportaVoz.value) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(texto)
    u.lang = 'es-CL'
    u.rate = 0.9
    u.pitch = 1.0
    window.speechSynthesis.speak(u)
  }

  function iniciarReconocimiento() {
    if (!soportaReconocimiento.value) return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-CL'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim()
      if (transcript) {
        procesarRespuesta(transcript)
      }
    }

    recognition.onerror = () => {
      // Si sigue activo, reiniciar tras error
      if (escuchando.value) {
        setTimeout(() => {
          if (escuchando.value) iniciarReconocimiento()
        }, 300)
      }
    }

    recognition.onend = () => {
      // Auto-reiniciar si el mic sigue encendido (escucha continua)
      if (escuchando.value) {
        setTimeout(() => {
          if (escuchando.value) iniciarReconocimiento()
        }, 200)
      }
    }

    recognitionInstance = recognition
    recognition.start()
  }

  function detenerReconocimiento() {
    if (recognitionInstance) {
      try { recognitionInstance.abort() } catch { /* ignore */ }
      recognitionInstance = null
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  function agregarMensaje(tipo: 'asistente' | 'usuario', texto: string, opciones?: ChatMensaje['opciones']) {
    mensajes.value.push({ tipo, texto, opciones, timestamp: Date.now() })
  }

  function formatFecha(iso: string): string {
    const [y, m, d] = iso.split('-')
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
    return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  // ── Flujo ───────────────────────────────────────────────────────────
  async function iniciar() {
    mensajes.value = []
    paso.value = 'inicio'
    abierto.value = true
    especialidadElegida.value = null
    resultadoCita.value = null

    await agenda.cargarEspecialidades()

    const nombre = auth.usuario?.nombre || 'paciente'
    const saludo = `Hola ${nombre}, ¿qué desea hacer?`
    agregarMensaje('asistente', saludo, [
      { label: '📅 Agendar hora', valor: 'agendar', icono: '📅' },
      { label: '📋 Ver mis citas', valor: 'mis_citas', icono: '📋' },
      { label: '❌ Cancelar una cita', valor: 'cancelar', icono: '❌' },
    ])
    hablar(saludo)
  }

  function cerrar() {
    abierto.value = false
    window.speechSynthesis.cancel()
    escuchando.value = false
    detenerReconocimiento()
  }

  async function procesarRespuesta(input: string) {
    const inputLower = input.toLowerCase().trim()
    agregarMensaje('usuario', input)

    switch (paso.value) {
      case 'inicio':
        await procesarInicio(inputLower)
        break
      case 'especialidad':
        await procesarEspecialidad(inputLower)
        break
      case 'confirmar':
        await procesarConfirmacion(inputLower)
        break
      case 'sinCupos':
        await procesarSinCupos(inputLower)
        break
      default:
        break
    }
  }

  // ── Paso: Inicio ────────────────────────────────────────────────────
  async function procesarInicio(input: string) {
    if (input.includes('agendar') || input.includes('hora') || input.includes('pedir') || input === 'agendar') {
      paso.value = 'especialidad'
      const opciones = agenda.especialidades.map(e => ({
        label: `${e.icono} ${e.nombre}`,
        valor: e.id,
        icono: e.icono,
      }))
      const texto = '¿En qué especialidad desea atenderse?'
      agregarMensaje('asistente', texto, opciones)
      hablar(texto + ' Tenemos: ' + agenda.especialidades.map(e => e.nombre).join(', '))
    } else if (input.includes('cita') && (input.includes('ver') || input.includes('mis'))) {
      agregarMensaje('asistente', 'Lo llevo a sus citas.')
      hablar('Lo llevo a sus citas.')
      cerrar()
      router.push('/paciente/mis-citas')
    } else if (input.includes('cancelar')) {
      agregarMensaje('asistente', 'Lo llevo a la sección de cancelación.')
      hablar('Lo llevo a la sección de cancelación.')
      cerrar()
      router.push('/paciente/mis-citas')
    } else {
      const texto = 'No entendí su respuesta. Puede decir: "agendar hora", "ver mis citas" o "cancelar cita".'
      agregarMensaje('asistente', texto, [
        { label: '📅 Agendar hora', valor: 'agendar' },
        { label: '📋 Ver mis citas', valor: 'mis_citas' },
        { label: '❌ Cancelar una cita', valor: 'cancelar' },
      ])
      hablar(texto)
    }
  }

  // ── Paso: Especialidad ──────────────────────────────────────────────
  async function procesarEspecialidad(input: string) {
    // Buscar match por nombre de especialidad o por id
    const esp = agenda.especialidades.find(e =>
      e.id === input ||
      e.nombre.toLowerCase().includes(input) ||
      input.includes(e.nombre.toLowerCase())
    )

    if (!esp) {
      const texto = 'No encontré esa especialidad. Por favor seleccione una de las opciones.'
      agregarMensaje('asistente', texto, agenda.especialidades.map(e => ({
        label: `${e.icono} ${e.nombre}`,
        valor: e.id,
      })))
      hablar(texto)
      return
    }

    especialidadElegida.value = esp
    paso.value = 'buscando'
    const buscando = `Buscando cupo disponible en ${esp.nombre}...`
    agregarMensaje('asistente', buscando)
    hablar(buscando)

    // Buscar primer slot libre
    await buscarYReservarParaChat(esp.id)
  }

  // ── Buscar y ofrecer ────────────────────────────────────────────────
  async function buscarYReservarParaChat(especialidadId: string) {
    try {
      const snap = await get(dbRef(db, `agenda/${especialidadId}`))
      if (!snap.exists()) {
        mostrarSinCupos()
        return
      }

      const data = snap.val()
      const todayIso = new Date().toISOString().split('T')[0]
      const fechas = Object.keys(data).sort()

      for (const fecha of fechas) {
        if (fecha < todayIso) continue
        const horarios = data[fecha]
        const horasLibres = Object.keys(horarios).filter(h => horarios[h] === true).sort()
        if (horasLibres.length === 0) continue

        const hora = horasLibres[0]
        resultadoCita.value = {
          fecha,
          hora,
          especialidad: especialidadElegida.value?.nombre || especialidadId,
        }
        paso.value = 'confirmar'

        const fechaFormateada = formatFecha(fecha)
        const texto = `Encontré un cupo para el ${fechaFormateada} a las ${hora}. ¿Desea confirmar esta hora?`
        agregarMensaje('asistente', texto, [
          { label: '✅ Sí, confirmar', valor: 'si' },
          { label: '🔄 Buscar otra', valor: 'otra_especialidad' },
        ])
        hablar(texto)
        return
      }

      mostrarSinCupos()
    } catch (err) {
      console.error(err)
      mostrarSinCupos()
    }
  }

  function mostrarSinCupos() {
    paso.value = 'sinCupos'
    const texto = `No hay cupos disponibles en ${especialidadElegida.value?.nombre} en este momento.`
    agregarMensaje('asistente', texto, [
      { label: '⏳ Anotarme en lista de espera', valor: 'espera' },
      { label: '🔄 Probar otra especialidad', valor: 'otra_especialidad' },
      { label: '🚪 Cerrar', valor: 'cerrar' },
    ])
    hablar(texto)
  }

  // ── Paso: Confirmación ──────────────────────────────────────────────
  async function procesarConfirmacion(input: string) {
    if (input.includes('si') || input.includes('sí') || input.includes('confirmar') || input === 'si') {
      if (!resultadoCita.value || !auth.usuario?.rut) return

      agregarMensaje('asistente', 'Reservando su hora...')

      await agenda.crearCita({
        pacienteRut: auth.usuario.rut,
        pacienteNombre: auth.usuario.nombre,
        especialidad: especialidadElegida.value.id,
        fecha: resultadoCita.value.fecha,
        hora: resultadoCita.value.hora,
      })

      paso.value = 'completado'
      const fechaFormateada = formatFecha(resultadoCita.value.fecha)
      const texto = `¡Listo! Su cita de ${resultadoCita.value.especialidad} fue agendada para el ${fechaFormateada} a las ${resultadoCita.value.hora}. Puede verla en "Mis citas".`
      agregarMensaje('asistente', texto, [
        { label: '👍 Entendido, cerrar', valor: 'cerrar' },
      ])
      hablar(texto)
    } else if (input.includes('otra') || input.includes('buscar') || input === 'otra_especialidad') {
      paso.value = 'especialidad'
      const opciones = agenda.especialidades.map(e => ({
        label: `${e.icono} ${e.nombre}`,
        valor: e.id,
      }))
      agregarMensaje('asistente', '¿En qué otra especialidad desea atenderse?', opciones)
      hablar('¿En qué otra especialidad desea atenderse?')
    } else {
      agregarMensaje('asistente', 'Por favor diga "sí" para confirmar o "buscar otra" para cambiar de especialidad.', [
        { label: '✅ Sí, confirmar', valor: 'si' },
        { label: '🔄 Buscar otra', valor: 'otra_especialidad' },
      ])
    }
  }

  // ── Paso: Sin cupos ─────────────────────────────────────────────────
  async function procesarSinCupos(input: string) {
    if (input.includes('espera') || input.includes('anotar') || input === 'espera') {
      if (!especialidadElegida.value || !auth.usuario?.rut) return

      await agenda.unirseListaEspera(
        especialidadElegida.value.id,
        auth.usuario.rut,
        auth.usuario.nombre,
        ''
      )

      paso.value = 'completado'
      const texto = `¡Anotado en lista de espera para ${especialidadElegida.value.nombre}! Le avisaremos cuando se libere un cupo.`
      agregarMensaje('asistente', texto, [
        { label: '👍 Entendido, cerrar', valor: 'cerrar' },
      ])
      hablar(texto)
    } else if (input.includes('otra') || input === 'otra_especialidad') {
      paso.value = 'especialidad'
      const opciones = agenda.especialidades.map(e => ({
        label: `${e.icono} ${e.nombre}`,
        valor: e.id,
      }))
      agregarMensaje('asistente', '¿En qué otra especialidad desea atenderse?', opciones)
      hablar('¿En qué otra especialidad desea atenderse?')
    } else if (input.includes('cerrar') || input === 'cerrar') {
      cerrar()
    }
  }

  // ── Toggle micrófono (activar/desactivar) ───────────────────────────
  function toggleMicrofono() {
    if (escuchando.value) {
      // Desactivar
      escuchando.value = false
      detenerReconocimiento()
    } else {
      // Activar
      escuchando.value = true
      iniciarReconocimiento()
    }
  }

  return {
    mensajes,
    paso,
    abierto,
    escuchando,
    soportaVoz,
    soportaReconocimiento,
    iniciar,
    cerrar,
    procesarRespuesta,
    toggleMicrofono,
  }
}
