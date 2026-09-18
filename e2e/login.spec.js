import { test, expect } from '@playwright/test'
import { installBackend } from './support/backend.js'
import { shot, expectNoHorizontalScroll } from './support/shot.js'

test.describe('로그인 화면', () => {
  test('비로그인으로 보호 경로에 들어가면 로그인 화면이 뜨고 레이아웃이 뷰포트에 맞는다', async ({ page }, testInfo) => {
    await installBackend(page, { session: false })
    await page.goto('/my/stamps')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: '카카오로 시작하기' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Google로 시작하기' })).toBeVisible()
    await expect(page.getByRole('link', { name: '이용약관' })).toBeVisible()
    await expectNoHorizontalScroll(page, expect)
    // 탭하기 좋은 버튼 높이(≥ 44px)
    const box = await page.getByRole('button', { name: '카카오로 시작하기' }).boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(44)
    await shot(page, testInfo, '01-login')
  })

  test('카카오 버튼은 계정 선택을 강제한 Supabase OAuth 주소로 이동한다', async ({ page }) => {
    const { authLog } = await installBackend(page, { session: false })
    await page.goto('/login')
    await page.getByRole('button', { name: '카카오로 시작하기' }).click()
    await expect(page.locator('#oauth-stub')).toBeVisible()
    const authorize = authLog.find(a => a.path === '/auth/v1/authorize')
    expect(authorize.query).toMatchObject({ provider: 'kakao', prompt: 'select_account' })
    expect(authorize.query.redirect_to).toBe('http://localhost:4173')
  })

  test('약관 페이지는 로그인 없이 열리고 뒤로 가기가 동작한다', async ({ page }) => {
    await installBackend(page, { session: false })
    await page.goto('/login')
    await page.getByRole('link', { name: '개인정보처리방침' }).click()
    await expect(page.getByRole('heading', { name: /개인정보처리방침/ })).toBeVisible()
    await page.getByRole('button', { name: '뒤로' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('첫 가입자는 온보딩에서 닉네임을 정한 뒤 홈으로 들어간다', async ({ page }, testInfo) => {
    const { db } = await installBackend(page, { profile: null })
    await page.goto('/')
    await expect(page.getByText('거의 다 됐어요 🎉')).toBeVisible()
    const input = page.getByPlaceholder('2~12자')
    await expect(input).toHaveValue('테스터')
    await input.fill('여행자')
    await shot(page, testInfo, '02-onboarding')
    await page.getByRole('button', { name: '시작하기' }).click()
    await expect(page.getByRole('link', { name: /STAMP PASSPORT/ })).toBeVisible()
    expect(db.rows('profiles')).toEqual([expect.objectContaining({ nickname: '여행자' })])
  })
})
