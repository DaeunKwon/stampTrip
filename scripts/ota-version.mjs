// OTA 번들 버전: "<커밋 시각(epoch 초)>-<커밋 해시 7자>"  예) 1789645200-9fb0620
// 같은 커밋이면 Vercel 빌드(서버 번들)와 로컬 빌드(APK 내장 번들)가 같은 값을 갖고, 앞쪽 숫자로 최신 여부를 비교한다.
// git 을 못 쓰는 환경이면 빌드 시각으로 대체한다 (항상 기존 번들보다 새 것으로 취급됨).
import { execSync } from 'node:child_process'

function git(args) {
  try { return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return '' }
}

export function computeBundleVersion() {
  const sha = (process.env.VERCEL_GIT_COMMIT_SHA || git('rev-parse HEAD')).slice(0, 7)
  const time = Number(git('log -1 --format=%ct')) || Math.floor(Date.now() / 1000)
  return `${time}-${sha || 'nogit'}`
}
