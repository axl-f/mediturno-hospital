<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useAgendaStore } from '../../stores/agenda'
import { useRouter } from 'vue-router'
import { get, ref as dbRef } from 'firebase/database'
import { db } from '../../firebase'
import AppHeader from '../../components/layout/AppHeader.vue'
import BigButton from '../../components/shared/BigButton.vue'
import LoadingSpinner from '../../components/shared/LoadingSpinner.vue'

const auth = useAuthStore()
const agenda = useAgendaStore()
const router = useRouter()

onMounted(() => {
  agenda.cargarEspecialidades()
  agenda.suscribirListaEspera()
})

// ── Notificaciones de lista de espera ──────────────────────────────────────
const notificaciones = computed(() => {
  if (!auth.usuario?.rut) return []
  const result: any[] = []
  for (const espId in agenda.listaEspera) {
    const queue = agenda.listaEspera[espId]
    for (const p of queue) {
      if (p.rut === auth.usuario.rut && p.notificado) {
        const esp = agenda.especialidades.find(e => e.id === espId)
        result.push({
          especialidadId: espId,
          especialidadNombre: esp ? esp.nombre : espId,
          fechaEsperada: p.fechaEsperada || ''
        })
      }
    }
  }
  return result
})

const agendarDesdeNotificacion = (notif: any) => {
  if (notif.fechaEsperada) {
    router.push(`/paciente/horarios/${notif.especialidadId}/${notif.fechaEsperada}`)
  } else {
    router.push('/paciente/especialidad')
  }
}

// ── Agendamiento Automático ────────────────────────────────────────────────
const modalAbierto = ref(false)
const paso = ref<'seleccion' | 'buscando' | 'confirmado' | 'sinCupos' | 'enEspera'>('seleccion')
const especialidadElegida = ref<any>(null)
const resultadoCita = ref<{ fecha: string; hora: string; especialidad: string } | null>(null)

const abrirAsistente = () => {
  paso.value = 'seleccion'
  especialidadElegida.value = null
  resultadoCita.value = null
  modalAbierto.value = true
}

const cerrarAsistente = () => {
  modalAbierto.value = false
}

const elegirEspecialidad = async (esp: any) => {
  especialidadElegida.value = esp
  paso.value = 'buscando'
  await buscarYReservar(esp.id)
}

// Busca el primer slot libre en Firebase y reserva automáticamente
const buscarYReservar = async (especialidadId: string) => {
  try {
    const snap = await get(dbRef(db, `agenda/${especialidadId}`))
    if (!snap.exists()) { paso.value = 'sinCupos'; return }

    const data = snap.val()
    const hoy = new Date()
    const todayIso = hoy.toISOString().split('T')[0]

    // Ordenar fechas y filtrar las futuras o de hoy
    const fechas = Object.keys(data).sort()
    
    for (const fecha of fechas) {
      if (fecha < todayIso) continue // saltar pasadas
      const horarios = data[fecha]
      // Buscar primer horario libre (valor === true)
      const horasLibres = Object.keys(horarios)
        .filter(h => horarios[h] === true)
        .sort()
      
      if (horasLibres.length === 0) continue

      const hora = horasLibres[0]

      // Reservar la cita
      await agenda.crearCita({
        pacienteRut: auth.usuario!.rut!,
        pacienteNombre: auth.usuario!.nombre,
        especialidad: especialidadId,
        fecha,
        hora,
      })

      resultadoCita.value = { fecha, hora, especialidad: especialidadElegida.value?.nombre || especialidadId }
      paso.value = 'confirmado'
      return
    }

    // No encontró ningún slot libre
    paso.value = 'sinCupos'
  } catch (err) {
    console.error(err)
    paso.value = 'sinCupos'
  }
}

const formatFecha = (iso: string) => {
  const [y, m, d] = iso.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
}

const unirseEspera = async () => {
  if (!especialidadElegida.value || !auth.usuario?.rut) return
  await agenda.unirseListaEspera(
    especialidadElegida.value.id,
    auth.usuario.rut,
    auth.usuario.nombre,
    ''
  )
  paso.value = 'enEspera'
}
</script>

<template>
  <div class="page-layout">
    <AppHeader />

    <main class="content-container">
      <h1 class="greeting">Hola, {{ auth.usuario?.nombre }}</h1>

      <!-- Notificaciones de lista de espera -->
      <div v-if="notificaciones.length > 0" class="notificaciones-container">
        <div
          v-for="(notif, i) in notificaciones"
          :key="i"
          class="notificacion-card"
          @click="agendarDesdeNotificacion(notif)"
        >
          <div class="notif-icon">🔔</div>
          <div class="notif-content">
            <h3>¡Cupo liberado para usted!</h3>
            <p>Se ha liberado un cupo en <strong>{{ notif.especialidadNombre }}</strong> para la fecha <strong>{{ notif.fechaEsperada || 'solicitada' }}</strong>. Presione aquí para agendar su hora.</p>
          </div>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="action-area">
        <!-- Botón principal: Agendamiento automático -->
        <button class="auto-btn" @click="abrirAsistente">
          <div class="auto-btn-icon">⚡</div>
          <div class="auto-btn-text">
            <span class="auto-btn-title">Pedir hora automáticamente</span>
            <span class="auto-btn-sub">El sistema busca y reserva el primer cupo disponible</span>
          </div>
          <div class="auto-btn-arrow">→</div>
        </button>

        <div class="divider-row"><span>o elija usted mismo</span></div>

        <BigButton
          label="Escoger hora manualmente"
          variant="secondary"
          size="md"
          icon="📅"
          @click="router.push('/paciente/especialidad')"
        />

        <BigButton
          label="Mis citas"
          variant="ghost"
          size="md"
          @click="router.push('/paciente/mis-citas')"
        />
      </div>
    </main>

    <!-- ── Modal Asistente Automático ─────────────────────────────────────── -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarAsistente">
      <div class="modal-card">
        <button class="modal-close" @click="cerrarAsistente">✕</button>

        <!-- Paso 1: Selección de especialidad -->
        <div v-if="paso === 'seleccion'">
          <div class="modal-header">
            <div class="modal-icon">🏥</div>
            <h2>¿A qué especialista desea ver?</h2>
            <p>Seleccione y reservaremos el primer cupo disponible automáticamente.</p>
          </div>
          <div class="esp-grid">
            <button
              v-for="esp in agenda.especialidades"
              :key="esp.id"
              class="esp-card"
              @click="elegirEspecialidad(esp)"
            >
              <span class="esp-icon">{{ esp.icono }}</span>
              <span class="esp-nombre">{{ esp.nombre }}</span>
            </button>
          </div>
        </div>

        <!-- Paso 2: Buscando -->
        <div v-else-if="paso === 'buscando'" class="step-center">
          <LoadingSpinner color="var(--color-primary)" />
          <h2>Buscando cupo disponible...</h2>
          <p>Estamos reservando el primer horario libre en <strong>{{ especialidadElegida?.nombre }}</strong>.</p>
        </div>

        <!-- Paso 3: Confirmado -->
        <div v-else-if="paso === 'confirmado'" class="step-center">
          <div class="success-circle">✓</div>
          <h2>¡Hora reservada con éxito!</h2>
          <div class="cita-resumen">
            <div class="resumen-row">
              <span class="resumen-label">Especialidad</span>
              <span class="resumen-val">{{ resultadoCita?.especialidad }}</span>
            </div>
            <div class="resumen-row">
              <span class="resumen-label">Fecha</span>
              <span class="resumen-val capitalize">{{ resultadoCita ? formatFecha(resultadoCita.fecha) : '' }}</span>
            </div>
            <div class="resumen-row">
              <span class="resumen-label">Hora</span>
              <span class="resumen-val">{{ resultadoCita?.hora }}</span>
            </div>
          </div>
          <p class="confirm-note">Su cita ha sido registrada. Puede verla en "Mis citas".</p>
          <BigButton label="Entendido, cerrar" variant="success" @click="cerrarAsistente" />
        </div>

        <!-- Paso 4: Sin cupos -->
        <div v-else-if="paso === 'sinCupos'" class="step-center">
          <div class="warn-circle">!</div>
          <h2>Sin cupos disponibles</h2>
          <p>No hay horarios para <strong>{{ especialidadElegida?.nombre }}</strong> en este momento.</p>
          <div class="no-cupos-actions">
            <button class="waitlist-btn" @click="unirseEspera">
              <span class="waitlist-icon">⏳</span>
              <div class="waitlist-text">
                <span class="waitlist-title">Anotarme en lista de espera</span>
                <span class="waitlist-sub">Le avisaremos cuando haya un cupo disponible</span>
              </div>
            </button>
            <BigButton label="Intentar otra especialidad" variant="secondary" @click="paso = 'seleccion'" />
            <BigButton label="Cerrar" variant="ghost" @click="cerrarAsistente" />
          </div>
        </div>

        <!-- Paso 5: Anotado en espera -->
        <div v-else-if="paso === 'enEspera'" class="step-center">
          <div class="wait-circle">⏳</div>
          <h2>¡Anotado en lista de espera!</h2>
          <p>Lo notificaremos en cuanto se libere un cupo en <strong>{{ especialidadElegida?.nombre }}</strong>. La notificación aparecerá en su pantalla de inicio.</p>
          <BigButton label="Entendido, cerrar" variant="success" @click="cerrarAsistente" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-layout {
  min-height: 100vh;
  background: var(--color-bg);
}

.content-container {
  max-width: 560px;
  margin: 0 auto;
  padding: 2rem 1.5rem 6rem;
}

.greeting {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 2rem;
  text-align: center;
}

/* Notificaciones */
.notificaciones-container {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notificacion-card {
  background: var(--color-success-light);
  border: 2px solid var(--color-success);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}
.notificacion-card:hover { transform: translateY(-2px); }
.notif-icon { font-size: 1.75rem; }
.notif-content h3 { color: var(--color-success); margin: 0 0 4px 0; font-size: 1.1rem; }
.notif-content p { margin: 0; font-size: 0.95rem; line-height: 1.4; }

/* Área de acciones */
.action-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Botón auto-agenda */
.auto-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1.5rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--color-primary), #1a7bc4);
  color: white;
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 6px 20px rgba(26, 95, 158, 0.35);
}
.auto-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(26, 95, 158, 0.45); }
.auto-btn:active { transform: scale(0.98); }

.auto-btn-icon { font-size: 2rem; min-width: 40px; text-align: center; }
.auto-btn-text { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.auto-btn-title { font-size: 1.2rem; font-weight: 700; }
.auto-btn-sub { font-size: 0.85rem; opacity: 0.85; }
.auto-btn-arrow { font-size: 1.5rem; opacity: 0.7; }

.divider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
.divider-row::before, .divider-row::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 24px 64px rgba(0,0,0,0.25);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;
}
.modal-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
.modal-header h2 { font-family: var(--font-display); color: var(--color-primary); margin: 0 0 6px 0; font-size: 1.4rem; }
.modal-header p { color: var(--color-text-secondary); margin: 0; font-size: 0.95rem; }

/* Grid especialidades */
.esp-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.esp-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 1.25rem 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}
.esp-card:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
  transform: translateY(-2px);
}
.esp-icon { font-size: 2rem; }
.esp-nombre { text-align: center; line-height: 1.2; }

/* Pasos loading/confirmado/error */
.step-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 1rem 0;
}
.step-center h2 { font-family: var(--font-display); color: var(--color-primary); margin: 0; }
.step-center p { color: var(--color-text-secondary); margin: 0; }

.success-circle {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: var(--color-success);
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.warn-circle {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: var(--color-warning);
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes pop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

.cita-resumen {
  background: var(--color-bg);
  border-radius: 12px;
  padding: 1.25rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.resumen-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
}
.resumen-label { color: var(--color-text-secondary); }
.resumen-val { font-weight: 700; color: var(--color-text); }
.capitalize { text-transform: capitalize; }

.confirm-note {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.no-cupos-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

/* Botón lista de espera */
.waitlist-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1.25rem;
  border: 2px solid var(--color-warning, #f59e0b);
  border-radius: 12px;
  background: #fffbeb;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}
.waitlist-btn:hover {
  background: #fef3c7;
  transform: translateY(-1px);
}
.waitlist-icon { font-size: 1.75rem; min-width: 36px; text-align: center; }
.waitlist-text { display: flex; flex-direction: column; gap: 2px; }
.waitlist-title { font-weight: 700; font-size: 1rem; color: #92400e; }
.waitlist-sub { font-size: 0.8rem; color: #a16207; }

.wait-circle {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: #f59e0b;
  color: white;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>

