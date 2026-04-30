<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { db } from '../../firebase'
import { ref as dbRef, update } from 'firebase/database'
import AppNav from '../../components/layout/AppNav.vue'
import BigButton from '../../components/shared/BigButton.vue'
import LoadingSpinner from '../../components/shared/LoadingSpinner.vue'

const auth = useAuthStore()

// Get tomorrow as min date
const minDate = new Date()
minDate.setDate(minDate.getDate() + 1)
const fechaInput = ref(minDate.toISOString().split('T')[0])

// Horario base de ejemplo (8:00 a 17:00, 30 min)
const horariosDisponibles = ref([
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
])

const horariosSeleccionados = ref<string[]>([...horariosDisponibles.value])

const toggleHorario = (hora: string) => {
  const index = horariosSeleccionados.value.indexOf(hora)
  if (index >= 0) {
    horariosSeleccionados.value.splice(index, 1)
  } else {
    horariosSeleccionados.value.push(hora)
    horariosSeleccionados.value.sort()
  }
}

const guardando = ref(false)
const mensajeExito = ref('')

const guardarDisponibilidad = async () => {
  if (!auth.usuario?.especialidad || !fechaInput.value) return
  
  guardando.value = true
  mensajeExito.value = ''
  
  try {
    const dataAguardar: Record<string, null> = {}
    horariosSeleccionados.value.forEach(h => {
      dataAguardar[h] = null // null means available in our RTDB structure
    })

    const path = `agenda/${auth.usuario.especialidad}/${fechaInput.value}`
    await update(dbRef(db), {
      [path]: dataAguardar
    })

    mensajeExito.value = '¡Horarios guardados correctamente!'
    setTimeout(() => mensajeExito.value = '', 3000)
  } catch (err) {
    console.error(err)
    alert('Error al guardar horarios')
  } finally {
    guardando.value = false
  }
}

const seleccionarTodos = () => {
  horariosSeleccionados.value = [...horariosDisponibles.value]
}

const limpiarTodos = () => {
  horariosSeleccionados.value = []
}
</script>

<template>
  <div class="medico-layout">
    <AppNav>
      <router-link to="/medico" class="nav-link">📅 Agenda de Hoy</router-link>
      <router-link to="/medico/checklist" class="nav-link">✅ Checklist</router-link>
      <router-link to="/medico/configuracion" class="nav-link">⚙️ Disponibilidad</router-link>
    </AppNav>
    
    <main class="medico-content">
      <div class="header-section">
        <h1>Configurar Disponibilidad</h1>
        <p class="subtitle">Seleccione la fecha y los horarios en los que atenderá.</p>
      </div>

      <div class="config-container">
        <div class="form-group">
          <label for="fecha">Día a configurar:</label>
          <input type="date" id="fecha" v-model="fechaInput" class="fecha-input" :min="minDate.toISOString().split('T')[0]">
        </div>

        <div class="horarios-section">
          <div class="horarios-header">
            <h3>Horarios Laborales</h3>
            <div class="bulk-actions">
              <button class="text-btn" @click="seleccionarTodos">Seleccionar Todos</button>
              <button class="text-btn text-danger" @click="limpiarTodos">Limpiar</button>
            </div>
          </div>

          <div class="grid-horarios">
            <button 
              v-for="h in horariosDisponibles" 
              :key="h"
              class="horario-btn"
              :class="{ selected: horariosSeleccionados.includes(h) }"
              @click="toggleHorario(h)"
            >
              {{ h }}
            </button>
          </div>
        </div>

        <div class="action-footer">
          <p v-if="mensajeExito" class="success-msg">{{ mensajeExito }}</p>
          <BigButton 
            v-if="!guardando"
            label="Guardar Configuración" 
            variant="primary" 
            @click="guardarDisponibilidad" 
            :disabled="horariosSeleccionados.length === 0"
          />
          <LoadingSpinner v-else color="var(--color-primary)" />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.medico-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.medico-content {
  flex: 1;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.header-section { margin-bottom: 2rem; }
.header-section h1 { font-family: var(--font-display); color: var(--color-primary); margin: 0 0 4px 0; }
.subtitle { color: var(--color-text-secondary); margin: 0; }

.config-container {
  background: white;
  border-radius: var(--radius);
  padding: 2rem;
  box-shadow: var(--shadow);
}

.form-group {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-group label { font-weight: bold; font-size: 1.125rem; }
.fecha-input {
  padding: 12px;
  font-size: 1.125rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  width: 100%;
  max-width: 300px;
}

.horarios-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.horarios-header h3 { margin: 0; }
.bulk-actions { display: flex; gap: 1rem; }
.text-btn {
  background: none; border: none;
  color: var(--color-primary);
  font-weight: bold;
  cursor: pointer;
  text-decoration: underline;
}
.text-danger { color: var(--color-danger); }

.grid-horarios {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-bottom: 2rem;
}

.horario-btn {
  padding: 12px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: white;
  font-size: 1.125rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-text-secondary);
}
.horario-btn:hover { border-color: var(--color-primary); }
.horario-btn.selected {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.action-footer {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
  border-top: 1px solid var(--color-border);
  padding-top: 2rem;
}
.success-msg {
  color: var(--color-success);
  font-weight: bold;
  margin: 0;
}
</style>
