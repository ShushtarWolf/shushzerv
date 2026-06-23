export type ToastTone = 'success' | 'error' | 'info'

export type ToastItem = {
  id: number
  message: string
  tone: ToastTone
}

const toasts = ref<ToastItem[]>([])
let nextId = 1

function push(message: string, tone: ToastTone, duration = 4000) {
  const id = nextId++
  toasts.value = [...toasts.value, { id, message, tone }]
  if (import.meta.client) {
    window.setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, duration)
  }
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error'),
    info: (message: string) => push(message, 'info'),
    dismiss: (id: number) => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    },
  }
}
