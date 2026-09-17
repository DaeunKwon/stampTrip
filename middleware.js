export const config = {
  // /api/* 는 Vercel Cron 이 부르는 서버 함수라 Basic Auth 대상에서 뺀다 (자체 CRON_SECRET 으로 인증)
  // /ota/* 는 설치된 앱이 새 웹 번들을 받아 가는 경로라 인증 없이 열어 둔다
  matcher: '/((?!api/|ota/).*)',
}

export default function middleware(request) {
  const user = process.env.BASIC_AUTH_USER
  const pass = process.env.BASIC_AUTH_PASS

  // 환경 변수가 설정되지 않으면 인증을 건너뛴다 (로컬 개발 등)
  if (!user || !pass) return

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice(6))
    const separatorIndex = decoded.indexOf(':')
    const inputUser = decoded.slice(0, separatorIndex)
    const inputPass = decoded.slice(separatorIndex + 1)
    if (inputUser === user && inputPass === pass) return
  }

  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="stamp-trip"' },
  })
}
