// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { parseAuthDeepLink } from '../src/native/auth'

const L = 'stamptrip://auth/callback'

describe('parseAuthDeepLink — 소셜 로그인 딥링크 파싱', () => {
  it('해시에 실린 access/refresh 토큰을 뽑는다 (implicit flow)', () => {
    expect(parseAuthDeepLink(`${L}#access_token=AT&refresh_token=RT&expires_in=3600&token_type=bearer`))
      .toEqual({ access_token: 'AT', refresh_token: 'RT' })
  })
  it('쿼리에 실려와도 처리한다', () => {
    expect(parseAuthDeepLink(`${L}?access_token=AT&refresh_token=RT`)).toEqual({ access_token: 'AT', refresh_token: 'RT' })
  })
  it('오류 응답은 error_description 을 우선 돌려준다', () => {
    expect(parseAuthDeepLink(`${L}#error=access_denied&error_description=User+cancelled`)).toEqual({ error: 'User cancelled' })
    expect(parseAuthDeepLink(`${L}?error=server_error`)).toEqual({ error: 'server_error' })
  })
  it('토큰이 빠지면 오류로 취급한다', () => {
    expect(parseAuthDeepLink(`${L}#access_token=AT`)).toEqual({ error: '인증 토큰이 없습니다' })
  })
  it('우리 딥링크가 아니면 null', () => {
    expect(parseAuthDeepLink('stamptrip://other')).toBeNull()
    expect(parseAuthDeepLink(undefined)).toBeNull()
  })
})
