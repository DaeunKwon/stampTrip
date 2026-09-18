import { test, expect } from '@playwright/test'
import { installBackend } from './support/backend.js'
import { expectNoHorizontalScroll } from './support/shot.js'

// iOS 홈 화면 추가 · Android 설치 배너에 필요한 PWA 조건과, 모바일 폭에서의 레이아웃을 확인한다
test.describe('PWA · 모바일 레이아웃', () => {
  test('manifest 와 iOS 메타 태그가 있고 아이콘이 서비스된다', async ({ page, request }) => {
    await installBackend(page, { session: false })
    await page.goto('/login')
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(manifestHref).toBeTruthy()
    const manifest = await (await request.get(manifestHref)).json()
    expect(manifest).toMatchObject({ name: '스탬프여행', short_name: '스탬프여행', display: 'standalone', start_url: '/', theme_color: '#2f5fe0', lang: 'ko' })
    expect(manifest.icons.some(i => i.purpose === 'maskable')).toBe(true)
    for (const icon of manifest.icons) expect((await request.get(icon.src)).status(), icon.src).toBe(200)

    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
    await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute('content', 'black-translucent')
    const touchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')
    expect((await request.get(touchIcon)).status()).toBe(200)
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).toContain('width=device-width')
    expect(viewport).toContain('user-scalable=no')
    // 서비스워커 등록 스크립트가 번들에 포함돼 있다 (테스트에서는 실행을 막아둔다)
    const html = await (await request.get('/')).text()
    expect(html).toMatch(/registerSW|serviceWorker/)
  })

  test('주요 화면 모두 가로 스크롤이 없고 탭바 링크가 44px 이상이다', async ({ page }) => {
    await installBackend(page)
    for (const route of ['/', '/course', '/map', '/archive', '/my/courses', '/my/stamps', '/my/favorites', '/settings']) {
      await page.goto(route)
      await expect(page.getByRole('navigation')).toBeVisible()
      await expectNoHorizontalScroll(page, expect)
      for (const link of await page.getByRole('navigation').getByRole('link').all()) {
        const b = await link.boundingBox()
        expect(b.height, `${route} 탭 높이`).toBeGreaterThanOrEqual(44)
        expect(b.width, `${route} 탭 너비`).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('탭바가 safe-area 패딩 클래스를 갖고 지도 화면 높이가 뷰포트에서 탭바를 뺀 값이다', async ({ page }) => {
    await installBackend(page)
    await page.goto('/map')
    await expect(page.getByRole('navigation')).toHaveClass(/safe-bottom/)
    const nav = await page.getByRole('navigation').boundingBox()
    const mapBox = await page.locator('[data-kakao-map-stub]').boundingBox()
    const vh = page.viewportSize().height
    // 탭바 h-16(64px) + 상단 테두리 1px. 지도는 100vh - 4rem
    expect(nav.height).toBeGreaterThanOrEqual(64)
    expect(nav.height).toBeLessThanOrEqual(66)
    expect(Math.abs(mapBox.height - (vh - 64))).toBeLessThanOrEqual(1)
    expect(Math.abs(mapBox.y + mapBox.height - nav.y)).toBeLessThanOrEqual(1)
  })

  test('뒤로 가기(history)로 팝업 상태가 복원된다', async ({ page }) => {
    await installBackend(page)
    await page.goto('/')
    await page.getByRole('button', { name: /서울 빛초롱 축제/ }).click()
    await page.getByRole('button', { name: '📍 주변 코스 스팟 보기' }).click()
    await expect(page.getByRole('heading', { name: '주변 코스 스팟' })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('heading', { name: '서울 빛초롱 축제', level: 2 })).toBeVisible()
    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.getByRole('heading', { name: '서울 빛초롱 축제', level: 2 })).toHaveCount(0)
  })
})
