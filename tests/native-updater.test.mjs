// OTA: 서버 번들 버전 비교 · version.json 검증 (src/native/updater.js 의 순수 함수)
import { describe, it, expect } from 'vitest'
import { isNewerBundle, parseOtaManifest, pickDownloadedBundle } from '../src/native/updater'

const SUM = 'a'.repeat(64)

describe('isNewerBundle — 서버 번들이 지금 번들보다 새 것인지', () => {
  it('커밋 시각이 더 늦으면 새 번들', () => {
    expect(isNewerBundle('1789700000-bbbbbbb', '1789600000-aaaaaaa')).toBe(true)
  })
  it('같은 버전이면 받지 않는다', () => {
    expect(isNewerBundle('1789600000-aaaaaaa', '1789600000-aaaaaaa')).toBe(false)
  })
  it('서버가 더 오래된 번들이면 받지 않는다 (아직 push 안 한 커밋으로 만든 APK)', () => {
    expect(isNewerBundle('1789600000-aaaaaaa', '1789700000-bbbbbbb')).toBe(false)
  })
  it('형식이 깨진 버전은 새 것으로 보지 않는다', () => {
    expect(isNewerBundle('latest', '1789600000-aaaaaaa')).toBe(false)
    expect(isNewerBundle(undefined, '1789600000-aaaaaaa')).toBe(false)
  })
})

describe('parseOtaManifest — version.json 검증', () => {
  const ok = { version: '1789700000-bbbbbbb', url: '/ota/bundle-1789700000-bbbbbbb.zip', checksum: SUM, minNativeBuild: 2 }

  it('상대 경로 url 을 서버 주소 기준 절대 주소로 바꾼다', () => {
    expect(parseOtaManifest(ok, 'https://stamp-trip.vercel.app')).toEqual({
      ...ok, url: 'https://stamp-trip.vercel.app/ota/bundle-1789700000-bbbbbbb.zip',
    })
  })
  it('minNativeBuild 가 없으면 0 (제한 없음)', () => {
    const { minNativeBuild: _, ...rest } = ok
    expect(parseOtaManifest(rest, 'https://x.test').minNativeBuild).toBe(0)
  })
  it('필드가 빠졌거나 체크섬이 sha256 이 아니면 null', () => {
    expect(parseOtaManifest(null)).toBeNull()
    expect(parseOtaManifest({ ...ok, url: undefined })).toBeNull()
    expect(parseOtaManifest({ ...ok, checksum: 'abc' })).toBeNull()
    expect(parseOtaManifest({ ...ok, version: 'latest' })).toBeNull()
  })
})

describe('pickDownloadedBundle — 시작할 때 갈아탈 번들 고르기', () => {
  const CURRENT = '1789600000-aaaaaaa'
  const b = (version, status = 'pending', id = version) => ({ id, version, status })

  it('받아 둔 것 중 지금보다 새 번들, 여러 개면 가장 최신', () => {
    const list = [b('builtin', 'success'), b('1789700000-bbbbbbb'), b('1789800000-ccccccc')]
    expect(pickDownloadedBundle(list, CURRENT, null).version).toBe('1789800000-ccccccc')
  })
  it('지금 번들과 같거나 오래된 것뿐이면 null', () => {
    expect(pickDownloadedBundle([b(CURRENT, 'success'), b('1789500000-0000000')], CURRENT, null)).toBeNull()
    expect(pickDownloadedBundle([], CURRENT, null)).toBeNull()
  })
  it('오류 상태이거나 적용에 실패했던 버전은 고르지 않는다', () => {
    expect(pickDownloadedBundle([b('1789700000-bbbbbbb', 'error')], CURRENT, null)).toBeNull()
    expect(pickDownloadedBundle([b('1789700000-bbbbbbb')], CURRENT, '1789700000-bbbbbbb')).toBeNull()
  })
})
