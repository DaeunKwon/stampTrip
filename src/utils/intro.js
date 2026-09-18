// 앱 첫 진입 인트로(빈 스플래시 → 로그인 화면의 아이콘이 제자리에서 통 하고 등장 → 문구·버튼) 의 진행 상태.
// 스플래시와 로그인 화면이 서로 다른 트리라, 스플래시가 언제 끝났고 이미 재생했는지를 모듈에 둔다.
export const intro = {
  splashEndedAt: null, // 스플래시가 마지막으로 사라진 시각
  played: false,       // 앱을 켠 뒤 한 번만 재생한다 (로그아웃 후 재진입 때는 생략)
}

/** 지금 로그인 화면이 떴다면 인트로를 재생할지. 호출하면 재생한 것으로 기록된다. */
export function takeIntro() {
  if (intro.played) return false
  intro.played = true
  // 스플래시에서 곧바로 넘어온 경우에만 재생 (앱을 쓰다가 로그아웃해서 온 경우는 제외)
  return intro.splashEndedAt !== null && performance.now() - intro.splashEndedAt <= 500
}
