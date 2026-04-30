import { defineStore } from 'pinia'
import { ref as vueRef } from 'vue'
import { db } from '../firebase'
import { ref as dbRef, onValue, remove, set } from 'firebase/database'

export interface Paciente {
  rut: string
  nombre: string
  edad?: number
  // otras propiedades
}

export interface Medico {
  user: string
  password?: string
  nombre: string
  especialidad: string
}

export const useAdminStore = defineStore('admin', () => {
  const pacientes = vueRef<Paciente[]>([])
  const medicos = vueRef<Medico[]>([])
  const cargando = vueRef(false)

  function suscribirPacientes() {
    cargando.value = true
    const pacRef = dbRef(db, 'pacientes')
    onValue(pacRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        pacientes.value = Object.keys(data).map(rut => ({
          rut,
          ...data[rut]
        }))
      } else {
        pacientes.value = []
      }
      cargando.value = false
    })
  }

  function suscribirMedicos() {
    cargando.value = true
    const medRef = dbRef(db, 'medicos')
    onValue(medRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        medicos.value = Object.keys(data).map(user => ({
          user,
          ...data[user]
        }))
      } else {
        medicos.value = []
      }
      cargando.value = false
    })
  }

  async function guardarPaciente(rut: string, datos: Omit<Paciente, 'rut'>) {
    const pacRef = dbRef(db, `pacientes/${rut}`)
    await set(pacRef, datos)
  }

  async function eliminarPaciente(rut: string) {
    const pacRef = dbRef(db, `pacientes/${rut}`)
    await remove(pacRef)
  }

  async function guardarMedico(user: string, datos: Omit<Medico, 'user'>) {
    const medRef = dbRef(db, `medicos/${user}`)
    await set(medRef, datos)
  }

  async function eliminarMedico(user: string) {
    const medRef = dbRef(db, `medicos/${user}`)
    await remove(medRef)
  }

  return {
    pacientes,
    medicos,
    cargando,
    suscribirPacientes,
    suscribirMedicos,
    guardarPaciente,
    eliminarPaciente,
    guardarMedico,
    eliminarMedico
  }
})
