<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import type { Paciente, Medico } from '../../stores/admin'
import { useAgendaStore } from '../../stores/agenda'
import AppNav from '../../components/layout/AppNav.vue'
import BigButton from '../../components/shared/BigButton.vue'
import LoadingSpinner from '../../components/shared/LoadingSpinner.vue'
import { useToast } from '../../composables/useToast'

const admin = useAdminStore()
const agenda = useAgendaStore()
const toast = useToast()

onMounted(() => {
  admin.suscribirPacientes()
  admin.suscribirMedicos()
  agenda.cargarEspecialidades()
})

const tabActual = ref<'pacientes' | 'medicos'>('pacientes')
const modalAbierto = ref(false)
const modoEdicion = ref(false)

const formPaciente = ref<Paciente>({ rut: '', nombre: '', edad: undefined })
const formMedico = ref<Medico>({ user: '', password: '', nombre: '', especialidad: '' })

const abrirModalNuevo = () => {
  modoEdicion.value = false
  if (tabActual.value === 'pacientes') {
    formPaciente.value = { rut: '', nombre: '', edad: undefined }
  } else {
    formMedico.value = { user: '', password: '', nombre: '', especialidad: agenda.especialidades[0]?.id || '' }
  }
  modalAbierto.value = true
}

const abrirModalEditar = (item: any) => {
  modoEdicion.value = true
  if (tabActual.value === 'pacientes') {
    formPaciente.value = { ...item }
  } else {
    formMedico.value = { ...item }
  }
  modalAbierto.value = true
}

const guardar = async () => {
  if (tabActual.value === 'pacientes') {
    if (!formPaciente.value.rut || !formPaciente.value.nombre) {
      toast.warning('RUT y Nombre son obligatorios')
      return
    }
    await admin.guardarPaciente(formPaciente.value.rut, { nombre: formPaciente.value.nombre, edad: formPaciente.value.edad })
  } else {
    if (!formMedico.value.user || !formMedico.value.nombre || !formMedico.value.especialidad) {
      toast.warning('Usuario, Nombre y Especialidad son obligatorios')
      return
    }
    const datosMedico: any = { nombre: formMedico.value.nombre, especialidad: formMedico.value.especialidad }
    if (formMedico.value.password) datosMedico.password = formMedico.value.password
    await admin.guardarMedico(formMedico.value.user, datosMedico)
  }
  toast.success(modoEdicion.value ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente')
  modalAbierto.value = false
}

const eliminar = async (id: string) => {
  if (!confirm(`¿Está seguro de eliminar a ${id}? Esta acción no se puede deshacer.`)) return
  if (tabActual.value === 'pacientes') {
    await admin.eliminarPaciente(id)
  } else {
    await admin.eliminarMedico(id)
  }
}
</script>

<template>
  <div class="admin-layout">
    <AppNav>
      <router-link to="/admin" class="nav-link">📊 Dashboard</router-link>
      <router-link to="/admin/alertas" class="nav-link">🔔 Alertas</router-link>
      <router-link to="/admin/usuarios" class="nav-link">👥 Gestión Usuarios</router-link>
    </AppNav>
    
    <main class="admin-content">
      <div class="header-section">
        <div class="title-area">
          <h1>Gestión de Usuarios</h1>
          <p class="subtitle">Crear, editar o eliminar pacientes y personal de salud.</p>
        </div>
        <BigButton label="+ Nuevo" variant="primary" @click="abrirModalNuevo" />
      </div>

      <div class="tabs-container">
        <button class="tab-btn" :class="{ active: tabActual === 'pacientes' }" @click="tabActual = 'pacientes'">Pacientes</button>
        <button class="tab-btn" :class="{ active: tabActual === 'medicos' }" @click="tabActual = 'medicos'">Personal de Salud</button>
      </div>

      <div class="table-container">
        <div v-if="admin.cargando" class="loading-state">
          <LoadingSpinner color="var(--color-primary)" />
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th v-if="tabActual === 'pacientes'">RUT</th>
              <th v-else>Usuario</th>
              <th>Nombre</th>
              <th v-if="tabActual === 'medicos'">Especialidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="tabActual === 'pacientes'">
              <tr v-for="item in admin.pacientes" :key="item.rut">
                <td>{{ item.rut }}</td>
                <td>{{ item.nombre }}</td>
                <td class="actions-cell">
                  <button class="icon-btn edit" @click="abrirModalEditar(item)" aria-label="Editar">✏️</button>
                  <button class="icon-btn delete" @click="eliminar(item.rut)" aria-label="Eliminar">🗑️</button>
                </td>
              </tr>
              <tr v-if="admin.pacientes.length === 0">
                <td colspan="3" class="empty-state">No hay pacientes registrados</td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="item in admin.medicos" :key="item.user">
                <td>{{ item.user }}</td>
                <td>{{ item.nombre }}</td>
                <td>
                  {{ agenda.especialidades.find(e => e.id === item.especialidad)?.nombre || item.especialidad }}
                </td>
                <td class="actions-cell">
                  <button class="icon-btn edit" @click="abrirModalEditar(item)" aria-label="Editar">✏️</button>
                  <button class="icon-btn delete" @click="eliminar(item.user)" aria-label="Eliminar">🗑️</button>
                </td>
              </tr>
              <tr v-if="admin.medicos.length === 0">
                <td colspan="4" class="empty-state">No hay médicos registrados</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Modal -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="modalAbierto = false">
      <div class="modal-content">
        <h2>{{ modoEdicion ? 'Editar' : 'Nuevo' }} {{ tabActual === 'pacientes' ? 'Paciente' : 'Médico' }}</h2>
        
        <form @submit.prevent="guardar" class="form-grid">
          <template v-if="tabActual === 'pacientes'">
            <div class="form-group">
              <label>RUT</label>
              <input v-model="formPaciente.rut" type="text" :disabled="modoEdicion" required placeholder="Ej: 12345678-9" />
            </div>
            <div class="form-group">
              <label>Nombre Completo</label>
              <input v-model="formPaciente.nombre" type="text" required />
            </div>
            <div class="form-group">
              <label>Edad (Opcional)</label>
              <input v-model="formPaciente.edad" type="number" min="0" />
            </div>
          </template>

          <template v-else>
            <div class="form-group">
              <label>Usuario</label>
              <input v-model="formMedico.user" type="text" :disabled="modoEdicion" required placeholder="Ej: medico1" />
            </div>
            <div class="form-group">
              <label>Contraseña</label>
              <input v-model="formMedico.password" type="text" :placeholder="modoEdicion ? 'Dejar en blanco para no cambiar' : 'Obligatorio'" :required="!modoEdicion" />
            </div>
            <div class="form-group">
              <label>Nombre Completo</label>
              <input v-model="formMedico.nombre" type="text" required />
            </div>
            <div class="form-group">
              <label>Especialidad</label>
              <select v-model="formMedico.especialidad" required>
                <option v-for="esp in agenda.especialidades" :key="esp.id" :value="esp.id">{{ esp.nombre }}</option>
              </select>
            </div>
          </template>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="modalAbierto = false">Cancelar</button>
            <button type="submit" class="btn-save">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.admin-content {
  flex: 1;
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.header-section h1 { font-family: var(--font-display); color: var(--color-primary); margin: 0 0 4px 0; }
.subtitle { color: var(--color-text-secondary); margin: 0; }

.tabs-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--color-border);
}
.tab-btn {
  background: none; border: none;
  font-size: 1.125rem;
  font-weight: bold;
  padding: 12px 24px;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}
.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.table-container {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
.data-table th { background: var(--color-bg); color: var(--color-text-secondary); font-weight: bold; }
.actions-cell { display: flex; gap: 8px; }
.icon-btn { background: none; border: none; font-size: 1.25rem; cursor: pointer; border-radius: 4px; padding: 4px; }
.icon-btn:hover { background: var(--color-bg); }
.empty-state { text-align: center; color: var(--color-text-secondary); padding: 2rem !important; }

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: var(--radius);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow);
}
.modal-content h2 { margin-top: 0; margin-bottom: 1.5rem; color: var(--color-primary); }

.form-grid { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-weight: bold; font-size: 0.9rem; }
.form-group input, .form-group select {
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 1.5rem;
}
.btn-cancel, .btn-save {
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-weight: bold;
  cursor: pointer;
}
.btn-cancel { background: white; border: 1px solid var(--color-border); }
.btn-save { background: var(--color-primary); color: white; border: none; }
</style>
