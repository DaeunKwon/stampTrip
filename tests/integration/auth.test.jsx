import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/render'
import { fake, makeUser, TEST_USER_ID } from '../mocks/supabase'

describe('인증 · 온보딩 흐름', () => {
  it('비로그인 상태로 보호 라우트에 들어가면 로그인 화면으로 보낸다', async () => {
    renderApp({ route: '/my/stamps' })
    expect(await screen.findByRole('button', { name: /카카오로 시작하기/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Google로 시작하기/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/terms')
  })

  it('카카오 버튼을 누르면 계정 선택을 강제하는 OAuth 요청을 보내고 버튼이 잠긴다', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/login' })
    const kakao = await screen.findByRole('button', { name: /카카오로 시작하기/ })
    await user.click(kakao)
    expect(fake.client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'kakao',
      options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
    })
    expect(screen.getByRole('button', { name: /카카오 로그인 중/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Google로 시작하기/ })).toBeDisabled()
  })

  it('OAuth 시작이 실패하면 토스트를 띄우고 버튼을 다시 연다', async () => {
    const user = userEvent.setup()
    fake.client.auth.signInWithOAuth.mockResolvedValueOnce({ data: null, error: { message: 'boom' } })
    renderApp({ route: '/login' })
    await user.click(await screen.findByRole('button', { name: /Google로 시작하기/ }))
    expect(await screen.findByText('로그인에 실패했어요. 다시 시도해 주세요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Google로 시작하기/ })).toBeEnabled()
  })

  it('소셜 인증에서 돌아온 URL 해시에 error 가 있으면 사유를 토스트로 보여준다', async () => {
    window.location.hash = '#error=access_denied&error_description=User%20cancelled'
    renderApp({ route: '/login' })
    expect(await screen.findByText('로그인 실패: User cancelled')).toBeInTheDocument()
    expect(window.location.hash).toBe('')
  })

  it('세션 복원(initialize) 오류는 로그인 화면에서 토스트로 알린다', async () => {
    fake.setInitError('Redirect URL not allowed')
    renderApp({ route: '/' })
    expect(await screen.findByText('로그인 처리 실패: Redirect URL not allowed')).toBeInTheDocument()
  })

  it('로그인은 됐지만 프로필이 없으면 온보딩으로 보내고, 닉네임 저장 후 홈으로 간다', async () => {
    const user = userEvent.setup()
    fake.signIn({ user: makeUser({ name: '권다은' }), profile: null })
    renderApp({ route: '/archive' })

    expect(await screen.findByText('거의 다 됐어요 🎉')).toBeInTheDocument()
    expect(screen.getByText('카카오 계정으로 연결됨')).toBeInTheDocument()
    const input = screen.getByPlaceholderText('2~12자')
    expect(input).toHaveValue('권다은')        // 소셜 이름이 기본값

    await user.clear(input)
    expect(screen.getByRole('button', { name: '시작하기' })).toBeDisabled()
    await user.type(input, '여')
    expect(screen.getByText('닉네임은 2자 이상이어야 해요')).toBeInTheDocument()
    await user.type(input, '행자')
    await user.click(screen.getByRole('button', { name: '시작하기' }))

    // 세션이 이미 있는 채로 들어온 경우 from 이 없어 홈으로 간다 (from 은 비로그인 → /login 리다이렉트 때만 실린다)
    expect(await screen.findByRole('link', { name: /첫 도장을 찍어보세요/ })).toBeInTheDocument()
    expect(fake.rows('profiles')).toEqual([expect.objectContaining({ id: TEST_USER_ID, nickname: '여행자', avatar_url: null })])

    // 저장된 닉네임이 My 탭 프로필 카드에 보인다
    await user.click(screen.getByRole('link', { name: /My/ }))
    expect(await screen.findByRole('heading', { name: 'My 탭' })).toBeInTheDocument()
    expect(screen.getByText('여행자')).toBeInTheDocument()
  })

  it('닉네임은 12자에서 잘린다', async () => {
    const user = userEvent.setup()
    fake.signIn({ user: makeUser({ name: '' }), profile: null })
    renderApp({ route: '/onboarding' })
    const input = await screen.findByPlaceholderText('2~12자')
    await user.type(input, '가나다라마바사아자차카타파하')
    expect(input).toHaveValue('가나다라마바사아자차카타')
    expect(screen.getByText('12/12')).toBeInTheDocument()
  })

  it('프로필 저장이 실패하면 토스트를 띄우고 온보딩에 남는다', async () => {
    const user = userEvent.setup()
    fake.signIn({ profile: null })
    fake.failNext('profiles', { code: '42501', message: 'RLS' }, 'insert')
    renderApp({ route: '/onboarding' })
    await user.click(await screen.findByRole('button', { name: '시작하기' }))
    expect(await screen.findByText('저장에 실패했어요. 다시 시도해 주세요')).toBeInTheDocument()
    expect(screen.getByText('거의 다 됐어요 🎉')).toBeInTheDocument()
  })

  it('프로필이 이미 있으면 온보딩·로그인 화면 대신 홈으로 간다', async () => {
    fake.signIn()
    renderApp({ route: '/onboarding' })
    expect(await screen.findByRole('link', { name: /첫 도장을 찍어보세요/ })).toBeInTheDocument()
  })

  it('로그인 상태에서 /login 에 오면 홈으로 보낸다', async () => {
    fake.signIn()
    renderApp({ route: '/login' })
    expect(await screen.findByText('진행중인 행사/축제')).toBeInTheDocument()
  })

  it('세션 판정 전에는 스플래시(로고)만 보인다', async () => {
    let release
    fake.client.auth.initialize.mockImplementationOnce(() => new Promise(r => { release = r }))
    renderApp({ route: '/' })
    expect(screen.getByText('여행지에서 도장 찍고, 기록을 남겨요')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /카카오로 시작하기/ })).not.toBeInTheDocument()
    release({ error: null })
    expect(await screen.findByRole('button', { name: /카카오로 시작하기/ })).toBeInTheDocument()
  })

  it('약관/개인정보 페이지는 로그인 없이 볼 수 있다', async () => {
    renderApp({ route: '/terms' })
    expect(await screen.findByRole('heading', { name: /이용약관/ })).toBeInTheDocument()
    renderApp({ route: '/privacy' })
    expect(await screen.findByRole('heading', { name: /개인정보처리방침/ })).toBeInTheDocument()
  })
})
