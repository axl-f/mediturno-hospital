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
  userId?: string  // clave de Firebase (ej: 'medico1')
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
          usuario.value = { nombre: data.nombre, especialidad: data.especialidad, rol: 'medico', userId: user }
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

  async function actualizarCredencialesMedico(
    nuevoUser: string,
    nuevaPass: string,
    passActual: string
  ): Promise<{ ok: boolean; msg: string }> {
    if (!usuario.value?.userId) return { ok: false, msg: 'Sesión no válida.' }
    cargando.value = true
    try {
      const { ref: dbRefFn, get: getFn, update: updateFn, remove } = await import('firebase/database')
      const oldKey = usuario.value.userId

      // 1. Verificar contraseña actual
      const snap = await getFn(dbRefFn(db, `medicos/${oldKey}`))
      if (!snap.exists() || snap.val().password !== passActual) {
        return { ok: false, msg: 'La contraseña actual es incorrecta.' }
      }

      const datosActuales = snap.val()

      // 2. Si cambio de nombre de usuario, verificar que no exista ya
      if (nuevoUser !== oldKey) {
        const nuevoSnap = await getFn(dbRefFn(db, `medicos/${nuevoUser}`))
        if (nuevoSnap.exists()) {
          return { ok: false, msg: 'Ese nombre de usuario ya está en uso.' }
        }
      }

      // 3. Escribir con el nuevo usuario (o actualizar en el mismo nodo)
      const nuevosDatos = {
        ...datosActuales,
        password: nuevaPass || datosActuales.password
      }

      if (nuevoUser !== oldKey) {
        // Crear nuevo nodo y borrar el antiguo
        await updateFn(dbRefFn(db, `medicos/${nuevoUser}`), nuevosDatos)
        await remove(dbRefFn(db, `medicos/${oldKey}`))
      } else {
        await updateFn(dbRefFn(db, `medicos/${oldKey}`), nuevosDatos)
      }

      // 4. Actualizar sesión local
      usuario.value.userId = nuevoUser
      return { ok: true, msg: 'Credenciales actualizadas correctamente.' }
    } catch (err) {
      console.error(err)
      return { ok: false, msg: 'Error al guardar los cambios.' }
    } finally {
      cargando.value = false
    }
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
    logout,
    actualizarCredencialesMedico
  }
})
