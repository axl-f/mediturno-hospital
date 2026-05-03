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

export const useAgendaStore = defineStore('agenda', () => {
  const especialidades = ref<Especialidad[]>([])
  const disponibilidad = ref<Record<string, Record<string, string[]>>>({})
  const fechasDisponibles = ref<string[]>([])
  const citasDelDia = ref<Cita[]>([])
  const listaEspera = ref<Record<string, PacienteEspera[]>>({})
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
    // Acá iría la lógica para activar lista de espera
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

  return {
    especialidades,
    disponibilidad,
    fechasDisponibles,
    citasDelDia,
    listaEspera,
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
    notificarPaciente
  }
})
