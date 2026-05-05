/**
 * useToast.ts
 * Composable global para mostrar notificaciones in-page.
 * Usar: const toast = useToast()
 *       toast.success('Operación exitosa')
 *       toast.error('Algo salió mal')
 */
import { ref } from 'vue'
import type { ToastType } from '../components/shared/ToastNotification.vue'

interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  const show = (message: string, type: ToastType = 'info', duration = 4000) => {
    const id = ++nextId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  const remove = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    remove,
    success: (msg: string, duration?: number) => show(msg, 'success', duration),
    error:   (msg: string, duration?: number) => show(msg, 'error',   duration),
    warning: (msg: string, duration?: number) => show(msg, 'warning', duration),
    info:    (msg: string, duration?: number) => show(msg, 'info',    duration),
  }
}
