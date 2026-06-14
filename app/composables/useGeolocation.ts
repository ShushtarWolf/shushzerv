export function useGeolocation() {
  const coords = ref<{ lat: number; lng: number } | null>(null)
  const error = ref('')
  const pending = ref(false)

  function request() {
    if (!import.meta.client || !navigator.geolocation) {
      error.value = 'unsupported'
      return
    }
    pending.value = true
    error.value = ''
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        coords.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        pending.value = false
      },
      () => {
        error.value = 'denied'
        pending.value = false
      },
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }

  function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  return { coords, error, pending, request, distanceKm }
}
