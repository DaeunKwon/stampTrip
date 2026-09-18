import { test, expect } from '@playwright/test'
import { installBackend, TEST_USER_ID } from './support/backend.js'
import { shot } from './support/shot.js'

test.describe('지도 탭 · GPS 스탬프', () => {
  test('현재 위치(서울시청) 근처 관광지가 자동으로 뜨고 스탬프를 찍으면 저장·연출·컬렉션 반영', async ({ page }, testInfo) => {
    const { db, tourLog } = await installBackend(page)
    await page.goto('/map')
    await expect(page.getByText('📍 37.5665, 126.9780')).toBeVisible()
    await expect(page.locator('[data-kakao-map-stub]')).toBeVisible()
    await expect(page.locator('img[data-marker="내 위치"]')).toBeVisible()
    await expect(page.locator('img[data-marker="덕수궁"]')).toBeVisible()
    await expect(page.locator('img[data-marker="광화문 국밥집"]')).toHaveCount(0)
    const call = tourLog.find(c => c.endpoint === 'locationBasedList2')
    expect(Number(call.params.mapY)).toBeCloseTo(37.5665, 3)

    await expect(page.getByText('📍 근처 관광지 발견!')).toBeVisible()
    await shot(page, testInfo, '09-map-popup')
    await page.getByRole('button', { name: '스탬프 찍기' }).click()
    await expect(page.getByText('방문 인증됨')).toBeVisible()
    await expect(page.getByText(/1번째 스탬프/)).toBeVisible()
    await shot(page, testInfo, '10-stamp-ceremony')
    await expect(page.getByText('🗺️ 1개 수집')).toBeVisible()
    await expect.poll(() => db.rows('stamps').length).toBe(1)
    expect(db.rows('stamps')[0]).toMatchObject({ user_id: TEST_USER_ID, content_id: '4001', title: '덕수궁' })

    // 연출이 끝나면 다음 미인증 관광지(청계광장) 팝업이 이어진다
    await expect(page.getByRole('button', { name: '스탬프 찍기' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('청계광장')).toBeVisible()

    await page.getByRole('navigation').getByRole('link', { name: 'My' }).click()
    await page.getByRole('link', { name: /스탬프 컬렉션/ }).click()
    await expect(page.getByText('1개 수집')).toBeVisible()
    await expect(page.getByText('방문 기록')).toBeVisible()
    await shot(page, testInfo, '11-my-stamps')
  })

  test('반경 밖 관광지는 잠금 상태로 보인다', async ({ page, context }) => {
    await installBackend(page)
    await context.setGeolocation({ latitude: 35.1587, longitude: 129.16 })   // 부산
    await page.goto('/map')
    await expect(page.getByText('📍 35.1587, 129.1600')).toBeVisible()
    await expect(page.getByText('관광지에 가까이 가면 스탬프 버튼이 나타납니다')).toBeVisible()
    // 지도 중심은 내 위치(부산)라 서울 관광지 마커는 화면 밖 → 지도를 서울로 옮겨 마커를 누른다
    await page.evaluate(() => { const m = window.kakao.maps.Map.instances[0]; m.setCenter(new window.kakao.maps.LatLng(37.5665, 126.978)) })
    await page.locator('img[data-marker="광화문"]').click()
    await expect(page.getByText('📍 선택한 관광지')).toBeVisible()
    await expect(page.getByText('🔒 가까이 가면 인증할 수 있어요')).toBeVisible()
    await expect(page.getByRole('button', { name: '내 위치로 이동' })).toBeVisible()
  })

  test('위치 권한이 없으면 오류를 표시하고 지도는 기본 중심으로 뜬다', async ({ page, context }) => {
    await installBackend(page)
    await context.clearPermissions()
    await page.goto('/map')
    await expect(page.getByText(/⚠️/)).toBeVisible()
    await expect(page.locator('img[data-marker="덕수궁"]')).toBeVisible()
    await expect(page.getByText(/반경 \d+m 내 관광지 인증 가능/)).toHaveCount(0)
  })
})
