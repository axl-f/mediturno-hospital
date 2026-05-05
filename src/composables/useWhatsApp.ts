/**
 * useWhatsApp.ts
 * Genera deep links wa.me para recordatorios y notificaciones de WhatsApp.
 * No requiere ningún backend ni API key — abre la app de WhatsApp del dispositivo.
 */

export interface CitaWA {
  especialidad: string
  fecha: string
  hora: string
  pacienteNombre: string
  numeroPaciente?: string // con código de país, ej: 56912345678
}

const formatFechaLegible = (iso: string) => {
  const [y, m, d] = iso.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function useWhatsApp() {

  /**
   * Abre WhatsApp con un mensaje pre-redactado de recordatorio.
   * Si se provee numeroPaciente, se dirige a ese número (uso del médico).
   * Si no, abre wa.me sin número (el paciente elige a quién enviárselo o lo guarda).
   */
  const abrirRecordatorioCita = (cita: CitaWA) => {
    const fechaLegible = formatFechaLegible(cita.fecha)
    const mensaje =
      `🏥 *Recordatorio de Cita Médica — MediTurno*\n\n` +
      `Hola ${cita.pacienteNombre}, le recordamos que tiene una cita agendada:\n\n` +
      `📋 *Especialidad:* ${cita.especialidad}\n` +
      `📅 *Fecha:* ${fechaLegible}\n` +
      `🕐 *Hora:* ${cita.hora} hrs\n\n` +
      `Por favor, llegue 10 minutos antes de su hora.\n` +
      `Si necesita cancelar, hágalo con anticipación desde la app MediTurno.`

    const encodedMsg = encodeURIComponent(mensaje)
    const url = cita.numeroPaciente
      ? `https://wa.me/${limpiarNumero(cita.numeroPaciente)}?text=${encodedMsg}`
      : `https://wa.me/?text=${encodedMsg}`

    window.open(url, '_blank')
  }

  /**
   * Abre WhatsApp para notificar a un paciente de lista de espera
   * que se liberó un cupo.
   */
  const abrirNotificacionEspera = (paciente: { nombre: string; numeroPaciente?: string }, especialidad: string) => {
    const mensaje =
      `🔔 *Notificación de Cupo Disponible — MediTurno*\n\n` +
      `Estimado/a ${paciente.nombre},\n\n` +
      `Le informamos que se ha liberado un *cupo disponible* en la especialidad de *${especialidad}*.\n\n` +
      `Ingrese a la app MediTurno para confirmar su hora antes de que sea tomada por otro paciente.\n\n` +
      `_Hospital Público — Sistema MediTurno_`

    const encodedMsg = encodeURIComponent(mensaje)
    const url = paciente.numeroPaciente
      ? `https://wa.me/${limpiarNumero(paciente.numeroPaciente)}?text=${encodedMsg}`
      : `https://wa.me/?text=${encodedMsg}`

    window.open(url, '_blank')
  }

  /**
   * Elimina espacios, guiones y el "+" del número telefónico.
   */
  const limpiarNumero = (num: string) => num.replace(/[\s\-\+]/g, '')

  return {
    abrirRecordatorioCita,
    abrirNotificacionEspera,
  }
}
