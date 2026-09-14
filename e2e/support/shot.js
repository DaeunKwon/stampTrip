// 프로젝트(web/android/ios)별 화면 캡처를 e2e-results/screens/<project>/<name>.png 에 남긴다 (실기기 확인 전 참고용)
import { mkdirSync } from 'node:fs'

export async function shot(page, testInfo, name) {
  const dir = `e2e-results/screens/${testInfo.project.name}`
  mkdirSync(dir, { recursive: true })
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: false })
}

/** 가로 스크롤이 생기지 않았는지 */
export async function expectNoHorizontalScroll(page, expect) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
  expect(sw, '가로 스크롤(문서 폭 > 뷰포트 폭)').toBeLessThanOrEqual(iw)
}
