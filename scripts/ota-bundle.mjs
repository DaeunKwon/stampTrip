// 앱(OTA)용 웹 번들 묶기 — vite build 직후 실행 (Vercel 의 vercel-build 에서만 돈다)
//   dist/ 전체를 zip 으로 묶어 dist/ota/bundle-<버전>.zip 에 두고, dist/ota/version.json 에 최신 버전 정보를 쓴다.
//   설치된 앱(src/native/updater.js)이 version.json 을 확인해 새 번들이면 zip 을 내려받아 다음 실행부터 적용한다.
// 로컬 `npm run build` 는 이 스크립트를 돌리지 않으므로 APK 안에는 ota/ 폴더가 들어가지 않는다.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative, sep } from 'node:path'
import { zipSync } from 'fflate'

// 이 번들이 돌아가려면 필요한 네이티브 앱의 최소 versionCode.
// 새 네이티브 플러그인에 의존하는 웹 코드를 올릴 때 그 플러그인이 처음 들어간 versionCode 로 올린다
// → 그보다 낮은 앱은 이 번들을 받지 않고 스토어 업데이트를 기다린다.
const MIN_NATIVE_BUILD = 2

const DIST = new URL('../dist/', import.meta.url).pathname
const OTA_DIR = join(DIST, 'ota')

const { version } = JSON.parse(readFileSync(join(DIST, 'bundle-version.json'), 'utf8'))

rmSync(OTA_DIR, { recursive: true, force: true })

const files = {}
function collect(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) collect(path)
    else files[relative(DIST, path).split(sep).join('/')] = new Uint8Array(readFileSync(path))
  }
}
collect(DIST)
if (!files['index.html']) throw new Error('dist/index.html 이 없습니다 — vite build 를 먼저 실행하세요')

const zip = zipSync(files, { level: 9 })
const zipName = `bundle-${version}.zip`
mkdirSync(OTA_DIR, { recursive: true })
writeFileSync(join(OTA_DIR, zipName), zip)
writeFileSync(join(OTA_DIR, 'version.json'), JSON.stringify({
  version,
  url: `/ota/${zipName}`,
  checksum: createHash('sha256').update(zip).digest('hex'),
  minNativeBuild: MIN_NATIVE_BUILD,
}, null, 2))

console.log(`✔ OTA 번들 ${zipName} (${(zip.length / 1024).toFixed(0)}KB, 파일 ${Object.keys(files).length}개)`)
