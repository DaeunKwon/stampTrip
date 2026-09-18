import { test, expect } from '@playwright/test'
import { installBackend, FakeDb, TEST_USER_ID } from './support/backend.js'
import { shot, expectNoHorizontalScroll } from './support/shot.js'

test.describe('My 탭 · 계정', () => {
  test('프로필·카운트·메뉴가 보이고 계정 설정에서 닉네임 변경 → 로그아웃', async ({ page }, testInfo) => {
    const db = new FakeDb()
    db.seed('stamps', [{ user_id: TEST_USER_ID, content_id: '4001', title: '덕수궁', addr1: '서울', firstimage: '', stamped_at: '2026-09-11T05:00:00.000Z' }])
    db.seed('favorites', [{ user_id: TEST_USER_ID, content_id: '3001', title: '서울 빛초롱 축제', addr1: '서울', firstimage: '', event_end_date: '20991231', saved_at: '2026-09-11T05:00:00.000Z' }])
    const { authLog } = await installBackend(page, { db })
    await page.goto('/archive')
    await expect(page.getByRole('heading', { name: '내 정보' })).toBeVisible()
    await expect(page.getByText('테스터')).toBeVisible()
    await expect(page.getByText('2026년 8월부터 함께')).toBeVisible()
    await expect(page.getByText(/v0\.1\.0/)).toBeVisible()
    await expectNoHorizontalScroll(page, expect)
    await shot(page, testInfo, '12-my-tab')

    await page.getByRole('link', { name: '계정 설정' }).first().click()
    await expect(page.getByRole('heading', { name: '계정 설정' })).toBeVisible()
    await expect(page.getByText('te***@example.com')).toBeVisible()
    await page.getByRole('button', { name: '테스터 ›' }).click()
    await page.getByRole('textbox').fill('새이름')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await expect(page.getByText('닉네임을 변경했어요')).toBeVisible()
    expect(db.rows('profiles')[0].nickname).toBe('새이름')
    await shot(page, testInfo, '13-settings')

    await page.getByRole('button', { name: /로그아웃/ }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(authLog.some(a => a.path === '/auth/v1/logout')).toBe(true)
    // 로그아웃 후 보호 경로는 다시 로그인 화면
    await page.goto('/archive')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('회원 탈퇴는 확인 팝업 후 RPC 로 삭제하고 로그인 화면으로 간다', async ({ page }, testInfo) => {
    const db = new FakeDb()
    db.seed('courses', [{ user_id: TEST_USER_ID, name: 'x', spots: [], created_at: '2026-09-01T00:00:00.000Z' }])
    await installBackend(page, { db })
    await page.goto('/settings')
    await page.getByRole('button', { name: /회원 탈퇴/ }).click()
    await expect(page.getByText('정말 탈퇴할까요?')).toBeVisible()
    await expect(page.getByText(/내 코스 1개, 스탬프 0개, 관심 목록 0개가/)).toBeVisible()
    await shot(page, testInfo, '14-delete-account')
    await page.getByRole('button', { name: '탈퇴하기' }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(db.log.some(l => l.table === 'rpc/delete_my_account')).toBe(true)
    expect(db.rows('profiles')).toHaveLength(0)
    expect(db.rows('courses')).toHaveLength(0)
  })

  test('종료된 관심 행사는 안내 팝업에서 바로 해제할 수 있다', async ({ page }) => {
    const db = new FakeDb()
    db.seed('favorites', [{ user_id: TEST_USER_ID, content_id: '9001', title: '끝난 축제', addr1: '서울', firstimage: '', event_end_date: '20200101', saved_at: '2026-09-11T05:00:00.000Z' }])
    await installBackend(page, { db })
    await page.goto('/my/favorites')
    await expect(page.getByText('종료된 행사')).toBeVisible()
    await page.getByRole('button', { name: /끝난 축제/ }).first().click()
    await expect(page.getByText('종료된 행사입니다')).toBeVisible()
    await page.getByRole('button', { name: '관심 목록에서 해제' }).click()
    await expect(page.getByText('아직 관심 목록이 없습니다')).toBeVisible()
    await expect.poll(() => db.rows('favorites').length).toBe(0)
  })
})
