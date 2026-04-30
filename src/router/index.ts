import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { transition: 'slide-left' }
    },
    // Flujo Paciente
    {
      path: '/paciente',
      name: 'paciente-home',
      component: () => import('../views/paciente/HomeView.vue'),
      meta: { requiresRole: 'paciente', transition: 'slide-left' }
    },
    {
      path: '/paciente/especialidad',
      name: 'paciente-especialidad',
      component: () => import('../views/paciente/EspecialidadView.vue'),
      meta: { requiresRole: 'paciente', transition: 'slide-left' }
    },
    {
      path: '/paciente/calendario/:especialidad',
      name: 'paciente-calendario',
      component: () => import('../views/paciente/CalendarioView.vue'),
      meta: { requiresRole: 'paciente', transition: 'slide-left' }
    },
    {
      path: '/paciente/horarios/:especialidad/:fecha',
      name: 'paciente-horarios',
      component: () => import('../views/paciente/HorariosView.vue'),
      meta: { requiresRole: 'paciente', transition: 'slide-left' }
    },
    {
      path: '/paciente/confirmar',
      name: 'paciente-confirmar',
      component: () => import('../views/paciente/ConfirmView.vue'),
      meta: { requiresRole: 'paciente', transition: 'slide-left' }
    },
    {
      path: '/paciente/mis-citas',
      name: 'paciente-miscitas',
      component: () => import('../views/paciente/MisCitasView.vue'),
      meta: { requiresRole: 'paciente', transition: 'slide-left' }
    },
    // Flujo Admin
    {
      path: '/admin',
      name: 'admin-agenda',
      component: () => import('../views/admin/AgendaView.vue'),
      meta: { requiresRole: 'admin', transition: 'slide-left' }
    },
    {
      path: '/admin/espera',
      name: 'admin-espera',
      component: () => import('../views/admin/ListaEsperaView.vue'),
      meta: { requiresRole: 'admin', transition: 'slide-left' }
    },
    {
      path: '/admin/alertas',
      name: 'admin-alertas',
      component: () => import('../views/admin/AlertasView.vue'),
      meta: { requiresRole: 'admin', transition: 'slide-left' }
    },
    {
      path: '/admin/usuarios',
      name: 'admin-usuarios',
      component: () => import('../views/admin/UsuariosView.vue'),
      meta: { requiresRole: 'admin', transition: 'slide-left' }
    },
    // Flujo Medico
    {
      path: '/medico',
      name: 'medico-agendahoy',
      component: () => import('../views/medico/AgendaHoyView.vue'),
      meta: { requiresRole: 'medico', transition: 'slide-left' }
    },
    {
      path: '/medico/checklist',
      name: 'medico-checklist',
      component: () => import('../views/medico/ChecklistView.vue'),
      meta: { requiresRole: 'medico', transition: 'slide-left' }
    },
    {
      path: '/medico/configuracion',
      name: 'medico-configuracion',
      component: () => import('../views/medico/ConfiguracionView.vue'),
      meta: { requiresRole: 'medico', transition: 'slide-left' }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  
  if (to.meta.requiresRole && (!auth.usuario || auth.usuario.rol !== to.meta.requiresRole)) {
    next('/')
  } else if (to.path === '/' && auth.usuario) {
    if (auth.usuario.rol === 'paciente') next('/paciente')
    else if (auth.usuario.rol === 'admin') next('/admin')
    else if (auth.usuario.rol === 'medico') next('/medico')
    else next()
  } else {
    next()
  }
})

export default router
