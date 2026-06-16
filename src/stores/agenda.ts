import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '../firebase'
import { ref as dbRef, get, update, push, onValue } from 'firebase/database'

export interface Especialidad {
  id: string
  nombre: string
  icono: string
  color?: string
}

export interface Cita {
  id: string
  pacienteRut: string
  pacienteNombre: string
  especialidad: string
  fecha: string
  hora: string
  estado: 'confirmada' | 'pendiente' | 'cancelada' | 'asistio' | 'no_asistio'
}

export interface PacienteEspera {
  id?: string
  rut: string
  nombre: string
  timestamp: number
  notificado?: boolean
  fechaEsperada?: string
}

export interface OfertaReasignacion {
  id: string
  especialidad: string
  especialidadNombre: string
  fecha: string
  hora: string
  pacienteRut: string
  creadaEn: number
  expiraEn: number
  estado: 'pendiente' | 'aceptada' | 'expirada' | 'rechazada'
}

export const useAgendaStore = defineStore('agenda', () => {
  const especialidades = ref<Especialidad[]>([])
  const disponibilidad = ref<Record<string, Record<string, string[]>>>({})
  const fechasDisponibles = ref<string[]>([])
  const citasDelDia = ref<Cita[]>([])
  const listaEspera = ref<Record<string, PacienteEspera[]>>({})
  const ofertasActivas = ref<OfertaReasignacion[]>([])
  const cargando = ref(false)

  async function cargarEspecialidades() {
    cargando.value = true
    try {
      const snap = await get(dbRef(db, 'especialidades'))
      if (snap.exists()) {
        const data = snap.val()
        especialidades.value = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
      }
    } finally {
      cargando.value = false
    }
  }

  async function cargarFechasDisponibles(especialidad: string) {
    cargando.value = true
    try {
      const snap = await get(dbRef(db, `agenda/${especialidad}`))
      if (snap.exists()) {
        const data = snap.val()
        fechasDisponibles.value = Object.keys(data).filter(fecha => {
          const horarios = data[fecha]
          return Object.values(horarios).some(val => val === true)
        })
      } else {
        fechasDisponibles.value = []
      }
    } finally {
      cargando.value = false
    }
  }

  async function cargarDisponibilidad(especialidad: string, fecha: string) {
    cargando.value = true
    try {
      const snap = await get(dbRef(db, `agenda/${especialidad}/${fecha}`))
      if (snap.exists()) {
        const data = snap.val()
        if (!disponibilidad.value[especialidad]) disponibilidad.value[especialidad] = {}
        const horasLibres = Object.keys(data).filter(h => data[h] === true)
        disponibilidad.value[especialidad][fecha] = horasLibres
      } else {
        if (!disponibilidad.value[especialidad]) disponibilidad.value[especialidad] = {}
        disponibilidad.value[especialidad][fecha] = []
      }
    } finally {
      cargando.value = false
    }
  }

  async function crearCita(datos: Omit<Cita, 'id' | 'estado'>) {
    cargando.value = true
    try {
      const citasRef = dbRef(db, 'citas')
      const nuevaCitaRef = push(citasRef)
      const cita: Cita = {
        id: nuevaCitaRef.key as string,
        ...datos,
        estado: 'pendiente'
      }

      // Transacción o multi-update
      const updates: any = {}
      updates[`citas/${cita.id}`] = cita
      updates[`agenda/${cita.especialidad}/${cita.fecha}/${cita.hora}`] = cita.id

      await update(dbRef(db), updates)
      
      // Intentar remover al paciente de la lista de espera si existía
      await removerPacienteDeEsperaPorRut(cita.especialidad, cita.pacienteRut)
      
      return cita.id
    } finally {
      cargando.value = false
    }
  }

  async function cancelarCita(citaId: string, cita: Cita) {
    const updates: any = {}
    updates[`citas/${citaId}/estado`] = 'cancelada'
    updates[`agenda/${cita.especialidad}/${cita.fecha}/${cita.hora}`] = null
    await update(dbRef(db), updates)
    // Reasignación automática: ofrecer cupo al siguiente en lista de espera
    await crearOfertaReasignacion(cita.especialidad, cita.fecha, cita.hora)
  }

  function suscribirCitasDelDia(fecha: string) {
    const citasRef = dbRef(db, 'citas')
    onValue(citasRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        citasDelDia.value = Object.keys(data)
          .map(k => data[k])
          .filter(c => c.fecha === fecha)
      } else {
        citasDelDia.value = []
      }
    })
  }

  async function agregarListaEspera(especialidad: string, paciente: PacienteEspera) {
    const listaRef = dbRef(db, `listaEspera/${especialidad}/queue`)
    await push(listaRef, paciente)
  }

  function suscribirListaEspera() {
    const listRef = dbRef(db, 'listaEspera')
    onValue(listRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const nuevaLista: Record<string, PacienteEspera[]> = {}
        Object.keys(data).forEach(esp => {
          if (data[esp].queue) {
            nuevaLista[esp] = Object.keys(data[esp].queue).map(k => ({
              id: k,
              ...data[esp].queue[k]
            }))
          } else {
            nuevaLista[esp] = []
          }
        })
        listaEspera.value = nuevaLista
      } else {
        listaEspera.value = {}
      }
    })
  }

  async function unirseListaEspera(especialidad: string, rut: string, nombre: string, fechaEsperada: string) {
    const queueRef = dbRef(db, `listaEspera/${especialidad}/queue`)
    const nuevoPaciente = {
      rut,
      nombre,
      timestamp: Date.now(),
      notificado: false,
      fechaEsperada
    }
    await push(queueRef, nuevoPaciente)
  }

  async function notificarPaciente(especialidad: string, id: string) {
    await update(dbRef(db), {
      [`listaEspera/${especialidad}/queue/${id}/notificado`]: true
    })
  }

  async function removerDeListaEspera(especialidad: string, id: string) {
    await update(dbRef(db), {
      [`listaEspera/${especialidad}/queue/${id}`]: null
    })
  }

  async function removerPacienteDeEsperaPorRut(especialidad: string, rut: string) {
    const queueData = listaEspera.value[especialidad]
    if (queueData) {
      const paciente = queueData.find(p => p.rut === rut)
      if (paciente && paciente.id) {
        await removerDeListaEspera(especialidad, paciente.id)
      }
    }
  }

  // ── Reasignación Dinámica ──────────────────────────────────────────
  const DURACION_OFERTA_MS = 15 * 60 * 1000 // 15 minutos

  async function crearOfertaReasignacion(especialidadId: string, fecha: string, hora: string) {
    const queue = listaEspera.value[especialidadId]
    if (!queue || queue.length === 0) return

    // Ordenar por antigüedad y obtener el primero no notificado aún con oferta
    const candidatos = [...queue].sort((a, b) => a.timestamp - b.timestamp)
    const candidato = candidatos[0]
    if (!candidato) return

    const espNombre = especialidades.value.find(e => e.id === especialidadId)?.nombre || especialidadId

    const ofertaRef = push(dbRef(db, 'ofertas'))
    const ahora = Date.now()
    const oferta: Omit<OfertaReasignacion, 'id'> = {
      especialidad: especialidadId,
      especialidadNombre: espNombre,
      fecha,
      hora,
      pacienteRut: candidato.rut,
      creadaEn: ahora,
      expiraEn: ahora + DURACION_OFERTA_MS,
      estado: 'pendiente',
    }

    await update(dbRef(db), {
      [`ofertas/${ofertaRef.key}`]: { id: ofertaRef.key, ...oferta },
    })
  }

  async function aceptarOferta(ofertaId: string) {
    // Leer la oferta
    const snap = await get(dbRef(db, `ofertas/${ofertaId}`))
    if (!snap.exists()) return
    const oferta = snap.val() as OfertaReasignacion

    if (oferta.estado !== 'pendiente') return

    // Crear la cita
    const citasRef = push(dbRef(db, 'citas'))
    const nuevaCita = {
      id: citasRef.key,
      pacienteRut: oferta.pacienteRut,
      pacienteNombre: '', // Se llena abajo
      especialidad: oferta.especialidad,
      fecha: oferta.fecha,
      hora: oferta.hora,
      estado: 'pendiente',
    }

    // Obtener nombre del paciente
    const pacSnap = await get(dbRef(db, `pacientes/${oferta.pacienteRut}`))
    if (pacSnap.exists()) {
      nuevaCita.pacienteNombre = pacSnap.val().nombre || ''
    }

    const updates: any = {}
    updates[`citas/${citasRef.key}`] = nuevaCita
    updates[`agenda/${oferta.especialidad}/${oferta.fecha}/${oferta.hora}`] = citasRef.key
    updates[`ofertas/${ofertaId}/estado`] = 'aceptada'
    await update(dbRef(db), updates)

    // Remover de lista de espera
    await removerPacienteDeEsperaPorRut(oferta.especialidad, oferta.pacienteRut)
  }

  async function rechazarOferta(ofertaId: string) {
    const snap = await get(dbRef(db, `ofertas/${ofertaId}`))
    if (!snap.exists()) return
    const oferta = snap.val() as OfertaReasignacion

    await update(dbRef(db), {
      [`ofertas/${ofertaId}/estado`]: 'rechazada',
    })

    // Buscar siguiente candidato en la lista de espera
    const queue = listaEspera.value[oferta.especialidad]
    if (queue && queue.length > 0) {
      const siguientes = [...queue]
        .sort((a, b) => a.timestamp - b.timestamp)
        .filter(p => p.rut !== oferta.pacienteRut)
      if (siguientes.length > 0) {
        await crearOfertaParaCandidato(oferta.especialidad, oferta.fecha, oferta.hora, siguientes[0])
      }
    }
  }

  async function crearOfertaParaCandidato(especialidadId: string, fecha: string, hora: string, candidato: PacienteEspera) {
    const espNombre = especialidades.value.find(e => e.id === especialidadId)?.nombre || especialidadId
    const ofertaRef = push(dbRef(db, 'ofertas'))
    const ahora = Date.now()
    await update(dbRef(db), {
      [`ofertas/${ofertaRef.key}`]: {
        id: ofertaRef.key,
        especialidad: especialidadId,
        especialidadNombre: espNombre,
        fecha,
        hora,
        pacienteRut: candidato.rut,
        creadaEn: ahora,
        expiraEn: ahora + DURACION_OFERTA_MS,
        estado: 'pendiente',
      },
    })
  }

  function suscribirOfertas(rut: string) {
    const ofertasRef = dbRef(db, 'ofertas')
    onValue(ofertasRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        ofertasActivas.value = Object.values(data)
          .filter((o: any) => o.pacienteRut === rut && o.estado === 'pendiente')
          .map((o: any) => o as OfertaReasignacion)
      } else {
        ofertasActivas.value = []
      }
    })
  }

  async function verificarExpiraciones() {
    const ahora = Date.now()
    for (const oferta of ofertasActivas.value) {
      if (oferta.estado === 'pendiente' && ahora >= oferta.expiraEn) {
        await update(dbRef(db), {
          [`ofertas/${oferta.id}/estado`]: 'expirada',
        })
        // Escalar al siguiente candidato
        const queue = listaEspera.value[oferta.especialidad]
        if (queue && queue.length > 0) {
          const siguientes = [...queue]
            .sort((a, b) => a.timestamp - b.timestamp)
            .filter(p => p.rut !== oferta.pacienteRut)
          if (siguientes.length > 0) {
            await crearOfertaParaCandidato(oferta.especialidad, oferta.fecha, oferta.hora, siguientes[0])
          }
        }
      }
    }
  }

  return {
    especialidades,
    disponibilidad,
    fechasDisponibles,
    citasDelDia,
    listaEspera,
    ofertasActivas,
    cargando,
    cargarEspecialidades,
    cargarFechasDisponibles,
    cargarDisponibilidad,
    crearCita,
    cancelarCita,
    suscribirCitasDelDia,
    suscribirListaEspera,
    unirseListaEspera,
    removerDeListaEspera,
    agregarListaEspera,
    notificarPaciente,
    crearOfertaReasignacion,
    aceptarOferta,
    rechazarOferta,
    suscribirOfertas,
    verificarExpiraciones,
  }
})
