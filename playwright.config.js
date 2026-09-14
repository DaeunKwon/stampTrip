// 웹(데스크톱 Chrome) · Android(Pixel 7, Chromium) · iOS(iPhone 14, WebKit) 세 프로젝트로 같은 시나리오를 돌린다.
// 앱은 .env.e2e 로 빌드한 정적 번들(dist-e2e)을 vite preview 로 띄우고, Supabase/TourAPI/카카오맵은 전부 네트워크 수준에서 가로챈다.
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const SEOUL_CITY_HALL = { latitude: 37.5665, longitude: 126.978 }

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e-results/artifacts',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'e2e-results/report', open: 'never' }]],
  timeout: 30000,
  expect: { timeout: 8000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    geolocation: SEOUL_CITY_HALL,
    permissions: ['geolocation'],
    // PWA 서비스워커가 요청을 가로채면 route 모킹이 안 먹으므로 막는다
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'web', use: { ...devices['Desktop Chrome'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
    { name: 'ios', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: `npx vite build --mode e2e --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
