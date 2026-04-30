export function useRecordatorios() {
  async function programarRecordatorios(cita: {
    id: string
    fecha: string
    hora: string
    especialidad: string
  }) {
    // Para producción: reemplazar setTimeout por Firebase Cloud Functions
    // con Cloud Scheduler para recordatorios confiables independientes del browser

    if (!('Notification' in window)) return
    
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission()
    }
    
    if (Notification.permission !== 'granted') return

    const [yyyy, mm, dd] = cita.fecha.split('-')
    const [h, m] = cita.hora.split(':')
    const citaDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), parseInt(h), parseInt(m))
    const ahora = new Date()

    const timers: number[] = []

    // 72h antes
    const ms72h = citaDate.getTime() - (72 * 60 * 60 * 1000) - ahora.getTime()
    if (ms72h > 0) {
      const id = setTimeout(() => {
        enviarNotificacion(
          'Recordatorio de Cita',
          `Tiene una cita el ${cita.fecha} a las ${cita.hora} — ${cita.especialidad}`
        )
      }, ms72h)
      timers.push(id as unknown as number)
    }

    // 24h antes
    const ms24h = citaDate.getTime() - (24 * 60 * 60 * 1000) - ahora.getTime()
    if (ms24h > 0) {
      const id = setTimeout(() => {
        enviarNotificacion(
          'Confirmación Requerida',
          `Mañana es su cita a las ${cita.hora}. Responda SÍ o NO en la app.`
        )
      }, ms24h)
      timers.push(id as unknown as number)
    }

    // 2h antes
    const ms2h = citaDate.getTime() - (2 * 60 * 60 * 1000) - ahora.getTime()
    if (ms2h > 0) {
      const id = setTimeout(() => {
        enviarNotificacion(
          'Cita Próxima',
          `Su cita comienza en 2 horas — ${cita.hora}, ${cita.especialidad}`
        )
      }, ms2h)
      timers.push(id as unknown as number)
    }

    localStorage.setItem(`recordatorios_${cita.id}`, JSON.stringify(timers))
  }

  function cancelarRecordatorios(citaId: string) {
    const timersStr = localStorage.getItem(`recordatorios_${citaId}`)
    if (timersStr) {
      const timers = JSON.parse(timersStr) as number[]
      timers.forEach(t => clearTimeout(t))
      localStorage.removeItem(`recordatorios_${citaId}`)
    }
  }

  function enviarNotificacion(title: string, body: string) {
    const notif = new Notification(title, { body })
    notif.onclick = () => {
      window.focus()
      // Acá idealmente se puede manejar la redirección si es PWA
    }
  }

  return { programarRecordatorios, cancelarRecordatorios }
}
