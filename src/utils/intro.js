// 앱 첫 진입 인트로(스플래시의 큰 아이콘 → 로그인 화면 제자리로) 의 진행 상태.
// 스플래시와 로그인 화면이 서로 다른 트리라, 언제 시작했고 이미 재생했는지를 모듈에 둔다.
export const intro = {
  startedAt: null,     // 스플래시가 처음 그려진 시각
  splashEndedAt: null, // 스플래시가 마지막으로 사라진 시각
  played: false,       // 앱을 켠 뒤 한 번만 재생한다 (로그아웃 후 재진입 때는 생략)
}

/** 큰 아이콘이 최소한 이만큼은 보인 뒤에 움직이기 시작한다 (ms) */
const HOLD_MS = 1200

/** 지금 로그인 화면이 떴다면 인트로를 재생할지, 재생한다면 몇 ms 뒤에 아이콘이 움직일지. 재생하지 않으면 null */
export function takeIntroDelay() {
  if (intro.played) return null
  intro.played = true
  const now = performance.now()
  // 스플래시에서 곧바로 넘어온 경우에만 재생 (앱을 쓰다가 로그아웃해서 온 경우는 제외)
  if (intro.splashEndedAt === null || now - intro.splashEndedAt > 500) return null
  return Math.max(150, HOLD_MS - (now - intro.startedAt))
}
