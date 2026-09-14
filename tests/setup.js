// 모든 vitest 테스트 공통 준비: 외부 의존성(Supabase · 카카오맵 · TourAPI · GPS)을 페이크로 바꾼다
import '@testing-library/jest-dom/vitest'
import { vi, beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { fake as fakeSupabase } from './mocks/supabase'
import { fakeMaps, resetKakao } from './mocks/kakao'
import { installFetchRouter, resetFetchRouter } from './mocks/tourApi'
import { installGeolocation, resetGeolocation } from './mocks/geolocation'

vi.mock('../src/api/supabase', () => import('./mocks/supabase'))
export const loadKakaoMapMock = vi.fn(() => Promise.resolve(fakeMaps))
vi.mock('../src/api/kakaoMap', async importOriginal => ({
  ...(await importOriginal()),
  loadKakaoMap: (...a) => loadKakaoMapMock(...a),
}))

// Node 22+ 는 전역 localStorage 를 이미 갖고 있어(--localstorage-file 없으면 undefined) vitest 가 jsdom 것을 넣어주지 않는다.
// 앱은 getItem/setItem 만 쓰므로 메모리 Storage 로 대체한다.
class MemoryStorage {
  #m = new Map()
  get length() { return this.#m.size }
  key(i) { return [...this.#m.keys()][i] ?? null }
  getItem(k) { return this.#m.has(String(k)) ? this.#m.get(String(k)) : null }
  setItem(k, v) { this.#m.set(String(k), String(v)) }
  removeItem(k) { this.#m.delete(String(k)) }
  clear() { this.#m.clear() }
}
for (const key of ['localStorage', 'sessionStorage']) {
  Object.defineProperty(globalThis, key, { value: new MemoryStorage(), configurable: true, writable: true })
}

// jsdom 에 없는 브라우저 API (tests/node/** 는 node 환경이라 건너뛴다)
const hasDom = typeof document !== 'undefined'
if (hasDom) {
  Element.prototype.scrollIntoView = () => {}
  window.scrollTo = () => {}
  window.kakao = { maps: fakeMaps }
}

beforeEach(() => {
  if (!hasDom) return
  loadKakaoMapMock.mockReset().mockImplementation(() => Promise.resolve(fakeMaps))
  fakeSupabase.reset()
  resetKakao()
  resetFetchRouter()
  installFetchRouter()
  installGeolocation()
  localStorage.clear()
})

afterEach(() => {
  if (!hasDom) return
  cleanup()
  resetGeolocation()
})
