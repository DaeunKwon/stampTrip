// navigator.geolocation 페이크: 테스트에서 gps.emit(...) / gps.fail(...) 로 위치를 밀어 넣는다
import { vi } from 'vitest'

export const gps = {
  success: null,
  error: null,
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
  emit({ lat, lng, accuracy = 10 }) {
    this.success?.({ coords: { latitude: lat, longitude: lng, accuracy } })
  },
  fail(message = 'User denied Geolocation') {
    this.error?.({ code: 1, message })
  },
}

export function installGeolocation() {
  gps.success = null
  gps.error = null
  gps.watchPosition = vi.fn((success, error) => {
    gps.success = success
    gps.error = error
    return 1
  })
  gps.clearWatch = vi.fn()
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { watchPosition: gps.watchPosition, clearWatch: gps.clearWatch, getCurrentPosition: vi.fn() },
  })
}

export function resetGeolocation() {
  gps.success = null
  gps.error = null
}
