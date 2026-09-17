// 네이티브 앱의 OTA(웹 번들 원격 교체).
// 화면·로직은 전부 웹 번들이라, 스토어 재배포 없이 서버(Vercel)에 올라간 새 번들로 바꿔 끼운다.
// 흐름: 앱 시작 → notifyAppReady(이 번들은 정상) → /ota/version.json 확인 → 새 버전이면 zip 을 백그라운드로 받아
//       "다음 번들"로 예약 → 앱을 종료했다 다시 열거나 5분 이상 백그라운드에 있다 돌아올 때 적용.
//       새 번들이 10초 안에 notifyAppReady 를 못 부르면(흰 화면 등) 플러그인이 이전 번들로 되돌린다.
// 서버 쪽 짝: scripts/ota-bundle.mjs (version.json · zip 생성), vercel.json (/ota 헤더)
import { App } from '@capacitor/app'
import { isNativeApp } from './platform'

const OTA_BASE_URL = import.meta.env.VITE_OTA_BASE_URL || 'https://stamp-trip.vercel.app'
const FAILED_KEY = 'otaFailedVersion' // 적용에 실패해 되돌려진 번들 버전 — 같은 걸 매번 다시 받지 않게 기억
const START_DELAY_MS = 3000 // 첫 화면 로딩과 겹치지 않게 잠깐 뒤에 확인
const RECHECK_MS = 60 * 60 * 1000 // 앱을 켜 둔 채 오래 쓰는 경우 포그라운드 복귀 때 다시 확인하는 최소 간격
const APPLY_AFTER_BACKGROUND_MS = 5 * 60 * 1000 // 잠깐 앱 전환(소셜 로그인·지도 앱)으로는 새로고침되지 않게

/** 버전 문자열 "<epoch 초>-<해시>" 의 시각 부분. 형식이 다르면 0 */
function versionTime(version) {
  const time = Number.parseInt(String(version ?? '').split('-')[0], 10)
  return Number.isFinite(time) ? time : 0
}

/** remote 가 current 보다 새 번들인지 */
export function isNewerBundle(remote, current) {
  return remote !== current && versionTime(remote) > versionTime(current)
}

/** version.json 내용 검증. 쓸 수 있으면 정규화해서 돌려주고 아니면 null */
export function parseOtaManifest(data, baseUrl = OTA_BASE_URL) {
  if (!data || typeof data.version !== 'string' || typeof data.url !== 'string') return null
  if (!versionTime(data.version) || !/^[0-9a-f]{64}$/.test(data.checksum ?? '')) return null
  return {
    version: data.version,
    url: new URL(data.url, baseUrl).toString(),
    checksum: data.checksum,
    minNativeBuild: Number(data.minNativeBuild) || 0,
  }
}

function readFailedVersion() {
  try { return localStorage.getItem(FAILED_KEY) } catch { return null }
}
function writeFailedVersion(version) {
  try { localStorage.setItem(FAILED_KEY, version) } catch { /* 저장 못 해도 동작에는 지장 없음 */ }
}

let checking = false
let lastCheckedAt = 0

async function checkForUpdate(CapacitorUpdater) {
  if (checking) return
  checking = true
  lastCheckedAt = Date.now()
  try {
    const res = await fetch(`${OTA_BASE_URL}/ota/version.json`, { cache: 'no-store' })
    if (!res.ok) return
    const manifest = parseOtaManifest(await res.json())
    if (!manifest || !isNewerBundle(manifest.version, __BUNDLE_VERSION__)) return
    if (manifest.version === readFailedVersion()) return

    // 이 번들이 요구하는 네이티브 앱보다 낮으면 받지 않는다 (스토어 업데이트가 먼저)
    const { build } = await App.getInfo()
    if (Number(build) < manifest.minNativeBuild) return

    // 이미 받아 둔 번들이면 다시 받지 않는다
    const { bundles } = await CapacitorUpdater.list()
    const bundle = bundles.find(b => b.version === manifest.version && b.status !== 'error')
      ?? await CapacitorUpdater.download({ url: manifest.url, version: manifest.version, checksum: manifest.checksum })

    await CapacitorUpdater.next({ id: bundle.id })
    await CapacitorUpdater.setMultiDelay({
      delayConditions: [{ kind: 'background', value: String(APPLY_AFTER_BACKGROUND_MS) }],
    })
  } catch (e) {
    // 오프라인·다운로드 실패 등 — 지금 번들로 계속 쓰고 다음 기회에 다시 시도
    console.warn('[ota] 업데이트 확인 실패:', e?.message ?? e)
  } finally {
    checking = false
  }
}

/** 앱 첫 화면이 그려진 뒤 한 번 호출한다 (App.jsx). 브라우저·PWA 에서는 아무것도 하지 않는다. */
export async function initOta() {
  if (!isNativeApp) return
  const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
  // 이 번들이 정상적으로 떴음을 알린다 — 안 부르면 플러그인이 실패로 보고 이전 번들로 되돌린다
  await CapacitorUpdater.notifyAppReady()

  // 직전 번들이 실패해 되돌려졌다면(플러그인이 기록해 둠) 그 버전은 다시 받지 않는다. 다음 커밋은 버전이 달라 정상 진행
  const failed = await CapacitorUpdater.getFailedUpdate().catch(() => null)
  if (failed?.bundle?.version) writeFailedVersion(failed.bundle.version)

  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive && Date.now() - lastCheckedAt > RECHECK_MS) checkForUpdate(CapacitorUpdater)
  })
  setTimeout(() => checkForUpdate(CapacitorUpdater), START_DELAY_MS)
}
