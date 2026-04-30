import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '../firebase'
import { ref as dbRef, get } from 'firebase/database'

export interface Usuario {
  rut?: string
  nombre: string
  rol: 'paciente' | 'admin' | 'medico'
  edad?: number
  especialidad?: string
}

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<Usuario | null>(null)
  const cargando = ref(false)
  const error = ref<string | null>(null)

  const esPaciente = computed(() => usuario.value?.rol === 'paciente')
  const esAdmin = computed(() => usuario.value?.rol === 'admin')
  const esMedico = computed(() => usuario.value?.rol === 'medico')

  async function loginConRut(rut: string) {
    cargando.value = true
    error.value = null
    try {
      const pacRef = dbRef(db, `pacientes/${rut}`)
      const snapshot = await get(pacRef)
      if (snapshot.exists()) {
        const data = snapshot.val()
        usuario.value = { ...data, rut, rol: 'paciente' }
        return { ok: true, rol: 'paciente' }
      } else {
        return { ok: false }
      }
    } catch (err) {
      console.error("Error en loginConRut:", err)
      error.value = 'Error al conectar con la base de datos'
      return { ok: false }
    } finally {
      cargando.value = false
    }
  }

  async function loginAdmin(user: string, pass: string) {
    cargando.value = true
    error.value = null
    try {
      const adminRef = dbRef(db, `admins/${user}`)
      const snapshot = await get(adminRef)
      if (snapshot.exists()) {
        const data = snapshot.val()
        if (data.password === pass) {
          usuario.value = { nombre: data.nombre, rol: 'admin' }
          return { ok: true }
        }
      }
      return { ok: false }
    } catch (err) {
      console.error("Error en loginAdmin:", err)
      error.value = 'Error al conectar'
      return { ok: false }
    } finally {
      cargando.value = false
    }
  }

  async function loginMedico(user: string, pass: string) {
    cargando.value = true
    error.value = null
    try {
      const medRef = dbRef(db, `medicos/${user}`)
      const snapshot = await get(medRef)
      if (snapshot.exists()) {
        const data = snapshot.val()
        if (data.password === pass) {
          usuario.value = { nombre: data.nombre, especialidad: data.especialidad, rol: 'medico' }
          return { ok: true }
        }
      }
      return { ok: false }
    } catch (err) {
      console.error("Error en loginMedico:", err)
      error.value = 'Error al conectar'
      return { ok: false }
    } finally {
      cargando.value = false
    }
  }

  function logout() {
    usuario.value = null
    error.value = null
  }

  return {
    usuario,
    cargando,
    error,
    esPaciente,
    esAdmin,
    esMedico,
    loginConRut,
    loginAdmin,
    loginMedico,
    logout
  }
})
