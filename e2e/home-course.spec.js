import { test, expect } from '@playwright/test'
import { installBackend, TEST_USER_ID } from './support/backend.js'
import { shot, expectNoHorizontalScroll } from './support/shot.js'

test.describe('홈 → 상세 → 주변 코스 스팟 → 내 코스', () => {
  test('홈에 스탬프 현황 · 행사 슬라이드 5개 · 요즘 뜨는 명소 5개가 뜨고, 하단 탭바가 화면 안에 고정된다', async ({ page }, testInfo) => {
    await installBackend(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '서울 빛초롱 축제', level: 3 })).toBeVisible()
    await expect(page.getByRole('link', { name: /첫 스탬프를 찍어보세요/ })).toBeVisible()
    const events = page.locator('section', { hasText: '진행중인 행사/축제' })
    await expect(events.getByRole('heading', { level: 3 })).toHaveCount(5)
    await expect(events.getByRole('link', { name: '전체보기' })).toHaveAttribute('href', '/course')
    await expect(page.getByText('요즘 뜨는 명소')).toBeVisible()
    await expect(page.getByRole('heading', { name: '감천문화마을', level: 3 })).toBeVisible()
    await expectNoHorizontalScroll(page, expect)

    const nav = await page.getByRole('navigation').boundingBox()
    const vh = page.viewportSize().height
    expect(nav.y + nav.height).toBeLessThanOrEqual(vh + 1)
    expect(nav.height).toBeGreaterThanOrEqual(56)
    await shot(page, testInfo, '03-home')
  })

  test('하트로 관심 저장 → My 탭 관심 목록에 보인다', async ({ page }) => {
    const { db } = await installBackend(page)
    await page.goto('/')
    await page.getByRole('button', { name: '관심 추가', exact: true }).first().click()
    await expect(page.getByText('관심 목록에 추가했습니다')).toBeVisible()
    await expect.poll(() => db.rows('favorites').length).toBe(1)
    expect(db.rows('favorites')[0]).toMatchObject({ user_id: TEST_USER_ID, content_id: '3001' })
    await page.getByRole('navigation').getByRole('link', { name: 'My' }).click()
    await page.getByRole('link', { name: /관심 목록/ }).last().click()
    await expect(page.getByText('1개 저장')).toBeVisible()
    await expect(page.getByRole('heading', { name: '서울 빛초롱 축제', level: 3 })).toBeVisible()
  })

  test('행사 카드 → 상세 팝업 → 주변 코스 스팟 → 코스 저장 → 내 코스', async ({ page }, testInfo) => {
    const { db } = await installBackend(page)
    await page.goto('/')
    await page.getByRole('button', { name: /서울 빛초롱 축제/ }).click()
    await expect(page.getByRole('heading', { name: '서울 빛초롱 축제', level: 2 })).toBeVisible()
    await expect(page.getByText('청계광장')).toBeVisible()
    await shot(page, testInfo, '04-detail-modal')
    // 팝업이 떠 있는 동안 body 스크롤 잠금
    await expect(page.locator('body')).toHaveCSS('position', 'fixed')

    await page.getByRole('button', { name: '📍 나만의 코스 짜기' }).click()
    await expect(page.getByRole('heading', { name: '나만의 코스 짜기' })).toBeVisible()
    await expect(page.locator('body')).not.toHaveCSS('position', 'fixed')
    await expect(page.getByText('주변 명소 3곳')).toBeVisible()
    await expect(page.locator('[data-kakao-map-stub]')).toBeVisible()
    await expect(page.locator('[data-kakao-map-stub] button')).toHaveCount(3)   // 번호 배지 3개

    await page.getByRole('checkbox', { name: /덕수궁/ }).click()
    // 지도 배지를 눌러도 선택된다 (스텁 지도에서는 ★ 마커 이미지가 배지 위에 겹치므로 클릭 이벤트를 직접 보낸다)
    await page.locator('[data-kakao-map-stub] button', { hasText: '1' }).dispatchEvent('click')
    await expect(page.getByText('2곳')).toBeVisible()
    await expect(page.locator('[data-polyline]')).toHaveAttribute('data-polyline', '3')

    // 하단 고정 바가 탭바 위에, 화면 안에 있다
    const bar = await page.getByRole('button', { name: '코스 만들기' }).boundingBox()
    const nav = await page.getByRole('navigation').boundingBox()
    expect(bar.y + bar.height).toBeLessThanOrEqual(nav.y + 1)
    await shot(page, testInfo, '05-nearby-selected')

    await page.getByRole('button', { name: '코스 만들기' }).click()
    await expect(page.getByRole('heading', { name: '나만의 코스', exact: true })).toBeVisible()
    const name = page.getByRole('textbox', { name: '코스 이름' })
    await expect(name).toHaveValue('서울 빛초롱 축제 코스')
    await name.fill('시청 산책')
    await shot(page, testInfo, '06-course-sheet')
    // 입력창에 포커스가 있는 채로 마우스 클릭하면 blur → 시트 높이 재계산으로 레이아웃이 움직여 click 이 유실될 수 있다
    // (데스크톱 Chrome 에서 재현, 터치는 통과). 실기기 확인 항목 — 여기서는 포커스를 먼저 뺀다
    await name.press('Tab')
    await page.getByRole('button', { name: '코스 저장' }).click()
    await expect(page.getByText('코스를 저장했어요')).toBeVisible()
    await expect(page).toHaveURL(/\/my\/courses$/)
    await expect(page.getByText('시청 산책')).toBeVisible()
    await expect(page.getByText('0/2 방문')).toBeVisible()
    expect(db.rows('courses')[0]).toMatchObject({ name: '시청 산책', event_content_id: '3001' })
    expect(db.rows('courses')[0].spots.map(s => s.contentid)).toEqual(['4001', '4002'])
    await shot(page, testInfo, '07-my-courses')

    // 코스 상세 → 스팟 탭 → 지도 탭이 그 명소 중심으로 열린다
    await page.getByRole('link', { name: /시청 산책/ }).click()
    await expect(page.getByRole('heading', { name: '시청 산책' })).toBeVisible()
    await page.getByRole('button', { name: /덕수궁.*미방문/ }).click()
    await expect(page).toHaveURL(/\/map$/)
    await expect(page.getByText('위치로 이동했습니다')).toBeVisible()
    await expect(page.locator('img[data-marker="덕수궁"]')).toBeVisible()
  })

  test('코스 탭: 지역 필터와 페이지네이션', async ({ page }, testInfo) => {
    await installBackend(page)
    await page.goto('/course')
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(6)
    await page.getByRole('button', { name: '2페이지로' }).click()
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(2)
    await page.getByRole('button', { name: '서울', exact: true }).click()
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(3)
    await expectNoHorizontalScroll(page, expect)
    await shot(page, testInfo, '08-course-tab')
  })
})
